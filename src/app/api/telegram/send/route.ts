import { Telegraf } from "telegraf";
import {
  appendTelegramMessage,
  getTelegramSettings,
} from "@/server/repositories";

export async function POST(req: Request) {
  const settings = await getTelegramSettings();
  const body = (await req.json()) as { chatId?: string; text?: string };
  const chatId = body.chatId ?? settings.defaultChatId;

  if (!settings.enabled || !settings.botToken) {
    return Response.json({ error: "Telegram bot is not enabled" }, { status: 400 });
  }
  if (!chatId || !body.text) {
    return Response.json(
      { error: "chatId/defaultChatId and text are required" },
      { status: 400 },
    );
  }

  const bot = new Telegraf(settings.botToken);
  await bot.telegram.sendMessage(chatId, body.text);
  const message = await appendTelegramMessage({
    chatId,
    text: body.text,
    direction: "outbound",
  });
  return Response.json({ message });
}
