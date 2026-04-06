import { motion } from "framer-motion";
import { Mail, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedCounter from "@/components/AnimatedCounter";

const timeline = [
  { year: "2023", title: "Le constat", desc: "50 outils EdTech analysés — aucun ne cible les francophones africains avec un tuteur IA socratique." },
  { year: "2024", title: "La recherche", desc: "Étude des curricula de 8 pays africains, des méthodes d'apprentissage orales et contextualisées." },
  { year: "2025", title: "Le prototype", desc: "Premier tuteur IA conversationnel adapté aux programmes BAC africains, avec réponse visuelle automatique." },
  { year: "2026", title: "Le lancement", desc: "MATHS4WORLD ouvre l'accès à 400 millions de francophones africains." },
];



const APropos = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
              À propos de MATHS4WORLD
            </h1>
            <p className="text-muted-foreground text-lg">
              L'IA qui enseigne les maths comme l'Afrique les vit
            </p>
          </motion.div>

          {/* Timeline */}
          <div className="mb-16">
            <h2 className="text-xl font-bold text-foreground mb-8">Né d'un constat africain</h2>
            <div className="space-y-6">
              {timeline.map((t, i) => (
                <motion.div
                  key={i}
                  className="flex gap-6 items-start"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="w-16 shrink-0">
                    <span className="text-sm font-bold text-secondary">{t.year}</span>
                  </div>
                  <div className="flex-1 bg-card rounded-xl p-5 shadow-card">
                    <h3 className="font-semibold text-card-foreground mb-1">{t.title}</h3>
                    <p className="text-sm text-muted-foreground">{t.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Team */}
          <motion.div
            className="bg-card rounded-2xl p-8 shadow-card mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shrink-0">
                <span className="text-primary-foreground font-extrabold text-xl">NK</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-card-foreground">Narcisse Kotcholé ATTIOU</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Data Scientist", "Ingénieur ML", "Mathématicien"].map((role) => (
                    <span key={role} className="bg-secondary/10 text-secondary text-xs font-semibold px-3 py-1 rounded-full">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mission Quote */}
          <motion.div
            className="bg-gradient-hero rounded-2xl p-10 mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-primary-foreground text-xl md:text-2xl font-semibold leading-relaxed text-center italic">
              "Notre mission : démocratiser l'accès aux mathématiques de qualité pour chaque étudiant et professionnel francophone d'Afrique, grâce à l'intelligence artificielle."
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { val: 50, label: "outils analysés" },
              { val: 400, suffix: "M", label: "francophones africains" },
              { val: 7, suffix: ",7 Mds $", label: "marché 2033" },
            ].map((s, i) => (
              <motion.div
                key={i}
                className="bg-card rounded-2xl p-6 shadow-card text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-3xl font-extrabold text-primary mb-1">
                  <AnimatedCounter end={s.val} suffix={s.suffix || ""} />
                </div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Funding */}
          <motion.div
            className="bg-card rounded-2xl p-8 shadow-card text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-lg font-bold text-card-foreground mb-2">🔎 À la recherche de financement et de partenariats</h3>
            <p className="text-muted-foreground text-sm">
              MATHS4WORLD est activement à la recherche de partenaires stratégiques et de financements pour accélérer sa mission éducative en Afrique francophone.
            </p>
          </motion.div>

          {/* Contact CTA */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <a
              href="mailto:contact@maths4world.com"
              className="inline-flex items-center gap-2 px-8 py-4 bg-secondary text-secondary-foreground rounded-xl text-base font-semibold hover:scale-[1.02] hover:shadow-hero transition-all duration-300"
            >
              <Mail size={18} /> Nous contacter <ArrowRight size={16} />
            </a>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default APropos;
