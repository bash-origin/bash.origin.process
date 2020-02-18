#!/usr/bin/env bash.origin.script

echo ">>>TEST_IGNORE_LINE:\\[bash.origin.process\\]<<<";

depend {
    "runner": "bash.origin.process # runner/v0",
    "impl": "@./impl#s1"
}

CALL_impl hello


CALL_runner run {
    "run-impl": {
        "env": {
            "PORT": "3000"
        },
        "run": (bash () >>>
            #!/usr/bin/env bash.origin.script

            depend {
                "impl": "@./impl#s1"
            }

            CALL_impl hello

            CALL_impl runServer {
                "responder": function /* CodeBlock */ () {
                    return function (req, res) {
                        res.statusCode = 200;
                        var msg = "rid:" + req.url.replace("/?rid=", "");
                        res.end(msg);
                        console.log(msg);
                    };
                }
            }

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
