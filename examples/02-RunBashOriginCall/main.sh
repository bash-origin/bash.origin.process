#!/usr/bin/env bash.origin.script

depend {
    "process": "@../..#s1",
    "impl": "@./impl#s1"
}

CALL_impl hello


CALL_process run "ProcessSet1" {
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
