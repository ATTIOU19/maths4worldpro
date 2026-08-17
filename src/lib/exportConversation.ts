import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType } from "docx";
import html2canvas from "html2canvas";

export type ExportMsg = { role: "user" | "assistant" | "ai"; content: string };

const roleLabel = (r: string) => (r === "user" ? "Vous" : "Amara");

/** Remplace les blocs de code de visualisation par une mention lisible. */
function stripVisualBlocks(text: string): string {
  return (text || "")
    .replace(/```(?:graph|chart|geogebra)[\s\S]*?```/gi, "\n> [Visualisation — voir la version PDF ou Word]\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Nettoie la syntaxe Markdown/LaTeX pour un rendu texte lisible. */
function toReadableText(text: string): string {
  return stripVisualBlocks(text)
    .replace(/```[\s\S]*?```/g, (b) => b.replace(/```\w*\n?/g, "").trim())
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1$2")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/\$\$([\s\S]+?)\$\$/g, "$1")
    .replace(/\$([^$\n]+)\$/g, "$1")
    .replace(/\\\(|\\\)|\\\[|\\\]/g, "")
    .replace(/^\s*\|.*\|\s*$/gm, (l) => l.replace(/\|/g, "  ").trim())
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toMarkdown(title: string, msgs: ExportMsg[]): string {
  const date = new Date().toLocaleString("fr-FR");
  const head = `# ${title}\n\n_Exporté le ${date} — MATHS4WORLD_\n\n---\n\n`;
  return head + msgs.map((m) => `## ${roleLabel(m.role)}\n\n${stripVisualBlocks(m.content)}\n`).join("\n---\n\n");
}

function toPlainText(title: string, msgs: ExportMsg[]): string {
  const date = new Date().toLocaleString("fr-FR");
  return `${title}\nExporté le ${date} — MATHS4WORLD\n\n` +
    msgs.map((m) => `${roleLabel(m.role).toUpperCase()}\n${"-".repeat(roleLabel(m.role).length)}\n${toReadableText(m.content)}\n`).join("\n");
}

/* ---------------- Capture visuelle des messages ---------------- */

export type CapturedMsg = { role: string; dataUrl: string; width: number; height: number };

async function waitForRender() {
  try { await (document as any).fonts?.ready; } catch { /* noop */ }
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 120)));
}

async function captureNode(node: HTMLElement): Promise<CapturedMsg["dataUrl"] | null> {
  try {
    const canvas = await html2canvas(node, {
      scale: Math.min(2, window.devicePixelRatio || 1.5),
      backgroundColor: "#FFFFFF",
      useCORS: true,
      logging: false,
      ignoreElements: (el) => (el as HTMLElement).dataset?.exportIgnore === "true",
    });
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

async function captureAll(nodes?: (HTMLElement | null)[]): Promise<(string | null)[]> {
  if (!nodes || nodes.length === 0) return [];
  await waitForRender();
  const out: (string | null)[] = [];
  for (const n of nodes) out.push(n ? await captureNode(n) : null);
  return out;
}

function imageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 1, h: 1 });
    img.src = dataUrl;
  });
}

function dataUrlToUint8(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] || "";
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportAsMarkdown(title: string, msgs: ExportMsg[], filename = "conversation.md") {
  const md = toMarkdown(title, msgs);
  downloadBlob(new Blob([md], { type: "text/markdown;charset=utf-8" }), filename);
}

export function exportAsTxt(title: string, msgs: ExportMsg[], filename = "conversation.txt") {
  downloadBlob(new Blob([toPlainText(title, msgs)], { type: "text/plain;charset=utf-8" }), filename);
}

export async function exportAsPdf(
  title: string,
  msgs: ExportMsg[],
  filename = "conversation.pdf",
  nodes?: (HTMLElement | null)[],
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = pageW - margin * 2;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(title, maxW);
  doc.text(titleLines, margin, y);
  y += 18 * titleLines.length + 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Exporté le ${new Date().toLocaleString("fr-FR")} — MATHS4WORLD`, margin, y);
  y += 18;
  doc.setTextColor(0);
  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 14;

  const shots = await captureAll(nodes);

  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i];
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(m.role === "user" ? 90 : 26);
    if (y > pageH - margin - 30) { doc.addPage(); y = margin; }
    doc.text(roleLabel(m.role), margin, y);
    y += 14;

    const shot = shots[i];
    if (shot) {
      const { w, h } = await imageSize(shot);
      const imgW = maxW;
      let imgH = (h * imgW) / w;
      const usable = pageH - margin * 2;

      if (imgH <= usable) {
        if (y + imgH > pageH - margin) { doc.addPage(); y = margin; }
        doc.addImage(shot, "PNG", margin, y, imgW, imgH);
        y += imgH + 16;
      } else {
        // Découpe verticale sur plusieurs pages
        const scale = imgW / w;
        let srcY = 0;
        while (srcY < h) {
          const availPt = (y === margin ? usable : pageH - margin - y);
          const sliceH = Math.min(h - srcY, availPt / scale);
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = Math.max(1, Math.round(sliceH));
          const ctx = canvas.getContext("2d");
          const img = new Image();
          await new Promise((res) => { img.onload = res; img.onerror = res; img.src = shot; });
          ctx?.drawImage(img, 0, srcY, w, canvas.height, 0, 0, w, canvas.height);
          doc.addImage(canvas.toDataURL("image/png"), "PNG", margin, y, imgW, canvas.height * scale);
          srcY += canvas.height;
          if (srcY < h) { doc.addPage(); y = margin; } else { y += canvas.height * scale + 16; }
        }
        imgH = 0;
      }
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(40);
      const lines = doc.splitTextToSize(toReadableText(m.content), maxW);
      for (const line of lines) {
        if (y > pageH - margin) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += 13;
      }
      y += 10;
    }
  }
  doc.save(filename);
}

export async function exportAsDocx(
  title: string,
  msgs: ExportMsg[],
  filename = "conversation.docx",
  nodes?: (HTMLElement | null)[],
) {
  const shots = await captureAll(nodes);
  const CONTENT_W = 620; // points (largeur utile A4)
  const children: Paragraph[] = [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(title)] }),
    new Paragraph({ children: [new TextRun({ text: `Exporté le ${new Date().toLocaleString("fr-FR")} — MATHS4WORLD`, italics: true, size: 18 })] }),
    new Paragraph({ children: [new TextRun("")] }),
  ];
  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i];
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(roleLabel(m.role))] }));
    const shot = shots[i];
    if (shot) {
      const { w, h } = await imageSize(shot);
      const width = CONTENT_W;
      const height = Math.round((h * width) / w);
      children.push(new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new ImageRun({
          type: "png",
          data: dataUrlToUint8(shot),
          transformation: { width, height },
          altText: { title: roleLabel(m.role), description: "Message exporté", name: `msg-${i}` },
        })],
      }));
    } else {
      for (const line of toReadableText(m.content).split("\n")) {
        children.push(new Paragraph({ children: [new TextRun(line)] }));
      }
    }
    children.push(new Paragraph({ children: [new TextRun("")] }));
  }
  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, filename);
}
