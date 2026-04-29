import { Telegraf } from "telegraf";
import {
  appendTelegramMessage,
  getTelegramSettings,
} from "@/server/repositories";
import { invokePersonalAssistant } from "@/server/agent/deep-agent";

type TodoStatus = "pending" | "in_progress" | "completed";

type Todo = {
  content: string;
  status: TodoStatus;
};

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
  const messageId = message?.message_id;

  if (!text || !chatId) {
    return Response.json({ ok: true });
  }

  const bot = new Telegraf(settings.botToken);

  await appendTelegramMessage({
    chatId: String(chatId),
    text,
    from: message.from?.username ?? message.from?.first_name,
    direction: "inbound",
  });

  if (messageId) {
    void reactToMessage(bot, chatId, messageId);
  }

  const stopTyping = keepTyping(bot, chatId);
  let answer: string;
  try {
    const response = await invokePersonalAssistant("telegram", [
      { role: "user", content: text },
    ]);
    answer = formatTelegramAnswer(response.answer, response.todos);
  } finally {
    stopTyping();
  }

  await bot.telegram.sendMessage(chatId, answer, { parse_mode: "Markdown" });
  await appendTelegramMessage({
    chatId: String(chatId),
    text: answer,
    direction: "outbound",
  });

  return Response.json({ ok: true });
}

function formatTelegramAnswer(answer: string, todos: Todo[]) {
  if (!todos.length) return answer;
  const todoText = todos
    .map((todo) => `${todoIcon(todo.status)} ${todo.content}`)
    .join("\n");
  return `*Kế hoạch DeepAgents:*\n${todoText}\n\n${answer}`;
}

function todoIcon(status: TodoStatus) {
  if (status === "completed") return "☑";
  if (status === "in_progress") return "▶";
  return "☐";
}

async function reactToMessage(
  bot: Telegraf,
  chatId: number | string,
  messageId: number,
) {
  try {
    await bot.telegram.setMessageReaction(
      chatId,
      messageId,
      [{ type: "emoji", emoji: "👀" }],
      false,
    );
  } catch (error) {
    console.warn("Unable to set Telegram reaction", error);
  }
}

function keepTyping(bot: Telegraf, chatId: number | string) {
  let stopped = false;
  const sendTyping = async () => {
    if (stopped) return;
    try {
      await bot.telegram.sendChatAction(chatId, "typing");
    } catch (error) {
      console.warn("Unable to send Telegram typing action", error);
    }
  };

  void sendTyping();
  const interval = setInterval(() => {
    void sendTyping();
  }, 4000);

  return () => {
    stopped = true;
    clearInterval(interval);
  };
}
