#!/usr/bin/env node

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { tmpdir, homedir } from 'os'
import { join } from 'path'

function showUsage() {
	console.log(`stt - Speech to text with timestamps and speaker diarization

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
  timestamp\ttext\ttype\tspeaker         Word-level with tabs (--words)
  JSON                               Full metadata (--json)

Examples:
  stt config api_key sk_123          # Save API key
  stt audio.mp3                      # Plain text output
  stt --words video.mp4              # 00:00.119-00:00.259\tHello\tword\tspeaker_0
  stt --json audio.mp3               # Full JSON with all metadata
  cat audio.mp3 | stt                # From stdin

Pipeline examples:
  # Video to audio to text:
  yt-dlp -x --audio-format mp3 $VIDEO_URL -o - | stt -

  # Extract speaker 1's words only:
  stt --words meeting.mp4 | grep speaker_1 | cut -f2

  # Transcribe and clean garbage:
  stt podcast.mp3 | gc - | tee transcript.txt

  # Process multiple audio files:
  fd -e mp3 . | xargs -I{} sh -c 'stt {} > {}.txt'
  
  # Word-level analysis with timestamps:
  stt --words lecture.mp4 | awk -F'\t' '$3=="word" {print $2}' | sort | uniq -c`)
	process.exit(2)
}

async function main() {
	const args = process.argv.slice(2)
	const flags = args.filter(arg => arg.startsWith("-"))
	const nonFlagArgs = args.filter(arg => !arg.startsWith("-"))

	if (flags.includes("-h") || flags.includes("--help")) showUsage()

	if (nonFlagArgs[0] === "config") {
		if (nonFlagArgs[1] === "api_key" && nonFlagArgs[2]) {
			const currentConfig = loadConfig()
			currentConfig.api_key = nonFlagArgs[2]
			saveConfig(currentConfig)
			console.log("API key saved to ~/.config/stt/config.json")
			process.exit(0)
		}
		console.error("Usage: stt config api_key <key>")
		process.exit(1)
	}

	const isJson = flags.includes("-j") || flags.includes("--json")
	const isWords = flags.includes("-w") || flags.includes("--words")

	let audioPath

	if (!process.stdin.isTTY) {
		const chunks = []
		process.stdin.on('data', chunk => chunks.push(chunk))
		await new Promise(resolve => process.stdin.on('end', resolve))
		// Save to temp file for curl
		const tempFile = join(tmpdir(), `stt_${Date.now()}.mp3`)
		const buffer = Buffer.concat(chunks)
		if (buffer.length === 0) {
			throw new Error("No input received from stdin")
		}
		writeFileSync(tempFile, buffer)
		audioPath = tempFile
	} else {
		if (!nonFlagArgs[0]) showUsage()
		audioPath = nonFlagArgs[0]
		
		if (!existsSync(audioPath)) {
			throw new Error(`File not found: ${audioPath}`)
		}
	}

	const API_KEY = ELEVENLABS_API_KEY
	if (!API_KEY) throw new Error("ELEVENLABS_API_KEY not set - use 'stt config api_key <key>' or set environment variable")

	const result = await speechToText(audioPath, API_KEY, {
		timestamps: isWords,
		diarize: true,
		numSpeakers: 8,
	})

	if (isJson) {
		console.log(JSON.stringify(result))
	} else if (isWords && result.words) {
		for (const word of result.words) {
			const start = formatTimestamp(word.start)
			const end = formatTimestamp(word.end)
			const speaker = word.speaker_id || "speaker"
			console.log(`${start}-${end}\t${word.text}\t${word.type}\t${speaker}`)
		}
	} else {
		console.log(result.text || "")
	}
}

async function speechToText(audioPath, apiKey, options = {}) {
	// Build curl command as single string
	let cmd = `curl -s -X POST https://api.elevenlabs.io/v1/speech-to-text`
	cmd += ` -H "xi-api-key: ${apiKey}"`
	cmd += ` -F "file=@${audioPath}"`
	cmd += ` -F "model_id=scribe_v1"`
	
	if (options.timestamps) {
		cmd += ` -F "timestamps_granularity=word"`
	}
	if (options.diarize) {
		cmd += ` -F "diarize=true"`
		cmd += ` -F "num_speakers=${options.numSpeakers || 8}"`
	}
	
	try {
		const output = execSync(cmd, { 
			encoding: 'utf8', 
			maxBuffer: 10 * 1024 * 1024
		})
		return JSON.parse(output)
	} catch (err) {
		throw new Error(`Speech-to-text failed: ${err.message}`)
	}
}

function formatTimestamp(seconds) {
	const mins = Math.floor(seconds / 60)
	const secs = seconds % 60
	const ms = Math.floor((secs % 1) * 1000)
	const wholeSecs = Math.floor(secs)
	return `${String(mins).padStart(2, "0")}:${String(wholeSecs).padStart(2, "0")}.${String(ms).padStart(3, "0")}`
}

const CONFIG_DIR = join(homedir(), '.config', 'stt')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')

function loadConfig() {
	if (existsSync(CONFIG_FILE)) {
		try {
			return JSON.parse(readFileSync(CONFIG_FILE, 'utf8'))
		} catch (e) {
			return {}
		}
	}
	return {}
}

function saveConfig(config) {
	if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true })
	writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

const config = loadConfig()
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || config.api_key

main().catch(console.error)