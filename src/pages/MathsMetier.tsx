import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, BarChart3, Brain, Building2, Sprout, Pill, ArrowRight, Mic, CheckCircle, Circle, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const domains = [
  { icon: Bot, title: "Intelligence Artificielle", sub: "Algèbre linéaire · Optimisation · Probabilités bayésiennes", badge: "Populaire", badgeColor: "bg-secondary" },
  { icon: BarChart3, title: "Data Science", sub: "Statistiques · Distributions · Régression · Matrices", badge: null, badgeColor: "" },
  { icon: Brain, title: "Machine Learning", sub: "Descente de gradient · Fonctions de coût · Valeurs propres", badge: "Nouveau", badgeColor: "bg-accent" },
  { icon: Building2, title: "BTP & Architecture", sub: "Calculs de structure · Volumes · Métrés · Résistance", badge: null, badgeColor: "" },
  { icon: Sprout, title: "Agriculture & Agronomie", sub: "Surfaces · Rendements · Modèles de croissance", badge: null, badgeColor: "" },
  { icon: Pill, title: "Médecine & Santé", sub: "Dosages · Statistiques médicales · Épidémiologie", badge: null, badgeColor: "" },
];

const progressSteps = [
  { label: "Fondations", status: "done" },
  { label: "Probabilités", status: "current" },
  { label: "Optimisation", status: "upcoming" },
  { label: "Algèbre avancée", status: "upcoming" },
  { label: "Évaluation orale", status: "upcoming" },
];

const MathsMetier = () => {
  const [expanded, setExpanded] = useState<number>(0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">
              Maths Métier
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Les mathématiques de votre domaine professionnel. Choisissez votre domaine et maîtrisez les maths qui font votre expertise.
            </p>
          </motion.div>

          {/* Domain Grid */}
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto mb-8">
            {domains.map((d, i) => (
              <motion.button
                key={i}
                onClick={() => setExpanded(expanded === i ? -1 : i)}
                className={`text-left bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border-2 ${
                  expanded === i ? "border-secondary" : "border-transparent"
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <d.icon size={24} className="text-primary" />
                  </div>
                  {d.badge && (
                    <span className={`${d.badgeColor} text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full`}>
                      {d.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-card-foreground mb-1">{d.title}</h3>
                <p className="text-xs text-muted-foreground mb-4">{d.sub}</p>
                <span className="text-secondary text-sm font-semibold inline-flex items-center gap-1">
                  Explorer <ArrowRight size={14} />
                </span>
              </motion.button>
            ))}
          </div>

          {/* Expanded IA Module */}
          <AnimatePresence>
            {expanded === 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="max-w-5xl mx-auto"
              >
                <div className="bg-card rounded-2xl shadow-card p-8 space-y-8">
                  <h2 className="text-xl font-bold text-card-foreground">
                    Parcours Maths pour Data Scientists & Ingénieurs IA
                  </h2>

                  {/* Progress Stepper */}
                  <div className="flex items-center justify-between">
                    {progressSteps.map((step, i) => (
                      <div key={i} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                          {step.status === "done" ? (
                            <CheckCircle size={28} className="text-success" />
                          ) : step.status === "current" ? (
                            <div className="relative">
                              <Circle size={28} className="text-secondary" />
                              <span className="absolute inset-0 rounded-full border-2 border-secondary animate-ping opacity-30" />
                            </div>
                          ) : (
                            <Circle size={28} className="text-muted-foreground/30" />
                          )}
                          <span className={`text-[10px] mt-2 font-medium text-center ${
                            step.status === "done" ? "text-success" : step.status === "current" ? "text-secondary" : "text-muted-foreground/50"
                          }`}>
                            {step.label}
                          </span>
                        </div>
                        {i < progressSteps.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-2 ${
                            step.status === "done" ? "bg-success" : "bg-muted"
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Mini Chat */}
                  <div className="bg-muted/50 rounded-xl p-5 space-y-3">
                    <div className="flex justify-end">
                      <div className="chat-bubble-user px-4 py-3 max-w-[80%] shadow-sm">
                        <p className="text-sm">Pouvez-vous m'expliquer pourquoi la descente de gradient utilise la dérivée ?</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0 mt-1">
                        <span className="text-accent-foreground text-xs font-bold">A</span>
                      </div>
                      <div className="chat-bubble-ai px-4 py-3 max-w-[85%] shadow-sm">
                        <p className="text-sm leading-relaxed">
                          Excellente question ! Imaginez que vous êtes sur une montagne la nuit, sans lampe. Pour descendre le plus vite possible, vous cherchez la pente la plus forte à vos pieds — c'est exactement ce que fait la dérivée. Si L(w) est votre fonction de coût, alors ∇L(w) indique la direction de montée la plus rapide. En allant dans le sens opposé (−∇L), vous minimisez L. Pour un modèle de crédit mobile money au Sénégal : w se met à jour à chaque itération selon w ← w - α·∇L(w), où α est le taux d'apprentissage.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Oral Evaluation */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-card-foreground flex items-center gap-2">
                      🎤 Entretien Oral IA
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Expliquez à voix haute pourquoi la dérivée d'une fonction de coût indique la direction de mise à jour des poids
                    </p>
                    <div className="flex items-center gap-4">
                      <button className="relative w-16 h-16 rounded-full bg-accent flex items-center justify-center mic-pulse">
                        <Mic size={28} className="text-accent-foreground" />
                      </button>
                      <span className="text-sm text-muted-foreground">
                        Appuyez pour parler — l'IA évalue votre raisonnement
                      </span>
                    </div>

                    {/* Simulated Result */}
                    <motion.div
                      className="bg-muted/50 rounded-xl p-5 space-y-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle size={16} className="text-success" />
                        <span className="text-card-foreground">Précision conceptuelle : <strong>9/10</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle size={16} className="text-success" />
                        <span className="text-card-foreground">Structure du raisonnement : <strong>8/10</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle size={16} className="text-secondary" />
                        <span className="text-card-foreground">À approfondir : la notion de convexité et conditions de convergence</span>
                      </div>
                      <button className="mt-2 text-sm font-semibold text-secondary inline-flex items-center gap-1 hover:underline">
                        Continuez vers le niveau 4 : Algèbre avancée <ArrowRight size={14} />
                      </button>
                    </motion.div>
                  </div>

                  {/* Certificate button */}
                  <button
                    className="px-5 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm font-medium cursor-not-allowed opacity-60"
                    disabled
                    title="Disponible après validation complète"
                  >
                    📜 Télécharger mon attestation
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MathsMetier;
