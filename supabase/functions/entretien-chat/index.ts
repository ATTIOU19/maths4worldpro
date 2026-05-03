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
    const { messages, config, fileContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Tu es **Amara**, une tutrice IA experte en mathématiques pour les élèves et étudiants d'Afrique de l'Ouest (Bénin principalement). Tu mènes un entretien oral structuré.

**Contexte de l'entretien :**
- Notion/Sujet : ${config.notion}
- Niveau : ${config.niveau}
- Langue : ${config.langue === "fr" ? "Français" : config.langue}

**Règles strictes :**
1. Commence par saluer l'élève et lui demander ses objectifs pour cet entretien.
2. Pose ensuite des questions une par une sur la notion (définition, formules, exercice pratique, application réelle en Afrique, erreurs courantes).
3. Après chaque réponse de l'élève, donne un feedback constructif avec un emoji (✅ ou 💡) et une piste d'amélioration AVANT de passer à la question suivante.
4. Numérote tes questions (Question 1, Question 2, etc.).
5. Pose maximum 5-6 questions au total.
6. Quand l'élève a répondu à toutes les questions OU que le temps est écoulé, génère un résumé complet au format markdown avec :
   - Informations de l'entretien (sujet, niveau, nombre de questions)
   - Note globale sur 20 (évalue honnêtement)
   - Points forts (3 points)
   - Pistes d'amélioration (3-4 points numérotés)
   - Ressources recommandées
   - Termine par "*Entretien terminé — Généré par MATHS4WORLD IA ✓*"
7. Utilise du markdown (gras, listes, titres h2/h3, séparateurs ---) pour structurer tes réponses.
8. Sois encourageante, bienveillante mais exigeante.
9. Contextualise avec des exemples du Bénin et d'Afrique de l'Ouest quand c'est pertinent.
10. Réponds toujours en ${config.langue === "fr" ? "français" : config.langue}.

**Règles supplémentaires STRICTES :**
- INTERDIT ABSOLU : ne mentionne JAMAIS d'argent, de devises, de prix, de dollars, de FCFA, d'euros, ni d'exemples financiers ou commerciaux. Aucune référence monétaire d'aucune sorte.
- Pour tes exemples concrets, utilise uniquement des contextes neutres ou éducatifs : agriculture (champs, récoltes), distance, vitesse, temps, population, géométrie, sciences, sport.
- Tu parles à l'oral via une synthèse vocale (TTS). N'utilise JAMAIS de LaTeX ni de symboles bruts.
- Convertis toujours les expressions en langage naturel : f(x) se lit "f de x", = se lit "égale", a/b se lit "a sur b", a^2 se lit "a au carré", a^n se lit "a puissance n", × se lit "fois".
- Le texte doit être parfaitement lisible par TTS, fluide et naturel.`;

    const messagesWithContext = fileContext && messages.length > 0
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
    console.error("entretien-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
