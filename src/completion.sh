_generate_foo_completions() {
  local idx=$1; shift
  local words=( "$@" )
  local current_word=${words[idx]}

  gg shell-completion --list "${words}"
}

_complete_foo_bash() {
  local IFS=$'\n'
  local raw=($(gg shell-completion --list "$COMP_LINE"))
  local trimmed=()
  trimmed+=( "${raw[@]}" )

  if (( ${#raw[@]} == 1 )); then
    trimmed+=( "${raw[0]%%:*}" )
  fi

  COMPREPLY=( "${trimmed[@]}" )
}

_complete_foo_zsh() {
  local -a raw trimmed
  local IFS=$'\n'
  raw=($(_generate_foo_completions "$CURRENT" "${words[@]}"))

  for d in $raw; do trimmed+=( "${d%%:*}" ); done
  if (( ${#raw} == 1 )); then
    trimmed+=( "${raw[1]}" )
    raw+=( "${trimmed[1]}" )
  fi

  compadd -d raw -- $trimmed
}

if [ -n "${ZSH_VERSION:-}" ]; then
  autoload -Uz compinit
  compinit
  compdef _complete_foo_zsh gg
elif [ -n "${BASH_VERSION:-}" ]; then
  complete -F _complete_foo_bash gg
fi