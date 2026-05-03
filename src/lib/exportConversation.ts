import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

export type ExportMsg = { role: "user" | "assistant" | "ai"; content: string };

const roleLabel = (r: string) => (r === "user" ? "Vous" : "Amara");

function toMarkdown(title: string, msgs: ExportMsg[]): string {
  const date = new Date().toLocaleString("fr-FR");
  const head = `# ${title}\n\n_Exporté le ${date} — MATHS4WORLD_\n\n---\n\n`;
  return head + msgs.map((m) => `## ${roleLabel(m.role)}\n\n${m.content}\n`).join("\n---\n\n");
}

function toPlainText(title: string, msgs: ExportMsg[]): string {
  const date = new Date().toLocaleString("fr-FR");
  return `${title}\nExporté le ${date} — MATHS4WORLD\n\n` +
    msgs.map((m) => `[${roleLabel(m.role)}]\n${m.content}\n`).join("\n");
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

export function exportAsPdf(title: string, msgs: ExportMsg[], filename = "conversation.pdf") {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = pageW - margin * 2;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, margin, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Exporté le ${new Date().toLocaleString("fr-FR")} — MATHS4WORLD`, margin, y);
  y += 18;
  doc.setTextColor(0);
  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 14;

  for (const m of msgs) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(m.role === "user" ? 30 : 26);
    if (y > pageH - margin - 30) { doc.addPage(); y = margin; }
    doc.text(roleLabel(m.role), margin, y);
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40);
    const lines = doc.splitTextToSize(m.content || "", maxW);
    for (const line of lines) {
      if (y > pageH - margin) { doc.addPage(); y = margin; }
      doc.text(line, margin, y);
      y += 13;
    }
    y += 8;
  }
  doc.save(filename);
}

export async function exportAsDocx(title: string, msgs: ExportMsg[], filename = "conversation.docx") {
  const children: Paragraph[] = [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(title)] }),
    new Paragraph({ children: [new TextRun({ text: `Exporté le ${new Date().toLocaleString("fr-FR")} — MATHS4WORLD`, italics: true, size: 18 })] }),
    new Paragraph({ children: [new TextRun("")] }),
  ];
  for (const m of msgs) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(roleLabel(m.role))] }));
    for (const line of (m.content || "").split("\n")) {
      children.push(new Paragraph({ children: [new TextRun(line)] }));
    }
    children.push(new Paragraph({ children: [new TextRun("")] }));
  }
  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, filename);
}
