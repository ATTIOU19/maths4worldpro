import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, Sparkles, Globe, ArrowRight, Mic, Zap, Bot, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedCounter from "@/components/AnimatedCounter";
import MathSymbolsBackground from "@/components/MathSymbolsBackground";
import { useEffect, useState } from "react";

const features = [
  {
    icon: MessageSquare,
    title: "Tuteur Socratique IA",
    desc: "Pose ta question en français. L'IA te guide étape par étape sans donner la réponse directement.",
  },
  {
    icon: Sparkles,
    title: "Réponse Visuelle Automatique",
    desc: "Chaque explication génère automatiquement le graphique ou schéma correspondant.",
  },
  {
    icon: Globe,
    title: "Exemples Africains Contextualisés",
    desc: "Les maths illustrées avec des réalités africaines : marchés, agriculture, tontines, ingénierie.",
  },
];

const steps = [
  { icon: MessageSquare, title: "Tu poses ta question en français", num: "01" },
  { icon: Sparkles, title: "L'IA génère l'explication + le visuel", num: "02" },
  { icon: Mic, title: "Tu t'entraînes à l'oral et valides ta maîtrise", num: "03" },
];

const TYPE_WORDS = ["mathématiques", "dérivées", "intégrales", "probabilités"];

const useTypewriter = (words: string[], speed = 90, pause = 1600) => {
  const [text, setText] = useState("");
  const [wIdx, setWIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wIdx];
    if (!deleting && text === word) {
      const t = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(t);
    }
    if (deleting && text === "") {
      setDeleting(false);
      setWIdx((i) => (i + 1) % words.length);
      return;
    }
    const t = setTimeout(() => {
      setText((cur) =>
        deleting ? cur.slice(0, -1) : word.slice(0, cur.length + 1)
      );
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(t);
  }, [text, deleting, wIdx, words, speed, pause]);

  return text;
};

const demoMessages = [
  { role: "user", text: "Qu'est-ce que la dérivée de x² ?" },
  { role: "ai", text: "Excellente question ! Que sais-tu déjà sur la règle n·xⁿ⁻¹ ?" },
  { role: "user", text: "On multiplie par l'exposant et on baisse de 1." },
  { role: "ai", text: "Parfait ! Donc pour x², on obtient 2x. Regarde le graphique →" },
];

