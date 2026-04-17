import { useMemo } from "react";

const SYMBOLS = ["∑", "∫", "π", "√", "∞", "Δ", "∂", "λ", "θ", "φ", "≈", "≠", "∇", "∈", "⊂", "%", "÷", "×", "²", "³", "α", "β", "Ω", "μ"];

interface MathSymbolsBackgroundProps {
  /** "light" = symboles foncés sur fond clair · "dark" = symboles clairs sur fond foncé */
  variant?: "light" | "dark";
  /** Densité de symboles (default 18) */
  count?: number;
  /** Opacité maximale (default 0.1) */
  opacity?: number;
  className?: string;
}

/**
 * Fond animé avec symboles mathématiques flottants.
 * À placer en premier enfant d'un conteneur `relative overflow-hidden`.
 * `pointer-events: none` => ne bloque jamais les interactions.
 */
const MathSymbolsBackground = ({
  variant = "light",
  count = 18,
  opacity = 0.1,
  className = "",
}: MathSymbolsBackgroundProps) => {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        sym: SYMBOLS[i % SYMBOLS.length],
        size: 24 + Math.random() * 48,
        left: Math.random() * 95,
        top: Math.random() * 95,
        delay: Math.random() * 8,
        duration: 8 + Math.random() * 8,
      })),
    [count]
  );

  const colorClass =
    variant === "dark" ? "text-primary-foreground" : "text-primary";

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {items.map((it, i) => (
        <span
          key={i}
          className={`math-symbol absolute font-bold select-none ${colorClass}`}
          style={{
            fontSize: `${it.size}px`,
            left: `${it.left}%`,
            top: `${it.top}%`,
            opacity,
            animationDelay: `${it.delay}s`,
            animationDuration: `${it.duration}s`,
          }}
        >
          {it.sym}
        </span>
      ))}
    </div>
  );
};

export default MathSymbolsBackground;
