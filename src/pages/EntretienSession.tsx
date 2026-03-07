import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, Clock, X, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Navbar from "@/components/Navbar";

interface Message {
  role: "user" | "ai";
  content: string;
}

interface InterviewConfig {
  notion: string;
  niveau: string;
  langue: string;
}

// Simulated AI responses based on interview phase
const getAIResponse = (
  messages: Message[],
  config: InterviewConfig,
  timeLeft: number
): string => {
  const aiCount = messages.filter((m) => m.role === "ai").length;
  const langLabel = config.langue === "fr" ? "français" : config.langue;

  // Phase 1: Greeting
  if (aiCount === 0) {
    return `Bonjour ! 👋 Je suis **Amara**, votre tuteur IA pour cet entretien sur **${config.notion}** (niveau ${config.niveau}).\n\nAvant de commencer, pourriez-vous me dire :\n- Quels sont vos **objectifs** pour cet entretien ?\n- Y a-t-il des points spécifiques que vous souhaitez approfondir ?`;
  }

  // Phase 2: After objectives, start questions
  if (aiCount === 1) {
    return `Merci pour ces précisions ! C'est un excellent point de départ. 🎯\n\nCommençons notre entretien. Voici ma première question :\n\n**Question 1** : Pouvez-vous me donner la définition de **${config.notion}** en mathématiques et expliquer pourquoi c'est un concept important ?`;
  }

  if (aiCount === 2) {
    return `Bonne réponse ! ✅ Vous avez bien cerné l'essentiel.\n\n**💡 Amélioration** : Essayez d'inclure un exemple concret pour illustrer votre définition. Par exemple, si on parle de dérivées, montrer comment la vitesse instantanée d'un véhicule est une application directe.\n\n**Question 2** : Pouvez-vous me donner les **formules principales** liées à ${config.notion} et expliquer quand on les utilise ?`;
  }

  if (aiCount === 3) {
    return `Très bien ! Vous connaissez les formules de base. 👍\n\n**💡 Amélioration** : N'oubliez pas de mentionner les **cas particuliers** et les **conditions d'application**. C'est souvent ce qui fait la différence au BAC.\n\n**Question 3** : Résolvez cet exercice pratique : *Soit f(x) = 2x³ - 3x² + x - 5. Calculez f'(x) et déterminez les extremums locaux.*`;
  }

  if (aiCount === 4) {
    return `Bon travail sur cet exercice ! 🧮\n\n**💡 Amélioration** : Pensez à toujours vérifier vos calculs en substituant les valeurs trouvées dans l'équation originale. Cela permet d'éviter les erreurs d'étourderie.\n\n**Question 4** : Dans quel **contexte réel** au Bénin ou en Afrique de l'Ouest pourrait-on appliquer ${config.notion} ? Donnez un exemple concret.`;
  }

  if (aiCount === 5) {
    return `Excellente réflexion ! Relier les maths au quotidien est essentiel. 🌍\n\n**💡 Amélioration** : Essayez de quantifier votre exemple avec des chiffres réels pour montrer la puissance du concept.\n\n**Question 5** : Quelles sont les **erreurs courantes** que font les élèves sur ${config.notion} et comment les éviter ?`;
  }

  // End of interview - generate summary
  if (timeLeft < 60 || aiCount >= 6) {
    return generateSummary(config, messages);
  }

  return `Bonne réponse ! Continuons.\n\n**Question ${aiCount}** : Pouvez-vous approfondir un autre aspect de ${config.notion} ?`;
};

const generateSummary = (config: InterviewConfig, messages: Message[]): string => {
  const userMessages = messages.filter((m) => m.role === "user");
  const totalResponses = userMessages.length;
  const score = Math.min(18, Math.max(8, 10 + totalResponses * 1.5));

  return `## 📋 Résumé de l'entretien\n\n---\n\n### 📝 Informations\n- **Sujet** : ${config.notion}\n- **Niveau** : ${config.niveau}\n- **Questions posées** : ${Math.min(totalResponses, 6)}\n- **Réponses fournies** : ${totalResponses}\n\n---\n\n### 🎯 Note globale : **${score.toFixed(1)} / 20**\n\n---\n\n### ✅ Points forts\n- Bonne compréhension des concepts de base\n- Capacité à relier la théorie à la pratique\n- Réponses structurées et claires\n\n### ⚠️ Pistes d'amélioration\n1. **Précision des formules** : Toujours vérifier les conditions d'application\n2. **Exemples concrets** : Illustrer chaque concept avec un exemple chiffré\n3. **Cas particuliers** : Ne pas oublier les exceptions et limites\n4. **Contextualisation** : Relier davantage aux problèmes du programme béninois\n\n---\n\n### 📚 Ressources recommandées\n- Revoir le chapitre sur ${config.notion} dans votre manuel\n- Faire les exercices types du BAC des 3 dernières années\n- Pratiquer avec des problèmes contextualisés\n\n---\n\n*Entretien terminé — Généré par MATHS4WORLD IA ✓*`;
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const EntretienSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const config = (location.state as InterviewConfig) || null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 min
  const [isFinished, setIsFinished] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Redirect if no config
  useEffect(() => {
    if (!config) {
      navigate("/entretien-vocal");
    }
  }, [config, navigate]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  // End when time is up
  useEffect(() => {
    if (timeLeft === 0 && !isFinished && config) {
      setIsFinished(true);
      simulateAI(generateSummary(config, messages));
    }
  }, [timeLeft]);

  // Initial AI greeting
  useEffect(() => {
    if (config && messages.length === 0) {
      const greeting = getAIResponse([], config, timeLeft);
      simulateAI(greeting);
    }
  }, [config]);

  const simulateAI = useCallback((text: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "ai", content: text }]);
      setIsTyping(false);
    }, 1200);
  }, []);

  const handleSend = () => {
    if (!input.trim() || isTyping || isFinished || !config) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");

    // Check if we should end
    const aiCount = updatedMessages.filter((m) => m.role === "ai").length;
    if (aiCount >= 6 || timeLeft < 60) {
      setIsFinished(true);
      simulateAI(generateSummary(config, updatedMessages));
    } else {
      const response = getAIResponse(updatedMessages, config, timeLeft);
      simulateAI(response);
    }

    inputRef.current?.focus();
  };

  const handleEndEarly = () => {
    if (!config) return;
    setIsFinished(true);
    simulateAI(generateSummary(config, messages));
  };

  if (!config) return null;

  const timerColor = timeLeft < 300 ? "text-destructive" : timeLeft < 600 ? "text-accent" : "text-muted-foreground";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="pt-16 flex-1 flex flex-col">
        {/* Header bar */}
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
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
              >
                <X size={12} />
                Terminer
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl mx-auto w-full">
          {messages.map((msg, i) => (
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

          {isFinished && messages.length > 0 && messages[messages.length - 1].role === "ai" && (
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
                disabled={isTyping}
                className="flex-1 px-4 py-2.5 rounded-full bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 disabled:opacity-50 transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
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
