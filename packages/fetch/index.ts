#!/usr/bin/env bun
// Chrome headless + pandoc web scraper

import { createHash } from "crypto"

async function main() {
	const args = process.argv.slice(2)

	if (!args[0] || args[0] === "-h") {
		console.log(`fetch - Web scraper with cache (Chrome + pandoc)

Usage:
  fetch <url>                        Fetch and convert to text
  fetch -                            Read URL from stdin

Examples:
  fetch "https://developer.apple.com/documentation/activitykit/activityuidismissalpolicy"
  
Pipeline:
  curl -s https://api.github.com/users/torvalds | jq -r .blog | fetch -
  fetch $URL | grep "ActivityUI" | wc -l
  fd -e md . | xargs -I {} sh -c 'echo "## {}" && fetch $(cat {})'
  
Cache:
  /tmp/fetch_cache/{md5}.txt          1 hour TTL`)
		process.exit(2)
	}

	let url = args[0]

	// stdin support
	if (url === "-") {
		const chunks = []
		for await (const chunk of process.stdin) {
			chunks.push(chunk)
		}
		url = chunks.join("").trim()
	}

	if (!url.startsWith("http")) {
		throw new Error("URL must start with http:// or https://")
	}

	// Cache için MD5 hash
	const urlHash = createHash("md5").update(url).digest("hex")
	const cacheDir = `/tmp/fetch_cache`
	const cacheFile = `${cacheDir}/${urlHash}.txt`

	// Cache kontrolü
	if (await Bun.file(cacheFile).exists()) {
		const stats = await Bun.file(cacheFile).stat()
		const age = Date.now() - stats.mtime.getTime()

		// 1 saatten yeni ise cache'den al
		if (age < 3600000) {
			const cached = await Bun.file(cacheFile).text()
			console.log(cached)
			process.exit(0)
		}
	}

	// Chrome headless ile HTML al
	const chrome = Bun.spawn(
		[
			"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
			"--headless",
			"--disable-gpu",
			"--dump-dom",
			"--virtual-time-budget=5000",
			url
		],
		{
			stderr: "ignore"
		}
	)

	const html = await new Response(chrome.stdout).text()

	if (!html || html.length < 100) {
		throw new Error("Chrome failed to fetch HTML")
	}

	// Pandoc ile plain text'e çevir
	const pandoc = Bun.spawn(["pandoc", "-f", "html", "-t", "plain", "--wrap=none"], {
		stdin: "pipe",
		stderr: "ignore"
	})

	pandoc.stdin.write(html)
	pandoc.stdin.end()

	const text = await new Response(pandoc.stdout).text()

	if (!text) {
		throw new Error("Pandoc failed to convert")
	}

	const result = text.trim()

	// Cache'e kaydet
	await Bun.$`mkdir -p ${cacheDir}`.quiet()
	await Bun.write(cacheFile, result)

	// Sonucu stdout'a bas
	console.log(result)
}

if (import.meta.main) {
	main().catch(err => {
		console.error(`Error: ${err.message}`)
		process.exit(1)
	})
}
