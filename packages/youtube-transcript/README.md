# @yemreak/youtube-transcript

## Usage

```bash
# Install
bun install -g @yemreak/youtube-transcript

# Extract transcript
yt "https://youtube.com/watch?v=dQw4w9WgXcQ"
yt dQw4w9WgXcQ

# Different languages
yt --lang tr "https://youtube.com/watch?v=dQw4w9WgXcQ"
yt --lang es "https://youtube.com/watch?v=dQw4w9WgXcQ"

# Timestamp format
yt --timestamps "https://youtube.com/watch?v=dQw4w9WgXcQ"
→ 0:00  Never gonna give you up
→ 0:03  Never gonna let you down

# JSON format
yt --json "https://youtube.com/watch?v=dQw4w9WgXcQ"
→ [{"text":"Never gonna give you up","start":0,"duration":2.34}]
```

## What This Does

Extract YouTube video transcripts. No browser, no API key, no rate limit.

**Pattern:**
- YouTube video URL → transcript text
- Uses YouTube's official subtitle API
- Multiple language support
- Three output formats (text/timestamps/json)

**Why it works:**
- Direct API access (no scraping)
- YouTube provides subtitles for most videos
- Auto-generated or manual subtitles
- Works with video ID or full URL

**Example flow:**
```bash
# Blog post from video
yt $VIDEO_URL | claude "write blog post" > post.md

# Translate to another language
yt --lang en $VIDEO | claude "translate to tr" > tr.txt

# Search for keyword
yt $VIDEO | grep -i "kubernetes"

# Word count
yt $VIDEO | wc -w
```

## How to Build

```typescript
import { YoutubeTranscript } from 'youtube-transcript-plus'

// Fetch transcript
const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
  lang: 'en' // or 'tr', 'es', etc.
})

// Extract video ID from URL
const patterns = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
  /^([a-zA-Z0-9_-]{11})$/
]

// Decode HTML entities
text.replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
```

**API:** Uses `youtube-transcript-plus` NPM package

**License:** Apache-2.0
