#!/usr/bin/env bun

import { YoutubeTranscript } from 'youtube-transcript-plus'

const args = process.argv.slice(2)

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
	console.log(`Usage: yt [OPTIONS] <url_or_id>

BEHAVIOURS:
  # Video transcriptini al:
  yt "https://youtube.com/watch?v=dQw4w9WgXcQ"
  yt dQw4w9WgXcQ
  → Never gonna give you up...

  # Türkçe altyazı:
  yt --lang tr "https://youtube.com/watch?v=dQw4w9WgXcQ"
  → Seni asla terk etmeyeceğim...

  # Timestamp formatları:
  yt --timestamps "https://youtube.com/watch?v=dQw4w9WgXcQ"
  → 0:00	Never gonna give you up
  yt --json "https://youtube.com/watch?v=dQw4w9WgXcQ"
  → [{"text":"Never gonna give you up","start":0,"duration":2.34}]`)
	process.exit(0)
}

const isJson = args.includes('--json')
const isTimestamps = args.includes('--timestamps')
const langIndex = args.indexOf('--lang')
const lang = langIndex !== -1 ? args[langIndex + 1] : undefined

const urlOrId = args.find(arg => !arg.startsWith('-') && arg !== lang)

if (!urlOrId) {
	console.error('Error: No URL or video ID provided')
	console.error("Use 'yt --help' for usage")
	process.exit(1)
}

const videoId = extractVideoId(urlOrId)

try {
	const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
		lang: lang || 'en'
	})

	const segments = transcript.map((segment: any) => ({
		text: decodeHtmlEntities(segment.text),
		start: segment.offset / 1000,
		duration: segment.duration / 1000
	}))

	if (isJson) {
		console.log(JSON.stringify(segments, null, 2))
	} else if (isTimestamps) {
		for (const segment of segments) {
			const time = formatTimestamp(segment.start)
			console.log(`${time}\t${segment.text}`)
		}
	} else {
		console.log(segments.map(s => s.text).join(' '))
	}
} catch (error) {
	console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
	process.exit(1)
}

function extractVideoId(urlOrId: string): string {
	const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/, /^([a-zA-Z0-9_-]{11})$/]

	for (const pattern of patterns) {
		const match = urlOrId.match(pattern)
		if (match) return match[1]!
	}

	throw new Error(`Invalid YouTube URL or video ID: ${urlOrId}`)
}

function decodeHtmlEntities(text: string): string {
	return text
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
}

function formatTimestamp(seconds: number): string {
	const totalSeconds = Math.floor(seconds)
	const hours = Math.floor(totalSeconds / 3600)
	const minutes = Math.floor((totalSeconds % 3600) / 60)
	const secs = totalSeconds % 60

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
	}
	return `${minutes}:${secs.toString().padStart(2, '0')}`
}
