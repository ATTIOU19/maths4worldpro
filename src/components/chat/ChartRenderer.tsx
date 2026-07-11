import { useEffect, useRef, useMemo, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { ZoomableFigure } from "./ZoomableFigure";

/* ── Types ── */

type ChartData = {
  type: "line" | "bar" | "area";
  title?: string;
  xLabel?: string;
  yLabel?: string;
  data: Record<string, number | string>[];
  series: { key: string; color?: string; name?: string }[];
};

type GraphData = {
  title?: string;
  functions: string[];
  xDomain?: [number, number];
  yDomain?: [number, number];
};

export type GeoGebraBlockData = {
  title?: string;
  code: string;
  dim?: "2d" | "3d";
};

type ParsedPart = {
  before: string;
  chart: ChartData | null;
  graph: GraphData | null;
  geogebra: GeoGebraBlockData | null;
  after: string;
};

/* ── Colors ── */

const COLORS = [
  "hsl(204, 68%, 47%)",
  "hsl(191, 83%, 32%)",
  "hsl(148, 64%, 24%)",
  "hsl(213, 61%, 27%)",
  "hsl(30, 80%, 55%)",
  "hsl(340, 65%, 50%)",
];

/* ── Parsing ── */

export function parseChartBlocks(text: string): ParsedPart[] {
  const regex = /```(?:chart|graph|geogebra)\s*\n([\s\S]*?)\n```/g;
  const parts: ParsedPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index);
    const blockType = match[0].startsWith("```geogebra")
      ? "geogebra"
      : match[0].startsWith("```graph")
      ? "graph"
      : "chart";
    try {
      const parsed = JSON.parse(match[1]);
      if (blockType === "geogebra" || parsed.type === "geogebra" || (typeof parsed.code === "string" && !parsed.functions && !parsed.data)) {
        const ggb: GeoGebraBlockData = {
          title: parsed.title,
          code: parsed.code,
          dim: parsed.dim === "3d" ? "3d" : "2d",
        };
        parts.push({ before, chart: null, graph: null, geogebra: ggb, after: "" });
      } else if (blockType === "graph" || parsed.functions) {
        parts.push({ before, chart: null, graph: parsed as GraphData, geogebra: null, after: "" });
      } else {
        parts.push({ before, chart: parsed as ChartData, graph: null, geogebra: null, after: "" });
      }
    } catch {
      parts.push({ before: before + match[0], chart: null, graph: null, geogebra: null, after: "" });
    }
    lastIndex = match.index + match[0].length;
  }

  const remaining = text.slice(lastIndex);
  if (parts.length === 0) {
    parts.push({ before: remaining, chart: null, graph: null, geogebra: null, after: "" });
  } else {
    parts[parts.length - 1].after = remaining;
  }

  return parts;
}

/* ── Function Plot (GeoGebra-style) ── */

export function FunctionPlotBlock({ graph }: { graph: GraphData }) {
  return (
    <ZoomableFigure
      title={graph.title}
      renderZoomed={(open) => (open ? <PlotSurface graph={graph} fullscreen /> : null)}
    >
      <div className="my-4 p-4 rounded-xl border border-border bg-background">
        {graph.title && (
          <h4 className="text-sm font-semibold text-foreground mb-3 text-center">{graph.title}</h4>
        )}
        <PlotSurface graph={graph} />
        {graph.functions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {graph.functions.map((fn, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground font-mono">
                {fn}
              </span>
            ))}
          </div>
        )}
      </div>
    </ZoomableFigure>
  );
}

