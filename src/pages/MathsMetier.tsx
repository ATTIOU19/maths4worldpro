import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, BarChart3, Brain, Building2, Sprout, Pill, ArrowRight, BookOpen, TrendingUp, Landmark, Banknote, Zap, Truck, Shield, Cpu, GraduationCap, Sparkles, MessageSquare } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MathSymbolsBackground from "@/components/MathSymbolsBackground";
import { Badge } from "@/components/ui/badge";

type Notion = {
  nom: string;
  description: string;
  niveau: "Débutant" | "Intermédiaire" | "Avancé";
};

const domains = [
  {
    icon: Bot, title: "Intelligence Artificielle", accent: "#6366f1",
    sub: "Algèbre linéaire · Optimisation · Probabilités bayésiennes",
    badge: "Populaire", badgeColor: "bg-secondary",
    notions: [
      { nom: "Algèbre linéaire", description: "Vecteurs, matrices et transformations linéaires utilisés dans les réseaux de neurones.", niveau: "Intermédiaire" as const },
      { nom: "Calcul matriciel", description: "Multiplication, inversion et décomposition de matrices pour le traitement des données.", niveau: "Intermédiaire" as const },
      { nom: "Probabilités bayésiennes", description: "Théorème de Bayes et inférence probabiliste pour la classification.", niveau: "Avancé" as const },
      { nom: "Optimisation convexe", description: "Minimisation de fonctions de coût et descente de gradient.", niveau: "Avancé" as const },
      { nom: "Dérivées partielles", description: "Calcul différentiel pour la rétropropagation dans les réseaux de neurones.", niveau: "Intermédiaire" as const },
      { nom: "Statistiques descriptives", description: "Moyenne, variance, écart-type pour l'analyse exploratoire des données.", niveau: "Débutant" as const },
    ],
  },
  {
    icon: BarChart3, title: "Data Science", accent: "#06b6d4",
    sub: "Statistiques · Distributions · Régression · Matrices",
    badge: null, badgeColor: "",
    notions: [
      { nom: "Distributions statistiques", description: "Lois normale, binomiale, Poisson pour modéliser les phénomènes aléatoires.", niveau: "Intermédiaire" as const },
      { nom: "Régression linéaire", description: "Modélisation de relations entre variables pour la prédiction.", niveau: "Débutant" as const },
      { nom: "Tests d'hypothèses", description: "Tests statistiques (t-test, chi², ANOVA) pour valider des résultats.", niveau: "Intermédiaire" as const },
      { nom: "Analyse en composantes principales", description: "Réduction de dimensionnalité pour visualiser et comprendre les données.", niveau: "Avancé" as const },
      { nom: "Séries temporelles", description: "Analyse de données séquentielles pour la prévision de tendances.", niveau: "Avancé" as const },
      { nom: "Probabilités conditionnelles", description: "Calcul de probabilités dépendantes pour l'analyse de risques.", niveau: "Intermédiaire" as const },
    ],
  },
  {
    icon: Brain, title: "Machine Learning", accent: "#8b5cf6",
    sub: "Descente de gradient · Fonctions de coût · Valeurs propres",
    badge: "Nouveau", badgeColor: "bg-accent",
    notions: [
      { nom: "Descente de gradient", description: "Algorithme d'optimisation itératif pour minimiser les erreurs du modèle.", niveau: "Intermédiaire" as const },
      { nom: "Fonctions de coût", description: "MSE, cross-entropy et autres métriques pour évaluer les performances.", niveau: "Intermédiaire" as const },
      { nom: "Valeurs propres", description: "Décomposition spectrale pour comprendre les transformations linéaires.", niveau: "Avancé" as const },
      { nom: "Régularisation", description: "Techniques L1/L2 pour éviter le surapprentissage des modèles.", niveau: "Avancé" as const },
      { nom: "Calcul vectoriel", description: "Opérations sur les vecteurs pour manipuler les features des données.", niveau: "Débutant" as const },
      { nom: "Théorie de l'information", description: "Entropie et information mutuelle pour la sélection de features.", niveau: "Avancé" as const },
    ],
  },
  {
    icon: Building2, title: "BTP & Architecture", accent: "#f59e0b",
    sub: "Calculs de structure · Volumes · Métrés · Résistance",
    badge: null, badgeColor: "",
    notions: [
      { nom: "Trigonométrie", description: "Calculs d'angles et de distances pour les plans de construction.", niveau: "Débutant" as const },
      { nom: "Calculs de volumes", description: "Volumes de solides (cylindres, prismes) pour le dimensionnement.", niveau: "Débutant" as const },
      { nom: "Résistance des matériaux", description: "Contraintes, déformations et moments pour la solidité des structures.", niveau: "Avancé" as const },
      { nom: "Géométrie dans l'espace", description: "Coordonnées 3D et intersections pour la modélisation architecturale.", niveau: "Intermédiaire" as const },
      { nom: "Calculs de surfaces", description: "Aires et métrés pour l'estimation des coûts de matériaux.", niveau: "Débutant" as const },
      { nom: "Statique des structures", description: "Équilibre des forces et moments dans les bâtiments.", niveau: "Avancé" as const },
    ],
  },
  {
    icon: Sprout, title: "Agriculture & Agronomie", accent: "#22c55e",
    sub: "Surfaces · Rendements · Modèles de croissance",
    badge: null, badgeColor: "",
    notions: [
      { nom: "Calculs de surfaces", description: "Mesure des parcelles et optimisation de l'utilisation des terres.", niveau: "Débutant" as const },
      { nom: "Rendements et proportions", description: "Ratios de production et calculs de rendement par hectare.", niveau: "Débutant" as const },
      { nom: "Modèles de croissance", description: "Fonctions exponentielles et logistiques pour prédire la croissance.", niveau: "Intermédiaire" as const },
      { nom: "Statistiques agricoles", description: "Analyse de variance des récoltes et planification saisonnière.", niveau: "Intermédiaire" as const },
      { nom: "Dosages et mélanges", description: "Proportions pour les engrais, pesticides et solutions nutritives.", niveau: "Débutant" as const },
      { nom: "Hydrologie de base", description: "Calculs de débit et d'irrigation pour la gestion de l'eau.", niveau: "Intermédiaire" as const },
    ],
  },
  {
    icon: Pill, title: "Médecine & Santé", accent: "#ec4899",
    sub: "Dosages · Statistiques médicales · Épidémiologie",
    badge: null, badgeColor: "",
    notions: [
      { nom: "Dosages proportionnels", description: "Calculs de doses médicamenteuses selon le poids et l'âge du patient.", niveau: "Débutant" as const },
      { nom: "Statistiques médicales", description: "Sensibilité, spécificité et valeurs prédictives des tests diagnostiques.", niveau: "Intermédiaire" as const },
      { nom: "Épidémiologie", description: "Taux d'incidence, prévalence et modèles de propagation des maladies.", niveau: "Avancé" as const },
      { nom: "Pharmacocinétique", description: "Modèles mathématiques de l'absorption et élimination des médicaments.", niveau: "Avancé" as const },
      { nom: "Biostatistiques", description: "Essais cliniques, randomisation et analyse de survie.", niveau: "Avancé" as const },
      { nom: "Conversions d'unités", description: "Conversions entre unités médicales (mg/mL, UI, mmol/L).", niveau: "Débutant" as const },
    ],
  },
];

