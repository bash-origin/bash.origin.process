
const codeblock = require("codeblock");
const http = require("http");

const hostname = "127.0.0.1";
const port = process.env.PORT;

const config = JSON.parse(process.argv[2]);

const responder = codeblock.run(config.responder, {}, {
    sandbox: {
        console: console
    }
});

const server = http.createServer(responder);

server.listen(port, hostname, () => {
    console.log("[node] Server running at http://" + hostname + ":" + port + "/");
});
