import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Mic, Sparkles, BookOpen } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ReferenceLine,
} from "recharts";
import Navbar from "@/components/Navbar";

// Generate chart data for f(x) = x³ - 2x + 1 and f'(x) = 3x² - 2
const chartData = Array.from({ length: 61 }, (_, i) => {
  const x = (i - 30) / 10;
  return {
    x: Math.round(x * 100) / 100,
    "f(x)": Math.round((x ** 3 - 2 * x + 1) * 100) / 100,
    "f'(x)": Math.round((3 * x ** 2 - 2) * 100) / 100,
  };
});

interface ChatMessage {
  role: "user" | "ai";
  text: string;
  time: string;
}

const demoConversation: ChatMessage[] = [
  { role: "user", text: "Bonjour ! Je veux comprendre comment calculer la dérivée de f(x) = x³ - 2x + 1", time: "14:02" },
  { role: "ai", text: "Bonjour ! Je suis là pour vous guider. Avant de calculer, dites-moi : connaissez-vous la règle de dérivation des monômes ? Par exemple, si g(x) = xⁿ, que vaut g'(x) ?", time: "14:02" },
  { role: "user", text: "Je crois que c'est n fois x puissance n-1 ?", time: "14:03" },
  { role: "ai", text: "Exactement ! Vous venez de retrouver la règle fondamentale : si g(x) = xⁿ, alors g'(x) = n·xⁿ⁻¹. Maintenant, appliquez cette règle terme par terme à f(x) = x³ - 2x + 1. Que donnent les dérivées de chaque terme ?", time: "14:03" },
  { role: "user", text: "Pour x³ ça donne 3x² et pour -2x ça donne -2, et la constante 1 donne 0 ?", time: "14:04" },
  { role: "ai", text: "🎉 Parfait ! Vous avez tout juste. Donc f'(x) = 3x² - 2. J'ai généré le graphique de f(x) et f'(x) sur votre droite, avec une application en contexte béninois. Observez comment les zones où f'(x) > 0 correspondent aux portions croissantes de f(x).", time: "14:04" },
];

const TuteurIA = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    // Progressive message display
    let timeout: ReturnType<typeof setTimeout>;
    demoConversation.forEach((msg, i) => {
      timeout = setTimeout(() => {
        setMessages((prev) => [...prev, msg]);
        if (i === demoConversation.length - 1) {
          setTimeout(() => setShowChart(true), 500);
        }
      }, i * 800 + 400);
    });
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 h-screen flex">
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
                <p className="text-xs text-muted-foreground">Niveau : Terminale C/D · Programme : BAC Bénin</p>
              </div>
            </div>
            <div className="flex gap-2">
              <select className="text-xs bg-muted rounded-lg px-3 py-1.5 text-foreground border border-border">
                <option>Terminale C/D</option>
                <option>Première</option>
                <option>Seconde</option>
                <option>3ème</option>
                <option>Concours</option>
              </select>
              <select className="text-xs bg-muted rounded-lg px-3 py-1.5 text-foreground border border-border">
                <option>🇧🇯 Bénin</option>
                <option>🇸🇳 Sénégal</option>
                <option>🇨🇮 Côte d'Ivoire</option>
                <option>🇨🇲 Cameroun</option>
                <option>🇲🇱 Mali</option>
                <option>🇧🇫 Burkina Faso</option>
              </select>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
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
                <div className={`max-w-[85%] ${msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"} px-4 py-3 shadow-sm`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <div className={`flex items-center gap-1 mt-1 ${msg.role === "user" ? "justify-end" : ""}`}>
                    <span className={`text-[10px] ${msg.role === "user" ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                      {msg.time}
                    </span>
                    {msg.role === "user" && <span className="text-[10px] text-primary-foreground/50">✓✓</span>}
                  </div>
                </div>
              </motion.div>
            ))}

            {messages.length < demoConversation.length && (
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
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2 shadow-sm">
              <input
                type="text"
                placeholder="Pose ta question en mathématiques..."
                className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
              />
              <button className="relative w-9 h-9 rounded-full bg-accent flex items-center justify-center mic-pulse">
                <Mic size={16} className="text-accent-foreground" />
              </button>
              <button className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:brightness-110 transition-all">
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
              <h2 className="text-lg font-bold text-foreground">Réponse Visuelle Automatique</h2>
            </div>

            {showChart ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                {/* Chart */}
                <div className="bg-card rounded-2xl p-6 shadow-card">
                  <h3 className="text-sm font-semibold text-card-foreground mb-4">
                    f(x) = x³ - 2x + 1 et sa dérivée f'(x) = 3x² - 2
                  </h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 20% 90%)" />
                      <XAxis dataKey="x" tick={{ fontSize: 11 }} stroke="hsl(210 10% 50%)" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(210 10% 50%)" />
                      <Tooltip
                        contentStyle={{
                          background: "white",
                          border: "1px solid hsl(210 20% 90%)",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <ReferenceLine x={0} stroke="hsl(210 10% 70%)" strokeDasharray="4 4" />
                      <ReferenceLine y={0} stroke="hsl(210 10% 70%)" strokeDasharray="4 4" />
                      <Line
                        type="monotone"
                        dataKey="f(x)"
                        stroke="#2E86C1"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 5, fill: "#2E86C1" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="f'(x)"
                        stroke="#E67E22"
                        strokeWidth={2.5}
                        strokeDasharray="6 3"
                        dot={false}
                        activeDot={{ r: 5, fill: "#E67E22" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* African context card */}
                <div className="bg-card rounded-2xl p-6 shadow-card border-l-4 border-accent">
                  <h4 className="text-sm font-bold text-card-foreground mb-2 flex items-center gap-2">
                    🌍 Application en contexte africain
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Un commerçant au marché Dantokpa (Cotonou) stocke q(x) = x³ - 2x + 1 tonnes de mil selon le prix x (en milliers de FCFA). La dérivée q'(x) = 3x² - 2 indique la vitesse de variation de son stock. À x = 1, q'(1) = 1 {">"} 0 : son stock augmente. C'est le principe de la dérivée appliqué au commerce béninois.
                  </p>
                </div>

                {/* Programme badge */}
                <div className="bg-card rounded-2xl p-5 shadow-card flex items-center gap-3">
                  <BookOpen size={20} className="text-secondary" />
                  <div>
                    <span className="text-xs font-semibold text-secondary">📚 Programme officiel</span>
                    <p className="text-sm text-card-foreground">Chapitre 7 — Dérivation · BAC C/D Bénin · Niveau : Terminale</p>
                  </div>
                </div>

                <p className="text-right text-[11px] text-muted-foreground">
                  Généré automatiquement par MATHS4WORLD ✓
                </p>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                En attente de la conversation...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TuteurIA;
