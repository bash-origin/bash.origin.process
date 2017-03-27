
const http = require("http");

const hostname = "127.0.0.1";
const port = process.env.PORT;

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    var msg = "rid:" + req.url.replace(/^\/\?rid=/, "");
    res.end(msg);
    console.log(msg);
});

server.listen(port, hostname, () => {
    console.log("[node] Server running at http://" + hostname + ":" + port + "/");
});
