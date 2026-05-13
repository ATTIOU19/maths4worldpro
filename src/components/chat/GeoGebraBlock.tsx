import { useEffect, useRef, useId } from "react";

declare global {
  interface Window {
    GGBApplet?: any;
  }
}

export type GeoGebraData = {
  title?: string;
  code: string;
  dim?: "2d" | "3d";
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
    const is3D = data.dim === "3d";
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
      appName: is3D ? "3d" : "graphing",
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
      perspective: is3D ? "T" : "G",
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
            // Set default 2D coord system; 3D laisse GeoGebra gérer la caméra
            if (!is3D) api.setCoordSystem(-10, 10, -6, 6);
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
          let hasComplexConic = false;
          const extend = (x: number, y: number) => {
            if (Number.isFinite(x) && Number.isFinite(y)) { xs.push(x); ys.push(y); }
          };
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
                  if (type === "conic") {
                    // Try to parse circle equation: x² + y² = r²,  (x - a)² + (y - b)² = r²
                    try {
                      const eq: string = api.getValueString(name) || "";
                      const norm = eq.replace(/²/g, "^2").replace(/\s+/g, "");
                      // (x-a)^2+(y-b)^2=r^2
                      let m = norm.match(/\(x([+\-][\d.]+)\)\^2\+\(y([+\-][\d.]+)\)\^2=([\d.]+)/);
                      if (m) {
                        const a = -parseFloat(m[1]);
                        const b = -parseFloat(m[2]);
                        const r = Math.sqrt(parseFloat(m[3]));
                        extend(a - r, b - r); extend(a + r, b + r);
                      } else {
                        // x^2+y^2=r^2
                        m = norm.match(/x\^2\+y\^2=([\d.]+)/);
                        if (m) {
                          const r = Math.sqrt(parseFloat(m[1]));
                          extend(-r, -r); extend(r, r);
                        } else {
                          hasComplexConic = true;
                        }
                      }
                    } catch { hasComplexConic = true; }
                  }
                } else if (type === "polygon") {
                  api.setColor(name, 26, 60, 110);
                  api.setLineThickness(name, 6);
                  try { api.setFilling(name, 0.2); } catch {}
                } else if (type === "polyhedron" || type === "quadric" || type === "surface" || type === "plane") {
                  api.setColor(name, 26, 60, 110);
                  try { api.setFilling(name, 0.25); } catch {}
                  try { api.setLineThickness(name, 5); } catch {}
                } else if (type === "point") {
                  api.setColor(name, 42, 139, 203);
                  api.setPointSize(name, 7);
                  api.setLabelVisible(name, true);
                  try {
                    const x = api.getXcoord(name);
                    const y = api.getYcoord(name);
                    extend(x, y);
                  } catch {}
                }
              } catch {}
            }
          } catch {}

          // Cadrage 2D : englobe TOUS les objets (points + cercles), avec ratio raisonnable
          if (!is3D) try {
            if (hasComplexConic && xs.length === 0) {
              api.setCoordSystem(-10, 10, -8, 8);
            } else if (xs.length > 0) {
              const minX = Math.min(...xs), maxX = Math.max(...xs);
              const minY = Math.min(...ys), maxY = Math.max(...ys);
              let padX = Math.max(1, (maxX - minX) * 0.2);
              let padY = Math.max(1, (maxY - minY) * 0.2);
              let x1 = minX - padX, x2 = maxX + padX;
              let y1 = minY - padY, y2 = maxY + padY;
              // Ratio garde-fou : éviter une bande trop aplatie
              const w = x2 - x1, h = y2 - y1;
              if (h < w * 0.4) {
                const cy = (y1 + y2) / 2, half = (w * 0.4) / 2;
                y1 = cy - half; y2 = cy + half;
              } else if (w < h * 0.4) {
                const cx = (x1 + x2) / 2, half = (h * 0.4) / 2;
                x1 = cx - half; x2 = cx + half;
              }
              api.setCoordSystem(x1, x2, y1, y2);
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
  }, [data.code, data.dim]);

  return (
    <div ref={wrapperRef} className="my-4 p-3 rounded-2xl border border-border bg-card shadow-lg ggb-wrapper">
      {data.title && (
        <h4 className="text-base font-semibold text-foreground mb-3 text-center tracking-tight">{data.title}</h4>
      )}
      <div ref={containerRef} className="w-full overflow-hidden rounded-xl ggb-container" style={{ background: "#FFFFFF" }} />
      <p className="text-[11px] text-muted-foreground text-center mt-2">
        {is3DLabel(data.dim)}
      </p>
    </div>
  );
}

function is3DLabel(dim?: "2d" | "3d") {
  return dim === "3d"
    ? "Figure 3D interactive — faites glisser pour faire pivoter"
    : "Figure interactive — déplacez les points pour explorer";
}
