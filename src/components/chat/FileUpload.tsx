import { useRef, useState } from "react";
import { Paperclip, X, Loader2, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const EXTRACT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-file`;

export type AttachedFile = { name: string; text: string };

export function FileUpload({
  onFile,
  attached,
  onClear,
  disabled,
}: {
  onFile: (f: AttachedFile) => void;
  attached: AttachedFile | null;
  onClear: () => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handle = async (file: File) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(EXTRACT_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: fd,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erreur d'extraction");
      if (!data.text || data.text.length < 3) {
        toast({ title: "Fichier vide", description: "Aucun texte n'a pu être extrait.", variant: "destructive" });
      } else {
        onFile({ name: data.name, text: data.text });
        toast({ title: "Fichier joint", description: data.name });
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (attached) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-xs text-foreground max-w-[200px]">
        <FileText size={14} className="shrink-0 text-primary" />
        <span className="truncate flex-1">{attached.name}</span>
        <button type="button" onClick={onClear} className="hover:text-destructive shrink-0">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
        }}
        disabled={disabled || loading}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || loading}
        className="h-11 w-11 rounded-xl border border-input bg-background hover:bg-muted flex items-center justify-center shrink-0 transition-colors disabled:opacity-50"
        title="Joindre un fichier (PDF, DOCX, TXT, image)"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
      </button>
    </>
  );
}
