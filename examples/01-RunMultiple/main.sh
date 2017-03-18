#!/usr/bin/env bash.origin.script

echo "TEST_MATCH_IGNORE>>>"
depend {
    "process": "@com.github/bash-origin/bash.origin.process#1"
}
echo "<<<TEST_MATCH_IGNORE"

echo "TEST_MATCH_IGNORE>>>"
CALL_process run "ProcessSet1" {
    "php": {
        "cwd": "$__DIRNAME__",
        "env": {
            "PORT": 3000
        },
        "command": "php -S 127.0.0.1:3000 -file server.php",
        "routes": {
            "alive": {
                "uri": "/?rid=test-php",
                "expect": "[php] rid:test-php",
                "exit": true
            }
        }
    },
    "nodejs": {
        "cwd": "$__DIRNAME__",
        "env": {
            "PORT": 3001
        },
        "commands": [
            "node server.js"
        ],
        "routes": {
            "alive": {
                "uri": "/?rid=test-nodejs",
                "expect": "[node] rid:test-nodejs",
                "exit": true
            }
        }
    }
}
echo "<<<TEST_MATCH_IGNORE"

echo "OK"
