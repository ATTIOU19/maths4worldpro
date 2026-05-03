import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Clock, X, CheckCircle2, Volume2, VolumeX, MessageSquare, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Navbar from "@/components/Navbar";
import { toast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { FileUpload, type AttachedFile } from "@/components/chat/FileUpload";
import { ExportMenu } from "@/components/chat/ExportMenu";

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
  fileContext,
  onDelta,
  onDone,
  onError,
}: {
  messages: ChatMessage[];
  config: InterviewConfig;
  fileContext?: string;
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
    body: JSON.stringify({ messages, config, fileContext }),
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

  const [displayMessages, setDisplayMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const apiMessagesRef = useRef<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [isFinished, setIsFinished] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentAiText, setCurrentAiText] = useState("");
  const [userSaidText, setUserSaidText] = useState("");
  const [attached, setAttached] = useState<AttachedFile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSpokenRef = useRef<string>("");

  // Speech synthesis (AI speaks)
  const { isSpeaking, speak, stop: stopSpeaking, isSupported: ttsSupported } = useSpeechSynthesis({
    lang: config?.langue || "fr",
    rate: 0.95,
    onEnd: () => {
      // Ne PAS démarrer le micro automatiquement : Chrome bloque souvent
      // l'API SpeechRecognition si elle n'est pas déclenchée par un clic direct.
      // L'utilisateur doit appuyer sur le bouton micro pour parler.
    },
  });

  // Speech recognition (user speaks)
  const {
    isListening,
    interim,
    isSupported: sttSupported,
    start: startListening,
    stop: stopListening,
    toggle: toggleMic,
  } = useSpeechRecognition({
    lang: config?.langue || "fr",
    onResult: (transcript) => {
      setUserSaidText((prev) => (prev ? prev + " " + transcript : transcript));
    },
  });

  // Listen to speech recognition errors and show user-friendly toasts
  useEffect(() => {
    const handler = (e: Event) => {
      const err = (e as CustomEvent).detail as string;
      const messages: Record<string, string> = {
        "not-allowed": "Accès au micro refusé. Autorisez-le dans les paramètres du navigateur.",
        "service-not-allowed": "Le micro est bloqué par votre navigateur.",
        "no-speech": "Aucune parole détectée. Réessayez en parlant plus fort.",
        "audio-capture": "Aucun micro détecté. Vérifiez votre matériel.",
        "network": "Problème réseau pour la reconnaissance vocale.",
        "aborted": "",
      };
      const msg = messages[err] ?? `Erreur micro : ${err}`;
      if (msg) toast({ title: "Micro", description: msg, variant: "destructive" });
    };
    window.addEventListener("speech-recognition-error", handler);
    return () => window.removeEventListener("speech-recognition-error", handler);
  }, []);

  useEffect(() => {
    if (!config) navigate("/entretien-vocal");
  }, [config, navigate]);

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

  // Speak AI response when streaming completes
  useEffect(() => {
    if (!isStreaming && displayMessages.length > 0) {
      const last = displayMessages[displayMessages.length - 1];
      if (last.role === "ai" && last.content && last.content !== lastSpokenRef.current && voiceEnabled && ttsSupported) {
        lastSpokenRef.current = last.content;
        speak(last.content);
      }
    }
  }, [isStreaming, displayMessages, voiceEnabled, ttsSupported, speak]);

  // Send AI request with streaming
  const sendToAI = useCallback(
    (msgs: ChatMessage[], endAfter = false, fileContext?: string) => {
      if (!config) return;
      setIsStreaming(true);
      stopSpeaking();
      stopListening();

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
        fileContext,
        onDelta: (chunk) => {
          assistantSoFar += chunk;
          setCurrentAiText(assistantSoFar);
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
    [config, stopSpeaking, stopListening]
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

  // Submit user's spoken answer
  const handleSubmitVoice = useCallback(() => {
    const text = userSaidText.trim();
    if (!text || isStreaming || isFinished || !config) return;

    stopListening();
    const fileCtx = attached?.text;
    const visibleText = attached ? `${text}\n📎 ${attached.name}` : text;
    setUserSaidText("");
    setAttached(null);
    setDisplayMessages((prev) => [...prev, { role: "user", content: visibleText }]);

    const updatedApiMsgs: ChatMessage[] = [
      ...apiMessagesRef.current,
      { role: "user", content: text },
    ];

    const aiCount = displayMessages.filter((m) => m.role === "ai").length;
    const shouldEnd = aiCount >= 6 || timeLeft < 60;

    sendToAI(updatedApiMsgs, shouldEnd, fileCtx);
  }, [userSaidText, isStreaming, isFinished, config, stopListening, displayMessages, timeLeft, sendToAI, attached]);

  const handleEndEarly = () => {
    if (!config || isStreaming) return;
    stopSpeaking();
    stopListening();
    sendToAI(apiMessagesRef.current, true);
  };

  if (!config) return null;

  const timerColor =
    timeLeft < 300
      ? "text-destructive"
      : timeLeft < 600
      ? "text-accent"
      : "text-muted-foreground";

  // Voice status text
  const getStatusText = () => {
    if (isStreaming) return "Amara réfléchit...";
    if (isSpeaking) return "Amara parle...";
    if (isListening) return "À vous de parler...";
    return "Appuyez sur le micro pour répondre";
  };

  const getStatusColor = () => {
    if (isSpeaking) return "text-accent";
    if (isListening) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="pt-16 flex-1 flex flex-col">
        {/* Top bar */}
        <div className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <span className="text-accent-foreground font-bold text-xs">A</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-card-foreground">
                Entretien vocal : {config.notion}
              </p>
              <p className="text-xs text-muted-foreground">
                {config.niveau} · {config.langue === "fr" ? "Français" : config.langue}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 ${timerColor}`}>
              <Clock size={14} />
              <span className="text-sm font-mono font-semibold">{formatTime(timeLeft)}</span>
            </div>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title={voiceEnabled ? "Désactiver la voix" : "Activer la voix"}
            >
              {voiceEnabled ? <Volume2 size={16} className="text-accent" /> : <VolumeX size={16} className="text-muted-foreground" />}
            </button>
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className={`p-2 rounded-lg hover:bg-muted transition-colors ${showTranscript ? "bg-muted" : ""}`}
              title="Voir la transcription"
            >
              <MessageSquare size={16} className={showTranscript ? "text-accent" : "text-muted-foreground"} />
            </button>
            {displayMessages.length > 0 && (
              <ExportMenu
                title={`Entretien : ${config.notion}`}
                messages={displayMessages.map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content }))}
                baseFilename="entretien-vocal"
                className="text-foreground"
              />
            )}
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

        {/* Main voice interface */}
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Transcript panel (collapsible) */}
          <AnimatePresence>
            {showTranscript && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "40%", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute top-0 left-0 right-0 bg-card border-b border-border overflow-y-auto z-10"
              >
                <div className="px-4 py-3 space-y-3 max-w-3xl mx-auto">
                  <div className="flex items-center justify-between sticky top-0 bg-card py-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transcription</p>
                    <button onClick={() => setShowTranscript(false)}>
                      <ChevronDown size={14} className="text-muted-foreground" />
                    </button>
                  </div>
                  {displayMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${
                        msg.role === "user"
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-muted text-card-foreground"
                      }`}>
                        {msg.role === "ai" ? (
                          <div className="prose prose-xs max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p>{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Central voice UI */}
          <div className="flex flex-col items-center gap-8">
            {/* AI avatar with speaking animation */}
            <motion.div
              animate={isSpeaking ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={isSpeaking ? { repeat: Infinity, duration: 1.5 } : {}}
              className="relative"
            >
              <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                isSpeaking
                  ? "bg-accent shadow-[0_0_40px_hsl(var(--accent)/0.4)]"
                  : isStreaming
                  ? "bg-muted animate-pulse"
                  : "bg-accent/20"
              }`}>
                <span className="text-3xl font-bold text-accent-foreground">A</span>
              </div>
              {/* Speaking ripples */}
              {isSpeaking && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full border-2 border-accent"
                  />
                  <motion.div
                    animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut", delay: 0.3 }}
                    className="absolute inset-0 rounded-full border-2 border-accent"
                  />
                </>
              )}
            </motion.div>

            {/* Status */}
            <p className={`text-sm font-medium ${getStatusColor()} transition-colors`}>
              {getStatusText()}
            </p>

            {/* Interim transcript (what user is saying) */}
            {(isListening || userSaidText) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl px-6 py-3 max-w-md text-center"
              >
                <p className="text-sm text-card-foreground">
                  {userSaidText}
                  {interim && <span className="text-muted-foreground italic"> {interim}...</span>}
                </p>
              </motion.div>
            )}

            {/* Main action area */}
            {!isFinished ? (
              <div className="flex flex-col items-center gap-4">
                {attached && (
                  <FileUpload onFile={setAttached} attached={attached} onClear={() => setAttached(null)} />
                )}
                <div className="flex items-center gap-4">
                {!attached && (
                  <FileUpload onFile={setAttached} attached={null} onClear={() => setAttached(null)} disabled={isStreaming} />
                )}
                {/* Mic button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (isSpeaking) {
                      stopSpeaking();
                    }
                    toggleMic();
                  }}
                  disabled={isStreaming}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${
                    isListening
                      ? "bg-destructive text-destructive-foreground shadow-[0_0_30px_hsl(var(--destructive)/0.4)]"
                      : "bg-secondary text-secondary-foreground hover:shadow-[0_0_20px_hsl(var(--secondary)/0.3)]"
                  }`}
                >
                  {isListening ? <MicOff size={28} /> : <Mic size={28} />}
                </motion.button>

                {/* Send button (if user has spoken something) */}
                {userSaidText.trim() && !isListening && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={handleSubmitVoice}
                    disabled={isStreaming}
                    className="px-6 py-3 rounded-full bg-accent text-accent-foreground text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    Envoyer
                  </motion.button>
                )}
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col items-center gap-4"
              >
                <p className="text-sm text-muted-foreground">Entretien terminé</p>
                <button
                  onClick={() => {
                    setShowTranscript(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80 transition-all"
                >
                  <MessageSquare size={16} />
                  Voir le résumé
                </button>
                <button
                  onClick={() => navigate("/entretien-vocal")}
                  className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-xl text-sm font-semibold hover:brightness-110 transition-all shadow-hero"
                >
                  <CheckCircle2 size={16} />
                  Nouvel entretien
                </button>
              </motion.div>
            )}

            {/* Hint */}
            {!isFinished && !isStreaming && !isSpeaking && !isListening && !userSaidText && (
              <p className="text-xs text-muted-foreground/60 mt-4 text-center max-w-xs">
                💡 Appuyez sur le micro pour parler. La transcription est disponible via l'icône 💬 en haut.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntretienSession;