function PlotSurface({ graph, fullscreen = false }: { graph: GraphData; fullscreen?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => {
      const w = el.clientWidth || 320;
      const h = fullscreen
        ? Math.max(320, el.clientHeight || 480)
        : Math.min(Math.max(240, Math.round(window.innerHeight * 0.55)), 480);
      setSize({ w, h });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [fullscreen]);

  useEffect(() => {
    if (!containerRef.current || !graph.functions?.length || !size) return;
    let cancelled = false;
    import("function-plot").then((mod) => {
      if (cancelled || !containerRef.current) return;
      const functionPlot = mod.default;
      containerRef.current.innerHTML = "";
      const colors = ["#2563eb", "#dc2626", "#16a34a", "#9333ea", "#ea580c", "#0891b2"];
      try {
        functionPlot({
          target: containerRef.current,
          width: size.w,
          height: size.h,
          xAxis: { label: "x", domain: graph.xDomain || [-10, 10] },
          yAxis: { label: "y", domain: graph.yDomain || [-10, 10] },
          grid: true,
          data: graph.functions.map((fn, i) => ({
            fn,
            color: colors[i % colors.length],
            graphType: "polyline" as const,
          })),
        });
      } catch (err) {
        console.error("function-plot error:", err);
        containerRef.current.innerHTML = `<p style="color:red;font-size:0.85rem;padding:1rem;">Erreur de tracé : expression invalide</p>`;
      }
    });
    return () => { cancelled = true; };
  }, [graph, size]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-lg"
      style={fullscreen ? { height: "100%" } : undefined}
    />
  );
}

/* ── Recharts (rétrocompatibilité) ── */

export function ChartBlock({ chart }: { chart: ChartData }) {
  const ChartComponent = useMemo(() => {
    switch (chart.type) {
      case "bar": return BarChartView;
      case "area": return AreaChartView;
      default: return LineChartView;
    }
  }, [chart.type]);

  const height = typeof window !== "undefined"
    ? Math.min(Math.max(240, Math.round(window.innerHeight * 0.5)), 420)
    : 320;

  return (
    <ZoomableFigure
      title={chart.title}
      renderZoomed={() => (
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent chart={chart} />
        </ResponsiveContainer>
      )}
    >
      <div className="my-4 p-4 rounded-xl border border-border bg-background">
        {chart.title && (
          <h4 className="text-sm font-semibold text-foreground mb-3 text-center">{chart.title}</h4>
        )}
        <ResponsiveContainer width="100%" height={height}>
          <ChartComponent chart={chart} />
        </ResponsiveContainer>
      </div>
    </ZoomableFigure>
  );
}

function LineChartView({ chart }: { chart: ChartData }) {
  return (
    <LineChart data={chart.data}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
      <XAxis dataKey="x" label={chart.xLabel ? { value: chart.xLabel, position: "bottom", offset: -5 } : undefined} tick={{ fontSize: 12 }} />
      <YAxis label={chart.yLabel ? { value: chart.yLabel, angle: -90, position: "insideLeft" } : undefined} tick={{ fontSize: 12 }} />
      <Tooltip contentStyle={{ borderRadius: "0.5rem", fontSize: "0.85rem" }} />
      <Legend />
      {chart.series.map((s, i) => (
        <Line key={s.key} type="monotone" dataKey={s.key} name={s.name || s.key} stroke={s.color || COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
      ))}
    </LineChart>
  );
}

function BarChartView({ chart }: { chart: ChartData }) {
  return (
    <BarChart data={chart.data}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
      <XAxis dataKey="x" tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} />
      <Tooltip contentStyle={{ borderRadius: "0.5rem", fontSize: "0.85rem" }} />
      <Legend />
      {chart.series.map((s, i) => (
        <Bar key={s.key} dataKey={s.key} name={s.name || s.key} fill={s.color || COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
      ))}
    </BarChart>
  );
}

function AreaChartView({ chart }: { chart: ChartData }) {
  return (
    <AreaChart data={chart.data}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
      <XAxis dataKey="x" tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} />
      <Tooltip contentStyle={{ borderRadius: "0.5rem", fontSize: "0.85rem" }} />
      <Legend />
      {chart.series.map((s, i) => (
        <Area key={s.key} type="monotone" dataKey={s.key} name={s.name || s.key} stroke={s.color || COLORS[i % COLORS.length]} fill={s.color || COLORS[i % COLORS.length]} fillOpacity={0.2} />
      ))}
    </AreaChart>
  );
}
