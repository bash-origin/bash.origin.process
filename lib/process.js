
// TODO: Relocate to pinf.io package and use here in bash.origin.process.

const LIB = require("bash.origin.workspace").forPackage(__dirname + "/..").LIB;

const Promise = LIB.BLUEBIRD;

Promise.defer = function defer() {
    var resolve, reject;
    var promise = new Promise(function() {
        resolve = arguments[0];
        reject = arguments[1];
    });
    return {
        resolve: resolve,
        reject: reject,
        promise: promise
    };
};

// TODO: Use a color lib that does not modify globals. i.e. Use one that proxies logging calls and
//       parses simple color syntax.
const COLORS = LIB.COLORS;
COLORS.setTheme({
    error: 'red'
});

const PATH = require("path");
const REQUEST = LIB.REQUEST;
const EVENTS = require("events");
const EXEC = require("child_process").exec;
const SPAWN = require("child_process").spawn;
const CODEBLOCK = LIB.CODEBLOCK;
const BASH_ORIGIN_MODULES = LIB.BASH_ORIGIN_MODULES;


exports.getProcesses = function () {

	return new Promise(function (resolve, reject) {

		var processes = {
			byPid: {},
		};
		var columns;

		function makeRow (columns, fields) {
			var row = {};
			fields.forEach(function (field, index) {
				if (columns[index]) {
					row[columns[index]] = field;
				} else {
					row[columns[columns.length - 1]] += " " + field;
				}
			});
			return row;
		}

		var proc = SPAWN("bash");
		proc.stderr.on('data', function (data) {
		  console.log('[bash.origin.process] stderr: ' + data);
		});
		var buffer = [];
		proc.stdout.on('data', function (data) {
			buffer.push(data.toString());
		});
		proc.on('close', function (code) {
			if (code !== 0) {
				return reject(new Error("Process exit status != 0"));
			}
			columns = null;
			buffer.join("").split("\n").forEach(function (line) {
				if (!line) return;
				var fields = line.replace(/[\t\s]+/g, " ").replace(/(^\s|\s$)/g, "").split(/\s/);

				if (fields[0] === "PPID" || fields[0] === "USER") {
					columns = fields;
				} else {
					// @see http://www.cs.miami.edu/~geoff/Courses/CSC521-04F/Content/UNIXProgramming/UNIXProcesses.shtml
					// @see http://chinkisingh.com/2012/06/10/session-foreground-processes-background-processes-and-their-interaction-with-controlling-terminal/					
					var process = makeRow(columns, fields);
					// process.PID - Process ID
					// process.PPID - Parent process ID
					// process.PGID - Parent group ID
					// process.SID - Session leader ID
					// process.TPGID - Terminal process group ID
					// process.TTY - (TeleTYpewriter) The terminal that executed a particular command ; @see http://stackoverflow.com/a/7113800/330439
					// process.STAT - Process state ; @see http://unix.stackexchange.com/a/18477/92833
					//	 states:
					//		D Uninterruptible sleep (usually IO)
					//		R Running or runnable (on run queue)
					//		S Interruptible sleep (waiting for an event to complete)
					//		T Stopped, either by a job control signal or because it is being traced.
					//		W paging (not valid since the 2.6.xx kernel)
					//		X dead (should never be seen)
					//		Z Defunct ("zombie") process, terminated but not reaped by its parent.
					//   flags:
					//		< high-priority (not nice to other users)
					//		N low-priority (nice to other users)
					//		L has pages locked into memory (for real-time and custom IO)
					//		s is a session leader
					//		l is multi-threaded (using CLONE_THREAD, like NPTL pthreads do)
					//		+ is in the foreground process group
					// process.UID - User ID ; @see http://stackoverflow.com/a/205146/330439
					// process.START - Indication of how long the process has been up
					// process.TIME - Accumulated CPU utilization time ; @see http://www.theunixschool.com/2012/09/ps-command-what-does-time-indicate.html
					// process.USER - Username of PID
					// process.COMMAND - The command being executed
					// process.%CPU - % of current total CPU utilization
					// process.%MEM - % of current total MEM utilization
					// process.VSZ - (Virtual Memory Size) Accessible memory including swap and shared lib ; @see http://stackoverflow.com/a/21049737/330439
					// process.RSS - (Resident Set Size) Allocated ram ; @see http://stackoverflow.com/a/21049737/330439

					if (!processes.byPid[process.PID]) {
						processes.byPid[process.PID] = {};
					}
					if (!processes.byPid[process.PID].info) {
						processes.byPid[process.PID].info = {};
					}
					for (var name in process) {
						if (typeof processes.byPid[process.PID].info[name] === "undefined") {
							processes.byPid[process.PID].info[name] = process[name];
						}
					}

					if (process.PPID) {
						if (!processes.byPid[process.PPID]) {
							processes.byPid[process.PPID] = {};
						}
						if (!processes.byPid[process.PPID].children) {
							processes.byPid[process.PPID].children = [];
						}
						if (processes.byPid[process.PPID].children.indexOf(process.PID) === -1) {
							processes.byPid[process.PPID].children.push(process.PID);
						}
					}

				}
			});

			return resolve(processes);
		});
		proc.stdin.write("ps axo ppid,pid,command");
		return proc.stdin.end();
	});
}


