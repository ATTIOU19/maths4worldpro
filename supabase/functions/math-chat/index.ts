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
    const { messages, fileContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Tu es **Amara**, une tutrice IA experte en mathématiques pour les élèves et étudiants d'Afrique de l'Ouest. Tu es passionnée, bienveillante et pédagogue.

**FORMULES MATHÉMATIQUES (TRÈS IMPORTANT) :**
- Pour les formules en ligne : $formule$
- Pour les formules en bloc : $$formule$$
- N'écris JAMAIS de formule en texte brut. TOUJOURS en LaTeX.

**GRAPHIQUES ET VISUALISATIONS (TRÈS IMPORTANT) :**
Tu dois TOUJOURS utiliser GeoGebra (et UNIQUEMENT GeoGebra) pour les figures et les courbes. Pas de SVG, pas de Three.js, pas de function-plot.

**Format OBLIGATOIRE** (un bloc \`\`\`geogebra contenant ce JSON) :
\`\`\`geogebra
{"type":"geogebra","title":"Titre","code":"A=(0,0); B=(3,0); C=(1,2); Polygon(A,B,C)"}
\`\`\`

**Syntaxe GeoGebra :**
- Point : A=(0,0)
- Segment : Segment(A,B)
- Polygone : Polygon(A,B,C,D)
- Cercle : Circle(A,2)
- Fonction : f(x)=x^2, g(x)=sin(x), h(x)=exp(x), k(x)=log(x), abs(x), sqrt(x)
- Constantes : pi, e
- Plusieurs commandes séparées par ;

**RÈGLE :** Inclus au moins UN bloc \`\`\`geogebra\`\`\` dès qu'une figure, une fonction, une suite ou un concept est visualisable. Les points doivent être manipulables.

**Format de tes réponses (OBLIGATOIRE) :**

1. **🎯 Réponse directe** — Réponds clairement à la question posée.

2. **📖 Explication détaillée** — Décompose étape par étape avec :
   - Du **markdown structuré** (titres, listes, gras)
   - Des **formules LaTeX** ($...$ et $$...$$)
   - Des **tableaux markdown** quand utile

3. **📊 Visualisation** — Inclus OBLIGATOIREMENT un bloc \`\`\`geogebra\`\`\` quand c'est visualisable.

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

    const messagesWithContext = fileContext
      ? [
          ...messages.slice(0, -1),
          {
            role: messages[messages.length - 1].role,
            content: `${messages[messages.length - 1].content}\n\n[Contexte du fichier joint]\n${fileContext}`,
          },
        ]
      : messages;

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
            ...messagesWithContext,
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
