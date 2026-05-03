import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_TEXT = 12000;

async function extractPdf(buf: ArrayBuffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("https://esm.sh/unpdf@0.12.1");
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: true });
  return typeof text === "string" ? text : (text as string[]).join("\n\n");
}

async function extractDocx(buf: ArrayBuffer): Promise<string> {
  // DOCX = ZIP. Extract word/document.xml and strip tags.
  const { unzipSync, strFromU8 } = await import("https://esm.sh/fflate@0.8.2");
  const files = unzipSync(new Uint8Array(buf));
  const docXml = files["word/document.xml"];
  if (!docXml) return "";
  const xml = strFromU8(docXml);
  // Replace paragraph breaks, then strip tags
  const text = xml
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<w:br\/>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return text;
}

async function extractImage(buf: ArrayBuffer, mimeType: string): Promise<string> {
  // Use Gemini vision via Lovable AI Gateway to OCR / describe the image
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  const dataUrl = `data:${mimeType};base64,${b64}`;
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Décris cette image en français de manière détaillée et transcris fidèlement TOUT texte ou expression mathématique présent (formules, équations, énoncé de problème). Si c'est un exercice de maths, restitue intégralement l'énoncé. Réponds en texte brut." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });
  if (!r.ok) {
    console.error("Vision error:", r.status, await r.text());
    return "[Image non analysable]";
  }
  const data = await r.json();
  return data.choices?.[0]?.message?.content || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: "Aucun fichier" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "Fichier trop volumineux (max 10 MB)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const name = file.name.toLowerCase();
    const buf = await file.arrayBuffer();
    let text = "";

    if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) {
      text = new TextDecoder().decode(buf);
    } else if (name.endsWith(".pdf") || file.type === "application/pdf") {
      text = await extractPdf(buf);
    } else if (name.endsWith(".docx") || file.type.includes("wordprocessingml")) {
      text = await extractDocx(buf);
    } else if (file.type.startsWith("image/")) {
      text = await extractImage(buf, file.type);
    } else {
      return new Response(JSON.stringify({ error: "Format non supporté. Formats acceptés : PDF, DOCX, TXT, image." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    text = text.trim();
    if (text.length > MAX_TEXT) text = text.slice(0, MAX_TEXT) + "\n\n[...contenu tronqué...]";

    return new Response(JSON.stringify({ name: file.name, text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-file error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
