#!/usr/bin/env bash.origin.script

echo ">>>TEST_IGNORE_LINE:\\[bash.origin.process\\]<<<";

depend {
    "runner": "bash.origin.process # runner/v0"
}

CALL_runner run {
    "nodejs": {
        "env": {
            "PORT": 3001
        },
        "commands": [
            "node server.js"
        ],
        "routes": {
            "alive": {
                "wait": 100,
                "uri": "/?rid=test-nodejs",
                "expect": "/^\\[node\\] rid:test-nodejs/",
                "exit": true
            }
        }
    }
}

echo "OK"