const Index = () => {
  const word = useTypewriter(TYPE_WORDS);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-hero">
        <MathSymbolsBackground variant="dark" count={20} opacity={0.09} />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="pulse-glow inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/20 border border-secondary/30 text-primary-foreground text-xs font-semibold mb-6 backdrop-blur-sm"
            >
              <Zap size={14} className="text-secondary" />
              Nouvelle génération de tuteur IA
            </motion.span>

            <h1 className="text-4xl md:text-6xl font-extrabold text-primary-foreground leading-tight mb-6">
              L'intelligence artificielle qui enseigne les{" "}
              <span className="text-gradient-primary bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, hsl(204 100% 75%), hsl(191 100% 70%))" }}>
                {word}
                <span className="caret" />
              </span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/70 max-w-2xl mx-auto mb-10 leading-relaxed">
              Tuteur IA conversationnel · Réponse visuelle automatique · Adapté aux curricula africains · Évaluation orale
            </p>

            {/* Equation flottante */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="inline-block mb-8 px-5 py-2 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10 backdrop-blur-sm"
            >
              <span className="font-mono text-primary-foreground/80 text-sm md:text-base">
                f(x) = x³ − 2x + 1  →  f′(x) = 3x² − 2
              </span>
            </motion.div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/tuteur-ia"
                className="btn-shine inline-flex items-center gap-2 px-8 py-4 bg-secondary text-secondary-foreground rounded-xl text-base font-semibold hover:scale-[1.03] hover:shadow-hero transition-all duration-300"
              >
                Essayer le Tuteur IA <ArrowRight size={18} />
              </Link>
              <Link
                to="/maths-metier"
                className="btn-shine inline-flex items-center gap-2 px-8 py-4 border-2 border-primary-foreground/30 text-primary-foreground rounded-xl text-base font-semibold hover:bg-primary-foreground/10 transition-all duration-300"
              >
                Voir le module Maths Métier <ArrowRight size={18} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20 bg-background overflow-hidden">
        <MathSymbolsBackground variant="light" count={14} opacity={0.05} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={i}
                className="bg-card rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 group cursor-default"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                whileHover={{ y: -6, rotateX: 2, rotateY: -2 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-5 group-hover:bg-secondary/20 group-hover:scale-110 transition-all">
                  <f.icon size={24} className="text-secondary" />
                </div>
                <h3 className="text-lg font-bold text-card-foreground mb-3">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-20 bg-muted/50 overflow-hidden">
        <MathSymbolsBackground variant="light" count={12} opacity={0.06} />
        <div className="container mx-auto px-4 relative z-10">
          <motion.h2
            className="text-3xl font-bold text-center text-foreground mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Comment ça marche ?
          </motion.h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 max-w-4xl mx-auto">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                className="flex flex-col items-center text-center flex-1"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-hero">
                  <s.icon size={28} className="text-primary-foreground" />
                </div>
                <span className="text-xs font-bold text-secondary mb-2">ÉTAPE {s.num}</span>
                <p className="text-sm font-medium text-foreground">{s.title}</p>
                {i < steps.length - 1 && (
                  <ArrowRight className="text-muted-foreground mt-4 hidden md:block" size={20} />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Aperçu en direct */}
      <section className="relative py-20 bg-background overflow-hidden">
        <MathSymbolsBackground variant="light" count={10} opacity={0.05} />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-3">Aperçu en direct</h2>
            <p className="text-muted-foreground">Voici à quoi ressemble une session avec Amara</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Mock chat */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl shadow-card p-6 border border-border"
            >
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <Bot size={18} className="text-accent-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-card-foreground text-sm">Amara · Tuteur IA</div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-xs text-success">En ligne</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {demoMessages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.25 }}
                    className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {m.role === "ai" && (
                      <div className="w-7 h-7 rounded-full bg-accent shrink-0 flex items-center justify-center">
                        <Bot size={14} className="text-accent-foreground" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${
                        m.role === "user" ? "chat-bubble-user" : "chat-bubble-ai shadow-sm"
                      }`}
                    >
                      {m.text}
                    </div>
                    {m.role === "user" && (
                      <div className="w-7 h-7 rounded-full bg-secondary shrink-0 flex items-center justify-center">
                        <User size={14} className="text-secondary-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Mock chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl shadow-card p-6 border border-border flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-card-foreground text-sm">Visualisation : f(x) = x²</div>
                <Sparkles size={16} className="text-secondary" />
              </div>
              <div className="flex-1 flex items-center justify-center">
                <svg viewBox="0 0 300 220" className="w-full h-full max-h-[260px]">
                  {/* grid */}
                  {[40, 80, 120, 160, 200].map((y) => (
                    <line key={y} x1="20" x2="280" y1={y} y2={y} stroke="hsl(var(--border))" strokeWidth="1" />
                  ))}
                  {[60, 110, 160, 210, 260].map((x) => (
                    <line key={x} x1={x} x2={x} y1="20" y2="200" stroke="hsl(var(--border))" strokeWidth="1" />
                  ))}
                  {/* axes */}
                  <line x1="20" x2="280" y1="200" y2="200" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
                  <line x1="150" x2="150" y1="20" y2="200" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
                  {/* parabola */}
                  <motion.path
                    d={`M ${Array.from({ length: 50 }, (_, i) => {
                      const x = -3 + (i * 6) / 49;
                      const px = 150 + x * 22;
                      const py = 200 - x * x * 18;
                      return `${i === 0 ? "" : "L "}${px.toFixed(1)} ${py.toFixed(1)}`;
                    }).join(" ")}`}
                    fill="none"
                    stroke="hsl(var(--secondary))"
                    strokeWidth="2.5"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.6, ease: "easeInOut" }}
                  />
                  <text x="265" y="215" fontSize="11" fill="hsl(var(--muted-foreground))">x</text>
                  <text x="155" y="30" fontSize="11" fill="hsl(var(--muted-foreground))">y</text>
                </svg>
              </div>
              <Link
                to="/visualisation"
                className="btn-shine mt-4 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all"
              >
                Essayer maintenant <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-20 bg-primary overflow-hidden">
        <MathSymbolsBackground variant="dark" count={14} opacity={0.07} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl md:text-5xl font-extrabold text-primary-foreground mb-2">
                <AnimatedCounter end={50} />
              </div>
              <p className="text-primary-foreground/60 text-sm">outils analysés — aucun ne fait ce que nous faisons</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
            >
              <div className="text-4xl md:text-5xl font-extrabold text-primary-foreground mb-2">
                <AnimatedCounter end={400} suffix="M" />
              </div>
              <p className="text-primary-foreground/60 text-sm">de francophones africains non couverts</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-4xl md:text-5xl font-extrabold text-secondary mb-2">
                <AnimatedCounter end={7} suffix=",7 Mds $" />
              </div>
              <p className="text-primary-foreground/60 text-sm">marché EdTech africain en 2033</p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
