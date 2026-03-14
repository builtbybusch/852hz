# Contributing

Thanks for your interest in contributing to 852 Hz!

## Setup

1. Fork and clone the repo.
2. Install dependencies:

```bash
pnpm install
```

3. Copy the environment file and fill in a GitHub personal access token (used for the feedback form to create issues):

```bash
cp .env.example .env
```

4. Start the dev server:

```bash
pnpm dev
```

## Code quality

Before opening a pull request, make sure the following pass:

```bash
pnpm lint
pnpm typecheck
```

Format your code with:

```bash
pnpm format
```

## Mobile testing with ngrok

Desktop browsers and mobile browsers handle Web Audio differently. iOS Safari in particular requires a silent HTML audio element to keep the audio session active. Always test audio changes on a real phone.

The easiest way to reach your local dev server from a phone is with [ngrok](https://ngrok.com):

1. Install ngrok:

```bash
brew install ngrok   # macOS
```

2. Start the dev server and the tunnel:

```bash
pnpm dev
ngrok http 3000
```

3. Open the HTTPS URL ngrok prints on your phone. Both devices need to be online but do not need to be on the same network.

## Audio architecture

Tone playback uses the Web Audio API (`OscillatorNode` → `GainNode` → `destination`). On iOS Safari, the Web Audio output is silently swallowed unless the browser's audio session is in "playback" mode. To activate it, a looping silent HTML `<audio>` element plays alongside the oscillator and is cleaned up on stop.

If you change anything in `tone-generator.tsx`, test on at least:

- Desktop Chrome or Firefox
- iOS Safari (iPhone)
- Android Chrome

## Pull requests

- Keep changes focused — one feature or fix per PR.
- Describe what you changed and why.
- Include screenshots or screen recordings for UI changes.
- If your change affects audio, note which devices you tested on.
