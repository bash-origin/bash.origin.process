#!/usr/bin/env bash.origin.script

function EXPORTS_hello {
    echo 'Hello there!'
}

function EXPORTS_runServer {
    BO_run_recent_node "$__DIRNAME__/server.js" "$1"
}
