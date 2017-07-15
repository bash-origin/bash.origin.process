#!/usr/bin/env bash.origin.script

depend {
    "process": "@com.github/bash-origin/bash.origin.process#s1"
}

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
                "expect": "/^\\[node\\] rid:test-nodejs/",
                "exit": true
            }
        }
    }
}

echo "OK"
