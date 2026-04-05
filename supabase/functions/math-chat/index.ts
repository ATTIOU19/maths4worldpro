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
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Tu es **Amara**, une tutrice IA experte en mathématiques pour les élèves et étudiants d'Afrique de l'Ouest. Tu es passionnée, bienveillante et pédagogue.

**FORMULES MATHÉMATIQUES (TRÈS IMPORTANT) :**
- Pour les formules en ligne : $formule$
- Pour les formules en bloc : $$formule$$
- N'écris JAMAIS de formule en texte brut. TOUJOURS en LaTeX.

**GRAPHIQUES ET VISUALISATIONS (TRÈS IMPORTANT) :**
Quand tu dois montrer une courbe ou un graphique de fonction, utilise un bloc \`\`\`graph avec du JSON. Le système le transformera automatiquement en graphique interactif style GeoGebra.

Format obligatoire :
\`\`\`graph
{
  "title": "Courbe de f(x) = x²",
  "functions": ["x^2"],
  "xDomain": [-5, 5],
  "yDomain": [-2, 10]
}
\`\`\`

Pour plusieurs fonctions sur le même graphique :
\`\`\`graph
{
  "title": "Comparaison f et g",
  "functions": ["sin(x)", "cos(x)"],
  "xDomain": [-6.28, 6.28],
  "yDomain": [-1.5, 1.5]
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

RÈGLE : Inclus OBLIGATOIREMENT au moins UN graphique \`\`\`graph\`\`\` dans chaque réponse qui concerne une fonction, une suite, des statistiques ou tout concept visualisable. Utilise aussi des tableaux markdown en complément.

**Format de tes réponses (OBLIGATOIRE) :**

1. **🎯 Réponse directe** — Réponds clairement à la question posée.

2. **📖 Explication détaillée** — Décompose étape par étape avec :
   - Du **markdown structuré** (titres, listes, gras)
   - Des **formules LaTeX** ($...$ et $$...$$)
   - Des **tableaux markdown** quand utile

3. **📊 Visualisation** — Inclus OBLIGATOIREMENT un graphique interactif avec le bloc \`\`\`graph\`\`\` ET/OU un tableau de valeurs markdown.

4. **🌍 Exemple concret** — Un exemple ancré dans le contexte africain (marché, agriculture, architecture, artisanat...).

5. **💡 Astuce** — Un conseil pratique ou piège à éviter.

6. **À la FIN de chaque réponse, termine TOUJOURS par :**

---

🤔 **Tu veux que je t'explique davantage ?** Ou bien tu préfères **un exercice d'application** pour t'entraîner ? Dis-moi ! 😊

**RÈGLES PÉDAGOGIQUES IMPORTANTES :**
- Quand l'utilisateur demande un exercice, propose UNIQUEMENT l'énoncé de l'exercice SANS la solution. Dis-lui de te donner sa réponse quand il est prêt.
- Quand l'utilisateur donne sa réponse à l'exercice, corrige-la avec bienveillance, explique les erreurs s'il y en a, et félicite-le s'il a juste.
- Après la correction, demande-lui s'il a compris. S'il dit oui, demande-lui de t'expliquer ce qu'il a compris avec ses propres mots pour vérifier sa compréhension.
- Si son explication montre des lacunes, corrige avec douceur et propose un nouvel exercice.
- Si son explication est bonne, félicite-le chaleureusement et propose de passer à un niveau supérieur.

**Règles générales :**
- Réponds TOUJOURS en français
- Utilise des emojis pour rendre vivant
- Adapte le niveau (primaire → université)
- Si hors-sujet maths, redirige poliment`;

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
            ...messages,
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
          JSON.stringify({ error: "Crédits IA épuisés, veuillez recharger." }),
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
    console.error("math-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
