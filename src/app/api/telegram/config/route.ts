import {
  getTelegramSettings,
  listTelegramMessages,
  saveTelegramSettings,
} from "@/server/repositories";
import type { TelegramSettings } from "@/server/types";

export async function GET() {
  const settings = await getTelegramSettings();
  const messages = await listTelegramMessages();
  return Response.json({
    settings: {
      ...settings,
      botToken: settings.botToken ? "configured" : undefined,
      webhookSecret: settings.webhookSecret ? "configured" : undefined,
    },
    messages,
  });
}

export async function POST(req: Request) {
  const current = await getTelegramSettings();
  const body = (await req.json()) as TelegramSettings;
  const next = await saveTelegramSettings({
    enabled: body.enabled ?? current.enabled,
    botToken:
      body.botToken && body.botToken !== "configured"
        ? body.botToken
        : current.botToken,
    webhookSecret:
      body.webhookSecret && body.webhookSecret !== "configured"
        ? body.webhookSecret
        : current.webhookSecret,
    defaultChatId: body.defaultChatId ?? current.defaultChatId,
  });
  return Response.json({
    settings: {
      ...next,
      botToken: next.botToken ? "configured" : undefined,
      webhookSecret: next.webhookSecret ? "configured" : undefined,
    },
  });
}
