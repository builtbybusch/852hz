# 852 Hz

Free solfeggio frequency tone generator. Pick a frequency, press play, and listen.

Runs as a progressive web app — install it on your phone and use it offline.

## Frequencies

| Hz  | Tradition          |
| --- | ------------------ |
| 396 | Liberation         |
| 417 | Change             |
| 528 | Healing            |
| 639 | Connection         |
| 741 | Expression         |
| 852 | Intuition          |

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router, Turbopack)
- [React](https://react.dev) 19
- [Tailwind CSS](https://tailwindcss.com) 4
- [shadcn/ui](https://ui.shadcn.com) components
- Web Audio API for tone generation
- Service worker for offline PWA support

## Getting started

```bash
pnpm install
cp .env.example .env   # fill in GitHub token for feedback integration
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command            | Description                        |
| ------------------ | ---------------------------------- |
| `pnpm dev`         | Start dev server with Turbopack    |
| `pnpm build`       | Production build                   |
| `pnpm start`       | Serve production build             |
| `pnpm lint`        | Run ESLint                         |
| `pnpm typecheck`   | Run TypeScript type checking       |
| `pnpm format`      | Format code with Prettier          |

## Testing on mobile

Audio behavior differs between desktop and mobile browsers (especially iOS Safari). Use [ngrok](https://ngrok.com) to expose your local dev server so you can test on a real device:

```bash
pnpm dev
ngrok http 3000
```

Open the ngrok HTTPS URL on your phone. See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

## License

MIT
