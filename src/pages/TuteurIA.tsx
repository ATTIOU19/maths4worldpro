import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Sparkles, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import MathSymbolsBackground from "@/components/MathSymbolsBackground";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileUpload, type AttachedFile } from "@/components/chat/FileUpload";
import { ExportMenu } from "@/components/chat/ExportMenu";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { parseChartBlocks, ChartBlock, FunctionPlotBlock } from "@/components/chat/ChartRenderer";
import { GeoGebraBlock } from "@/components/chat/GeoGebraBlock";

interface ChatMessage {
  role: "user" | "ai";
  text: string;
  time: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/math-chat`;

const nowTime = () =>
  new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

async function streamTutorChat({
  messages,
  fileContext,
  onDelta,
  onDone,
}: {
  messages: { role: "user" | "assistant"; content: string }[];
  fileContext?: string;
  onDelta: (t: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, fileContext, tutorMode: true }),
  });

  if (resp.status === 429) {
    toast.error("Trop de requêtes, réessayez dans un moment.");
    throw new Error("rate limited");
  }
  if (resp.status === 402) {
    toast.error("Crédits IA épuisés.");
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

const TuteurIA = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const [attached, setAttached] = useState<AttachedFile | null>(null);
  const [userName, setUserName] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Extraire la DERNIÈRE figure (geogebra > graph > chart) trouvée dans les réponses d'Amara
  const latestVisual = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role !== "ai") continue;
      const parts = parseChartBlocks(m.text);
      for (let j = parts.length - 1; j >= 0; j--) {
        const p = parts[j];
        if (p.geogebra) return { kind: "geogebra" as const, data: p.geogebra };
        if (p.graph) return { kind: "graph" as const, data: p.graph };
        if (p.chart) return { kind: "chart" as const, data: p.chart };
      }
    }
    return null;
  }, [messages]);

  const renderVisual = () => {
    if (!latestVisual) return null;
    if (latestVisual.kind === "geogebra") return <GeoGebraBlock data={latestVisual.data} />;
    if (latestVisual.kind === "graph") return <FunctionPlotBlock graph={latestVisual.data} />;
    return <ChartBlock chart={latestVisual.data} />;
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("prenoms, nom")
        .eq("id", user.id)
        .maybeSingle();
      const prenom = (data?.prenoms || "").split(" ")[0]?.trim();
      if (prenom) setUserName(prenom);
    })();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const startConversation = () => {
    setStarted(true);
    const greet = userName
      ? `Bonjour **${userName}** ! 👋 Je suis **Amara**, ta tutrice IA en mathématiques.\n\nQue souhaites-tu **maîtriser aujourd'hui** ? (ex: les dérivées, le théorème de Pythagore, les intégrales, la trigonométrie…)`
      : `Bonjour ! 👋 Je suis **Amara**, ta tutrice IA en mathématiques.\n\nQue souhaites-tu **maîtriser aujourd'hui** ? (ex: les dérivées, le théorème de Pythagore, les intégrales, la trigonométrie…)`;
    setMessages([{ role: "ai", text: greet, time: nowTime() }]);
  };

  const handleSend = async () => {
    if (isTyping || !input.trim()) return;

    const userText = input.trim();
    const userVisible = attached ? `${userText} 📎 ${attached.name}` : userText;
    const fileCtx = attached?.text;

    const userMsg: ChatMessage = { role: "user", text: userVisible, time: nowTime() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setAttached(null);
    setIsTyping(true);

    const history = updated.map((m) => ({
      role: (m.role === "ai" ? "assistant" : "user") as "user" | "assistant",
      content: m.text,
    }));

    let acc = "";
    const upsert = (chunk: string) => {
      acc += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "ai") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, text: acc } : m));
        }
        return [...prev, { role: "ai", text: acc, time: nowTime() }];
      });
    };

    try {
      await streamTutorChat({
        messages: history,
        fileContext: fileCtx,
        onDelta: upsert,
        onDone: () => setIsTyping(false),
      });
    } catch (e) {
      console.error(e);
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MathSymbolsBackground variant="light" count={14} opacity={0.05} />
      <Navbar />
      <div className="pt-16 h-screen flex relative z-10">
        {/* LEFT - Chat */}
        <div className="w-full lg:w-[40%] flex flex-col border-r border-border bg-card">
          {/* Chat Header */}
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-sm">A</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-card-foreground text-sm">Amara, votre tuteur IA</span>
                  <span className="w-2 h-2 rounded-full bg-success inline-block" />
                  <span className="text-xs text-success">En ligne</span>
                </div>
                <p className="text-xs text-muted-foreground">Tutrice IA en mathématiques</p>
              </div>
              {messages.length > 0 && (
                <div className="ml-auto">
                  <ExportMenu
                    title="Conversation Tuteur IA"
                    messages={messages.map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }))}
                    baseFilename="tuteur-ia"
                    className="text-foreground"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {!started ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                  <Sparkles size={28} className="text-accent" />
                </div>
                <h3 className="text-lg font-bold text-card-foreground">Démo interactive</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Découvrez comment Amara vous guide pas à pas pour comprendre la dérivation. Cliquez pour commencer !
                </p>
                <button
                  onClick={startConversation}
                  className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-xl text-sm font-semibold hover:brightness-110 transition-all shadow-hero"
                >
                  Commencer la démo
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <>
                <AnimatePresence>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "ai" && (
                        <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center mr-2 mt-1 shrink-0">
                          <span className="text-accent-foreground text-xs font-bold">A</span>
                        </div>
                      )}
                      {msg.role === "ai" ? (
                        <div className="flex-1 min-w-0">
                          <MessageBubble msg={{ role: "assistant", content: msg.text }} hideVisuals />
                          <div className="text-[10px] text-muted-foreground mt-1 ml-1">{msg.time}</div>
                        </div>
                      ) : (
                        <div className="max-w-[85%] chat-bubble-user px-4 py-3 shadow-sm">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          <div className="flex items-center gap-1 mt-1 justify-end">
                            <span className="text-[10px] text-primary-foreground/50">{msg.time}</span>
                            <span className="text-[10px] text-primary-foreground/50">✓✓</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isTyping && (
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

                <div ref={bottomRef} />
              </>
            )}

            {/* Tableau mobile — sous le chat, masqué sur desktop */}
            {latestVisual && (
              <div className="lg:hidden mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-secondary" />
                  <h3 className="text-sm font-bold text-foreground">Tableau d'apprentissage</h3>
                </div>
                {renderVisual()}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            {attached && (
              <div className="mb-2">
                <FileUpload onFile={setAttached} attached={attached} onClear={() => setAttached(null)} />
              </div>
            )}
            <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2 shadow-sm">
              {!attached && started && (
                <FileUpload onFile={setAttached} attached={null} onClear={() => setAttached(null)} disabled={isTyping} />
              )}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={!started ? "Cliquez sur « Commencer la démo »" : "Tapez votre réponse..."}
                disabled={!started || isTyping}
                className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground disabled:opacity-50"
              />
              <button className="relative w-9 h-9 rounded-full bg-accent flex items-center justify-center mic-pulse">
                <Mic size={16} className="text-accent-foreground" />
              </button>
              <button
                onClick={handleSend}
                disabled={!started || isTyping || !input.trim()}
                className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:brightness-110 transition-all disabled:opacity-50"
              >
                <Send size={16} className="text-secondary-foreground" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">Propulsé par MATHS4WORLD AI</p>
          </div>
        </div>

        {/* RIGHT - Visual */}
        <div className="hidden lg:flex lg:w-[60%] flex-col overflow-y-auto bg-background">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles size={20} className="text-secondary" />
              <h2 className="text-lg font-bold text-foreground">Tableau d'apprentissage</h2>
            </div>

            {latestVisual ? (
              <div>{renderVisual()}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center text-muted-foreground text-sm px-8 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <Sparkles size={28} className="text-accent" />
                </div>
                <p className="max-w-md">
                  Les <strong>figures, courbes et solides 3D</strong> (cône, sphère, cylindre…) générées par Amara apparaîtront ici, en grand format.
                </p>
                <p className="text-xs">Dis-lui ce que tu veux explorer pour commencer !</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TuteurIA;
