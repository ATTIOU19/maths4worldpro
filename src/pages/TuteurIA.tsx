import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Sparkles, BookOpen, ArrowRight, Download } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import Navbar from "@/components/Navbar";
import MathSymbolsBackground from "@/components/MathSymbolsBackground";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileUpload, type AttachedFile } from "@/components/chat/FileUpload";
import { ExportMenu } from "@/components/chat/ExportMenu";
import { MessageBubble } from "@/components/chat/MessageBubble";

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

const conversationSteps = [
  {
    ai: { role: "ai" as const, text: "Bonjour ! Je suis **Amara**, votre tutrice IA. Avant de commencer, regardons un objet familier — un **cône de révolution** :\n\n```geogebra\n{\"type\":\"geogebra\",\"dim\":\"3d\",\"title\":\"Cône de révolution\",\"code\":\"A=(0,0,0); B=(0,0,4); Cone(A,B,2)\"}\n```\n\nMaintenant une question d'analyse : connaissez-vous la règle de dérivation des monômes ? Par exemple, si $g(x) = x^n$, que vaut $g'(x)$ ?", time: "14:02" },
    expectedConcept: "La règle est n·x^(n-1). Par exemple la dérivée de x^n est n*x^(n-1).",
    nextAi: { role: "ai" as const, text: "Exactement ! Vous venez de retrouver la règle fondamentale : si g(x) = xⁿ, alors g'(x) = n·xⁿ⁻¹. Maintenant, appliquez cette règle terme par terme à f(x) = x³ - 2x + 1. Que donnent les dérivées de chaque terme ?", time: "14:03" },
  },
  {
    ai: { role: "ai" as const, text: "Exactement ! Vous venez de retrouver la règle fondamentale : si g(x) = xⁿ, alors g'(x) = n·xⁿ⁻¹. Maintenant, appliquez cette règle terme par terme à f(x) = x³ - 2x + 1. Que donnent les dérivées de chaque terme ?", time: "14:03" },
    expectedConcept: "f'(x) = 3x² - 2. Accepter aussi 3x^2 - 2 ou toute formulation équivalente.",
    nextAi: { role: "ai" as const, text: "🎉 Parfait ! Vous avez tout juste. Donc f'(x) = 3x² - 2. Observez le graphique à droite : les zones où f'(x) > 0 correspondent aux portions croissantes de f(x). Voyez-vous le lien ?", time: "14:04" },
  },
  {
    ai: { role: "ai" as const, text: "🎉 Parfait ! Vous avez tout juste. Donc f'(x) = 3x² - 2. Observez le graphique à droite : les zones où f'(x) > 0 correspondent aux portions croissantes de f(x). Voyez-vous le lien ?", time: "14:04" },
    expectedConcept: "Quand la dérivée f'(x) est positive, la fonction f(x) est croissante. Quand f'(x) est négative, f(x) est décroissante.",
    nextAi: null,
  },
];

const TuteurIA = () => {
  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const [attached, setAttached] = useState<AttachedFile | null>(null);

  const showChart = step >= 2;

  const startConversation = () => {
    setStarted(true);
    setIsTyping(true);
    setTimeout(() => {
      setMessages([conversationSteps[0].ai]);
      setIsTyping(false);
    }, 1000);
  };

  const handleSend = async () => {
    if (isTyping || step >= conversationSteps.length || !input.trim()) return;

    const currentStep = conversationSteps[step];
    const userText = attached
      ? `${input.trim()}\n\n[Fichier joint : ${attached.name}]\n${attached.text.slice(0, 2000)}`
      : input.trim();
    const userMsg: ChatMessage = {
      role: "user",
      text: attached ? `${input.trim()} 📎 ${attached.name}` : input.trim(),
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttached(null);
    setIsTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-answer", {
        body: {
          question: currentStep.ai.text,
          userAnswer: userText,
          expectedConcept: currentStep.expectedConcept,
        },
      });

      if (error) throw error;

      const { correct, feedback } = data;

      if (correct) {
        // Show AI feedback then advance
        const feedbackMsg: ChatMessage = {
          role: "ai",
          text: feedback,
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, feedbackMsg]);

        const nextStep = step + 1;
        setStep(nextStep);

        // Show next scripted AI message after a delay
        if (currentStep.nextAi && nextStep < conversationSteps.length) {
          setTimeout(() => {
            setMessages((prev) => [...prev, conversationSteps[nextStep].ai]);
            setIsTyping(false);
          }, 1500);
          return;
        }
      } else {
        // Show correction feedback, stay on same step
        const feedbackMsg: ChatMessage = {
          role: "ai",
          text: feedback,
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, feedbackMsg]);
      }
    } catch (e) {
      console.error("Verification error:", e);
      toast.error("Erreur lors de la vérification. Réessayez.");
    }

    setIsTyping(false);
  };

  const isConversationDone = step >= conversationSteps.length;

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
                          <MessageBubble msg={{ role: "assistant", content: msg.text }} />
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

                {isConversationDone && !isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-4"
                  >
                    <p className="text-xs text-muted-foreground mb-3">✅ Démo terminée ! Essayez un vrai entretien.</p>
                    <a
                      href="/entretien-vocal"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-secondary-foreground rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
                    >
                      Lancer un entretien vocal
                      <ArrowRight size={14} />
                    </a>
                  </motion.div>
                )}
              </>
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
              {!attached && started && !isConversationDone && (
                <FileUpload onFile={setAttached} attached={null} onClear={() => setAttached(null)} disabled={isTyping} />
              )}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={!started ? "Cliquez sur « Commencer la démo »" : isConversationDone ? "Démo terminée" : "Tapez votre réponse..."}
                disabled={!started || isTyping || isConversationDone}
                className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground disabled:opacity-50"
              />
              <button className="relative w-9 h-9 rounded-full bg-accent flex items-center justify-center mic-pulse">
                <Mic size={16} className="text-accent-foreground" />
              </button>
              <button
                onClick={handleSend}
                disabled={!started || isTyping || isConversationDone || !input.trim()}
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
              <h2 className="text-lg font-bold text-foreground">Réponse Visuelle Automatique</h2>
            </div>

            {showChart ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
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
                      <Line type="monotone" dataKey="f(x)" stroke="#2E86C1" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: "#2E86C1" }} />
                      <Line type="monotone" dataKey="f'(x)" stroke="#E67E22" strokeWidth={2.5} strokeDasharray="6 3" dot={false} activeDot={{ r: 5, fill: "#E67E22" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-card rounded-2xl p-6 shadow-card border-l-4 border-accent">
                  <h4 className="text-sm font-bold text-card-foreground mb-2 flex items-center gap-2">
                    🌍 Application en contexte africain
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Un commerçant au marché Dantokpa (Cotonou) stocke q(x) = x³ - 2x + 1 tonnes de mil selon le prix x (en milliers de FCFA). La dérivée q'(x) = 3x² - 2 indique la vitesse de variation de son stock. À x = 1, q'(1) = 1 {">"} 0 : son stock augmente.
                  </p>
                </div>

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
                {started ? "Continuez la conversation pour voir le graphique..." : "Lancez la démo pour commencer"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TuteurIA;