exports.killPIDs = function (pids) {

	return new Promise(function (resolve, reject) {

		var command = "kill " + pids.join(" ");

		if (process.env.VERBOSE) console.log(("[bash.origin.process] Run: " + command).magenta);

		return EXEC(command, function (err, stdout, stderr) {
			if (stdout) process.stdout.write(stdout);
			if (stderr) process.stderr.write(stderr);
			if (err) {
				// NOTE: Purposely not returning error
				return resolve(null);
			}
			return resolve(null);
		});
	});
}





var Runner = function (name) {
	var self = this;

	self._name = name;

	self._bootedPrograms = {};
	self._registeredCommands = {};

	// TODO: Register this more centrally.
	process.on('SIGINT', function() {
		return self.killAll();
	});	
	process.on('SIGTERM', function() {
		return self.killAll();
	});
}
Runner.prototype.killAll = function () {
	var self = this;
	return new Promise(function (resolve, reject) {
		for (var programNumber in self._bootedPrograms) {
			self._bootedPrograms[programNumber].kill();
		}
		// TODO: Find a more deterministic way to wait by looking for `GOODBYE` log message?
		return setTimeout(function () {
			try {
				console.log(("[bash.origin.process] Quitting.").magenta);
				process.stdin.end();
				process.exit(0);
				return resolve(null);
			} catch (err) {
				return reject(err);
			}
		}, 1000);
	});
}
/*
Runner.prototype.hookAPI = function (API) {
	var self = this;

	API.runProgramProcess = function (options, callback) {
		options._number = Object.keys(self._bootedPrograms).length + 1;
		var program = new Program (this, options);
		self._bootedPrograms[program._number] = program;
		return program.start(function (err) {
			if (err) return callback(err);
			self.writeHeader();
			return callback(null, program);
		});
	}

	API.registerCommand = function (alias, command) {
		self._registeredCommands[alias] = command;
	}

}
*/

Runner.prototype.runProgramProcess = function (options) {
	var self = this;

	if (typeof options === "string") {
		options = {
			command: options
		};
	}
	if (options.command) {
		if (!options.commands) {
			options.commands = [];
		}
		options.commands.push(options.command);
		delete options.command;
	}

	options.config = options.config || {};

	options._number = Object.keys(self._bootedPrograms).length + 1;

	if (!options.cwd) {
		options.cwd = process.cwd();
	}

	var program = new Program (self, options);
	self._bootedPrograms[program._number] = program;

	return program.start().then(function () {

		return program;
	});
}

