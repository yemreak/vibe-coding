#!/usr/bin/env node

import { exec } from 'child_process'
import { promisify } from 'util'
import { readFile } from 'fs/promises'

const execAsync = promisify(exec)

async function main() {
	const args = process.argv.slice(2)
	
	if (args.includes("-h") || args.includes("--help")) {
		console.log(`culture - Learn from git history, preserve culture

Git = Our history. Every commit is a lesson, every fix an anti-pattern.
Like learning from ancestors, we learn from git history.

Usage:
  culture [path]        Show file/directory history
  culture -h            Show this help

Examples:
  culture .                     # Project's last 20 commits
  culture src/core/             # core directory history
  culture src/core/auth.ts      # auth.ts file evolution

What you'll see:
  - Past decisions (why did we do it this way?)
  - Anti-patterns (what did fixes correct?)
  - Pattern evolution (what did refactors improve?)
  - Culture DNA (recurring approaches)

Remember:
  - Use git mv, preserve file history
  - Write every action to git, create history
  - Look at the past, don't repeat mistakes`)
		process.exit(2)
	}

	const path = args[0] || "."
	
	console.log("════════════════════════════════════════")
	console.log(`GIT HISTORY: ${path}`)
	console.log("════════════════════════════════════════\n")
	
	try {
		// Get all commits with full message
		const { stdout: commits } = await execAsync(`git log -n 20 --format="COMMIT_START%n%H%n%ar%n%B%nCOMMIT_END" -- "${path}"`)
		const commitBlocks = commits.split("COMMIT_START").filter(Boolean)
		
		if (commitBlocks.length === 0) {
			console.log("No commits found for this path")
			process.exit(0)
		}
		
		for (const [idx, block] of commitBlocks.entries()) {
			const lines = block.trim().split("\n").filter(line => line && line !== "COMMIT_END")
			if (lines.length < 3) continue
			
			const hash = lines[0]?.trim()
			const time = lines[1]?.trim()
			const message = lines.slice(2).join("\n").trim()
			
			if (!hash || !time) continue
			
			// Split message into subject and body
			const messageLines = message.split("\n")
			const subject = messageLines[0]
			const body = messageLines.slice(1).join("\n").trim()
			
			console.log(`\n[${idx + 1}] ${time}`)
			console.log(subject || "No subject")
			
			// Show commit body
			if (body) {
				console.log(body.split("\n").map(line => `    ${line}`).join("\n"))
			}
			
			try {
				const { stdout: stats } = await execAsync(`git show ${hash} --stat --format="" -- "${path}"`)
				const statLines = stats.trim().split("\n").filter(Boolean)
				
				if (statLines.length > 0) {
					console.log("Files:")
					for (const line of statLines) {
						if (line.includes("|")) {
							const parts = line.split("|")
							if (parts.length >= 2 && parts[0] && parts[1]) {
								console.log(`  ${parts[0].trim()} ${parts[1].trim()}`)
							}
						}
					}
				}
			} catch (e) {
				// Ignore stats errors
			}
		}
		
		console.log(`
════════════════════════════════════════
GIT = OUR HISTORY
════════════════════════════════════════

All file operations must use git commands.
Naming, moving, everything. We track all file history.

We learn from past mistakes. Anti-patterns.
We try not to repeat them. We understand past decisions
and become aware of the culture.

Like people learning from ancestors. We transmit culture through git.
All our actions must be written to history. Git is our history.

Just as people consult their elders, look at their history
"How did they solve this in the past, how should I solve it?"
You too, looking at the past in the same concept:
- Anti-patterns to avoid
- Patterns to follow
- Things that express where we are
Shape your behavior.

Commands:
  git log --follow ${path}  # Track even if filename changed
  git diff HEAD~1 ${path}   # See last changes
  git blame ${path}         # Who wrote each line
  git mv old new            # Move/rename file (NEVER use plain mv)`)
	} catch (err) {
		console.error(err.message)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err.message)
	process.exit(1)
})