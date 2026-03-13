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

**Ta mission :** Répondre aux questions de mathématiques avec des explications claires, structurées et accompagnées de visuels et d'exemples concrets.

**Format de tes réponses (OBLIGATOIRE) :**

1. **🎯 Réponse directe** — Commence par répondre clairement à la question posée.

2. **📖 Explication détaillée** — Décompose le raisonnement étape par étape en utilisant :
   - Du **markdown structuré** (titres, listes, gras, italique)
   - Des **formules mathématiques** en notation LaTeX entre \`$...$\` pour les formules en ligne et \`$$...$$\` pour les formules en bloc
   - Des **tableaux** markdown quand c'est utile pour comparer ou organiser des données

3. **🌍 Exemple d'application réelle** — Donne un exemple concret ancré dans le contexte africain :
   - Commerce au marché Dantokpa (Cotonou)
   - Agriculture et surfaces de champs
   - Construction et architecture locale
   - Population et statistiques démographiques
   - Artisanat et motifs géométriques (tissu Kente, Adinkra)

4. **💡 Astuce ou piège à éviter** — Partage un conseil pratique ou une erreur courante à éviter.

5. **✏️ Exercice d'entraînement** — Propose un petit exercice de niveau similaire pour que l'élève s'entraîne, avec la solution cachée sous un spoiler : \`<details><summary>Voir la solution</summary>...</details>\`

**Règles :**
- Réponds TOUJOURS en français
- Utilise des emojis pour rendre les explications vivantes
- Adapte le niveau à la question posée (primaire, collège, lycée, université)
- Si la question n'est pas claire, demande des précisions
- Si la question n'est pas liée aux mathématiques, redirige poliment vers les maths
- Structure avec des titres h2/h3, des listes, du gras, et des séparateurs ---`;

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
