import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Tu es un assistant de visualisation mathématique expert. L'utilisateur te décrit ce qu'il veut visualiser et tu dois répondre avec UNIQUEMENT deux éléments, rien d'autre :

1. **UN bloc \`\`\`graph** avec les expressions mathématiques pour tracer le graphique interactif style GeoGebra.
2. **UN tableau markdown** récapitulatif des propriétés mathématiques.

**NE DONNE AUCUNE EXPLICATION TEXTUELLE.** Pas de phrase d'introduction, pas de commentaire, pas de conclusion. UNIQUEMENT le graphique et le tableau.

**FORMAT DU BLOC GRAPH (OBLIGATOIRE) :**
\`\`\`graph
{
  "title": "Titre du graphique",
  "functions": ["x^2"],
  "xDomain": [-5, 5],
  "yDomain": [-2, 10]
}
\`\`\`

**SYNTAXE DES EXPRESSIONS (function-plot) :**
- Puissance : x^2, x^3
- Racine carrée : sqrt(x)
- Exponentielle : exp(x) ou e^x
- Logarithme : log(x) (népérien)
- Trigonométrie : sin(x), cos(x), tan(x)
- Valeur absolue : abs(x)
- Constantes : pi, e
- Combinaisons : sin(x) * exp(-x/5), x^2 - 3*x + 2

Pour plusieurs fonctions :
\`\`\`graph
{
  "title": "Comparaison",
  "functions": ["sin(x)", "cos(x)"],
  "xDomain": [-6.28, 6.28],
  "yDomain": [-1.5, 1.5]
}
\`\`\`

**RÈGLES CRITIQUES :**
- Adapte xDomain et yDomain pour montrer les parties intéressantes de la fonction.
- Utilise LaTeX dans le tableau : $...$ en ligne.
- Le tableau DOIT inclure : fonction, domaine, image, asymptotes, points remarquables, monotonie, limites, parité si applicable.
- Réponds TOUJOURS en français.
- AUCUN texte en dehors du bloc graph et du tableau.

**Exemple de réponse complète attendue :**

\`\`\`graph
{"title":"f(x) = x²","functions":["x^2"],"xDomain":[-5,5],"yDomain":[-2,10]}
\`\`\`

| Propriété | Valeur |
|-----------|--------|
| Fonction | $f(x) = x^2$ |
| Domaine | $\\mathbb{R}$ |
| Image | $[0, +\\infty[$ |
| Minimum | $(0, 0)$ |
| Parité | Paire |
| Monotonie | Décroissante sur $]-\\infty, 0]$, croissante sur $[0, +\\infty[$ |
| Limites | $\\lim_{x \\to \\pm\\infty} f(x) = +\\infty$ |`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, réessayez dans un moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA épuisés." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("visualize error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
