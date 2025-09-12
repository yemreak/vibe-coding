# tts

Text to speech conversion using ElevenLabs API

⚠️ **EXPERIMENTAL**: This package is under active development. Breaking changes may occur at any time.

If you like a version, stick with it: `npm install @yemreak/tts@version`

## Installation

```bash
npm install -g @yemreak/tts
```

## Usage

```
tts - Text to speech conversion

Usage:
  tts [text] [voice_id]              Convert text to speech
  tts voices                         List available voices
  tts config api_key <key>           Set ElevenLabs API key
  tts config voice_id <id>           Set default voice ID
  tts -q [text]                      Output binary instead of playing
  tts -h                             Show this help

Configuration:
  Config file: ~/.config/tts/config.json
  Environment variables:
    ELEVENLABS_API_KEY               API key for ElevenLabs
    ELEVENLABS_DEFAULT_VOICE_ID      Default voice ID

Examples:
  tts config api_key sk_123          # Save API key
  tts config voice_id voice_456      # Save default voice
  tts hello                          # Play speech
```

## License

Apache-2.0 ~ Yunus Emre Ak - yemreak

---
Generated: 2025-09-12 04:27:45
