# moriod-completion.sh

_morio_completion() {
    local cur_word args
    COMPREPLY=()
    cur_word="${COMP_WORDS[COMP_CWORD]}"
    args="cc start status stop restart"

    COMPREPLY=( $(compgen -W "$args" -- $cur_word) )
    return 0
}

complete -F _moriod_completion moriod

