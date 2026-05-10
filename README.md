# LLMPlayground

> **An open-source AI playground** — chat, roleplay, coding assistant, and more.

**Live:** [llmplayground.net](https://llmplayground.net) · **GitHub:** [github.com/meow18838/LLMPlayground](https://github.com/meow18838/LLMPlayground)

---

## Contributing

- **Fork** the repo and open a PR
- **Open an issue** for bugs or feature requests

---

## Features

| Feature | Description |
|---------|-------------|
| **Chat** | Multi-turn conversations with streaming responses |
| **Roleplay** | Character-based chats with custom personas |
| **Coding** | Copilot-style assistant with Explain / Review / Refactor / Test / Debug |
| **Personas** | Create and manage AI characters for roleplay |
| **Providers** | Any OpenAI-compatible API; Airforce API is the default (no key needed) |

---

## Quick Start

```bash
git clone https://github.com/meow18838/LLMPlayground
cd LLMPlayground
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Tech Stack

- **React** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- OpenAI-compatible streaming API

---

## Configuration

Copy `.env.example` to `.env` and adjust:

```
VITE_API_BASE_URL=https://panel.api.airforce/v1
VITE_DEBUG=false
```

---

## License

MIT — do whatever you want with it.
