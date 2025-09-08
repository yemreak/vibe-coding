#!/usr/bin/env bun

import { execSync } from "child_process"

/**
 * @example
 * extractUserMessages("> User message\n⏺ Response\n> Another") → "User message\n\nAnother"
 */
function extractUserMessages(input: string): string {
	const lines = input.split('\n')
	const result: string[] = []
	let inUserMessage = false
	let currentMessage = ''

	for (const line of lines) {
		if (line.startsWith('>')) {
			if (inUserMessage && currentMessage) {
				result.push(currentMessage.trim())
			}
			inUserMessage = true
			currentMessage = line.substring(2).trim()
		} else if (line.startsWith('⏺')) {
			if (inUserMessage && currentMessage) {
				result.push(currentMessage.trim())
				inUserMessage = false
				currentMessage = ''
			}
		} else if (inUserMessage && line.startsWith('  ')) {
			currentMessage += '\n' + line.substring(2)
		} else if (inUserMessage && line.trim() === '') {
			currentMessage += '\n'
		} else if (inUserMessage) {
			result.push(currentMessage.trim())
			inUserMessage = false
			currentMessage = ''
		}
	}

	if (inUserMessage && currentMessage) {
		result.push(currentMessage.trim())
	}

	return result.join('\n\n')
}

function showUsage() {
	console.log(`claude-extract - Extract user messages from Claude chat

Usage:
  claude-extract           Extract all messages from clipboard
  claude-extract N         Extract Nth message (1-indexed)
  claude-extract -N        Extract Nth message from end
  claude-extract N:M       Extract messages N to M
  claude-extract :N        Extract first N messages
  claude-extract -N:       Extract last N messages
  
Experience:
  1. In Claude Code: /export → Copy to clipboard
  2. Terminal: claude-extract
  3. Result: User messages in clipboard
  
Pipeline:
  pbpaste | claude-extract | pbcopy
  claude-extract 3 && pbpaste | wc -l`)
}

async function main() {
	const args = process.argv.slice(2)

	if (args.includes("--help") || args.includes("-h")) {
		showUsage()
		process.exit(0)
	}

	// Parse number/range argument
	let messageCount: number | null = null
	let isFromEnd = false
	let rangeStart: number | null = null
	let rangeEnd: number | null = null

	if (args[0]) {
		const arg = args[0]
		if (arg.includes(':')) {
			// Range format: 1:3, :3, 2:, 1:5
			const [startStr, endStr] = arg.split(':')
			
			if (startStr) {
				const start = parseInt(startStr)
				if (!isNaN(start)) rangeStart = start - 1 // Convert to 0-based
			}
			
			if (endStr) {
				const end = parseInt(endStr)
				if (!isNaN(end)) rangeEnd = end // End is exclusive like Python
			}
		} else if (arg.startsWith('-') && arg.length > 1) {
			// -5 format (from end)
			const num = parseInt(arg.slice(1))
			if (!isNaN(num)) {
				messageCount = num
				isFromEnd = true
			}
		} else if (!isNaN(parseInt(arg))) {
			// 3 format (single message index)
			messageCount = parseInt(arg)
			isFromEnd = false
		}
	}

	// Always read from clipboard
	let input = ''
	try {
		input = execSync('pbpaste', { encoding: 'utf8' })
	} catch (error) {
		console.error("× Failed to read from clipboard")
		process.exit(1)
	}

	if (!input.trim()) {
		console.error("× No input data found")
		process.exit(1)
	}

	// Extract and filter messages
	const rawResult = extractUserMessages(input)
	if (!rawResult) {
		console.error("× No user messages found")
		process.exit(1)
	}
	
	const allMessages = rawResult.split('\n\n').filter(msg => msg.trim())
	
	// Apply filtering logic
	let filteredMessages = allMessages
	
	if (rangeStart !== null || rangeEnd !== null) {
		// Range format: Python slice behavior
		if (rangeStart === null && rangeEnd !== null) {
			// :N format (head -N behavior)
			filteredMessages = allMessages.slice(0, rangeEnd)
		} else if (rangeStart !== null && rangeEnd === null) {
			// N: format  
			if (rangeStart < 0) {
				// -N: format (tail -N behavior)
				filteredMessages = allMessages.slice(rangeStart)
			} else {
				// N: format (from N to end)
				filteredMessages = allMessages.slice(rangeStart)
			}
		} else {
			// N:M format (range)
			const start = rangeStart ?? 0
			const end = rangeEnd ?? allMessages.length
			filteredMessages = allMessages.slice(start, end)
		}
	} else if (messageCount !== null) {
		if (isFromEnd) {
			// -N format (single message from end)
			const index = allMessages.length + messageCount - 1 // -1 becomes last, -2 becomes second-to-last
			if (index >= 0 && index < allMessages.length) {
				const message = allMessages[index]
				filteredMessages = message ? [message] : []
			} else {
				filteredMessages = []
			}
		} else {
			// N format (single message from start)
			const index = messageCount - 1 // Convert to 0-based
			if (index >= 0 && index < allMessages.length) {
				const message = allMessages[index]
				filteredMessages = message ? [message] : []
			} else {
				filteredMessages = []
			}
		}
	}
	
	// Output to clipboard
	const result = filteredMessages.join('\n\n')
	try {
		execSync('pbcopy', { input: result })
		console.log('✓ Copied to clipboard')
	} catch (error) {
		console.error('× Failed to write to clipboard')
		process.exit(1)
	}
}

if (import.meta.main) {
	main()
}