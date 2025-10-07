# @yemreak/hue

## Usage

```bash
# Install
bun install -g @yemreak/hue

# Setup (one time)
export HUE_BRIDGE_IP=192.168.1.100
hue auth                              # Press bridge button first
export HUE_USERNAME=<output>

# Control lights
hue status                            # List all lights
hue on                                # Turn all on
hue off 2                             # Turn light 2 off
hue color blue                        # Change all to blue
hue color warm 1                      # Change light 1 to warm
hue dim 50                            # Set all to 50%
hue dim 100 2                         # Set light 2 to 100%
```

**Colors:** `red` `orange` `warm` `green` `blue` `purple` `pink` `cold`

## What This Does

Talk to your lights. No app, no cloud, no delay.

Your voice → text → `hue color blue` → lights change.

**Pattern:**
- You record voice (phone/watch/computer)
- AI converts to text
- AI reads this tool's commands
- AI writes `hue color blue`
- Terminal executes
- Lights respond

**Why it works:**
- Local API (bridge on your network)
- Single command (no complex syntax)
- Terminal ready (pipe from anywhere)
- AI friendly (simple english-like commands)

**Example flow:**
```bash
# Voice: "make the lights blue"
stt audio.mp3                         # → "make the lights blue"
| claude                              # → "hue color blue"
| sh                                  # → lights turn blue
```

## How to Build

```typescript
// Structure
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'  // Bridge uses self-signed cert

// API calls
fetch(`https://${BRIDGE_IP}/api/${USERNAME}/lights`)
fetch(`https://${BRIDGE_IP}/api/${USERNAME}/lights/1/state`, {
  method: 'PUT',
  body: JSON.stringify({ on: true, hue: 46920, sat: 254, bri: 254 })
})

// Color mapping
{ blue: 46920, red: 0, green: 25500, ... }

// Brightness (0-100% → 0-254)
Math.round((percent / 100) * 254)
```

**API Docs:** https://developers.meethue.com/develop/get-started-2/

**License:** Apache-2.0
