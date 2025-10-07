# @yemreak/fetch

## Usage

```bash
# Install
bun install -g @yemreak/fetch

# Fetch with llms.txt (AI-friendly docs)
fetch "https://elevenlabs.io/docs/api-reference"
→ [llms.txt] https://elevenlabs.io/llms.txt
→ API documentation...

# Regular webpage (puppeteer fallback)
fetch "https://example.com"
→ Example Domain...

# Stdin pipe
echo "https://example.com" | fetch -

# Cache bypass
fetch --no-cache "https://example.com"
```

## What This Does

Smart web scraper. Tries llms.txt first (AI documentation), falls back to puppeteer.

**Pattern:**
- URL → check for llms.txt → extract section → cache → text
- No llms.txt? → puppeteer headless browser → extract text → cache

**Why it works:**
- llms.txt = AI-friendly documentation format (markdown, structured)
- Path-based section extraction (`/docs/api-reference` → grep "api-reference")
- 7-day cache (fast repeat fetches)
- Puppeteer fallback (works on any website)

**Example flow:**
```bash
# AI reads API docs
fetch "https://elevenlabs.io/docs/api" | claude "explain"

# Scrape + process
fetch "https://news.ycombinator.com" | grep "Show HN"

# Bulk documentation
fd -e md docs/ | xargs -I {} fetch $(cat {}) > all-docs.txt
```

## How to Build

```typescript
// Check for llms.txt
const LLMS_PATHS = ['/docs/llms.txt', '/llms.txt', '/.well-known/llms.txt']
for (const path of LLMS_PATHS) {
  const response = await fetch(`https://${domain}${path}`, { method: 'HEAD' })
  if (response.ok && response.headers.get('content-type')?.includes('text/plain')) {
    return url
  }
}

// Extract section by path
const pathSegment = url.split('/').pop() // "api-reference"
const section = grepSection(llmsContent, pathSegment)

// Puppeteer fallback
import puppeteer from 'puppeteer'
const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()
await page.goto(url)
const text = await page.evaluate(() => document.body.innerText)
```

**Dependencies:** `puppeteer` (auto-downloads Chromium)

**Cache:** `/tmp/fetch_cache/{md5}.txt` (7 days TTL)

**License:** Apache-2.0
