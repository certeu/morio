# morio-completion.sh

_morio_completion() {
    local cur_word args
    COMPREPLY=()
    cur_word="${COMP_WORDS[COMP_CWORD]}"
    args="apt audit cc flags logs metrics start status stop restart template vars"

    # If the command is 'vars', provide additional completions
    if [[ ${COMP_WORDS[1]} == "vars" ]]; then
        args=" dump edit ls set rm wipe"
    fi

    # If the command is 'flags', provide additional completions
    if [[ ${COMP_WORDS[1]} == "flags" ]]; then
        args=" disable enable rm"
    fi

    COMPREPLY=( $(compgen -W "$args" -- $cur_word) )
    return 0
}

complete -F _morio_completion morio

