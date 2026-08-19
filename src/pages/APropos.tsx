import { motion } from "framer-motion";
import { Mail, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedCounter from "@/components/AnimatedCounter";
import MathSymbolsBackground from "@/components/MathSymbolsBackground";
import { useT } from "@/i18n";

const TIMELINE_YEARS = ["2023", "2024", "2025", "2026"] as const;

const APropos = () => {
  const t = useT();

  const timeline = TIMELINE_YEARS.map((year) => ({
    year,
    title: t(`about.tl.${year}.title`),
    desc: t(`about.tl.${year}.desc`),
  }));

  const stats = [
    { val: 50, label: t("about.stat1.label") },
    { val: 400, suffix: "M", label: t("about.stat2.label") },
    { val: 7, suffix: ",7 Mds $", label: t("about.stat3.label") },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <MathSymbolsBackground variant="light" count={14} opacity={0.05} />
      <Navbar />
      <div className="pt-24 pb-16 relative z-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
              {t("about.title")}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t("about.subtitle")}
            </p>
          </motion.div>

          {/* Timeline */}
          <div className="mb-16">
            <h2 className="text-xl font-bold text-foreground mb-8">{t("about.timelineTitle")}</h2>
            <div className="space-y-6">
              {timeline.map((tl, i) => (
                <motion.div
                  key={i}
                  className="flex gap-6 items-start"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="w-16 shrink-0">
                    <span className="text-sm font-bold text-secondary">{tl.year}</span>
                  </div>
                  <div className="flex-1 bg-card rounded-xl p-5 shadow-card">
                    <h3 className="font-semibold text-card-foreground mb-1">{tl.title}</h3>
                    <p className="text-sm text-muted-foreground">{tl.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mission Quote */}
          <motion.div
            className="bg-gradient-hero rounded-2xl p-10 mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-primary-foreground text-xl md:text-2xl font-semibold leading-relaxed text-center italic">
              {t("about.quote")}
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {stats.map((s, i) => (
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
            <h3 className="text-lg font-bold text-card-foreground mb-2">{t("about.fundingTitle")}</h3>
            <p className="text-muted-foreground text-sm">
              {t("about.fundingDesc")}
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
              href="mailto:attioukotchole@gmail.com"
              className="inline-flex items-center gap-2 px-8 py-4 bg-secondary text-secondary-foreground rounded-xl text-base font-semibold hover:scale-[1.02] hover:shadow-hero transition-all duration-300"
            >
              <Mail size={18} /> {t("about.contact")} <ArrowRight size={16} />
            </a>
            
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default APropos;
