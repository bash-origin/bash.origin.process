#!/bin/bash
if [ -z "$HOME" ]; then
    echo "ERROR: 'HOME' environment variable is not set!"
    exit 1
fi
# Source https://github.com/bash-origin/bash.origin
if [ -z "${BO_LOADED}" ]; then
    . "$HOME/.bash.origin"
fi
function init {
    eval BO_SELF_BASH_SOURCE="$BO_READ_SELF_BASH_SOURCE"
    BO_deriveSelfDir ___TMP___ "$BO_SELF_BASH_SOURCE"
    __BO_Process_DIR__="$___TMP___"


    function BO_Process_IsDaemonized {
        if [ -z "${_BO_PROCESS_DAEMONIZED}" ]; then
            return 1
        fi
        return 0
    }

    function BO_Process_Daemonize {
        BO_log "$BO_VERBOSE" "[bash.origin.process] BO_Process_Daemonize"

        if [ ! -e "${__BO_Process_DIR__}/lib/mon/mon" ]; then
            pushd "${__BO_Process_DIR__}/lib/mon" > /dev/null
                make
            popd > /dev/null
        fi

        BO_resetLoaded
        export _BO_PROCESS_DAEMONIZED=1

        # TODO: Make these paths configurable.
        if [ -e "$1~mon.pid" ]; then
            kill `cat "$1~mon.pid"` || true
        fi
        "${__BO_Process_DIR__}/lib/mon/mon" \
            --log "$1~mon.log" \
            --pidfile "$1~mon.pid" \
            --daemonize \
            "$1"
    }

}
init "$@"
