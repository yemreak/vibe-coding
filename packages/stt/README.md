# stt

Speech to text with timestamps and speaker diarization

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
  stt --youtube <file>               Output YouTube subtitle format (SRT)
  stt --json <file>                  Output full JSON with all metadata
  stt -h                             Show this help

Output formats:
  text (default)                     Plain text transcription
  timestamp	text	type	speaker         Word-level with tabs (--words)
  SRT format                         YouTube subtitles (--youtube)
  JSON                               Full metadata (--json)

Examples:
  stt audio.mp3                      # Plain text output
  stt --words video.mp4              # 00:00.119-00:00.259	Hello	word	speaker_0
  stt --youtube video.mp4            # SRT subtitle format
  stt --json audio.mp3               # Full JSON with all metadata
```

## License

Apache-2.0 ~ Yunus Emre Ak - yemreak

---
Generated: 2025-09-12 03:35:00
