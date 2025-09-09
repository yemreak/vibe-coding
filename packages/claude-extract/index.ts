#!/usr/bin/env bun
import { extractUserMessages } from "./extract"

function showUsage() {
	console.log(`claude-extract - Extract messages from Claude chat

Usage:
  claude-extract           Extract all messages
  claude-extract N         Extract Nth message
  claude-extract -N        Extract Nth from end
  claude-extract N:M       Extract range N to M
  claude-extract :N        Extract first N
  claude-extract -N:       Extract last N
  
Experience:
  /export → claude-extract → User (>) assistant (⏺) in clipboard
  
Pipeline:
  claude-extract && pbpaste | wc -l
  claude-extract 3 && pbpaste > messages.txt`)
}

async function main() {
	const args = process.argv.slice(2)
	if (args.includes("--help") || args.includes("-h")) {
		showUsage(); process.exit(0)
	}

	let count: number | null = null, fromEnd = false, start: number | null = null, end: number | null = null

	if (args[0]) {
		const arg = args[0]
		if (arg.includes(':')) {
			const [s, e] = arg.split(':')
			if (s) { const n = parseInt(s); if (!isNaN(n)) start = n - 1 }
			if (e) { const n = parseInt(e); if (!isNaN(n)) end = n }
		} else if (arg.startsWith('-') && arg.length > 1) {
			const n = parseInt(arg.slice(1))
			if (!isNaN(n)) { count = n; fromEnd = true }
		} else if (!isNaN(parseInt(arg))) {
			count = parseInt(arg); fromEnd = false
		}
	}

	let input = ''
	for (let i = 0; i < 10; i++) {
		if (i > 0) await Bun.sleep(200)
		const proc = Bun.spawn(['pbpaste'])
		input = await new Response(proc.stdout).text()
		if (input.includes('>') || input.includes('⏺') || input.includes('⎿')) break
	}

	if (!input.trim() || (!input.includes('>') && !input.includes('⏺'))) {
		console.error("× No valid conversation data found")
		process.exit(1)
	}

	const raw = extractUserMessages(input)
	if (!raw) { console.error("× No messages found"); process.exit(1) }
	
	const header = [
		"# Previous Conversation Context",
		"",
		"This conversation history is from previous interactions.",
		"Human (>) and assistant (⏺) messages are preserved.",
		"Continue with the same behavior pattern from this context.",
		"",
		"---",
		""
	].join('\n')
	
	const all = raw.split('\n\n').filter(m => m.trim())
	
	let filtered = all
	
	if (start !== null || end !== null) {
		if (start === null && end !== null) {
			filtered = all.slice(0, end)
		} else if (start !== null && end === null) {
			filtered = all.slice(start < 0 ? start : start)
		} else {
			filtered = all.slice(start ?? 0, end ?? all.length)
		}
	} else if (count !== null) {
		if (fromEnd) {
			const i = all.length + count - 1
			filtered = (i >= 0 && i < all.length && all[i]) ? [all[i]] : []
		} else {
			const i = count - 1
			filtered = (i >= 0 && i < all.length && all[i]) ? [all[i]] : []
		}
	}
	
	const msgs = filtered.join('\n\n')
	const result = msgs ? `${header}${msgs}` : ''
	
	const proc = Bun.spawn(['pbcopy'], { stdin: 'pipe' })
	proc.stdin?.write(result)
	proc.stdin?.end()
	await proc.exited
	console.log('✓ Copied to clipboard')
}

if (import.meta.main) {
	main()
}