domains.push(
  {
    icon: TrendingUp, title: "Finance & Marchés", accent: "#10b981",
    sub: "Intérêts composés · Options · Risque · Portefeuille",
    badge: "Nouveau", badgeColor: "bg-accent",
    notions: [
      { nom: "Intérêts composés", description: "Capitalisation, actualisation et valeur temps de l'argent.", niveau: "Débutant" as const },
      { nom: "Évaluation d'actifs", description: "Modèles DCF, VAN et TRI pour valoriser projets et entreprises.", niveau: "Intermédiaire" as const },
      { nom: "Théorie du portefeuille", description: "Diversification, frontière efficiente de Markowitz et CAPM.", niveau: "Avancé" as const },
      { nom: "Options et dérivés", description: "Modèle de Black-Scholes et couverture des risques de marché.", niveau: "Avancé" as const },
      { nom: "Mesures de risque", description: "Volatilité, VaR et Expected Shortfall pour gérer l'exposition.", niveau: "Intermédiaire" as const },
      { nom: "Mathématiques actuarielles", description: "Tables de mortalité et calculs de primes d'assurance.", niveau: "Avancé" as const },
    ],
  },
  {
    icon: Landmark, title: "Économie", accent: "#3b82f6",
    sub: "Élasticité · Macro · Optimisation · Théorie des jeux",
    badge: null, badgeColor: "",
    notions: [
      { nom: "Élasticités", description: "Sensibilité de la demande au prix et au revenu.", niveau: "Débutant" as const },
      { nom: "Optimisation sous contrainte", description: "Lagrangiens pour le choix du consommateur et du producteur.", niveau: "Avancé" as const },
      { nom: "Modèles macroéconomiques", description: "IS-LM, croissance de Solow et inflation.", niveau: "Intermédiaire" as const },
      { nom: "Théorie des jeux", description: "Équilibre de Nash et stratégies pour la concurrence et la négociation.", niveau: "Avancé" as const },
      { nom: "Indices économiques", description: "Calcul de l'IPC, du PIB réel et des taux de croissance.", niveau: "Débutant" as const },
      { nom: "Économétrie", description: "Régressions et tests statistiques sur données économiques.", niveau: "Avancé" as const },
    ],
  },
  {
    icon: Banknote, title: "Comptabilité & Gestion", accent: "#64748b",
    sub: "Amortissements · Coûts · Budget · Trésorerie",
    badge: null, badgeColor: "",
    notions: [
      { nom: "Amortissements", description: "Méthodes linéaire et dégressive pour la dépréciation des actifs.", niveau: "Débutant" as const },
      { nom: "Seuil de rentabilité", description: "Coûts fixes, variables et point mort pour piloter une activité.", niveau: "Débutant" as const },
      { nom: "Analyse de marges", description: "Marge brute, nette et contribution par produit ou service.", niveau: "Intermédiaire" as const },
      { nom: "Budget et prévisions", description: "Construction budgétaire et écarts entre prévu et réalisé.", niveau: "Intermédiaire" as const },
      { nom: "Gestion de trésorerie", description: "Plans de trésorerie, BFR et besoins de financement.", niveau: "Intermédiaire" as const },
      { nom: "Ratios financiers", description: "Liquidité, solvabilité et rentabilité pour analyser une entreprise.", niveau: "Intermédiaire" as const },
    ],
  },
  {
    icon: Zap, title: "Énergie & Environnement", accent: "#eab308",
    sub: "Bilans énergétiques · Solaire · Empreinte carbone",
    badge: null, badgeColor: "",
    notions: [
      { nom: "Bilans énergétiques", description: "Conversion et rendement entre formes d'énergie.", niveau: "Intermédiaire" as const },
      { nom: "Dimensionnement solaire", description: "Calcul de panneaux et batteries pour sites isolés en Afrique.", niveau: "Intermédiaire" as const },
      { nom: "Empreinte carbone", description: "Comptabilité CO₂ des activités et produits.", niveau: "Débutant" as const },
      { nom: "Modèles climatiques", description: "Équations différentielles pour la dynamique du climat.", niveau: "Avancé" as const },
      { nom: "Optimisation énergétique", description: "Minimisation de la consommation sous contraintes opérationnelles.", niveau: "Avancé" as const },
      { nom: "Statistiques environnementales", description: "Analyse de séries de mesures de pollution et de qualité de l'air.", niveau: "Intermédiaire" as const },
    ],
  },
  {
    icon: Truck, title: "Logistique & Supply Chain", accent: "#f97316",
    sub: "Tournées · Stocks · Files d'attente · Prévision",
    badge: null, badgeColor: "",
    notions: [
      { nom: "Optimisation de tournées", description: "Problème du voyageur de commerce et algorithmes de routage.", niveau: "Avancé" as const },
      { nom: "Gestion des stocks", description: "Modèles EOQ, point de commande et stock de sécurité.", niveau: "Intermédiaire" as const },
      { nom: "Théorie des files d'attente", description: "Modèles M/M/1 pour entrepôts, ports et centres d'appels.", niveau: "Avancé" as const },
      { nom: "Prévision de la demande", description: "Moyennes mobiles, lissage exponentiel et saisonnalité.", niveau: "Intermédiaire" as const },
      { nom: "Programmation linéaire", description: "Allocation optimale de ressources et planification.", niveau: "Avancé" as const },
      { nom: "KPI logistiques", description: "Taux de service, rotation et délais pour piloter la performance.", niveau: "Débutant" as const },
    ],
  },
  {
    icon: Shield, title: "Cybersécurité & Cryptographie", accent: "#ef4444",
    sub: "Modulo · RSA · Probabilités · Codes correcteurs",
    badge: null, badgeColor: "",
    notions: [
      { nom: "Arithmétique modulaire", description: "Congruences et théorème d'Euler, base de la cryptographie.", niveau: "Intermédiaire" as const },
      { nom: "Cryptographie RSA", description: "Génération de clés, chiffrement et signature numérique.", niveau: "Avancé" as const },
      { nom: "Courbes elliptiques", description: "ECC pour des clés courtes et sécurisées (mobile, IoT).", niveau: "Avancé" as const },
      { nom: "Fonctions de hachage", description: "Propriétés de SHA et résistance aux collisions.", niveau: "Intermédiaire" as const },
      { nom: "Probabilités d'attaque", description: "Estimation des risques de collision et brute force.", niveau: "Intermédiaire" as const },
      { nom: "Codes correcteurs", description: "Codes de Hamming et Reed-Solomon pour la transmission fiable.", niveau: "Avancé" as const },
    ],
  },
  {
    icon: Cpu, title: "Ingénierie & Électronique", accent: "#14b8a6",
    sub: "Signaux · Fourier · Circuits · Automatique",
    badge: null, badgeColor: "",
    notions: [
      { nom: "Nombres complexes", description: "Représentation des signaux et impédances en électronique.", niveau: "Intermédiaire" as const },
      { nom: "Transformée de Fourier", description: "Analyse fréquentielle des signaux audio, image et radio.", niveau: "Avancé" as const },
      { nom: "Équations différentielles", description: "Modélisation des circuits RLC et systèmes dynamiques.", niveau: "Avancé" as const },
      { nom: "Asservissement", description: "Boucles de rétroaction et stabilité en automatique.", niveau: "Avancé" as const },
      { nom: "Algèbre de Boole", description: "Logique combinatoire pour la conception de circuits numériques.", niveau: "Débutant" as const },
      { nom: "Traitement du signal", description: "Filtres numériques et échantillonnage de Shannon.", niveau: "Avancé" as const },
    ],
  },
  {
    icon: GraduationCap, title: "Éducation & Recherche", accent: "#d946ef",
    sub: "Pédagogie · Statistiques · Expérimentation",
    badge: null, badgeColor: "",
    notions: [
      { nom: "Statistiques pour l'enseignement", description: "Évaluation des résultats et analyse des progrès des élèves.", niveau: "Débutant" as const },
      { nom: "Plans d'expérience", description: "Conception d'études comparatives en sciences de l'éducation.", niveau: "Intermédiaire" as const },
      { nom: "Tests psychométriques", description: "Fiabilité, validité et théorie des réponses aux items.", niveau: "Avancé" as const },
      { nom: "Analyse de données qualitatives", description: "Codage et statistiques sur enquêtes et entretiens.", niveau: "Intermédiaire" as const },
      { nom: "Modélisation de l'apprentissage", description: "Courbes d'apprentissage et modèles cognitifs.", niveau: "Avancé" as const },
      { nom: "Échantillonnage", description: "Méthodes pour des enquêtes représentatives en milieu scolaire.", niveau: "Intermédiaire" as const },
    ],
  },
);

