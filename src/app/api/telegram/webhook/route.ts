import { Telegraf } from "telegraf";
import {
  appendTelegramMessage,
  getTelegramSettings,
} from "@/server/repositories";
import { invokePersonalAssistant } from "@/server/agent/deep-agent";

export async function POST(req: Request) {
  const settings = await getTelegramSettings();
  const secret = req.headers.get("x-telegram-bot-api-secret-token");

  if (!settings.enabled || !settings.botToken) {
    return Response.json({ error: "Telegram bot is not enabled" }, { status: 400 });
  }
  if (settings.webhookSecret && secret !== settings.webhookSecret) {
    return Response.json({ error: "Invalid webhook secret" }, { status: 401 });
  }

  const update = await req.json();
  const message = update.message;
  const text = message?.text;
  const chatId = message?.chat?.id;

  if (!text || !chatId) {
    return Response.json({ ok: true });
  }

  await appendTelegramMessage({
    chatId: String(chatId),
    text,
    from: message.from?.username ?? message.from?.first_name,
    direction: "inbound",
  });

  const answer = await invokePersonalAssistant("telegram", [
    { role: "user", content: text },
  ]);
  const bot = new Telegraf(settings.botToken);
  await bot.telegram.sendMessage(chatId, answer, { parse_mode: "Markdown" });
  await appendTelegramMessage({
    chatId: String(chatId),
    text: answer,
    direction: "outbound",
  });

  return Response.json({ ok: true });
}
