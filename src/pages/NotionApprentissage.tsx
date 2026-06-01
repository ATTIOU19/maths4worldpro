import { useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Send, ArrowLeft, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { FileUpload, type AttachedFile } from "@/components/chat/FileUpload";
import { ExportMenu } from "@/components/chat/ExportMenu";
import MathSymbolsBackground from "@/components/MathSymbolsBackground";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/math-chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: Msg[];
  onDelta: (t: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });
  if (resp.status === 429) {
    toast({ title: "Limite atteinte", description: "Trop de requêtes.", variant: "destructive" });
    throw new Error("rate");
  }
  if (resp.status === 402) {
    toast({ title: "Crédits épuisés", variant: "destructive" });
    throw new Error("paid");
  }
  if (!resp.ok || !resp.body) throw new Error("stream");

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

const NotionApprentissage = () => {
  const [params] = useSearchParams();
  const domaine = params.get("domaine") || "";
  const notion = params.get("notion") || "";

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attached, setAttached] = useState<AttachedFile | null>(null);
  const initRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const runStream = async (msgs: Msg[]) => {
    setLoading(true);
    let acc = "";
    const upsert = (chunk: string) => {
      acc += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: acc } : m);
        }
        return [...prev, { role: "assistant", content: acc }];
      });
    };
    try {
      await streamChat({ messages: msgs, onDelta: upsert, onDone: () => setLoading(false) });
    } catch {
      setLoading(false);
    }
  };

  // Initial synthesis
  useEffect(() => {
    if (initRef.current || !notion || !domaine) return;
    initRef.current = true;
    const synth: Msg = {
      role: "user",
      content: `Fais-moi une **synthèse pédagogique complète** de la notion **"${notion}"** dans le contexte du métier **"${domaine}"**.

Structure ta réponse ainsi :

1. 📌 **Définition claire** — De quoi s'agit-il exactement ?
2. 🧠 **Tout ce qu'il faut savoir** — Concepts clés, formules essentielles (en LaTeX), propriétés importantes.
3. 🛠️ **Cas pratiques dans le métier "${domaine}"** — 2 à 3 exemples concrets et résolus, ancrés dans la réalité de ce métier en Afrique.
4. ⚠️ **Pièges courants** à éviter.
5. 📊 Une **visualisation GeoGebra** si pertinent — utilise un bloc \`\`\`geogebra contenant un JSON \`{"type":"geogebra","dim":"2d|3d","title":"...","code":"..."}\`. Mets \`"dim":"3d"\` dès qu'il s'agit d'un solide ou de l'espace (cube, sphère, cylindre, cône, pyramide, plan, surface z=f(x,y)). Commandes 3D utiles : \`Cube(A,B,C)\`, \`Sphere(O,r)\`, \`Cylinder(A,B,r)\`, \`Cone(A,B,r)\`, \`Pyramid(A,B,C,D,S)\`, \`Plane(A,B,C)\`, \`f(x,y)=...\`.
6. ✅ **Points clés à retenir** (3 à 5 bullets).

Termine en m'invitant à poser des questions pour approfondir.`,
    };
    // On envoie le prompt à l'IA mais on ne l'affiche pas dans le chat
    runStream([synth]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notion, domaine]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const visible = attached ? `${text.trim()}\n\n📎 ${attached.name}` : text.trim();
    const userMsg: Msg = { role: "user", content: visible };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setAttached(null);
    await runStream(updated);
  };

  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden">
      <MathSymbolsBackground variant="light" count={12} opacity={0.05} />
      <header className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3 shrink-0">
        <Link to="/maths-metier" className="hover:opacity-80 transition-opacity">
          <ArrowLeft size={20} />
        </Link>
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <BookOpen size={16} className="text-secondary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-sm truncate">{notion || "Notion"}</h1>
          <p className="text-xs opacity-70 truncate">{domaine}</p>
        </div>
        {messages.length > 0 && (
          <ExportMenu title={`${notion} — ${domaine}`} messages={messages} baseFilename={`notion-${notion}`} />
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <Sparkles className="text-primary animate-pulse" size={32} />
          </div>
        )}
        {messages.map((m, i) => <MessageBubble key={i} msg={m} />)}
        {loading && (messages.length === 0 || messages[messages.length - 1]?.role === "user") && (
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

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="shrink-0 border-t border-border bg-card px-4 py-3">
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
              placeholder="Pose une question pour approfondir…"
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

export default NotionApprentissage;