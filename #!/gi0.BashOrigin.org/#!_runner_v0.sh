#!/usr/bin/env bash.origin.script

function EXPORTS_run {

    doc={
        "# +1": "gi0.PINF.it/core",
        "# +2": {
            "process": "${__DIRNAME__}/../gi0.PINF.it/#!inf.json"
        },
        ":runner:": "process @ runner/v0",

        "gi0.PINF.it/core/v0 @ # :runner: set() config": ${1},
        "gi0.PINF.it/core/v0 @ # :runner: run()": ""
    }

    echo "${doc}" | pinf.it ---
}
