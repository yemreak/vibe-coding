/**
```ts
extractUserMessages(`
> User message here
  continues here

⏺ Assistant response
  with multiple lines

⎿ Tool output line 1
   Tool output line 2

⏺ Assistant continues after tool

> Another user message
`)
→ `> User message here
continues here

⏺ Assistant response
with multiple lines

⏺ Assistant continues after tool

> Another user message`
```
*/
export function extractUserMessages(input: string): string {
	const lines = input.split('\n'), result: string[] = []
	let inMsg = false, inTool = false, msg = '', type = ''

	for (const line of lines) {
		if (line.startsWith('⎿')) {
			inTool = true
			if (inMsg && msg && type === 'a') {
				result.push(msg.trim())
				msg = ''; inMsg = false
			}
			continue
		}
		
		if (inTool) {
			if (!line.trim() || line.startsWith('>') || line.startsWith('⏺')) {
				inTool = false
				if (line.startsWith('>')) {
					inMsg = true; type = 'u'; msg = '> ' + line.substring(2).trim()
				} else if (line.startsWith('⏺')) {
					inMsg = true; type = 'a'; msg = '⏺ ' + line.substring(2).trim()
				}
			}
			continue
		}
		
		if (line.startsWith('>')) {
			if (inMsg && msg) result.push(msg.trim())
			inMsg = true; type = 'u'; msg = '> ' + line.substring(2).trim()
		} else if (line.startsWith('⏺')) {
			if (inMsg && msg) result.push(msg.trim())
			inMsg = true; type = 'a'; msg = '⏺ ' + line.substring(2).trim()
		} else if (inMsg && line.startsWith('  ')) {
			msg += '\n' + line.substring(2)
		} else if (inMsg && !line.trim()) {
			msg += '\n'
		} else if (inMsg) {
			result.push(msg.trim())
			inMsg = false; msg = ''; type = ''
		}
	}

	if (inMsg && msg) result.push(msg.trim())
	return result.join('\n\n')
}