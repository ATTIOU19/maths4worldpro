import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, Sparkles, Globe, ArrowRight, Mic, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedCounter from "@/components/AnimatedCounter";

const mathSymbols = ["∑", "∫", "π", "√", "∞", "Δ", "∂", "λ", "θ", "φ"];

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

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-hero">
        {/* Floating math symbols */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {mathSymbols.map((sym, i) => (
            <span
              key={i}
              className="math-symbol absolute text-primary-foreground/[0.05] font-bold select-none"
              style={{
                fontSize: `${24 + Math.random() * 48}px`,
                left: `${5 + (i * 9.5)}%`,
                top: `${10 + Math.random() * 70}%`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${6 + Math.random() * 6}s`,
              }}
            >
              {sym}
            </span>
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-4xl md:text-6xl font-extrabold text-primary-foreground leading-tight mb-6">
              L'intelligence artificielle qui enseigne les mathématiques{" "}
              <span className="opacity-80">à l'africaine</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/70 max-w-2xl mx-auto mb-10 leading-relaxed">
              Tuteur IA conversationnel · Réponse visuelle automatique · Adapté aux curricula africains · Évaluation orale
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/tuteur-ia"
                className="inline-flex items-center gap-2 px-8 py-4 bg-secondary text-secondary-foreground rounded-xl text-base font-semibold hover:scale-[1.02] hover:shadow-hero transition-all duration-300"
              >
                Essayer le Tuteur IA <ArrowRight size={18} />
              </Link>
              <Link
                to="/maths-metier"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-primary-foreground/30 text-primary-foreground rounded-xl text-base font-semibold hover:bg-primary-foreground/10 transition-all duration-300"
              >
                Voir le module Maths Métier <ArrowRight size={18} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={i}
                className="bg-card rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-5 group-hover:bg-secondary/20 transition-colors">
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
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
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
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
                  <s.icon size={28} className="text-primary-foreground" />
                </div>
                <span className="text-xs font-bold text-secondary mb-2">ÉTAPE {s.num}</span>
                <p className="text-sm font-medium text-foreground">{s.title}</p>
                {i < steps.length - 1 && (
                  <ArrowRight className="text-muted-foreground mt-4 hidden md:block rotate-0 md:rotate-0" size={20} />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4">
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