Runner.prototype.writeHeader = function () {
	var self = this;
	console.log(("[bash.origin.process] Enter '<ProgramNumber> + [Return]' to restart program or 'commands' (list commands) or 'q' (quit):").cyan);
	if (Object.keys(self._bootedPrograms).length === 0) {
		console.log(("[bash.origin.process] (No programs registered)").cyan);
		return;
	}
	Object.keys(self._bootedPrograms).forEach(function (programNumber) {
		console.log(("[bash.origin.process]  " + (""+programNumber).bold + " - " + self._bootedPrograms[programNumber].label).cyan);
	});
}
Runner.prototype.runREPL = function () {
	var self = this;

	return new Promise(function (resolve, reject) {

		process.stdin.resume();
		process.stdin.setEncoding("utf8");

		var lastCommand = "";
		process.stdin.on("data", function (data) {

			try {

				data = data.replace(/\n+/g, "");

		// TODO: Optionally enable.
		//			for (var i=0;i<data.length;i++) {
		//				console.log(i+": "+data.charCodeAt(i));
		//			}

				// Up arrow to repeat last command.
				// TODO: Scroll through history.
				if (
					data.length === 3 &&
					data.charCodeAt(0) === 27 &&
					data.charCodeAt(1) === 91 &&
					data.charCodeAt(2) === 65 &&
					lastCommand
				) {
					data = lastCommand;
				}

				if (process.env.VERBOSE) console.log("[bash.origin.process] stdin data:", data);

				if (!data) {
					return self.writeHeader();
				}
				lastCommand = data;

				if (data === "q") {
					return self.killAll();
				} else
				if (data === "commands") {
					Object.keys(self._registeredCommands).forEach(function (commandAlias) {
						console.log("[bash.origin.process]  " + commandAlias + " - " + self._registeredCommands[commandAlias].getLabel());
					});
					return;
				} else
				if (self._registeredCommands[data]) {
					console.log("[bash.origin.process] Running command:", self._registeredCommands[data].getLabel());

					return Promise.try(function () {
						return self._registeredCommands[data].run();
					}).catch(function (err) {
						if (err) {
							console.error("[bash.origin.process] Error running command:", err.stack);
						}
					});
					return;
				}

				for (var programNumber in self._bootedPrograms) {
					if (programNumber == data) {

						console.log(("[bash.origin.process] Restarting program: " + self._bootedPrograms[programNumber].label).magenta);

						return self._bootedPrograms[programNumber].kill().catch(function (err) {
							console.error("[bash.origin.process] Error killing program! We may have orphans now!", err.stack);
						}).then(function () {

							setTimeout(function () {
								return self._bootedPrograms[programNumber].start().catch(function (err) {
									
									console.error("[bash.origin.process] Error starting program!", err.stack);

									return null;
								}).then(function () {
									return self.writeHeader();
								});
							}, 1000);

							return null;
						}).catch(console.error);
					}
				}

				console.log(("[bash.origin.process] Program with number '" + data + "' not found!").red);
				return;
			} catch (err) {
				console.error(err.stack);
			}
		});

		return resolve(null);
	});
}




exports.run = function (name, instructions) {
	var runner = new Runner(name);

	var pendingProcesses = {};

	return Promise.map(Object.keys(instructions), function (alias) {

		var instruction = instructions[alias];
		instruction._alias = alias;

		if (!pendingProcesses[alias]) {
			pendingProcesses[alias] = Promise.defer();
		}

		function ensureDepends () {
			if (!instruction.depends) {
				return Promise.resolve(null);
			}
			return Promise.map(instruction.depends, function (otherAlias) {
				if (!pendingProcesses[otherAlias]) {
					pendingProcesses[otherAlias] = Promise.defer();
				}
				if (process.env.VERBOSE) console.log("[bash.origin.process] Waiting to boot process '" + alias + "' until process '" + otherAlias + "' is alive!");
				return pendingProcesses[otherAlias].promise.timeout(15 * 1000, "Stop booting process '" + alias + "' because it depends on process '" + otherAlias + "' which is taking too long to be alive!");
			});
		}

		return ensureDepends().then(function () {
			return runner.runProgramProcess(instruction);
		}).then(pendingProcesses[alias].resolve, function (err) {
			pendingProcesses[alias].reject(err);
			throw err;
		});

	}).then(function () {
		return runner.runREPL();
	}).then(function () {
		return runner.writeHeader();
	});
}




