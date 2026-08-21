import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Send, ArrowLeft, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { FileUpload, type AttachedFile } from "@/components/chat/FileUpload";
import { ExportMenu } from "@/components/chat/ExportMenu";
import MathSymbolsBackground from "@/components/MathSymbolsBackground";
import { useLanguage } from "@/i18n";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/math-chat`;

const SUGGESTION_KEYS = ["chat.s1", "chat.s2", "chat.s3", "chat.s4", "chat.s5", "chat.s6"];

async function streamChat({
  messages,
  fileContext,
  lang,
  t,
  onDelta,
  onDone,
}: {
  messages: Msg[];
  fileContext?: string;
  lang: string;
  t: (k: string) => string;
  onDelta: (t: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, fileContext, lang }),
  });

  if (resp.status === 429) {
    toast({ title: t("err.rate.title"), description: t("err.rate.desc"), variant: "destructive" });
    throw new Error("rate limited");
  }
  if (resp.status === 402) {
    toast({ title: t("err.credits.title"), description: t("err.credits.desc"), variant: "destructive" });
    throw new Error("payment required");
  }
  if (!resp.ok || !resp.body) throw new Error("stream error");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let done = false;

  while (!done) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const c = JSON.parse(json).choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
  onDone();
}

const ChatIA = () => {
  const { lang, t } = useLanguage();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attached, setAttached] = useState<AttachedFile | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const visible = attached ? `${text.trim()}\n\n📎 ${attached.name}` : text.trim();
    const userMsg: Msg = { role: "user", content: visible };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    const fileCtx = attached?.text;
    setAttached(null);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: updated,
        fileContext: fileCtx,
        lang,
        t,
        onDelta: upsert,
        onDone: () => setLoading(false),
      });
    } catch {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden">
      <MathSymbolsBackground variant="light" count={12} opacity={0.05} />
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3 shrink-0">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <ArrowLeft size={20} />
        </Link>
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <Sparkles size={16} className="text-secondary-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-sm">{t("chat.title")}</h1>
          <p className="text-xs opacity-70">{t("chat.sub")}</p>
        </div>
        {messages.length > 0 && (
          <>
            <ExportMenu title={t("chat.exportTitle")} messages={messages} baseFilename="chat-ia" containerRef={listRef} />
            <button
              onClick={() => setMessages([])}
              className="p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
              title={t("chat.new")}
            >
              <Trash2 size={18} />
            </button>
          </>
        )}
      </header>

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">{t("chat.greet")}</h2>
            <p className="text-muted-foreground text-sm max-w-md mb-8">
              {t("chat.intro")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTION_KEYS.map((k) => (
                <button
                  key={k}
                  onClick={() => send(t(k))}
                  className="text-left px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted text-sm text-foreground transition-colors"
                >
                  {t(k)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} data-export-msg="true">
              <MessageBubble msg={msg} />
            </div>
          ))
        )}

        {loading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="chat-bubble-ai px-4 py-3">
              <div className="flex gap-1.5">
                <span className="typing-dot w-2 h-2 bg-muted-foreground/50 rounded-full" />
                <span className="typing-dot w-2 h-2 bg-muted-foreground/50 rounded-full" />
                <span className="typing-dot w-2 h-2 bg-muted-foreground/50 rounded-full" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="shrink-0 border-t border-border bg-card px-4 py-3">
        <div className="flex flex-col gap-2 max-w-3xl mx-auto">
          {attached && (
            <FileUpload onFile={setAttached} attached={attached} onClear={() => setAttached(null)} />
          )}
          <div className="flex gap-2">
          {!attached && (
            <FileUpload onFile={setAttached} attached={null} onClear={() => setAttached(null)} disabled={loading} />
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("chat.placeholder")}
            className="flex-1 h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={loading}
          />
          <Button type="submit" size="icon" className="h-11 w-11 rounded-xl" disabled={loading || !input.trim()}>
            <Send size={18} />
          </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatIA;
