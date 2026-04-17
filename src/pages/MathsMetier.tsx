import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, BarChart3, Brain, Building2, Sprout, Pill, ArrowRight, BookOpen } from "lucide-react";
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
    icon: Bot, title: "Intelligence Artificielle",
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
    icon: BarChart3, title: "Data Science",
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
    icon: Brain, title: "Machine Learning",
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
    icon: Building2, title: "BTP & Architecture",
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
    icon: Sprout, title: "Agriculture & Agronomie",
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
    icon: Pill, title: "Médecine & Santé",
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

const niveauColor = {
  "Débutant": "bg-green-500/10 text-green-700 border-green-500/20",
  "Intermédiaire": "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  "Avancé": "bg-red-500/10 text-red-700 border-red-500/20",
};

const MathsMetier = () => {
  const [expanded, setExpanded] = useState<number>(-1);
  const navigate = useNavigate();

  const handleLearn = (domaine: string, notion: string) => {
    const prompt = `Explique-moi la notion "${notion}" dans le contexte du domaine "${domaine}". Donne des exemples concrets liés à ce métier.`;
    navigate(`/chat?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <MathSymbolsBackground variant="light" count={16} opacity={0.05} />
      <Navbar />
      <div className="pt-24 pb-16 relative z-10">
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

          <AnimatePresence>
            {expanded >= 0 && (
              <motion.div
                key={expanded}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="max-w-5xl mx-auto"
              >
                <div className="bg-card rounded-2xl shadow-card p-8">
                  <h2 className="text-xl font-bold text-card-foreground mb-6">
                    Notions mathématiques pour {domains[expanded].title}
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {domains[expanded].notions.map((notion, j) => (
                      <motion.div
                        key={j}
                        className="bg-muted/50 rounded-xl p-5 flex flex-col gap-3 border border-border"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: j * 0.05 }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-card-foreground text-sm">{notion.nom}</h3>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${niveauColor[notion.niveau]}`}>
                            {notion.niveau}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                          {notion.description}
                        </p>
                        <button
                          onClick={() => handleLearn(domains[expanded].title, notion.nom)}
                          className="mt-auto text-xs font-semibold text-secondary inline-flex items-center gap-1 hover:underline self-start"
                        >
                          <BookOpen size={14} /> Apprendre cette notion
                        </button>
                      </motion.div>
                    ))}
                  </div>
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
