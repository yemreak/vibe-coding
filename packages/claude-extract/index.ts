#!/usr/bin/env bun

export type Message =
	| { type: "user"; content: string }
	| { type: "assistant"; content: string; toolOutput?: string }

export function extractConversation(input: string): Message[] {
	const lines = input.split("\n"),
		msgs: Message[] = []
	let cur: Message | null = null,
		tool = ""

	for (const ln of lines) {
		if (ln[0] === ">") {
			if (cur) {
				if (cur.type === "assistant" && tool) cur.toolOutput = tool.trim()
				msgs.push(cur)
			}
			cur = { type: "user", content: ln.substring(1).trim() }
			tool = ""
		} else if (ln[0] === "⏺") {
			if (cur) {
				if (cur.type === "assistant" && tool) cur.toolOutput = tool.trim()
				msgs.push(cur)
			}
			cur = { type: "assistant", content: ln.substring(1).trim() }
			tool = ""
		} else if (ln.startsWith("  ") && cur) {
			if (ln.trim().startsWith("⎿")) {
				if (cur.type === "assistant") {
					tool = ln.trim().substring(1).trim()
				} else {
					cur.content += "\n" + ln
				}
			} else if (tool) {
				tool += "\n" + ln.trim()
			} else {
				cur.content += "\n" + ln
			}
		}
	}

	if (cur) {
		if (cur.type === "assistant" && tool) cur.toolOutput = tool.trim()
		msgs.push(cur)
	}

	return msgs
}

async function main() {
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

	let cnt = null,
		end = false,
		st = null,
		en = null
	if (a[0]) {
		const arg = a[0]
		if (arg.includes(":")) {
			const [s, e] = arg.split(":")
			if (s) {
				const n = parseInt(s)
				if (!isNaN(n)) st = n - 1
			}
			if (e) {
				const n = parseInt(e)
				if (!isNaN(n)) en = n
			}
		} else if (arg.startsWith("-") && arg.length > 1) {
			const n = parseInt(arg.slice(1))
			if (!isNaN(n)) {
				cnt = n
				end = true
			}
		} else if (!isNaN(parseInt(arg))) {
			cnt = parseInt(arg)
			end = false
		}
	}

	let inp = ""
	if (!process.stdin.isTTY) {
		for await (const c of process.stdin) inp += c.toString()
	} else {
		const p = Bun.spawnSync(["pbpaste"])
		inp = p.stdout.toString()
	}

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

	const fmt = flt
		.map(m => `${m.type === "user" ? ">" : "⏺"} ${m.content}`)
		.join("\n\n")
	const res = fmt ? `${hdr}${fmt}` : ""

	if (!process.stdin.isTTY) {
		process.stdout.write(res)
	} else {
		const os = inp.length,
			rs = res.length
		const red = Math.round((1 - rs / os) * 100)
		Bun.spawnSync(["pbcopy"], { stdin: Buffer.from(res) })
		console.log(`✓ Copied (${os} → ${rs} chars, -${red}%)`)
	}
}

if (import.meta.main) main()
