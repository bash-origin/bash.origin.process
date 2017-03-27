#!/usr/bin/env bash.origin.script

echo "TEST_MATCH_IGNORE>>>"
depend {
    "process": "@../..#1",
    "impl": "@./impl#s1"
}
echo "<<<TEST_MATCH_IGNORE"


CALL_impl hello


CALL_process run "ProcessSet1" {
    "run-impl": {
        "env": {
            "PORT": "3000"
        },
        "run": (bash () >>>
            #!/usr/bin/env bash.origin.script

            echo "BASH RUNNING IN PROCESS!"

            depend {
                "impl": "@./impl#s1"
            }

            CALL_impl hello

            CALL_impl runServer

        <<<),
        "routes": {
            "alive": {
                "uri": "/?rid=test",
                "expect": "rid:test",
                "exit": true
            }
        }
    }
}

echo "OK"
