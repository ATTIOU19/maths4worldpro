import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { parseChartBlocks, ChartBlock, FunctionPlotBlock } from "./ChartRenderer";
import { GeoGebraBlock } from "./GeoGebraBlock";

type Msg = { role: "user" | "assistant"; content: string };

export function MessageBubble({ msg, hideVisuals = false }: { msg: Msg; hideVisuals?: boolean }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] md:max-w-[70%] px-4 py-3 chat-bubble-user">
          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
        </div>
      </div>
    );
  }

  const parts = parseChartBlocks(msg.content);
  const hasVisual = !hideVisuals && parts.some((p) => p.geogebra || p.graph || p.chart);

  if (hideVisuals) {
    const textOnly = parts
      .map((p) => [p.before, p.after].filter(Boolean).join("\n\n"))
      .filter(Boolean)
      .join("\n\n")
      .trim();
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] md:max-w-[70%] px-4 py-3 chat-bubble-ai">
          {textOnly && (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {textOnly}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className={`${hasVisual ? "max-w-full w-full md:max-w-[95%]" : "max-w-[85%] md:max-w-[70%]"} px-4 py-3 chat-bubble-ai`}>
        {parts.map((part, i) => (
          <div key={i}>
            {part.before && (
              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {part.before}
                </ReactMarkdown>
              </div>
            )}
            {part.graph && <FunctionPlotBlock graph={part.graph} />}
            {part.chart && <ChartBlock chart={part.chart} />}
            {part.geogebra && <GeoGebraBlock data={part.geogebra} />}
            {part.after && (
              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {part.after}
                </ReactMarkdown>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
