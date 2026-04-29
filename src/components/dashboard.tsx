"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  FileCode2,
  ImageIcon,
  KeyRound,
  Library,
  Plus,
  RefreshCcw,
  Send,
  Sparkles,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  Artifact,
  KnowledgeItem,
  Skill,
  TelegramLogMessage,
  TelegramSettings,
} from "@/server/types";

type DashboardData = {
  artifacts: Artifact[];
  skills: Skill[];
  knowledge: KnowledgeItem[];
  telegram: {
    settings: TelegramSettings;
    messages: TelegramLogMessage[];
  };
};

const emptyData: DashboardData = {
  artifacts: [],
  skills: [],
  knowledge: [],
  telegram: { settings: { enabled: false }, messages: [] },
};

export function Dashboard() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [skillName, setSkillName] = useState("");
  const [skillDescription, setSkillDescription] = useState("");
  const [skillInstructions, setSkillInstructions] = useState("");
  const [knowledgeTitle, setKnowledgeTitle] = useState("");
  const [knowledgeContent, setKnowledgeContent] = useState("");
  const [artifactTitle, setArtifactTitle] = useState("");
  const [artifactContent, setArtifactContent] = useState("");
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramSecret, setTelegramSecret] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramText, setTelegramText] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [notice, setNotice] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("/api/telegram/webhook");

  async function refresh() {
    const [artifacts, skills, knowledge, telegram] = await Promise.all([
      fetch("/api/artifacts").then((res) => res.json()),
      fetch("/api/skills").then((res) => res.json()),
      fetch("/api/knowledge").then((res) => res.json()),
      fetch("/api/telegram/config").then((res) => res.json()),
    ]);
    setData({
      artifacts: artifacts.artifacts ?? [],
      skills: skills.skills ?? [],
      knowledge: knowledge.knowledge ?? [],
      telegram,
    });
  }

  useEffect(() => {
    const load = async () => {
      setWebhookUrl(`${window.location.origin}/api/telegram/webhook`);
      await refresh();
    };
    void load();
  }, []);

  async function submitSkill() {
    await fetch("/api/skills", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: skillName,
        description: skillDescription,
        instructions: skillInstructions,
      }),
    });
    setSkillName("");
    setSkillDescription("");
    setSkillInstructions("");
    setNotice("Đã tạo skill.");
    await refresh();
  }

  async function submitKnowledge() {
    await fetch("/api/knowledge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: knowledgeTitle, content: knowledgeContent }),
    });
    setKnowledgeTitle("");
    setKnowledgeContent("");
    setNotice("Đã upload knowledge.");
    await refresh();
  }

  async function uploadKnowledgeFile(file: File) {
    const form = new FormData();
    form.set("file", file);
    if (knowledgeTitle) form.set("title", knowledgeTitle);
    await fetch("/api/knowledge", { method: "POST", body: form });
    setNotice(`Đã upload ${file.name}.`);
    await refresh();
  }

  async function createHtmlArtifact() {
    await fetch("/api/artifacts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: artifactTitle,
        type: "html",
        content: artifactContent,
      }),
    });
    setArtifactTitle("");
    setArtifactContent("");
    setNotice("Đã tạo HTML artifact.");
    await refresh();
  }

  async function saveTelegram() {
    await fetch("/api/telegram/config", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        enabled: true,
        botToken: telegramToken || undefined,
        webhookSecret: telegramSecret || undefined,
        defaultChatId: telegramChatId || undefined,
      }),
    });
    setTelegramToken("");
    setTelegramSecret("");
    setNotice("Đã lưu cấu hình Telegram.");
    await refresh();
  }

  async function sendTelegram() {
    await fetch("/api/telegram/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chatId: telegramChatId, text: telegramText }),
    });
    setTelegramText("");
    setNotice("Đã gửi Telegram.");
    await refresh();
  }

  async function generateImage() {
    const res = await fetch("/api/images", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: imagePrompt }),
    });
    const json = await res.json();
    setNotice(json.error ?? "Đã tạo ảnh artifact.");
    await refresh();
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1">
      <Card className="bg-slate-950 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-300" />
            Control Center
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          <p>
            OPENAI_BASE_URL mặc định hỗ trợ endpoint OpenAI-compatible. Đặt key
            trong <code className="text-sky-200">OPENAI_API_KEY</code>.
          </p>
          {notice ? <Badge className="bg-sky-100 text-sky-800">{notice}</Badge> : null}
          <Button onClick={refresh} size="sm" variant="secondary">
            <RefreshCcw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-slate-500" />
            Telegram Bot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            onChange={(event) => setTelegramToken(event.target.value)}
            placeholder="Telegram bot token"
            type="password"
            value={telegramToken}
          />
          <Input
            onChange={(event) => setTelegramSecret(event.target.value)}
            placeholder="Webhook secret"
            type="password"
            value={telegramSecret}
          />
          <Input
            onChange={(event) => setTelegramChatId(event.target.value)}
            placeholder="Default chat id"
            value={telegramChatId}
          />
          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            Webhook URL: <span className="break-all font-mono">{webhookUrl}</span>
          </div>
          <Button onClick={saveTelegram} size="sm">
            <Bot className="h-3.5 w-3.5" />
            Lưu Telegram
          </Button>
          <Textarea
            onChange={(event) => setTelegramText(event.target.value)}
            placeholder="Tin nhắn test"
            value={telegramText}
          />
          <Button onClick={sendTelegram} size="sm" variant="outline">
            <Send className="h-3.5 w-3.5" />
            Gửi test
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Library className="h-4 w-4 text-slate-500" />
            Skills
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            onChange={(event) => setSkillName(event.target.value)}
            placeholder="Tên skill"
            value={skillName}
          />
          <Input
            onChange={(event) => setSkillDescription(event.target.value)}
            placeholder="Mô tả"
            value={skillDescription}
          />
          <Textarea
            onChange={(event) => setSkillInstructions(event.target.value)}
            placeholder="Instructions"
            value={skillInstructions}
          />
          <Button onClick={submitSkill} size="sm">
            <Plus className="h-3.5 w-3.5" />
            Tạo skill
          </Button>
          <List items={data.skills.map((skill) => skill.name)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-slate-500" />
            Knowledge
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            onChange={(event) => setKnowledgeTitle(event.target.value)}
            placeholder="Tiêu đề"
            value={knowledgeTitle}
          />
          <Textarea
            onChange={(event) => setKnowledgeContent(event.target.value)}
            placeholder="Nội dung knowledge"
            value={knowledgeContent}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={submitKnowledge} size="sm">
              Upload text
            </Button>
            <label className="inline-flex h-8 cursor-pointer items-center rounded-xl border border-slate-200 px-3 text-xs font-medium hover:bg-slate-50">
              Upload file
              <input
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadKnowledgeFile(file);
                }}
                type="file"
              />
            </label>
          </div>
          <List items={data.knowledge.map((item) => item.title)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-slate-500" />
            Artifacts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            onChange={(event) => setArtifactTitle(event.target.value)}
            placeholder="HTML artifact title"
            value={artifactTitle}
          />
          <Textarea
            onChange={(event) => setArtifactContent(event.target.value)}
            placeholder="<main>...</main>"
            value={artifactContent}
          />
          <Button onClick={createHtmlArtifact} size="sm">
            Tạo HTML
          </Button>
          <Input
            onChange={(event) => setImagePrompt(event.target.value)}
            placeholder="Prompt tạo ảnh"
            value={imagePrompt}
          />
          <Button onClick={generateImage} size="sm" variant="outline">
            <ImageIcon className="h-3.5 w-3.5" />
            Tạo ảnh
          </Button>
          <div className="space-y-2">
            {data.artifacts.map((artifact) => (
              <a
                className="block rounded-xl border border-slate-200 p-3 text-sm hover:bg-slate-50"
                href={`/api/artifacts?id=${artifact.id}&raw=1`}
                key={artifact.id}
                rel="noreferrer"
                target="_blank"
              >
                <div className="font-medium">{artifact.title}</div>
                <div className="text-xs text-slate-500">{artifact.type}</div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  if (!items.length) {
    return <p className="text-xs text-slate-500">Chưa có dữ liệu.</p>;
  }
  return (
    <div className="space-y-2">
      {items.slice(0, 5).map((item) => (
        <div
          className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700"
          key={item}
        >
          {item}
        </div>
      ))}
    </div>
  );
}
