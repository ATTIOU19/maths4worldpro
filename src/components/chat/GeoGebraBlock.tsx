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
          } catch {}
          for (const cmd of splitCommands(data.code)) {
            try {
              api.evalCommand(cmd);
            } catch (err) {
              console.warn("GeoGebra command failed:", cmd, err);
            }
          }
          // Style every constructed object: thicker primary-colored curves/segments
          try {
            const names: string[] = api.getAllObjectNames() || [];
            for (const name of names) {
              const type = api.getObjectType(name);
              try {
                if (type === "function" || type === "line" || type === "segment" || type === "conic" || type === "curve" || type === "polygon") {
                  api.setColor(name, 26, 60, 110); // primary #1A3C6E
                  api.setLineThickness(name, 6);
                } else if (type === "point") {
                  api.setColor(name, 14, 116, 144);
                  api.setPointSize(name, 6);
                }
              } catch {}
            }
          } catch {}
          // Auto-fit view to all constructed objects
          try {
            api.evalCommand("ZoomFit()");
          } catch {
            try { api.setCoordSystem(-6, 6, -6, 6); } catch {}
          }
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
      try { apiRef.setSize(w, h); apiRef.evalCommand("ZoomFit()"); } catch {}
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
      <div ref={containerRef} className="w-full overflow-hidden rounded-xl ggb-container bg-background" />
      <p className="text-[11px] text-muted-foreground text-center mt-2">
        Figure interactive — déplacez les points pour explorer
      </p>
    </div>
  );
}
