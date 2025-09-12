# fetch

Web scraper with cache (Chrome headless + pandoc)

⚠️ **EXPERIMENTAL**: This package is under active development. Breaking changes may occur at any time.

If you like a version, stick with it: `npm install @yemreak/fetch@version`

## Installation

```bash
npm install -g @yemreak/fetch
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

Apache-2.0 ~ Yunus Emre Ak - yemreak

---
Generated: 2025-09-12 04:27:45
