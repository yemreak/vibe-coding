#!/usr/bin/env bun

/**
 * Philips Hue Voice Control CLI
 * https://developers.meethue.com/develop/get-started-2/
 *
 * Environment variables required:
 * - HUE_BRIDGE_IP: Bridge IP address on local network
 * - HUE_USERNAME: Authorized username (generated via authenticate())
 *
 * Usage:
 *   bun hue.ts auth
 *   bun hue.ts status
 *   bun hue.ts color blue
 *   bun hue.ts dim 50
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// ==============================================================================
// HELP
// ==============================================================================

const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
	console.log(`Usage: hue <command> [options]

BEHAVIOURS:
  # İlk setup:
  hue auth
  → Press link button on bridge first
  → 1028d66426293e821ecfd9ef1a0731df

  # Durum check:
  hue status
  → 1	Living Room	on	254	10000	ok

  # Işıkları aç/kapat:
  hue on
  hue on 1
  hue off 2
  → Light 2 off

  # Renk değiştir:
  hue color red
  hue color blue 1
  → Light 1 blue

  # Parlaklık ayarla:
  hue dim 50
  hue dim 100 2
  → Light 2 100%

COLORS:
  red orange warm green blue purple pink cold

ENVIRONMENT:
  HUE_BRIDGE_IP
  HUE_USERNAME`)
	process.exit(0)
}

// ==============================================================================
// TYPES
// ==============================================================================

type HueColor = 'red' | 'blue' | 'green' | 'warm' | 'cold' | 'orange' | 'purple' | 'pink'

type LightState = {
	on: boolean
	bri: number // 0-254 brightness
	hue: number // 0-65535 color
	sat: number // 0-254 saturation
	reachable: boolean
}

type Light = {
	state: LightState
	type: string
	name: string
	modelid: string
	manufacturername: string
	productname: string
	uniqueid: string
}

type LightsResponse = Record<string, Light>

type GetLightsError =
	| { type: 'auth_missing'; context: { HUE_BRIDGE_IP: string | undefined; HUE_USERNAME: string | undefined } }
	| { type: 'bridge_unreachable'; context: { response: Response } }
	| { type: 'request_failed'; context: { error: unknown } }

type SetLightStateError =
	| { type: 'auth_missing'; context: { HUE_BRIDGE_IP: string | undefined; HUE_USERNAME: string | undefined } }
	| { type: 'bridge_unreachable'; context: { response: Response } }
	| { type: 'light_unreachable'; context: Light }
	| { type: 'request_failed'; context: { error: unknown } }
	| { type: 'state_update_failed'; context: { data: unknown } }

type AuthenticateError =
	| { type: 'bridge_ip_missing'; context: { HUE_BRIDGE_IP: string | undefined } }
	| { type: 'link_button_not_pressed'; context: { data: unknown } }
	| { type: 'request_failed'; context: { error: unknown } }

// ==============================================================================
// API
// ==============================================================================

const HUE_BRIDGE_IP = process.env.HUE_BRIDGE_IP
const HUE_USERNAME = process.env.HUE_USERNAME

async function getLights(params: {
	onError: (error: GetLightsError) => void
	onResponse: (lights: LightsResponse) => void
}) {
	if (!HUE_BRIDGE_IP || !HUE_USERNAME) {
		params.onError({ type: 'auth_missing', context: { HUE_BRIDGE_IP, HUE_USERNAME } })
		return
	}

	try {
		const response = await fetch(`https://${HUE_BRIDGE_IP}/api/${HUE_USERNAME}/lights`, {
			method: 'GET'
		})

		if (!response.ok) {
			params.onError({ type: 'bridge_unreachable', context: { response } })
			return
		}

		const data = await response.json()
		params.onResponse(data as LightsResponse)
	} catch (error) {
		params.onError({ type: 'request_failed', context: { error } })
	}
}

async function setLightState(params: {
	lightId: string
	state: Partial<{ on: boolean; bri: number; hue: number; sat: number }>
	onError: (error: SetLightStateError) => void
	onResponse: (result: unknown) => void
}) {
	if (!HUE_BRIDGE_IP || !HUE_USERNAME) {
		params.onError({ type: 'auth_missing', context: { HUE_BRIDGE_IP, HUE_USERNAME } })
		return
	}

	try {
		const stateResponse = await fetch(`https://${HUE_BRIDGE_IP}/api/${HUE_USERNAME}/lights/${params.lightId}`, {
			method: 'GET'
		})

		if (!stateResponse.ok) {
			params.onError({ type: 'bridge_unreachable', context: { response: stateResponse } })
			return
		}

		const lightData = await stateResponse.json() as Light

		if (lightData.state && lightData.state.reachable === false) {
			params.onError({ type: 'light_unreachable', context: lightData })
			return
		}

		const response = await fetch(`https://${HUE_BRIDGE_IP}/api/${HUE_USERNAME}/lights/${params.lightId}/state`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(params.state)
		})

		if (!response.ok) {
			params.onError({ type: 'bridge_unreachable', context: { response } })
			return
		}

		const data = await response.json()

		const hasError = Array.isArray(data) && data.some((item) => (item as Record<string, unknown>).error)
		if (hasError) {
			params.onError({ type: 'state_update_failed', context: { data } })
			return
		}

		params.onResponse(data)
	} catch (error) {
		params.onError({ type: 'request_failed', context: { error } })
	}
}

async function authenticate(params: {
	deviceType: string
	onError: (error: AuthenticateError) => void
	onResponse: (username: string) => void
}) {
	if (!HUE_BRIDGE_IP) {
		params.onError({ type: 'bridge_ip_missing', context: { HUE_BRIDGE_IP } })
		return
	}

	try {
		const response = await fetch(`https://${HUE_BRIDGE_IP}/api`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ devicetype: params.deviceType })
		})

		if (!response.ok) {
			params.onError({ type: 'request_failed', context: { error: response } })
			return
		}

		const data = await response.json()

		if (Array.isArray(data) && data[0]?.error?.type === 101) {
			params.onError({ type: 'link_button_not_pressed', context: { data } })
			return
		}

		if (Array.isArray(data) && data[0]?.success?.username) {
			params.onResponse(data[0].success.username)
			return
		}

		params.onError({ type: 'request_failed', context: { error: data } })
	} catch (error) {
		params.onError({ type: 'request_failed', context: { error } })
	}
}

function colorToHue(color: HueColor): number {
	const colorMap: Record<HueColor, number> = {
		red: 0,
		orange: 5000,
		warm: 8000,
		green: 25500,
		blue: 46920,
		purple: 50000,
		pink: 56100,
		cold: 43000
	}
	return colorMap[color]
}

function percentToBri(percent: number): number {
	return Math.round((percent / 100) * 254)
}

// ==============================================================================
// CLI COMMANDS
// ==============================================================================

function formatError(error: { type: string; context: unknown }): string {
	if (error.type === 'bridge_unreachable') {
		const response = (error.context as { response: Response }).response
		return `${response.status} ${response.statusText}`
	}
	return JSON.stringify(error.context, null, 2)
}

const command = args[0]!

if (command === 'auth') {
	await authenticate({
		deviceType: 'mind#cli',
		onError: (error) => {
			if (error.type === 'link_button_not_pressed') {
				console.error('Press link button on bridge first')
				process.exit(1)
			}
			console.error(formatError(error))
			process.exit(1)
		},
		onResponse: (username) => {
			console.log(username)
			console.error(`Add to .env: HUE_USERNAME=${username}`)
		}
	})
	process.exit(0)
}

if (!process.env.HUE_BRIDGE_IP || !process.env.HUE_USERNAME) {
	console.error('Error: HUE_BRIDGE_IP or HUE_USERNAME not set')
	console.error('Run: hue auth')
	process.exit(1)
}

if (command === 'status') {
	await getLights({
		onError: (error) => {
			console.error(formatError(error))
			process.exit(1)
		},
		onResponse: (lights) => {
			for (const [id, light] of Object.entries(lights)) {
				const status = light.state.on ? 'on' : 'off'
				const reachable = light.state.reachable ? 'ok' : 'UNREACHABLE'
				console.log(`${id}\t${light.name}\t${status}\t${light.state.bri}\t${light.state.hue}\t${reachable}`)
			}
		}
	})
	process.exit(0)
}

if (command === 'on' || command === 'off') {
	const lightId = args[1]
	const state = { on: command === 'on' }

	if (lightId) {
		await setLightState({
			lightId,
			state,
			onError: (error) => {
				console.error(formatError(error))
				process.exit(1)
			},
			onResponse: () => {
				console.log(`Light ${lightId} ${command}`)
			}
		})
	} else {
		await new Promise<void>((resolve, reject) => {
			getLights({
				onError: (error) => {
					console.error(formatError(error))
					reject(error)
				},
				onResponse: async (lights) => {
					const ids = Object.keys(lights).filter(id => {
						const light = lights[id]
						return light && light.state.bri !== undefined
					})
					for (const id of ids) {
						await setLightState({
							lightId: id,
							state,
							onError: (error) => {
								console.error(`Light ${id}: ${formatError(error)}`)
							},
							onResponse: () => {}
						})
					}
					console.log(`All lights ${command}`)
					resolve()
				}
			})
		})
	}
	process.exit(0)
}

if (command === 'color') {
	if (!args[1]) {
		console.error('Error: color required')
		process.exit(1)
	}

	const color = args[1]! as 'red' | 'blue' | 'green' | 'warm' | 'cold' | 'orange' | 'purple' | 'pink'
	const lightId = args[2]

	const validColors = ['red', 'blue', 'green', 'warm', 'cold', 'orange', 'purple', 'pink']
	if (!validColors.includes(color)) {
		console.error(`Error: invalid color (use: ${validColors.join(' ')})`)
		process.exit(1)
	}

	const hue = colorToHue(color)
	const state = { on: true, hue, sat: 254, bri: 254 }

	if (lightId) {
		await setLightState({
			lightId,
			state,
			onError: (error) => {
				console.error(formatError(error))
				process.exit(1)
			},
			onResponse: () => {
				console.log(`Light ${lightId} ${color}`)
			}
		})
	} else {
		await new Promise<void>((resolve, reject) => {
			getLights({
				onError: (error) => {
					console.error(formatError(error))
					reject(error)
				},
				onResponse: async (lights) => {
					const ids = Object.keys(lights).filter(id => {
						const light = lights[id]
						return light && light.state.bri !== undefined
					})
					for (const id of ids) {
						await setLightState({
							lightId: id,
							state,
							onError: (error) => {
								console.error(`Light ${id}: ${formatError(error)}`)
							},
							onResponse: () => {}
						})
					}
					console.log(`All lights ${color}`)
					resolve()
				}
			})
		})
	}
	process.exit(0)
}

if (command === 'dim') {
	if (!args[1]) {
		console.error('Error: brightness percent required (0-100)')
		process.exit(1)
	}

	const percent = parseInt(args[1]!, 10)
	if (isNaN(percent) || percent < 0 || percent > 100) {
		console.error('Error: brightness must be 0-100')
		process.exit(1)
	}

	const lightId = args[2]
	const bri = percentToBri(percent)
	const state = { on: true, bri }

	if (lightId) {
		await setLightState({
			lightId,
			state,
			onError: (error) => {
				console.error(formatError(error))
				process.exit(1)
			},
			onResponse: () => {
				console.log(`Light ${lightId} ${percent}%`)
			}
		})
	} else {
		await new Promise<void>((resolve, reject) => {
			getLights({
				onError: (error) => {
					console.error(formatError(error))
					reject(error)
				},
				onResponse: async (lights) => {
					const ids = Object.keys(lights).filter(id => {
						const light = lights[id]
						return light && light.state.bri !== undefined
					})
					for (const id of ids) {
						await setLightState({
							lightId: id,
							state,
							onError: (error) => {
								console.error(`Light ${id}: ${formatError(error)}`)
							},
							onResponse: () => {}
						})
					}
					console.log(`All lights ${percent}%`)
					resolve()
				}
			})
		})
	}
	process.exit(0)
}

console.error(`Error: unknown command: ${command}`)
console.error("Use 'hue --help' for usage")
process.exit(1)