const niveauColor = {
  "Débutant": "bg-green-500/10 text-green-700 border-green-500/20",
  "Intermédiaire": "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  "Avancé": "bg-red-500/10 text-red-700 border-red-500/20",
};

const niveauBar = {
  "Débutant": "#22c55e",
  "Intermédiaire": "#eab308",
  "Avancé": "#ef4444",
};

type NiveauFilter = "all" | "Débutant" | "Intermédiaire" | "Avancé";

const totalNotions = domains.reduce((acc, d) => acc + d.notions.length, 0);

const MathsMetier = () => {
  const [expanded, setExpanded] = useState<number>(-1);
  const [niveauFilter, setNiveauFilter] = useState<NiveauFilter>("all");
  const navigate = useNavigate();

  const handleLearn = (domaine: string, notion: string) => {
    navigate(`/notion?domaine=${encodeURIComponent(domaine)}&notion=${encodeURIComponent(notion)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <MathSymbolsBackground variant="light" count={16} opacity={0.05} />
      <Navbar />
      <div className="pt-24 pb-16 relative z-10 flex-1">
        <div className="container mx-auto px-4">
          {/* HERO */}
          <motion.div
            className="relative text-center mb-14 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div
              aria-hidden
              className="absolute inset-x-0 -top-16 h-64 -z-10 blur-3xl opacity-60 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(26,60,110,0.18), transparent 60%)",
              }}
            />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-5 border border-primary/15">
              <Sparkles size={12} />
              {domains.length} domaines · {totalNotions}+ notions
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
              Maths{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Métier
              </span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              Les mathématiques de votre domaine professionnel. Choisissez votre métier et maîtrisez les notions qui font votre expertise.
            </p>
          </motion.div>

          {/* DOMAINS GRID */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto mb-10">
            {domains.map((d, i) => (
              <motion.button
                key={i}
                onClick={() => setExpanded(expanded === i ? -1 : i)}
                className="group text-left bg-card rounded-2xl p-6 border border-border/60 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                style={{
                  boxShadow:
                    expanded === i
                      ? `0 12px 32px -12px ${d.accent}66, 0 0 0 2px ${d.accent}`
                      : "0 4px 16px -8px rgba(15,23,42,0.10)",
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.01 }}
              >
                {/* glow */}
                <div
                  aria-hidden
                  className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-500"
                  style={{ backgroundColor: `${d.accent}33` }}
                />
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center ring-1"
                    style={{
                      backgroundColor: `${d.accent}18`,
                      boxShadow: `inset 0 0 0 1px ${d.accent}33`,
                      color: d.accent,
                    }}
                  >
                    <d.icon size={24} />
                  </div>
                  {d.badge && (
                    <span
                      className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border"
                      style={{
                        color: d.accent,
                        borderColor: `${d.accent}40`,
                        backgroundColor: `${d.accent}10`,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: d.accent }}
                      />
                      {d.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-card-foreground mb-1.5 text-base">
                  {d.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                  {d.sub}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {d.notions.slice(0, 3).map((n) => (
                    <span
                      key={n.nom}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60"
                    >
                      {n.nom}
                    </span>
                  ))}
                </div>
                <span
                  className="text-sm font-semibold inline-flex items-center gap-1 transition-transform group-hover:gap-2"
                  style={{ color: d.accent }}
                >
                  {expanded === i ? "Masquer" : "Explorer"}{" "}
                  <ArrowRight size={14} />
                </span>
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {expanded >= 0 && (
              <motion.div
                key={expanded}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35 }}
                className="max-w-6xl mx-auto"
              >
                <div
                  className="bg-card rounded-2xl shadow-card p-6 md:p-8 border"
                  style={{ borderColor: `${domains[expanded].accent}30` }}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{
                          backgroundColor: `${domains[expanded].accent}18`,
                          color: domains[expanded].accent,
                        }}
                      >
                        {(() => {
                          const Icon = domains[expanded].icon;
                          return <Icon size={22} />;
                        })()}
                      </div>
                      <div>
                        <h2 className="text-lg md:text-xl font-bold text-card-foreground leading-tight">
                          {domains[expanded].title}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {domains[expanded].notions.length} notions à explorer
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(["all", "Débutant", "Intermédiaire", "Avancé"] as NiveauFilter[]).map(
                        (lvl) => {
                          const active = niveauFilter === lvl;
                          return (
                            <button
                              key={lvl}
                              onClick={() => setNiveauFilter(lvl)}
                              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                                active
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                              }`}
                            >
                              {lvl === "all" ? "Tous niveaux" : lvl}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {domains[expanded].notions
                      .filter((n) => niveauFilter === "all" || n.niveau === niveauFilter)
                      .map((notion, j) => (
                      <motion.div
                        key={j}
                        className="group bg-background rounded-xl p-5 flex flex-col gap-3 border border-border hover:shadow-md hover:-translate-y-0.5 transition-all relative overflow-hidden"
                        style={{
                          borderLeft: `3px solid ${niveauBar[notion.niveau]}`,
                        }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: j * 0.04 }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-card-foreground text-sm leading-snug">
                            {notion.nom}
                          </h3>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${niveauColor[notion.niveau]}`}>
                            {notion.niveau}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                          {notion.description}
                        </p>
                        <button
                          onClick={() => handleLearn(domains[expanded].title, notion.nom)}
                          className="mt-auto text-xs font-semibold inline-flex items-center gap-1 self-start transition-all group-hover:gap-2"
                          style={{ color: domains[expanded].accent }}
                        >
                          <BookOpen size={14} className="transition-transform group-hover:rotate-6" />
                          Apprendre cette notion
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-6xl mx-auto mt-14"
          >
            <div
              className="relative overflow-hidden rounded-2xl p-8 md:p-10 text-primary-foreground"
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)",
              }}
            >
              <div
                aria-hidden
                className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-white/10 blur-3xl"
              />
              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold mb-2">
                    Votre métier n'est pas listé ?
                  </h3>
                  <p className="text-sm md:text-base opacity-90 max-w-xl">
                    Demandez à Amara, votre tutrice IA, de vous expliquer n'importe quelle notion mathématique liée à votre activité.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/chat")}
                  className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-5 py-3 rounded-xl hover:bg-white/90 transition shadow-lg whitespace-nowrap"
                >
                  <MessageSquare size={18} />
                  Demander à Amara
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MathsMetier;
