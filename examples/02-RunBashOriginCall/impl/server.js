
const LIB = require("bash.origin.workspace").forPackage(__dirname + "/../../..").LIB;

const hostname = "127.0.0.1";
const port = process.env.PORT;

const config = JSON.parse(process.argv[2]);

const responder = LIB.CODEBLOCK.run(config.responder, {}, {
    sandbox: {
        console: console
    }
});

const server = LIB.HTTP.createServer(responder);

server.listen(port, hostname, () => {
    console.log("[node] Server running at http://" + hostname + ":" + port + "/");
});