var Program = function (API, options) {
	var self = this;

	self.label = options.label || options._alias || "";

	if (process.env.VEROSE) console.log("[bash.origin.process] Run program '" + self.label, "using config:", options.config);

	self._options = options;
	self._number = options._number;
	self.process = null;

	self.startupPIDs = {};
	self.startupInterval = null;

	self.indexPIDs = function () {
		return exports.getProcesses().then(function (processes) {
			var pids = [];
			if (self.process.pid) {
				pids.push(self.process.pid);
				function traverse (node) {
					if (
						node &&
						node.children &&
						node.children.length > 0
					) {
						node.children.forEach(function (pid) {
							pids.push(pid);
							return traverse(processes.byPid[""+pid]);
						});
					}
				}
				traverse(processes.byPid[""+self.process.pid]);
			}
			pids.reverse();
			if (self.startupPIDs) {
				pids.forEach(function (pid) {
					self.startupPIDs[pid] = true;
				});
			}
			return pids;
		});
	};

	self.killForever = function () {
		var self = this;
		delete API._bootedPrograms[self._number];
		return self.kill().then(function () {
			if (Object.keys(API._bootedPrograms).length === 0) {
				return API.killAll();
			}
			return null;
		});
	}

	self.kill = function () {
		if (process.env.VERBOSE) console.log(("[bash.origin.process] Killing program '" + self.label + "'").magenta);
		return self.indexPIDs().then(function (pids) {
			if (pids.length === 0) {
				return null;
			}
			return exports.killPIDs(pids);
		});
	};

	self.start = function () {

		return new Promise(function (resolve, reject) {

			try {

				var env = {};
				for (var name in process.env) {
					env[name] = process.env[name];
				}
				if (options.env) {
					for (name in options.env) {
						env[name] = options.env[name];
					}
				}

				function waitUntilAlive () {

					if (process.env.VERBOSE) console.log("[bash.origin.process] waitUntilAlive()", self.label);

					if (
						!options.routes ||
						!options.routes.alive
					) {

						if (process.env.VERBOSE) console.log("[bash.origin.process] no routes, skip tests.", self.label);
						return resolve(null);
					}

					// TODO: Use implementation from 'bash.origin.request'

					if (typeof options.routes.alive === "string") {
						options.routes.alive = {
							uri: options.routes.alive
						};
					}

					var url = "http://127.0.0.1:" + env.PORT + options.routes.alive.uri;

					console.log(("[bash.origin.process] Waiting until program '" + self.label + "' is alive by checking route '" + url + "' against '" + JSON.stringify(options.routes.alive.expect || "") + "'.").magenta);

					function checkAgain () {
						setTimeout(function () {
							doCheck();
						}, 1000);
					}

					function doCheck () {

						if (process.env.VERBOSE) console.log("[bash.origin.process] Checking if alive:", url);

						return REQUEST({
							method: "GET",
							url: url
						}, function (err, response, body) {
							if (err) {
								return checkAgain();
							}
							if (process.env.VERBOSE) console.log("response.body", response.body);
							if (options.routes.alive.expect) {

								if (typeof options.routes.alive.expect === "string") {

									if (/^\/.+\/$/.test(options.routes.alive.expect)) {

										var re = new RegExp(options.routes.alive.expect.replace(/\/(.+)\//, "$1").replace(/\/\//g, "/"));

										if (process.env.VERBOSE) console.log("re", re);

										if (!re.test(response.body)) {
											return checkAgain();
										}

									} else {
										if (response.body !== options.routes.alive.expect) {
											return checkAgain();
										}
									}

								} else {

									try {

										response.body = JSON.parse(response.body);

									} catch (err) {
										console.error("[bash.origin.process] Error parsing response JSON to match it to expected value.", err.stack);
										return checkAgain();
									}

									for (var name in options.routes.alive.expect) {
										if (response[name] !== options.routes.alive.expect[name]) {
											return checkAgain();
										}
									}
								}
							}
							console.log(("[bash.origin.process] Program '" + self.label + "' is alive!").magenta);

							if (options.routes.alive.exit) {

								if (process.env.VERBOSE) console.log("[bash.origin.process] Trigger exit due to 'options.routes.alive.exit'");

								if (process.env.BO_TEST_FLAG_DEV) {
									console.log("[bash.origin.process] Skip exit due to 'BO_TEST_FLAG_DEV'");
								} else {
									self.killForever().catch(console.error);
								}
							}

							return resolve(null);
						});
					}

					return doCheck();
				}

				// Return when no message comes in within one second as we assume server setup is done.
				// i.e. For a server to stop us from proceeding it should issue a "." every 1/2 a second
				//      which doubles as a good responsiveness heartbeat.
				var lastMessageTime = null;
				var lastMessageTimeout = null;
				function onNewMessage () {

					if (process.env.VERBOSE) console.log("[bash.origin.process] onNewMessage()", self.label);

					lastMessageTime = Date.now();
					if (!lastMessageTimeout) {
						function makeTimeout () {
							lastMessageTimeout = setTimeout(function () {
								var offset = (Date.now() - 1000) - lastMessageTime;
								if (offset < 0) {
									return makeTimeout();
								}
								if (process.env.VERBOSE) console.log(("[bash.origin.process] Done booting program '" + self.label + "'.").magenta);
								return waitUntilAlive();
							}, 1000);
						}
						return makeTimeout();
					}
				}


				function normalizeCommands () {
					return Promise.try(function () {

						var commands = self._options.commands;
						if (
							!commands && 
							self._options.run
						) {
							if (self._options.run['.@'] === 'github.com~0ink~codeblock/codeblock:Codeblock') {

								var codeblock = CODEBLOCK.compile(self._options.run, {
									ENV: env
								});

								if (codeblock.getFormat() === 'bash') {

									commands = codeblock.getCode();

									if (/^.+\sbash\.origin\.script\s*$/m.test(commands)) {
										return BASH_ORIGIN_MODULES.compile(commands, process.cwd() + "/." + self.label + ".codeblock.bo.sh").then(function (code) {
											return [												
												'export BO_LOADED=',
												'export BO_IS_SOURCING=',
												'export BO_sourceProfile__sourced=',
												'export BO_ROOT_SCRIPT_PATH="' + LIB.resolve("bash.origin/bash.origin") + '"',
												code,
												'as "__codeblock__"'
											].join("\n");
										});
									}

								} else {
									console.error("self._options.run", self._options.run);
									throw new Error("Codeblock format '" + codeblock.getFormat() + "' not supported!");
								}

							} else {
								commands = self._options.run;
							}
						}

						return commands;
					}).then(function (commands) {
						if (Array.isArray(commands)) {
							commands = commands.join("\n");
						}

						commands = [
							'# VERBOSE>>>',
							commands,
							'# <<<VERBOSE'
						].join("\n");

						return commands;
					});
				}

				return normalizeCommands().then(function (commands) {

					if (process.env.VERBOSE) console.log("[bash.origin.process] Run commands:", commands, {
						cwd: options.cwd,
						env: options.env || {}
					});

					var commandsSummary = commands;
					if (commandsSummary.split("\n").length > 1) {
						commandsSummary = commandsSummary.split("\n")[0] + " ...";
					}
					if (/^# VERBOSE>>>/m.test(commandsSummary)) {
						commandsSummary = "";
					}
					console.log(("[bash.origin.process] Run program '" + self.label + "': " + commandsSummary).magenta);

					self.process = SPAWN("bash", [
						"-s"
					], {
						cwd: options.cwd,
						env: env
					});
					var inVerboseBlock = 0;
					// TODO: Buffer calls to console and prefix and flush periodically so we
					//       don't prefix partial written lines.
					function prefixAndWrite (stream, prefixColor, lines) {
						lines = lines.toString().replace(/\n+/g, "\n").replace(/\n$/, "");
						if (!lines) return;
						var prefix = ("[" + self._number + ":" + self.label + "] ").bold;
						if (prefixColor) {
							prefix = prefix[prefixColor];
						}
						lines.split("\n").forEach(function (line) {
							if (/#\s*VERBOSE>>>/.test(line)) {
								inVerboseBlock += 1;
							} else
							if (/#\s*<<<VERBOSE/.test(line)) {
								inVerboseBlock -= 1;
							}
							if (
								inVerboseBlock === 0 ||
								process.env.VERBOSE
							) {
								stream.write(prefix + line + "\n");
							}
						});

						// TODO: Make these error lookup strings configurable.
						if (
							/Error: Cannot find module/.test(lines) ||
							/ERR!/.test(lines)
						) {
							if (!prefixAndWrite._error) {
								self.indexPIDs();
								prefixAndWrite._error = true;
								return setTimeout(function () {
									return reject(new Error("Detected an error in program output!"));
								}, 250);
							}
						}
					}
					self.process.on("error", function(err) {
						process.stdout.write(("[" + self._number + ":" + self.label + "] ERROR[1]: ").bold + (""+err.stack).red);
						return reject(err);
					});
					self.process.stdout.on("data", function (data) {
						onNewMessage();
						prefixAndWrite(process.stdout, null, data);
					});
					self.process.stderr.on("data", function (data) {
						onNewMessage();
						prefixAndWrite(process.stdout, "red", data);
					});

					self.startupInterval = setInterval(function () {
						self.indexPIDs().catch(console.error);
					}, 900);

					if (process.env.VERBOSE) console.log("[bash.origin.process] Write commands:", commands);

					self.process.stdin.write(commands);
					self.process.stdin.end();
					onNewMessage();

					return null;
				}).catch(reject);

			} catch (err) {
				process.stdout.write(("[" + self._number + ":" + self.label + "] ERROR[2]: ").bold + (""+err.stack).red);
				return reject(err);
			}

		}).then(function () {
			clearInterval(self.startupInterval);
			self.startupInterval = null;
			self.startupPIDs = null;
			return null;
		}).catch(function (err) {

			if (process.env.VERBOSE) console.error("[bash.origin.process] CAUGHT ERROR", err.stack, "Shutting down process.");

			if (!self.startupPIDs) {
				throw err;
			}
			var pids = Object.keys(self.startupPIDs);
			if (pids.length === 0) {
				throw err;
			}
			return exports.killPIDs(pids);
		});
	};
}
