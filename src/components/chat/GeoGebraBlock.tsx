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
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const idRef = useRef(`ggb-${reactId}`);

  useEffect(() => {
    if (!containerRef.current || !window.GGBApplet) return;
    const id = idRef.current;
    let appletReady = false;
    let cancelled = false;

    const params = {
      appName: "geometry",
      width: containerRef.current.clientWidth || 600,
      height: 380,
      showToolBar: false,
      showAlgebraInput: false,
      showMenuBar: false,
      showResetIcon: true,
      enableLabelDrags: true,
      enableShiftDragZoom: true,
      enableRightClick: false,
      showZoomButtons: true,
      capturingThreshold: null,
      errorDialogsActive: false,
      useBrowserForJS: false,
      appletOnLoad: (api: any) => {
        if (cancelled) return;
        appletReady = true;
        try {
          api.reset();
          for (const cmd of splitCommands(data.code)) {
            try {
              api.evalCommand(cmd);
            } catch (err) {
              console.warn("GeoGebra command failed:", cmd, err);
            }
          }
          api.setCoordSystem(-5, 5, -5, 5);
        } catch (err) {
          console.error("GeoGebra init error:", err);
        }
      },
    };

    const applet = new window.GGBApplet(params, true);
    // Render into the dedicated div
    containerRef.current.innerHTML = `<div id="${id}"></div>`;
    applet.inject(id);

    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [data.code]);

  return (
    <div className="my-4 p-4 rounded-xl border border-border bg-background">
      {data.title && (
        <h4 className="text-sm font-semibold text-foreground mb-3 text-center">{data.title}</h4>
      )}
      <div ref={containerRef} className="w-full overflow-hidden rounded-lg" />
      <p className="text-[11px] text-muted-foreground text-center mt-2">
        Figure interactive — déplacez les points pour explorer
      </p>
    </div>
  );
}
