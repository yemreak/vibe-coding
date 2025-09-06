# @yemreak/fetch

Scrape JavaScript-rendered pages as plain text with Chrome headless and pandoc

```bash
bun add -g @yemreak/fetch
```

## Why

Most scraping tools fail with modern JavaScript-heavy websites. `yfetch` uses Chrome headless to fully render pages, then converts to plain text with pandoc. Perfect for documentation sites, SPAs, and dynamic content.

## Usage

```
yfetch <url>                        Fetch and convert to text
yfetch -                            Read URL from stdin
```

## Examples

```bash
yfetch "https://developer.apple.com/documentation/activitykit/activityuidismissalpolicy"
```

## Pipeline

```bash
curl -s https://api.github.com/users/torvalds | jq -r .blog | yfetch -
yfetch $URL | grep "ActivityUI" | wc -l
fd -e md . | xargs -I {} sh -c 'echo "## {}" && yfetch $(cat {})'
```

## Cache

```
/tmp/fetch_cache/{md5}.txt          1 hour TTL
```

## Install

```bash
bun add -g @yemreak/fetch    # or npm install -g