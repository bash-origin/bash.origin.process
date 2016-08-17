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
    local __BO_DIR__="$___TMP___"



    function BO_Process_IsDaemonized {

    }


    function BO_Process_Daemonize {

    }


}
init $@
