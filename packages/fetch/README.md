# fetch

Web scraper with cache (Chrome headless + pandoc)

## Installation

```bash
npm install -g @yemreak/fetch
bun add -g @yemreak/fetch

# Uninstall
npm uninstall -g @yemreak/fetch
bun remove -g @yemreak/fetch
```

## Usage

```
fetch - Web scraper with cache (Chrome + pandoc)

Usage:
  fetch <url>                        Fetch and convert to text
  fetch -                            Read URL from stdin

Examples:
  fetch "https://developer.apple.com/documentation/activitykit/activityuidismissalpolicy"
  
Pipeline:
  curl -s https://api.github.com/users/torvalds | jq -r .blog | fetch -
  fetch $URL | grep "ActivityUI" | wc -l
  fd -e md . | xargs -I {} sh -c 'echo "## {}" && fetch $(cat {})'
  
Cache:
  /tmp/fetch_cache/{md5}.txt          1 hour TTL
```

## License

Apache-2.0

---
Generated: 2025-09-09 15:17:25
