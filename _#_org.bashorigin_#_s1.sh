#!/usr/bin/env bash.origin.script


function EXPORTS_free_port {
    BO_run_recent_node --eval '
        const GET_PORT = require("bash.origin.lib").GET_PORT;
        GET_PORT().then(function (port) {
            // NOTE: This does not work!
            //process.stdout.write(port);

            console.log(port);

            process.exit(0);
        }).catch(function (err) {
            throw err;
        });
    '
}


function EXPORTS_run {
    BO_run_recent_node --eval '
        const PROCESS = require("$__DIRNAME__/lib/process");
        PROCESS.run(process.argv[1], JSON.parse(process.argv[2])).catch(console.error);
    ' "$1" "$2"
}


# @see http://blog.dekstroza.io/ulimit-shenanigans-on-osx-el-capitan/
function EXPORTS_maximize_limits {

    ulimit -n 8192

    if [ ! -e "/Library/LaunchDaemons/limit.maxfiles.plist" ]; then
        echo "Asking for sudo to write file: /Library/LaunchDaemons/limit.maxfiles.plist"
        echo -e '
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
        "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>limit.maxfiles</string>
    <key>ProgramArguments</key>
    <array>
      <string>launchctl</string>
      <string>limit</string>
      <string>maxfiles</string>
      <string>524288</string>
      <string>524288</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>ServiceIPC</key>
    <false/>
  </dict>
</plist>
        ' | sudo tee /Library/LaunchDaemons/limit.maxfiles.plist

        sudo chown root:wheel /Library/LaunchDaemons/limit.maxfiles.plist
        sudo launchctl load -w /Library/LaunchDaemons/limit.maxfiles.plist
    fi

    if [ ! -e "/Library/LaunchDaemons/limit.maxproc.plist" ]; then
        echo "Asking for sudo to write file: /Library/LaunchDaemons/limit.maxproc.plist"
        echo -e '
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple/DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
  <plist version="1.0">
    <dict>
      <key>Label</key>
        <string>limit.maxproc</string>
      <key>ProgramArguments</key>
        <array>
          <string>launchctl</string>
          <string>limit</string>
          <string>maxproc</string>
          <string>2048</string>
          <string>2048</string>
        </array>
      <key>RunAtLoad</key>
        <true />
      <key>ServiceIPC</key>
        <false />
    </dict>
  </plist>
        ' | sudo tee /Library/LaunchDaemons/limit.maxproc.plist

        sudo chown root:wheel /Library/LaunchDaemons/limit.maxproc.plist
        sudo launchctl load -w /Library/LaunchDaemons/limit.maxproc.plist
    fi

}
