import { useEffect, useRef, useId, useState } from "react";

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

function splitArgs(args: string): string[] {
  const result: string[] = [];
  let current = "";
  let depth = 0;
  for (const char of args) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

const NUM = "[+-]?\\d+(?:\\.\\d+)?";

function parseCoordText(text: string): { x: number; y: number } | null {
  const cleaned = text
    .replace(/\s+/g, "")
    .replace(/[{}]/g, "")
    .replace(/^=+/, "")
    .replace(/^\(+/, "")
    .replace(/\)+$/, "");
  const match = cleaned.match(new RegExp(`^(${NUM}),(${NUM})(?:,${NUM})?$`));
  return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
}

function normalizeGeoGebraCommand(cmd: string): string {
  let normalized = cmd.trim();
  normalized = normalized.replace(new RegExp(`\\(\\s*\\{\\s*(${NUM})\\s*,\\s*(${NUM})\\s*\\}\\s*\\)`, "g"), "($1,$2)");
  normalized = normalized.replace(new RegExp(`\\{\\s*(${NUM})\\s*,\\s*(${NUM})\\s*\\}`, "g"), "($1,$2)");
  const point2d = normalized.match(new RegExp(`^(\\w+)\\s*=\\s*[({]+\\s*(${NUM})\\s*,\\s*(${NUM})\\s*[)}]+$`));
  if (point2d) return `${point2d[1]}=(${point2d[2]},${point2d[3]})`;
  const point3d = normalized.match(new RegExp(`^(\\w+)\\s*=\\s*[({]+\\s*(${NUM})\\s*,\\s*(${NUM})\\s*,\\s*(${NUM})\\s*[)}]+$`));
  if (point3d) return `${point3d[1]}=(${point3d[2]},${point3d[3]},${point3d[4]})`;
  return normalized;
}

function getPoint2D(api: any, value: string): { x: number; y: number } | null {
  const fromText = parseCoordText(value);
  if (fromText) return fromText;
  const direct = value.match(/^\(?\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*\)?$/);
  if (direct) return { x: parseFloat(direct[1]), y: parseFloat(direct[2]) };
  try {
    const x = api.getXcoord(value);
    const y = api.getYcoord(value);
    return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
  } catch {
    try {
      const valueString = api.getValueString?.(value) || api.getDefinitionString?.(value) || "";
      return parseCoordText(String(valueString).replace(/^[^=]+=/, ""));
    } catch {
      return null;
    }
  }
}

function getNumericValue(api: any, value: string): number | null {
  const parsed = Number(value.replace(",", "."));
  if (Number.isFinite(parsed)) return parsed;
  try {
    const n = api.getValue(value);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function circumcircle(points: { x: number; y: number }[]) {
  const [a, b, c] = points;
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < 1e-9) return null;
  const ux = ((a.x ** 2 + a.y ** 2) * (b.y - c.y) + (b.x ** 2 + b.y ** 2) * (c.y - a.y) + (c.x ** 2 + c.y ** 2) * (a.y - b.y)) / d;
  const uy = ((a.x ** 2 + a.y ** 2) * (c.x - b.x) + (b.x ** 2 + b.y ** 2) * (a.x - c.x) + (c.x ** 2 + c.y ** 2) * (b.x - a.x)) / d;
  const r = Math.hypot(ux - a.x, uy - a.y);
  return { x: ux, y: uy, r };
}

function getObjectNames(api: any): string[] {
  try {
    return api.getAllObjectNames?.() || [];
  } catch {
    return [];
  }
}

function commandCreatesObject(cmd: string): boolean {
  return /\b(Polygon|Segment|Line|Ray|Circle|Ellipse|Parabola|Hyperbola|Vector|Polyline|PolyLine|CircularArc|Arc|Sector|Semicircle|Cube|Prism|Pyramid|Cone|Cylinder|Sphere|Plane|Surface)\s*(?:\(|\[)/i.test(cmd);
}

function runGeoGebraEval(api: any, cmd: string, expectObject = false): boolean {
  const normalizedCmd = normalizeGeoGebraCommand(cmd);
  const before = expectObject ? new Set(getObjectNames(api)) : null;
  try {
    const result = api.evalCommand(normalizedCmd);
    if (result === false) return false;
  } catch {
    return false;
  }
  if (!expectObject || !before) return true;
  const after = getObjectNames(api);
  if (after.some((name) => !before.has(name))) return true;
  try {
    const labels = api.evalCommandGetLabels?.(normalizedCmd);
    return Boolean(labels && String(labels).trim());
  } catch {
    return false;
  }
}

function roundCoord(n: number) {
  return Number(n.toFixed(6));
}

function nextAvailableLabel(api: any, prefix: string) {
  const names = new Set(getObjectNames(api));
  for (let i = 1; i < 100; i++) {
    const candidate = `${prefix}${i}`;
    if (!names.has(candidate)) return candidate;
  }
  return `${prefix}${Date.now()}`;
}

function drawSegment(api: any, a: string, b: string): boolean {
  const pa = getPoint2D(api, a);
  const pb = getPoint2D(api, b);
  if (!pa || !pb) return false;
  const labelA = /^[A-Za-z]\w*$/.test(a.trim()) ? a.trim() : createPoint(api, pa.x, pa.y, "S");
  const labelB = /^[A-Za-z]\w*$/.test(b.trim()) ? b.trim() : createPoint(api, pb.x, pb.y, "S");
  if (!labelA || !labelB) return false;
  const lineName = nextAvailableLabel(api, "seg");
  return [
    `${lineName}=Segment(${labelA},${labelB})`,
    `Segment(${labelA},${labelB})`,
    `Segment[${labelA},${labelB}]`,
    `${lineName}: (${pa.y - pb.y})x + (${pb.x - pa.x})y = ${(pa.y - pb.y) * pa.x + (pb.x - pa.x) * pa.y}`,
  ].some((cmd) => runGeoGebraEval(api, cmd, true));
}

function drawClosedSegments(api: any, points: string[], close = true): boolean {
  if (points.length < 2) return false;
  let ok = 0;
  const limit = close ? points.length : points.length - 1;
  for (let i = 0; i < limit; i++) {
    if (drawSegment(api, points[i], points[(i + 1) % points.length])) ok += 1;
  }
  return ok >= Math.max(1, limit - 1);
}

function createPoint(api: any, x: number, y: number, prefix = "P") {
  const label = nextAvailableLabel(api, prefix);
  const created = runGeoGebraEval(api, `${label}=(${roundCoord(x)},${roundCoord(y)})`);
  return created ? label : null;
}

function drawRegularPolygonFallback(api: any, first: string, second: string, sides: number): boolean {
  const a = getPoint2D(api, first);
  const b = getPoint2D(api, second);
  if (!a || !b || sides < 3 || sides > 24) return false;
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  if (Math.hypot(vx, vy) < 1e-9) return false;
  const angle = (2 * Math.PI) / sides;
  const vertices = [first, second];
  let cx = b.x;
  let cy = b.y;
  for (let i = 1; i < sides - 1; i++) {
    const dx = vx * Math.cos(angle * i) - vy * Math.sin(angle * i);
    const dy = vx * Math.sin(angle * i) + vy * Math.cos(angle * i);
    cx += dx;
    cy += dy;
    const label = createPoint(api, cx, cy, "V");
    if (!label) return false;
    vertices.push(label);
  }
  return drawClosedSegments(api, vertices, true);
}

function regularSidesFromText(text: string): number | null {
  const lower = text.toLowerCase();
  const explicit = lower.match(/(\d+)\s*(?:côtés|cotes|sommets)/);
  if (explicit) return Math.max(3, Math.min(24, Number(explicit[1])));
  if (/triangle|trianfle/.test(lower)) return 3;
  if (/carr[ée]|quadrilat[eè]re r[ée]gulier|quadrilat[eè]re regulier/.test(lower)) return 4;
  if (/pentagone/.test(lower)) return 5;
  if (/hexagone/.test(lower)) return 6;
  if (/heptagone/.test(lower)) return 7;
  if (/octogone/.test(lower)) return 8;
  return null;
}

function pointLabels(api: any): string[] {
  return getObjectNames(api)
    .filter((name) => {
      try { return api.getObjectType(name) === "point" && getPoint2D(api, name); } catch { return false; }
    })
    .sort((a, b) => a.localeCompare(b, "fr", { numeric: true }));
}

function ensureFigureFromPoints(api: any, title: string | undefined, code: string) {
  const text = `${title || ""} ${code}`.toLowerCase();
  const labels = pointLabels(api);
  if (labels.length < 2) return;

  const asksClosedShape = /losange|parall[ée]logramme|par[ée]lograme|parelograme|carr[ée]|rectangle|triangle|trianfle|quadrilat[eè]re|polygone/.test(text);
  const sides = regularSidesFromText(text);

  if (/polygone r[ée]gulier|polygone regulier|triangle [ée]quilat[ée]ral|carr[ée]|pentagone|hexagone|heptagone|octogone/.test(text) && sides && labels.length >= 2) {
    drawRegularPolygonFallback(api, labels[0], labels[1], sides);
  }

  if (asksClosedShape && labels.length >= 3) {
    const vertexCount = /triangle/.test(text) && !/quadrilat[eè]re/.test(text) ? 3 : Math.min(labels.length, sides || 4);
    drawClosedSegments(api, labels.slice(0, Math.max(3, vertexCount)), true);
  }

  if (/diagonale/.test(text) && labels.length >= 4) {
    drawSegment(api, labels[0], labels[2]);
    drawSegment(api, labels[1], labels[3]);
  }
}

function extendCircleFromCommand(api: any, cmd: string, extend: (x: number, y: number) => void): boolean {
  const match = cmd.match(/(?:\w+\s*=\s*)?Circle\s*\((.*)\)\s*$/i);
  if (!match) return false;
  const args = splitArgs(match[1]);
  const center = getPoint2D(api, args[0] || "");
  if (args.length === 2 && center) {
    const radius = getNumericValue(api, args[1]);
    const boundary = getPoint2D(api, args[1]);
    const r = radius ?? (boundary ? Math.hypot(boundary.x - center.x, boundary.y - center.y) : null);
    if (r && Number.isFinite(r)) {
      extend(center.x - Math.abs(r), center.y - Math.abs(r));
      extend(center.x + Math.abs(r), center.y + Math.abs(r));
      return true;
    }
  }
  if (args.length === 3) {
    const pts = args.map((arg) => getPoint2D(api, arg));
    if (pts.every(Boolean)) {
      const circle = circumcircle(pts as { x: number; y: number }[]);
      if (circle) {
        extend(circle.x - circle.r, circle.y - circle.r);
        extend(circle.x + circle.r, circle.y + circle.r);
        return true;
      }
    }
  }
  return false;
}

function circleFallbackCommands(api: any, cmd: string): string[] {
  const match = cmd.match(/(?:(\w+)\s*=\s*)?Circle\s*\((.*)\)\s*$/i);
  if (!match) return [];
  const [, name, rawArgs] = match;
  const args = splitArgs(rawArgs);
  const withoutAssignment = `Circle(${rawArgs})`;
  const oldSyntax = `Circle[${rawArgs}]`;
  const fallbacks = [withoutAssignment, oldSyntax];
  const center = getPoint2D(api, args[0] || "");
  if (args.length === 2 && center) {
    const radius = getNumericValue(api, args[1]);
    const boundary = getPoint2D(api, args[1]);
    const r = radius ?? (boundary ? Math.hypot(boundary.x - center.x, boundary.y - center.y) : null);
    if (r && Number.isFinite(r)) {
      const prefix = name ? `${name}: ` : "";
      fallbacks.push(`${prefix}(x - ${center.x})^2 + (y - ${center.y})^2 = ${Math.abs(r) ** 2}`);
    }
  }
  if (args.length === 3) {
    const pts = args.map((arg) => getPoint2D(api, arg));
    if (pts.every(Boolean)) {
      const circle = circumcircle(pts as { x: number; y: number }[]);
      if (circle) {
        const prefix = name ? `${name}: ` : "";
        fallbacks.push(`${prefix}(x - ${circle.x})^2 + (y - ${circle.y})^2 = ${circle.r ** 2}`);
      }
    }
  }
  return fallbacks;
}

function evalGeoGebraCommand(api: any, cmd: string): boolean {
  const expectObject = commandCreatesObject(cmd);
  if (runGeoGebraEval(api, cmd, expectObject)) return true;

  const normalized = cmd.replace(/^(\w+)\s*=\s*/, "$1: ");
  if (normalized !== cmd) {
    if (runGeoGebraEval(api, normalized, expectObject)) return true;
  }

  for (const fallback of circleFallbackCommands(api, cmd)) {
    if (runGeoGebraEval(api, fallback, commandCreatesObject(fallback))) return true;
  }

  const polyMatch = cmd.match(/(?:\w+\s*=\s*)?Polygon\s*\((.*)\)\s*$/i);
  if (polyMatch) {
    const args = splitArgs(polyMatch[1]);
    const pointArgs = args.filter((a) => /^[A-Za-z]\w*$/.test(a));
    const sides = args.length === 3 ? getNumericValue(api, args[2]) : null;
    if (args.length === 3 && pointArgs.length >= 2 && sides && Number.isInteger(sides)) {
      if (drawRegularPolygonFallback(api, args[0], args[1], sides)) return true;
    }
    if (pointArgs.length >= 3) {
      const defined = pointArgs.filter((p) => {
        try { return getPoint2D(api, p) !== null; } catch { return false; }
      });
      if (defined.length >= 3) {
        if (drawClosedSegments(api, defined, true)) return true;
      }
      if (pointArgs.length === args.length) {
        if (runGeoGebraEval(api, `Polygon(${args[0]},${args[1]},${args.length})`, true)) return true;
        if (drawRegularPolygonFallback(api, args[0], args[1], args.length)) return true;
      }
    }
  }

  const regularSides = regularSidesFromText(cmd);
  const segmentLike = cmd.match(/(?:\w+\s*=\s*)?(?:Segment|Line|Ray)\s*\(([^,]+),([^)]+)\)\s*$/i);
  if (segmentLike && drawSegment(api, segmentLike[1].trim(), segmentLike[2].trim())) return true;
  if (regularSides) {
    const pts = getObjectNames(api).filter((name) => {
      try { return api.getObjectType(name) === "point"; } catch { return false; }
    });
    if (pts.length >= 2 && drawRegularPolygonFallback(api, pts[0], pts[1], regularSides)) return true;
  }

  console.warn("GeoGebra command failed:", cmd);
  return false;
}

function keepOrthonormalScale(x1: number, x2: number, y1: number, y2: number, width: number, height: number) {
  const targetRatio = Math.max(1, width) / Math.max(1, height);
  const currentRatio = (x2 - x1) / Math.max(0.0001, y2 - y1);
  if (currentRatio < targetRatio) {
    const cx = (x1 + x2) / 2;
    const half = ((y2 - y1) * targetRatio) / 2;
    return { x1: cx - half, x2: cx + half, y1, y2 };
  }
  const cy = (y1 + y2) / 2;
  const half = ((x2 - x1) / targetRatio) / 2;
  return { x1, x2, y1: cy - half, y2: cy + half };
}

export function GeoGebraBlock({ data }: { data: GeoGebraData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const idRef = useRef(`ggb-${reactId}`);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  // Lazy init when the wrapper enters the viewport
  useEffect(() => {
    if (!wrapperRef.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(wrapperRef.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !containerRef.current) return;
    const id = idRef.current;
    const is3D = data.dim === "3d";
    let appletReady = false;
    let cancelled = false;
    let apiRef: any = null;
    let waitTimer: any = null;

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
        setLoading(false);
        try {
          api.reset();
          try {
            api.setPerspective(is3D ? "T" : "G");
            api.setGridVisible(true);
            api.setAxesVisible(true, true);
            // Set default 2D coord system; 3D laisse GeoGebra gérer la caméra
            if (!is3D) api.setCoordSystem(-10, 10, -6, 6);
          } catch {}
          const commands = splitCommands(data.code);
          for (const cmd of commands) {
            evalGeoGebraCommand(api, cmd);
          }
          ensureFigureFromPoints(api, data.title, data.code);
          // Style every constructed object + compute fit window from points
          let xs: number[] = [];
          let ys: number[] = [];
          let hasFunction = false;
          let hasComplexConic = false;
          // Palette inspirée de la capture (planes terracotta/salmon, ligne verte, points bleus)
          const palette: [number, number, number][] = [
            [201, 110, 84],   // terracotta
            [232, 168, 124],  // salmon clair
            [139, 168, 120],  // sauge / vert plan
            [107, 140, 168],  // bleu acier
            [196, 149, 107],  // sable chaud
            [168, 96, 76],    // brique
            [120, 158, 138],  // vert d'eau
          ];
          let solidIdx = 0;
          let planarIdx = 0;
          const PLANE_FILL = 0.45;
          const SOLID_FILL = 0.35;
          const POLY_FILL = 0.35;
          const extend = (x: number, y: number) => {
            if (Number.isFinite(x) && Number.isFinite(y)) { xs.push(x); ys.push(y); }
          };
          if (!is3D) {
            for (const cmd of commands) extendCircleFromCommand(api, cmd, extend);
          }
          try {
            const names: string[] = api.getAllObjectNames() || [];
            for (const name of names) {
              const type = api.getObjectType(name);
              try {
                if (type === "function" || type === "curve") {
                  hasFunction = true;
                  const [r, g, b] = palette[planarIdx++ % palette.length];
                  api.setColor(name, r, g, b);
                  api.setLineThickness(name, 7);
                  api.setLineStyle(name, 0);
                } else if (type === "line" || type === "segment" || type === "conic") {
                  const [r, g, b] = palette[planarIdx++ % palette.length];
                  api.setColor(name, r, g, b);
                  api.setLineThickness(name, 6);
                  if (type === "conic") {
                    // Try to parse circle equation: x² + y² = r²,  (x - a)² + (y - b)² = r²
                    try {
                      const eq: string = api.getValueString(name) || "";
                      const norm = eq.replace(/^[^:]+:/, "").replace(/²/g, "^2").replace(/\s+/g, "");
                      // (x-a)^2+(y-b)^2=r^2
                      let m = norm.match(/\(x([+-][\d.]+)\)\^2\+\(y([+-][\d.]+)\)\^2=([\d.]+)/);
                      if (m) {
                        const a = -parseFloat(m[1]);
                        const b = -parseFloat(m[2]);
                        const r = Math.sqrt(parseFloat(m[3]));
                        extend(a - r, b - r); extend(a + r, b + r);
                      } else {
                        // x^2+y^2=r^2
                        m = norm.match(/x\^2\+y\^2=([\d.]+)/) || norm.match(/x\^2\+y\^2-([\d.]+)=0/);
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
                  const [r, g, b] = palette[solidIdx++ % palette.length];
                  api.setColor(name, r, g, b);
                  api.setLineThickness(name, 5);
                  try { api.setFilling(name, POLY_FILL); } catch {}
                } else if (type === "polyhedron" || type === "quadric" || type === "surface" || type === "plane") {
                  const [r, g, b] = palette[solidIdx++ % palette.length];
                  api.setColor(name, r, g, b);
                  const fill = type === "plane" ? PLANE_FILL : SOLID_FILL;
                  try { api.setFilling(name, fill); } catch {}
                  try { api.setLineThickness(name, 4); } catch {}
                } else if (type === "point") {
                  api.setColor(name, 42, 110, 187);
                  api.setPointSize(name, 6);
                  api.setLabelVisible(name, true);
                  try { api.setLabelStyle(name, 1); } catch {}
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
              const size = computeSize();
              ({ x1, x2, y1, y2 } = keepOrthonormalScale(x1, x2, y1, y2, size.w, size.h));
              api.setCoordSystem(x1, x2, y1, y2);
            } else if (!hasFunction) {
              const size = computeSize();
              const view = keepOrthonormalScale(-6, 6, -6, 6, size.w, size.h);
              api.setCoordSystem(view.x1, view.x2, view.y1, view.y2);
            }
            // sinon : on garde [-10,10]×[-6,6] pour les fonctions
          } catch {}
        } catch (err) {
          console.error("GeoGebra init error:", err);
        }
      },
    };

    const startApplet = () => {
      if (cancelled || !containerRef.current || !window.GGBApplet) return;
      const applet = new window.GGBApplet(params, true);
      containerRef.current.innerHTML = `<div id="${id}"></div>`;
      applet.inject(id);
    };

    if (window.GGBApplet) {
      startApplet();
    } else {
      // Wait until deployggb.js (loaded with defer) is ready
      const startedAt = Date.now();
      waitTimer = setInterval(() => {
        if (cancelled) { clearInterval(waitTimer); return; }
        if (window.GGBApplet) {
          clearInterval(waitTimer);
          startApplet();
        } else if (Date.now() - startedAt > 10000) {
          clearInterval(waitTimer);
          console.error("GeoGebra script not available after 10s");
        }
      }, 60);
    }

    // Resize on container width change
    const ro = new ResizeObserver(() => {
      if (!apiRef || !containerRef.current) return;
      const { w, h } = computeSize();
      try { apiRef.setSize(w, h); } catch {}
    });
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      cancelled = true;
      if (waitTimer) clearInterval(waitTimer);
      ro.disconnect();
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [data.code, data.dim, visible]);

  return (
    <div ref={wrapperRef} className="my-4 p-3 rounded-2xl border border-border bg-card shadow-lg ggb-wrapper">
      {data.title && (
        <h4 className="text-base font-semibold text-foreground mb-3 text-center tracking-tight">{data.title}</h4>
      )}
      <div className="relative w-full overflow-hidden rounded-xl" style={{ background: "#FFFFFF" }}>
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/40 animate-pulse z-10 pointer-events-none" style={{ minHeight: 320 }}>
            <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <p className="text-xs text-muted-foreground">Préparation de la figure…</p>
          </div>
        )}
        <div ref={containerRef} className="w-full ggb-container" style={{ minHeight: 320 }} />
      </div>
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
