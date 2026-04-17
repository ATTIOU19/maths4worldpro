import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Send, Trash2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { MessageBubble } from "@/components/chat/MessageBubble";
import MathSymbolsBackground from "@/components/MathSymbolsBackground";

type Msg = { role: "user" | "assistant"; content: string };

const VIZ_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/visualize`;

const SUGGESTIONS = [
  "Trace la courbe de f(x) = e^(x²)",
  "Visualise sin(x) et cos(x) sur [-2π, 2π]",
  "Histogramme des 10 premiers nombres premiers",
  "Courbe de la fonction ln(x)",
  "Compare x², x³ et √x sur [0, 5]",
  "Aire sous la courbe de f(x) = x² entre 0 et 3",
];

async function streamVisualize({
  prompt,
  onDelta,
  onDone,
}: {
  prompt: string;
  onDelta: (t: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(VIZ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ prompt }),
  });

  if (resp.status === 429) {
    toast({ title: "Limite atteinte", description: "Trop de requêtes, réessayez dans un moment.", variant: "destructive" });
    throw new Error("rate limited");
  }
  if (resp.status === 402) {
    toast({ title: "Crédits épuisés", description: "Les crédits IA sont épuisés.", variant: "destructive" });
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

const Visualisation = () => {
  const [result, setResult] = useState<Msg | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result) {
      resultRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [result]);

  const generate = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput("");
    setResult(null);
    setLoading(true);

    let content = "";
    const update = (chunk: string) => {
      content += chunk;
      setResult({ role: "assistant", content });
    };

    try {
      await streamVisualize({
        prompt: text.trim(),
        onDelta: update,
        onDone: () => setLoading(false),
      });
    } catch {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generate(input);
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
          <BarChart3 size={16} className="text-secondary-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-sm">Visualisation IA</h1>
          <p className="text-xs opacity-70">Décris ce que tu veux visualiser</p>
        </div>
        {result && (
          <button
            onClick={() => setResult(null)}
            className="p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
            title="Effacer"
          >
            <Trash2 size={18} />
          </button>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {!result && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <BarChart3 size={28} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Visualisation instantanée 📊</h2>
            <p className="text-muted-foreground text-sm max-w-md mb-8">
              Décris la courbe, le graphique ou le diagramme que tu veux voir. L'IA le génère avec tous les détails en un instant.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => generate(s)}
                  className="text-left px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted text-sm text-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {loading && !result && (
              <div className="flex justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
                    <Sparkles size={24} className="text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">Génération en cours…</p>
                </div>
              </div>
            )}
            {result && (
              <div ref={resultRef}>
                <MessageBubble msg={result} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="shrink-0 border-t border-border bg-card px-4 py-3">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex : Trace la courbe de f(x) = sin(x) × e^(-x)…"
            className="flex-1 h-11 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={loading}
          />
          <Button type="submit" size="icon" className="h-11 w-11 rounded-xl" disabled={loading || !input.trim()}>
            <Send size={18} />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Visualisation;
