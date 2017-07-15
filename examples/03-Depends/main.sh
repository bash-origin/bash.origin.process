#!/usr/bin/env bash.origin.script

depend {
    "process": "@com.github/bash-origin/bash.origin.process#s1"
}

CALL_process run "ProcessSet1" {
    "process1": {
        "depends": [
            "process3"
        ],
        "cwd": "$__DIRNAME__",
        "env": {
            "PORT": 3001
        },
        "commands": [
            "node server.js"
        ],
        "routes": {
            "alive": {
                "uri": "/?rid=test-p1",
                "expect": "[node] rid:test-p1",
                "exit": true
            }
        }
    },
    "process2": {
        "depends": [
            "process1"
        ],
        "cwd": "$__DIRNAME__",
        "env": {
            "PORT": 3002
        },
        "commands": [
            "node server.js"
        ],
        "routes": {
            "alive": {
                "uri": "/?rid=test-p2",
                "expect": "[node] rid:test-p2",
                "exit": true
            }
        }
    },
    "process3": {
        "cwd": "$__DIRNAME__",
        "env": {
            "PORT": 3003
        },
        "commands": [
            "node server.js"
        ],
        "routes": {
            "alive": {
                "uri": "/?rid=test-p3",
                "expect": "[node] rid:test-p3",
                "exit": true
            }
        }
    }
}

echo "OK"
