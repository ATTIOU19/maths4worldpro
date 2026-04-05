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

    const systemPrompt = `Tu es un assistant de visualisation mathématique expert. L'utilisateur te décrit ce qu'il veut visualiser (courbe, histogramme, aire, etc.) et tu dois répondre avec:

1. Un bloc \`\`\`chart avec les données JSON pour tracer le graphique interactif.
2. Un tableau markdown récapitulatif avec les valeurs clés, propriétés et détails importants.
3. Une brève explication des caractéristiques visibles sur le graphique.

**FORMAT DU BLOC CHART (OBLIGATOIRE) :**
\`\`\`chart
{
  "type": "line",
  "title": "Titre du graphique",
  "xLabel": "x",
  "yLabel": "f(x)",
  "data": [{"x": -3, "y": 9}, {"x": -2, "y": 4}, ...],
  "series": [{"key": "y", "name": "f(x) = x²"}]
}
\`\`\`

Types disponibles : "line" (courbes), "bar" (barres), "area" (aires).
Pour plusieurs courbes, utilise plusieurs clés dans data et series.

**RÈGLES CRITIQUES :**
- Génère TOUJOURS au moins 15-20 points de données pour des courbes lisses.
- Pour les fonctions, calcule les vraies valeurs numériques (pas d'approximation).
- Utilise le format LaTeX pour les formules : $...$ en ligne, $$...$$ en bloc.
- Le tableau markdown DOIT inclure : domaine, image, asymptotes, points remarquables, monotonie, limites.
- Réponds TOUJOURS en français.
- Utilise des emojis pour rendre vivant.
- CHAQUE réponse doit contenir au minimum UN bloc \`\`\`chart\`\`\` et UN tableau markdown.

**Exemple de tableau attendu :**
| Propriété | Valeur |
|-----------|--------|
| Fonction | $f(x) = e^{x^2}$ |
| Domaine | $\\mathbb{R}$ |
| Image | $[1, +\\infty[$ |
| Minimum | $(0, 1)$ |
| Parité | Paire |
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
