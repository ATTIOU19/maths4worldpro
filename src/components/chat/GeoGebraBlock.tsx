import { useEffect, useRef, useId } from "react";

declare global {
  interface Window {
    GGBApplet?: any;
  }
}

export type GeoGebraData = {
  title?: string;
  code: string;
};

/**
 * Parse a GeoGebra command string of the form:
 *   "A=(0,0); B=(2,0); C=(2,2); D=(0,2); Polygon(A,B,C,D)"
 * Returns the array of individual commands (split on `;` or newline).
 */
function splitCommands(code: string): string[] {
  return code
    .split(/[;\n]/)
    .map((c) => c.trim())
    .filter(Boolean);
}

export function GeoGebraBlock({ data }: { data: GeoGebraData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const idRef = useRef(`ggb-${reactId}`);

  useEffect(() => {
    if (!containerRef.current || !window.GGBApplet) return;
    const id = idRef.current;
    let appletReady = false;
    let cancelled = false;
    let apiRef: any = null;

    const computeSize = () => {
      const w = containerRef.current?.clientWidth || 800;
      const isMobile = w < 640;
      return { w, h: isMobile ? 380 : 560 };
    };
    const initial = computeSize();

    const params = {
      appName: "graphing",
      width: initial.w,
      height: initial.h,
      showToolBar: false,
      showAlgebraInput: false,
      showMenuBar: false,
      showResetIcon: false,
      enableLabelDrags: true,
      enableShiftDragZoom: true,
      enableRightClick: false,
      showZoomButtons: false,
      showGrid: true,
      showLogo: false,
      borderColor: "transparent",
      perspective: "G",
      capturingThreshold: null,
      errorDialogsActive: false,
      useBrowserForJS: false,
      showFullscreenButton: true,
      appletOnLoad: (api: any) => {
        if (cancelled) return;
        appletReady = true;
        apiRef = api;
        try {
          api.reset();
          try {
            api.setGridVisible(true);
            api.setAxesVisible(true, true);
            // Set default coord system FIRST so functions render in view
            api.setCoordSystem(-10, 10, -6, 6);
          } catch {}
          for (const cmd of splitCommands(data.code)) {
            try {
              api.evalCommand(cmd);
            } catch (err) {
              console.warn("GeoGebra command failed:", cmd, err);
            }
          }
          // Style every constructed object + compute fit window from points
          let xs: number[] = [];
          let ys: number[] = [];
          let hasFunction = false;
          try {
            const names: string[] = api.getAllObjectNames() || [];
            for (const name of names) {
              const type = api.getObjectType(name);
              try {
                if (type === "function" || type === "curve") {
                  hasFunction = true;
                  api.setColor(name, 26, 60, 110);
                  api.setLineThickness(name, 8);
                  api.setLineStyle(name, 0);
                } else if (type === "line" || type === "segment" || type === "conic") {
                  api.setColor(name, 26, 60, 110);
                  api.setLineThickness(name, 7);
                } else if (type === "polygon") {
                  api.setColor(name, 26, 60, 110);
                  api.setLineThickness(name, 6);
                  try { api.setFilling(name, 0.2); } catch {}
                } else if (type === "point") {
                  api.setColor(name, 42, 139, 203);
                  api.setPointSize(name, 7);
                  api.setLabelVisible(name, true);
                  try {
                    const x = api.getXcoord(name);
                    const y = api.getYcoord(name);
                    if (Number.isFinite(x) && Number.isFinite(y)) {
                      xs.push(x); ys.push(y);
                    }
                  } catch {}
                }
              } catch {}
            }
          } catch {}

          // Cadrage : si on a des points, on les englobe avec marge ; sinon fenêtre par défaut
          try {
            if (xs.length > 0) {
              const minX = Math.min(...xs), maxX = Math.max(...xs);
              const minY = Math.min(...ys), maxY = Math.max(...ys);
              const padX = Math.max(1, (maxX - minX) * 0.3);
              const padY = Math.max(1, (maxY - minY) * 0.3);
              api.setCoordSystem(minX - padX, maxX + padX, minY - padY, maxY + padY);
            } else if (!hasFunction) {
              api.setCoordSystem(-6, 6, -6, 6);
            }
            // sinon : on garde [-10,10]×[-6,6] pour les fonctions
          } catch {}
        } catch (err) {
          console.error("GeoGebra init error:", err);
        }
      },
    };

    const applet = new window.GGBApplet(params, true);
    containerRef.current.innerHTML = `<div id="${id}"></div>`;
    applet.inject(id);

    // Resize on container width change
    const ro = new ResizeObserver(() => {
      if (!apiRef || !containerRef.current) return;
      const { w, h } = computeSize();
      try { apiRef.setSize(w, h); } catch {}
    });
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      cancelled = true;
      ro.disconnect();
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [data.code]);

  return (
    <div ref={wrapperRef} className="my-4 p-3 rounded-2xl border border-border bg-card shadow-lg ggb-wrapper">
      {data.title && (
        <h4 className="text-base font-semibold text-foreground mb-3 text-center tracking-tight">{data.title}</h4>
      )}
      <div ref={containerRef} className="w-full overflow-hidden rounded-xl ggb-container" style={{ background: "#FFFFFF" }} />
      <p className="text-[11px] text-muted-foreground text-center mt-2">
        Figure interactive — déplacez les points pour explorer
      </p>
    </div>
  );
}
