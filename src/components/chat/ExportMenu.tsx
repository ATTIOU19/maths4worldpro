import { useState, useRef, useEffect } from "react";
import { Download } from "lucide-react";
import { exportAsMarkdown, exportAsTxt, exportAsPdf, exportAsDocx, type ExportMsg } from "@/lib/exportConversation";

export function ExportMenu({
  title,
  messages,
  baseFilename = "conversation",
  className = "",
}: {
  title: string;
  messages: ExportMsg[];
  baseFilename?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (messages.length === 0) return null;

  const handle = (fn: () => void | Promise<void>) => async () => {
    setOpen(false);
    await fn();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors ${className}`}
        title="Télécharger la conversation"
      >
        <Download size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-border bg-popover shadow-lg z-50 py-1 text-popover-foreground">
          {[
            { label: "Markdown (.md)", onClick: handle(() => exportAsMarkdown(title, messages, `${baseFilename}.md`)) },
            { label: "Texte (.txt)", onClick: handle(() => exportAsTxt(title, messages, `${baseFilename}.txt`)) },
            { label: "PDF (.pdf)", onClick: handle(() => exportAsPdf(title, messages, `${baseFilename}.pdf`)) },
            { label: "Word (.docx)", onClick: handle(() => exportAsDocx(title, messages, `${baseFilename}.docx`)) },
          ].map((it) => (
            <button
              key={it.label}
              onClick={it.onClick}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
