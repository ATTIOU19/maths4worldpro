import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mic, Globe, BookOpen, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";

const langues = [
  { code: "fr", label: "🇫🇷 Français" },
  { code: "en", label: "🇬🇧 English" },
  { code: "fon", label: "🇧🇯 Fon" },
  { code: "yoruba", label: "🇳🇬 Yoruba" },
];

const EntretienSetup = () => {
  const navigate = useNavigate();
  const [notion, setNotion] = useState("");
  const [langue, setLangue] = useState("fr");

  const canStart = notion.trim() && langue;

  const handleStart = () => {
    if (!canStart) return;
    navigate("/entretien-vocal/session", {
      state: { notion: notion.trim(), langue },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Mic size={28} className="text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Entretien Vocal IA
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Préparez-vous à un entretien interactif de 30 minutes maximum avec notre IA tuteur. 
              Configurez votre session ci-dessous.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="bg-card rounded-2xl p-6 shadow-card space-y-6"
          >
            {/* Notion */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-card-foreground mb-2">
                <BookOpen size={16} className="text-secondary" />
                Notion / Sujet de l'entretien
              </label>
              <input
                type="text"
                value={notion}
                onChange={(e) => setNotion(e.target.value)}
                placeholder="Ex: Les dérivées, Les intégrales, Suites numériques..."
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all"
              />
            </div>

            {/* Langue */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-card-foreground mb-2">
                <Globe size={16} className="text-secondary" />
                Langue de l'entretien
              </label>
              <div className="grid grid-cols-2 gap-2">
                {langues.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLangue(l.code)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                      langue === l.code
                        ? "bg-secondary text-secondary-foreground border-secondary shadow-sm"
                        : "bg-muted text-muted-foreground border-border hover:border-secondary/40"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Timer info */}
            <div className="bg-accent/5 rounded-xl p-4 border border-accent/20">
              <p className="text-xs text-muted-foreground">
                ⏱️ L'entretien dure <strong className="text-foreground">30 minutes maximum</strong>. 
                L'IA vous posera des questions, analysera vos réponses et vous fournira un résumé complet avec votre note à la fin.
              </p>
            </div>

            {/* Start button */}
            <button
              onClick={handleStart}
              disabled={!canStart}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                canStart
                  ? "bg-secondary text-secondary-foreground hover:brightness-110 shadow-hero"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              Commencer l'entretien
              <ArrowRight size={16} />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EntretienSetup;
