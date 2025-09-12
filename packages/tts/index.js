#!/usr/bin/env node

import { spawn } from 'child_process'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

function showUsage() {
	console.log(`tts - Text to speech conversion

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
  tts "Hello world" voice_123        # Custom voice
  tts -q hello > audio.mp3           # Save to file
  cat file.txt | tts                 # From stdin`)
	process.exit(2)
}

async function main() {
	const args = process.argv.slice(2)
	const flags = args.filter(arg => arg.startsWith("-"))
	const nonFlagArgs = args.filter(arg => !arg.startsWith("-"))

	if (flags.includes("-h") || flags.includes("--help")) showUsage()

	const isQuiet = flags.includes("-q") || flags.includes("--quiet")

	if (nonFlagArgs[0] === "config") {
		if (nonFlagArgs[1] === "api_key" && nonFlagArgs[2]) {
			const currentConfig = loadConfig()
			currentConfig.api_key = nonFlagArgs[2]
			saveConfig(currentConfig)
			console.log("API key saved to ~/.config/tts/config.json")
			process.exit(0)
		}
		if (nonFlagArgs[1] === "voice_id" && nonFlagArgs[2]) {
			const currentConfig = loadConfig()
			currentConfig.voice_id = nonFlagArgs[2]
			saveConfig(currentConfig)
			console.log("Voice ID saved to ~/.config/tts/config.json")
			process.exit(0)
		}
		console.error("Usage: tts config api_key <key> or tts config voice_id <id>")
		process.exit(1)
	}

	if (nonFlagArgs[0] === "voices") {
		const API_KEY = ELEVENLABS_API_KEY
		if (!API_KEY) throw new Error("ELEVENLABS_API_KEY not set")

		const voices = await listVoices(API_KEY)
		console.log(JSON.stringify(voices, null, 2))
		process.exit(0)
	}

	let text = ""
	let voiceId = ""

	if (!process.stdin.isTTY) {
		const chunks = []
		for await (const chunk of process.stdin) {
			chunks.push(chunk)
		}
		text = Buffer.concat(chunks).toString().trim()
		voiceId = nonFlagArgs[0] || ""
	} else {
		if (!nonFlagArgs[0]) showUsage()
		text = nonFlagArgs[0]
		voiceId = nonFlagArgs[1] || ""
	}

	if (!text) throw new Error("Text required")

	const API_KEY = ELEVENLABS_API_KEY
	if (!API_KEY) throw new Error("ELEVENLABS_API_KEY not set")

	const finalVoiceId = voiceId || ELEVENLABS_DEFAULT_VOICE_ID
	if (!finalVoiceId) throw new Error("Voice ID required - set ELEVENLABS_DEFAULT_VOICE_ID or provide voice_id")
	
	const audioBuffer = await textToSpeech(text, finalVoiceId, API_KEY)

	const isPiped = !process.stdout.isTTY

	if (isPiped) process.stdout.write(audioBuffer)
	else if (!isQuiet) await playAudio(audioBuffer)
}

const CONFIG_DIR = join(homedir(), '.config', 'tts')
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
const ELEVENLABS_DEFAULT_VOICE_ID = process.env.ELEVENLABS_DEFAULT_VOICE_ID || config.voice_id

async function textToSpeech(text, voiceId, apiKey, modelId = "eleven_turbo_v2_5") {
	const response = await fetch(
		`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
		{
			method: "POST",
			headers: {
				"xi-api-key": apiKey,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				text,
				model_id: modelId,
				output_format: "mp3_44100_128",
			}),
		}
	)

	if (!response.ok) {
		const error = await response.text()
		throw new Error(`Text-to-speech failed: ${error}`)
	}

	const audioData = await response.arrayBuffer()
	return Buffer.from(audioData)
}

async function listVoices(apiKey) {
	const response = await fetch("https://api.elevenlabs.io/v1/voices", {
		headers: { "xi-api-key": apiKey },
	})

	if (!response.ok) {
		const error = await response.text()
		throw new Error(`Failed to list voices: ${error}`)
	}

	const data = await response.json()
	return data.voices
}

async function playAudio(audioBuffer) {
	return new Promise((resolve, reject) => {
		const playProcess = spawn('play', ['-t', 'mp3', '-q', '-'], {
			stdin: 'pipe',
			stdout: 'ignore',
			stderr: 'ignore'
		})

		playProcess.stdin.write(audioBuffer)
		playProcess.stdin.end()

		playProcess.on('close', code => {
			if (code === 0) resolve()
			else reject(new Error(`Play exited with code ${code}`))
		})

		playProcess.on('error', reject)
	})
}

main().catch(console.error)