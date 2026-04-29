# Personal Assistant Hub

Trợ lý cá nhân chạy trên Next.js, TypeScript, assistant-ui, LangChain DeepAgents
và Telegram Bot API. Ứng dụng hỗ trợ chat web, generative UI/artifacts, upload
knowledge, quản lý skills, tạo ảnh và cấu hình Telegram bot qua giao diện web.

## Environment

Tạo `.env.local`:

```bash
OPENAI_BASE_URL="https://llmgate.app/v1"
OPENAI_API_KEY="your-key"
OPENAI_MODEL="gpt-4o-mini"
OPENAI_IMAGE_MODEL="gpt-image-1"
```

Không commit API key thật. Telegram token cũng có thể lưu qua web UI ở panel
Telegram Bot.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Telegram webhook

Sau khi deploy, cấu hình webhook bằng Bot API:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://your-domain.com/api/telegram/webhook" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

## Features

- Web chat UI using `@assistant-ui/react` and Vercel AI SDK transport.
- LangChain DeepAgents integration for Telegram and reusable tools.
- Skills and uploaded knowledge persisted locally in `.data/*.json`.
- Artifacts API for HTML, Markdown, text, JSON, and generated images.
- OpenAI-compatible base URL support through `OPENAI_BASE_URL`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
