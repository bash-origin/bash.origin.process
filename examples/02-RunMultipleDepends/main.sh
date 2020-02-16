#!/usr/bin/env bash.origin.script

echo ">>>TEST_IGNORE_LINE:\\[bash.origin.process\\]<<<";

depend {
    "runner": "bash.origin.process # runner/v0"
}

CALL_runner run {
    "process1": {
        "depends": [
            "process3"
        ],
        "env": {
            "PORT": 3001
        },
        "commands": [
            "node ../01-RunSingle/server.js"
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
        "cwd": "../01-RunSingle",
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
        "cwd": "${__DIRNAME__}/../01-RunSingle",
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
