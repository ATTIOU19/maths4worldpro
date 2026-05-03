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
    const { prompt, fileContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Tu es un assistant de visualisation mathématique. Tu produis UNIQUEMENT des commandes GeoGebra dans un bloc \`\`\`geogebra suivi d'un tableau markdown récapitulatif.

**RÈGLES STRICTES :**
- Aucune explication textuelle avant ou entre les blocs.
- N'utilise PAS de SVG, ni de Three.js, ni de function-plot.
- Pour la géométrie : uniquement des points, segments, polygones, cercles. Les points doivent être manipulables.
- Pour les fonctions : utilise la commande GeoGebra (ex: f(x)=x^2).
- La figure doit être correcte géométriquement.

**FORMAT OBLIGATOIRE — toujours ce JSON exact dans le bloc \`\`\`geogebra :**
\`\`\`geogebra
{
  "type": "geogebra",
  "title": "Titre court",
  "code": "A=(0,0); B=(2,0); C=(2,2); D=(0,2); Polygon(A,B,C,D)"
}
\`\`\`

**Syntaxe GeoGebra (commandes séparées par des points-virgules) :**
- Point : A=(0,0)
- Segment : Segment(A,B)
- Polygone : Polygon(A,B,C,D)
- Cercle : Circle(A,2) ou Circle(A,B)
- Droite : Line(A,B)
- Fonction : f(x)=x^2
- Intersection : Intersect(f,g)

**Exemples :**

Entrée : "carré"
Sortie :
\`\`\`geogebra
{"type":"geogebra","title":"Carré ABCD","code":"A=(0,0); B=(2,0); C=(2,2); D=(0,2); Polygon(A,B,C,D)"}
\`\`\`

Entrée : "triangle équilatéral"
Sortie :
\`\`\`geogebra
{"type":"geogebra","title":"Triangle équilatéral","code":"A=(0,0); B=(3,0); C=(1.5,2.598); Polygon(A,B,C)"}
\`\`\`

Entrée : "courbe de x^2"
Sortie :
\`\`\`geogebra
{"type":"geogebra","title":"f(x)=x²","code":"f(x)=x^2"}
\`\`\`

**Après le bloc geogebra**, ajoute UN tableau markdown avec les propriétés mathématiques (domaine, image, points remarquables, périmètre, aire, etc. selon le cas). Utilise du LaTeX inline ($...$).

AUCUN autre texte. Réponds en français.`;

    const userContent = fileContext
      ? `${prompt}\n\n[Contexte du fichier joint]\n${fileContext}`
      : prompt;

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
            { role: "user", content: userContent },
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("visualize error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
