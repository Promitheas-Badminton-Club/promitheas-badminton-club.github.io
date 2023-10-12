#!/usr/bin/env bash

set -euo pipefail

sheet="https://docs.google.com/spreadsheets/d/1cqdZfqpBg20zd027ZhYXhNfVCKPRyB4t-4BWx6-gJyw/edit#gid=0"

minify() {
  npx html-minifier \
    --collapse-whitespace \
    --remove-comments \
    --remove-optional-tags \
    --remove-redundant-attributes \
    --remove-script-type-attributes \
    --use-short-doctype \
    --minify-css true
}

# Dev mode
printf '
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

  } | minify > "./$code/index.html"

done <<< 'en
nl
ru
el'

cp ./en/index.html index.html
git restore ./en
