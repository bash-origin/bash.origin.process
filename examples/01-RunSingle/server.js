
const http = require('http');

const hostname = '127.0.0.1';
const port = process.env.PORT;

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    var msg = '[node] rid:' + req.url.replace(/^\/\?rid=/, "");
    res.end(msg);
    console.log(msg);
});

server.listen(port, hostname, () => {
    console.log('[node] Server running at http://' + hostname + ':' + port + '/');
});
