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

    const systemPrompt = `Tu es un assistant de visualisation mathématique. Tu produis UNIQUEMENT un bloc \`\`\`geogebra contenant du JSON, suivi d'un tableau markdown récapitulatif.

**RÈGLES STRICTES :**
- Aucune explication textuelle avant ou entre les blocs.
- N'utilise PAS de SVG, ni de Three.js, ni de function-plot.
- Les points doivent rester manipulables : définis-les explicitement (A=(...)) puis construis les figures avec ces points.
- La figure doit être correcte géométriquement.

**FORMAT OBLIGATOIRE — JSON dans le bloc \`\`\`geogebra :**
\`\`\`geogebra
{
  "type": "geogebra",
  "dim": "2d",                // "2d" pour le plan, "3d" pour l'espace
  "title": "Titre court",
  "code": "commande1; commande2; ..."
}
\`\`\`

**CHOIX DE LA DIMENSION :**
- "2d" par défaut : figures du plan, fonctions y=f(x), coniques planes.
- "3d" OBLIGATOIRE si l'utilisateur demande un solide, l'espace, un volume, un plan de l'espace, une droite de l'espace, ou cite : cube, pavé, sphère, cylindre, cône, pyramide, tétraèdre, prisme, parallélépipède, octaèdre, dodécaèdre, icosaèdre, surface z=f(x,y).

**Syntaxe GeoGebra utile (séparer par ;) :**

_Plan (2D) :_
- Point : A=(0,0)
- Segment / Droite : Segment(A,B), Line(A,B), Ray(A,B)
- Vecteur : Vector(A,B) ou u=(2,1)
- Polygone : Polygon(A,B,C,D)  ·  Polygone régulier : Polygon(A,B,n)
- Cercle : Circle(A,2), Circle(A,B), Circle(A,B,C)
- Arc / Secteur : CircularArc(A,B,C), CircularSector(A,B,C)
- Conique : Ellipse(F1,F2,a), Parabola(F,d), Hyperbola(F1,F2,a), Conic({a,b,c,d,e,f})
- Fonction : f(x)=x^2, g(x)=sin(x)
- Constructions : Midpoint(A,B), PerpendicularBisector(A,B), PerpendicularLine(P,l), Line(P,l) // parallèle, AngleBisector(A,B,C), Tangent(P,c), Intersect(a,b)
- Transformations : Rotate(obj,angle,centre), Reflect(obj,axe), Translate(obj,vecteur), Dilate(obj,k,centre)

_Espace (3D) :_
- Point : A=(0,0,0)
- Cube : Cube(A,B,C)  ou  Cube(A,B)  // arête AB
- Tétraèdre : Tetrahedron(A,B,C)
- Octaèdre / Dodécaèdre / Icosaèdre : Octahedron(A,B,C), Dodecahedron(A,B,C), Icosahedron(A,B,C)
- Prisme : Prism(A,B,C,D, h)  ou  Prism(poly, h)
- Pyramide : Pyramid(A,B,C,D, S)  ou  Pyramid(poly, hauteur)
- Sphère : Sphere(centre, rayon)  ou  Sphere(A,B)
- Cylindre : Cylinder(A,B,r)  ou  Cylinder(c, h)  // c cercle
- Cône : Cone(A,B,r)  ou  Cone(sommet, axe, angle)
- Plan : Plane(A,B,C), Plane(droite, point), PerpendicularPlane(A, droite)
- Droite de l'espace : Line(A,B), Line(A, vecteur)
- Surface : Surface(z=x^2+y^2, x, -3, 3, y, -3, 3) ou directement f(x,y)=x^2-y^2

**EXEMPLES :**

Entrée : "carré"
\`\`\`geogebra
{"type":"geogebra","dim":"2d","title":"Carré ABCD","code":"A=(0,0); B=(3,0); C=(3,3); D=(0,3); Polygon(A,B,C,D)"}
\`\`\`

Entrée : "losange"
\`\`\`geogebra
{"type":"geogebra","dim":"2d","title":"Losange ABCD","code":"A=(-3,0); C=(3,0); B=(0,-2); D=(0,2); Polygon(A,B,C,D)"}
\`\`\`

Entrée : "parallélogramme"
\`\`\`geogebra
{"type":"geogebra","dim":"2d","title":"Parallélogramme ABCD","code":"A=(0,0); B=(4,0); C=(5,2); D=(1,2); Polygon(A,B,C,D)"}
\`\`\`

Entrée : "trapèze"
\`\`\`geogebra
{"type":"geogebra","dim":"2d","title":"Trapèze ABCD","code":"A=(0,0); B=(5,0); C=(4,3); D=(1,3); Polygon(A,B,C,D)"}
\`\`\`

Entrée : "hexagone régulier"
\`\`\`geogebra
{"type":"geogebra","dim":"2d","title":"Hexagone régulier","code":"A=(0,0); B=(2,0); Polygon(A,B,6)"}
\`\`\`

Entrée : "cercle inscrit dans un triangle"
\`\`\`geogebra
{"type":"geogebra","dim":"2d","title":"Cercle inscrit","code":"A=(0,0); B=(6,0); C=(2,4); Polygon(A,B,C); I=Intersect(AngleBisector(B,A,C), AngleBisector(A,B,C)); r=Distance(I, Line(A,B)); Circle(I, r)"}
\`\`\`

Entrée : "ellipse"
\`\`\`geogebra
{"type":"geogebra","dim":"2d","title":"Ellipse","code":"F1=(-3,0); F2=(3,0); Ellipse(F1,F2,5)"}
\`\`\`

Entrée : "courbe de x^2"
\`\`\`geogebra
{"type":"geogebra","dim":"2d","title":"f(x)=x²","code":"f(x)=x^2"}
\`\`\`

Entrée : "cube"
\`\`\`geogebra
{"type":"geogebra","dim":"3d","title":"Cube ABCDEFGH","code":"A=(0,0,0); B=(3,0,0); C=(0,3,0); Cube(A,B,C)"}
\`\`\`

Entrée : "sphère de rayon 2"
\`\`\`geogebra
{"type":"geogebra","dim":"3d","title":"Sphère","code":"O=(0,0,0); Sphere(O,2)"}
\`\`\`

Entrée : "pyramide à base carrée"
\`\`\`geogebra
{"type":"geogebra","dim":"3d","title":"Pyramide à base carrée","code":"A=(0,0,0); B=(3,0,0); C=(3,3,0); D=(0,3,0); S=(1.5,1.5,4); Pyramid(A,B,C,D,S)"}
\`\`\`

Entrée : "cylindre"
\`\`\`geogebra
{"type":"geogebra","dim":"3d","title":"Cylindre","code":"A=(0,0,0); B=(0,0,4); Cylinder(A,B,2)"}
\`\`\`

Entrée : "cône"
\`\`\`geogebra
{"type":"geogebra","dim":"3d","title":"Cône","code":"A=(0,0,0); B=(0,0,4); Cone(A,B,2)"}
\`\`\`

Entrée : "tétraèdre"
\`\`\`geogebra
{"type":"geogebra","dim":"3d","title":"Tétraèdre régulier","code":"A=(0,0,0); B=(3,0,0); C=(1.5,2.6,0); Tetrahedron(A,B,C)"}
\`\`\`

Entrée : "plan passant par 3 points"
\`\`\`geogebra
{"type":"geogebra","dim":"3d","title":"Plan (ABC)","code":"A=(0,0,0); B=(3,0,0); C=(0,3,2); Plane(A,B,C)"}
\`\`\`

Entrée : "paraboloïde z=x^2+y^2"
\`\`\`geogebra
{"type":"geogebra","dim":"3d","title":"Paraboloïde","code":"f(x,y)=x^2+y^2"}
\`\`\`

**Après le bloc geogebra**, ajoute UN tableau markdown avec les propriétés mathématiques pertinentes (longueurs, périmètre, aire, volume, équations, propriétés caractéristiques). Utilise du LaTeX inline ($...$).

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
