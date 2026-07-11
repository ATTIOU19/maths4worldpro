import { useState, ReactNode } from "react";
import { Maximize2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function ZoomableFigure({
  title,
  children,
  renderZoomed,
}: {
  title?: string;
  children: ReactNode;
  /** Optional custom renderer used in the fullscreen dialog. Falls back to `children`. */
  renderZoomed?: (open: boolean) => ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            aria-label="Agrandir"
            title="Agrandir"
            className="absolute top-2 right-2 z-20 p-2 rounded-lg bg-background/80 hover:bg-background border border-border shadow-sm backdrop-blur transition-colors"
          >
            <Maximize2 size={16} className="text-foreground" />
          </button>
        </DialogTrigger>
        {children}
        <DialogContent className="max-w-[96vw] w-[96vw] h-[92vh] p-4 sm:p-6 flex flex-col gap-3 sm:rounded-xl">
          {title && (
            <h3 className="text-base font-semibold text-foreground pr-10 tracking-tight">
              {title}
            </h3>
          )}
          <div className="flex-1 min-h-0 w-full overflow-hidden rounded-lg bg-background">
            {renderZoomed ? renderZoomed(open) : children}
          </div>
          <p className="sr-only">Appuyez sur Échap pour fermer</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { X };