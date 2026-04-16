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
    const { question, userAnswer, expectedConcept } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: `Tu es un correcteur de mathématiques bienveillant pour des élèves africains. On te donne une question posée par le tuteur, la réponse de l'élève, et le concept attendu.

Évalue si la réponse de l'élève est correcte ou suffisamment proche du concept attendu.

RÈGLES IMPORTANTES :
- Si la réponse finale est mathématiquement correcte, considère-la comme correcte MÊME SI l'élève ne détaille pas chaque étape.
- Sois indulgent sur la notation : 3x^2 = 3x² = 3·x² = 3x2 sont tous équivalents.
- Une réponse courte mais juste (ex: "3x² - 2") est CORRECTE si elle correspond au résultat attendu.
- Sois indulgent sur la formulation textuelle mais exigeant sur le fond mathématique.

Tu DOIS répondre UNIQUEMENT avec un JSON valide, sans aucun texte avant ou après :
{"correct": true/false, "feedback": "ton message d'encouragement ou de correction"}

Si correct : félicite chaleureusement avec des emojis.
Si incorrect : encourage avec bienveillance, donne un indice sans donner la réponse complète.`,
            },
            {
              role: "user",
              content: `Question du tuteur : "${question}"
Réponse de l'élève : "${userAnswer}"
Concept attendu : "${expectedConcept}"`,
            },
          ],
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

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse the JSON from the AI response
    let result;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      console.error("Failed to parse AI response:", content);
      result = { correct: false, feedback: "Je n'ai pas pu évaluer ta réponse. Peux-tu reformuler ? 🤔" };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-answer error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
