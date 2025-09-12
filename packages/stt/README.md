# stt

Speech to text with timestamps and speaker diarization

⚠️ **EXPERIMENTAL**: This package is under active development. Breaking changes may occur at any time.

If you like a version, stick with it: `npm install @yemreak/stt@version`

## Installation

```bash
npm install -g @yemreak/stt
```

## Usage

```
stt - Speech to text with timestamps and speaker diarization

Usage:
  stt <audio/video_file>             Transcribe text only (default)
  stt --words <file>                 Output word-level timestamps with tabs
  stt --json <file>                  Output full JSON with all metadata
  stt config api_key <key>           Set ElevenLabs API key
  stt -h                             Show this help

Configuration:
  Config file: ~/.config/stt/config.json
  Environment variables:
    ELEVENLABS_API_KEY               API key for ElevenLabs

Output formats:
  text (default)                     Plain text transcription
  timestamp	text	type	speaker         Word-level with tabs (--words)
  JSON                               Full metadata (--json)

Examples:
```

## License

Apache-2.0 ~ Yunus Emre Ak - yemreak

---
Generated: 2025-09-12 04:27:44
