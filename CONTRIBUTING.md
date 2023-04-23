# Contributing

## How it works

One page with headers to jump to the desired information.

Content is delivered using the CMS named CMSheet. It allows you to use google
sheets to define content and translations.

An iCalendar is used to populate the events timeline. The title and summary
values are keys that access the CMS values.

```sh
mustache index.md "$(cmsheet "$google_sheet_url")" |
  pandoc |
  publish
```
