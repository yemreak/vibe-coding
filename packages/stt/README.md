# @yemreak/stt

## Usage

```bash
# Install
bun install -g @yemreak/stt

# Setup API key
stt config api_key sk_your_elevenlabs_key

# Transcribe audio
stt audio.mp3
→ Hello, this is the transcribed text

# From stdin
cat audio.mp3 | stt

# Word-level timestamps
stt --words meeting.mp4
→ 00:00.119-00:00.259	Hello	word	speaker_0
→ 00:00.280-00:00.520	world	word	speaker_0

# JSON output
stt --json podcast.mp3
→ {"text": "Hello world", "words": [...]}
```

## What This Does

Speech to text with speaker diarization. Supports audio and video files.

**Pattern:**
- Audio/video file → ElevenLabs API → transcript with timestamps and speakers
- Multiple speakers detected automatically
- Word-level timestamps for precise editing

**Why it works:**
- ElevenLabs Scribe API (high accuracy, multi-language)
- Auto speaker diarization (up to 8 speakers)
- Video support via ffmpeg (extracts audio automatically)
- Tab-separated output (pipe-friendly)

**Example flow:**
```bash
# Extract speaker 1's words
stt --words meeting.mp4 | grep speaker_1 | cut -f2

# Transcribe multiple files
fd -e mp3 . | xargs -I {} sh -c 'stt {} > {}.txt'

# Video to transcript
yt-dlp -x --audio-format mp3 $VIDEO_URL -o - | stt

# Word count by speaker
stt --words podcast.mp4 | awk -F'\t' '{print $4}' | sort | uniq -c
```

## How to Build

```bash
# ElevenLabs Speech-to-Text API
curl -X POST https://api.elevenlabs.io/v1/speech-to-text \
  -H "xi-api-key: $API_KEY" \
  -F "file=@audio.mp3" \
  -F "model_id=scribe_v1" \
  -F "timestamps_granularity=word" \
  -F "diarize=true" \
  -F "num_speakers=8"
```

**API:** ElevenLabs Scribe v1

**Config:** `~/.config/stt/config.json` or `ELEVENLABS_API_KEY` env var

**License:** Apache-2.0
