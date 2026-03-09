import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, Clock, X, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Navbar from "@/components/Navbar";
import { toast } from "@/hooks/use-toast";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface InterviewConfig {
  notion: string;
  niveau: string;
  langue: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/entretien-chat`;

async function streamChat({
  messages,
  config,
  onDelta,
  onDone,
  onError,
}: {
  messages: ChatMessage[];
  config: InterviewConfig;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, config }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ error: "Erreur réseau" }));
    onError(data.error || `Erreur ${resp.status}`);
    return;
  }

  if (!resp.body) {
    onError("Pas de réponse du serveur");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // Final flush
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const EntretienSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const config = (location.state as InterviewConfig) || null;

  // Display messages (with "ai" role for rendering)
  const [displayMessages, setDisplayMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  // API messages history
  const apiMessagesRef = useRef<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [isFinished, setIsFinished] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!config) navigate("/entretien-vocal");
  }, [config, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  // Timer
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished]);

  // Send AI request with streaming
  const sendToAI = useCallback(
    (msgs: ChatMessage[], endAfter = false) => {
      if (!config) return;
      setIsStreaming(true);

      // Add instruction if ending
      const finalMsgs = endAfter
        ? [
            ...msgs,
            {
              role: "user" as const,
              content:
                "L'entretien est terminé. Génère maintenant le résumé complet avec la note sur 20, les points forts, pistes d'amélioration et ressources.",
            },
          ]
        : msgs;

      let assistantSoFar = "";

      streamChat({
        messages: finalMsgs,
        config,
        onDelta: (chunk) => {
          assistantSoFar += chunk;
          setDisplayMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "ai") {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
              );
            }
            return [...prev, { role: "ai", content: assistantSoFar }];
          });
        },
        onDone: () => {
          // Save to API history
          apiMessagesRef.current = [
            ...msgs,
            { role: "assistant", content: assistantSoFar },
          ];
          setIsStreaming(false);
          if (endAfter) setIsFinished(true);
        },
        onError: (err) => {
          toast({ title: "Erreur", description: err, variant: "destructive" });
          setIsStreaming(false);
        },
      });
    },
    [config]
  );

  // Initial greeting
  useEffect(() => {
    if (config && displayMessages.length === 0) {
      sendToAI([]);
    }
  }, [config]);

  // End when time is up
  useEffect(() => {
    if (timeLeft === 0 && !isFinished && !isStreaming && config) {
      sendToAI(apiMessagesRef.current, true);
    }
  }, [timeLeft]);

  const handleSend = () => {
    if (!input.trim() || isStreaming || isFinished || !config) return;

    const userText = input.trim();
    setInput("");

    // Add to display
    setDisplayMessages((prev) => [...prev, { role: "user", content: userText }]);

    // Add to API history
    const updatedApiMsgs: ChatMessage[] = [
      ...apiMessagesRef.current,
      { role: "user", content: userText },
    ];

    // Check if we should end (count AI messages)
    const aiCount = displayMessages.filter((m) => m.role === "ai").length;
    const shouldEnd = aiCount >= 6 || timeLeft < 60;

    sendToAI(updatedApiMsgs, shouldEnd);
    inputRef.current?.focus();
  };

  const handleEndEarly = () => {
    if (!config || isStreaming) return;
    sendToAI(apiMessagesRef.current, true);
  };

  if (!config) return null;

  const timerColor =
    timeLeft < 300
      ? "text-destructive"
      : timeLeft < 600
      ? "text-accent"
      : "text-muted-foreground";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="pt-16 flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <span className="text-accent-foreground font-bold text-xs">A</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-card-foreground">
                Entretien : {config.notion}
              </p>
              <p className="text-xs text-muted-foreground">
                {config.niveau} · {config.langue === "fr" ? "Français" : config.langue}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 ${timerColor}`}>
              <Clock size={14} />
              <span className="text-sm font-mono font-semibold">
                {formatTime(timeLeft)}
              </span>
            </div>
            {!isFinished && (
              <button
                onClick={handleEndEarly}
                disabled={isStreaming}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50"
              >
                <X size={12} />
                Terminer
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl mx-auto w-full">
          {displayMessages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "ai" && (
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center mr-2 mt-1 shrink-0">
                  <span className="text-accent-foreground text-xs font-bold">A</span>
                </div>
              )}
              <div
                className={`max-w-[85%] px-4 py-3 shadow-sm ${
                  msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"
                }`}
              >
                {msg.role === "ai" ? (
                  <div className="prose prose-sm max-w-none text-sm leading-relaxed [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_hr]:my-3 [&_strong]:text-card-foreground [&_li]:text-muted-foreground [&_p]:text-card-foreground">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}

          {isStreaming && displayMessages[displayMessages.length - 1]?.role !== "ai" && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0">
                <span className="text-accent-foreground text-xs font-bold">A</span>
              </div>
              <div className="chat-bubble-ai px-4 py-3 flex gap-1">
                <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground/50" />
                <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground/50" />
                <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground/50" />
              </div>
            </div>
          )}

          {isFinished && displayMessages.length > 0 && displayMessages[displayMessages.length - 1].role === "ai" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center pt-4"
            >
              <button
                onClick={() => navigate("/entretien-vocal")}
                className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-xl text-sm font-semibold hover:brightness-110 transition-all shadow-hero"
              >
                <CheckCircle2 size={16} />
                Nouvel entretien
              </button>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {!isFinished && (
          <div className="border-t border-border bg-card px-4 py-3">
            <div className="max-w-3xl mx-auto flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Tapez votre réponse..."
                disabled={isStreaming}
                className="flex-1 px-4 py-2.5 rounded-full bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 disabled:opacity-50 transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:brightness-110 transition-all disabled:opacity-50"
              >
                <Send size={16} className="text-secondary-foreground" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntretienSession;
