#!/usr/bin/env node

function extractConversation(input) {
	const lines = input.split("\n"), msgs = []
	let cur = null
	
	for (const ln of lines) {
		if (ln[0] === ">") {
			if (cur) msgs.push(cur)
			cur = { type: "user", content: ln.substring(1).trim() }
		} else if (ln[0] === "⏺") {
			if (cur) msgs.push(cur)
			cur = { type: "assistant", content: ln.substring(1).trim() }
		} else if (ln.startsWith("  ") && cur) {
			cur.content += "\n" + ln
		}
	}
	
	if (cur) msgs.push(cur)
	return msgs
}

function main() {
	const a = process.argv.slice(2)
	if (a.includes("--help") || a.includes("-h")) {
		console.log(`claude-extract - Transfer conversation between Claude sessions

Usage:
  claude-extract      Extract all messages
  claude-extract N    Extract Nth message
  claude-extract -N   Extract Nth from end
  claude-extract N:M  Extract range N to M
  claude-extract :N   Extract first N messages
  claude-extract -N:  Extract last N messages

Workflow:
  1. Current Claude: /export → Copy to clipboard
  2. New Claude: claude-extract (in bash)
  3. Paste result → AI continues with context`)
		process.exit(0)
	}

	let cnt = null, end = false, st = null, en = null
	if (a[0]) {
		const arg = a[0]
		if (arg.includes(":")) {
			const [s, e] = arg.split(":")
			if (s) { const n = parseInt(s); if (!isNaN(n)) st = n - 1 }
			if (e) { const n = parseInt(e); if (!isNaN(n)) en = n }
		} else if (arg.startsWith("-") && arg.length > 1) {
			const n = parseInt(arg.slice(1))
			if (!isNaN(n)) { cnt = n; end = true }
		} else if (!isNaN(parseInt(arg))) {
			cnt = parseInt(arg); end = false
		}
	}

	let inp = ""
	if (!process.stdin.isTTY) {
		const chunks = []
		process.stdin.on("data", chunk => chunks.push(chunk))
		process.stdin.on("end", () => {
			inp = Buffer.concat(chunks).toString()
			processInput()
		})
	} else {
		const { execSync } = require("child_process")
		inp = execSync("pbpaste", { encoding: "utf8" })
		processInput()
	}

	function processInput() {
		if (!inp.trim() || (!inp.includes(">") && !inp.includes("⏺"))) {
			console.error("× No valid data")
			process.exit(1)
		}

		const msgs = extractConversation(inp)
		if (!msgs.length) {
			console.error("× No messages")
			process.exit(1)
		}

		const hdr = `# Previous Conversation Context

This conversation history is from previous interactions.
Human (my) (>) and assistant (your) (⏺) messages are preserved.
Continue with the same behavior pattern from this context.
IMPORTANT: Execute REAL actions using actual tools (Bash, Read, Write, etc.)
DO NOT simulate outputs - use actual MCP tools to perform real operations.
When you see tool usage patterns, execute them with real tools, not simulations.

---

`

		let flt = msgs
		if (st !== null || en !== null) {
			if (st === null && en !== null) flt = msgs.slice(0, en)
			else if (st !== null && en === null) flt = msgs.slice(st < 0 ? st : st)
			else flt = msgs.slice(st ?? 0, en ?? msgs.length)
		} else if (cnt !== null) {
			if (end) {
				const i = msgs.length + cnt - 1
				flt = i >= 0 && i < msgs.length && msgs[i] ? [msgs[i]] : []
			} else {
				const i = cnt - 1
				flt = i >= 0 && i < msgs.length && msgs[i] ? [msgs[i]] : []
			}
		}

		const fmt = flt.map(m => `${m.type === "user" ? ">" : "⏺"} ${m.content}`).join("\n\n")
		const res = fmt ? `${hdr}${fmt}` : ""

		if (!process.stdin.isTTY) {
			process.stdout.write(res)
		} else {
			const os = inp.length, rs = res.length
			const red = Math.round((1 - rs / os) * 100)
			const { execSync } = require("child_process")
			execSync("pbcopy", { input: res })
			console.log(`✓ Copied (${os} → ${rs} chars, -${red}%)`)
		}
	}
}

if (require.main === module) main()