#!/usr/bin/env bash

set -euo pipefail

sheet="https://docs.google.com/spreadsheets/d/1cqdZfqpBg20zd027ZhYXhNfVCKPRyB4t-4BWx6-gJyw/edit#gid=0"

# Dev mode
printf 'en
nl
ru
el
' | while read -r code; do
  mkdir -p "$code"

  {
    echo '<!DOCTYPE html>'
    mache 'cmsheet "%s" -o "value.%s" "value"' "$sheet" "$code" |
      jq -r .page |
      pandoc -

    echo '<script defer>'
    npx babel ./script.js --presets=@babel/preset-env | npx terser
    echo '</script>'

  } > "./$code/index.html"

done <<< 'en
nl
ru
el'

cp en/index.html index.html
