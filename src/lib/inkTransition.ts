import { flushSync } from "react-dom";
import type { ThemeMode } from "@/types/garmentflow";

/**
 * Generates an organic, noise-warped ink front polygon radiating from (ox, oy)
 * so the expanding View Transition boundary curls like liquid ink across the viewport.
 */
function buildOrganicInkPolygon(
  ox: number,
  oy: number,
  radius: number,
  wobbleAmplitude: number,
  seed: number,
  points = 56
): string {
  if (radius <= 0.5) {
    return `polygon(${ox.toFixed(1)}px ${oy.toFixed(1)}px, ${ox.toFixed(1)}px ${oy.toFixed(1)}px, ${ox.toFixed(1)}px ${oy.toFixed(1)}px)`;
  }
  const coords: string[] = [];
  for (let i = 0; i < points; i++) {
    const theta = (i / points) * Math.PI * 2;
    const wave =
      Math.sin(theta * 5 + seed) * 0.45 +
      Math.sin(theta * 11 - seed * 1.7) * 0.35 +
      Math.cos(theta * 17 + seed * 2.3) * 0.2;
    const r = Math.max(0, radius + wave * wobbleAmplitude);
    const x = ox + Math.cos(theta) * r;
    const y = oy + Math.sin(theta) * r;
    coords.push(`${x.toFixed(1)}px ${y.toFixed(1)}px`);
  }
  return `polygon(${coords.join(", ")})`;
}

/**
 * Triggers an ink-spread theme transition originating from the toggle button.
 * Uses document.startViewTransition with an organic multi-lobe ink-front polygon
 * and cleanly falls back to a circular overlay or immediate switch when unsupported
 * or when prefers-reduced-motion is enabled.
 */
export async function runInkThemeTransition(options: {
  nextTheme: ThemeMode;
  originEl: HTMLElement | null;
  applyTheme: (theme: ThemeMode) => void;
  onBusy?: (busy: boolean) => void;
}) {
  const { nextTheme, originEl, applyTheme, onBusy } = options;
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const rect = originEl?.getBoundingClientRect();
  const ox = rect ? rect.left + rect.width / 2 : window.innerWidth - 48;
  const oy = rect ? rect.top + rect.height / 2 : 32;
  const maxR =
    Math.hypot(
      Math.max(ox, window.innerWidth - ox),
      Math.max(oy, window.innerHeight - oy)
    ) + 90;

  // Immediate transition for reduced motion
  if (reducedMotion || typeof document === "undefined") {
    applyTheme(nextTheme);
    return;
  }

  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => {
      ready: Promise<void>;
      finished: Promise<void>;
    };
  };

  if (typeof doc.startViewTransition === "function") {
    onBusy?.(true);
    try {
      const transition = doc.startViewTransition(() => {
        flushSync(() => {
          applyTheme(nextTheme);
        });
      });

      await transition.ready;

      const steps = 16;
      const seed = nextTheme === "dark" ? 1.4 : 4.2;
      const keyframes: Keyframe[] = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        // S-curve progress with organic plume wobble peaking mid-pour and settling cleanly
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const r = maxR * eased;
        const wobble = Math.sin(t * Math.PI) * Math.min(72, maxR * 0.055);
        keyframes.push({
          clipPath: buildOrganicInkPolygon(ox, oy, r, wobble, seed + t * 2.4),
        });
      }

      const anim = document.documentElement.animate(keyframes, {
        duration: 860,
        easing: "cubic-bezier(0.55, 0.04, 0.25, 1)",
        pseudoElement: "::view-transition-new(root)",
      });

      await Promise.allSettled([anim.finished, transition.finished]);
    } catch {
      applyTheme(nextTheme);
    } finally {
      onBusy?.(false);
    }
    return;
  }

  // Fallback for browsers without View Transitions API: smooth ink-circle veil
  onBusy?.(true);
  const veil = document.createElement("div");
  veil.setAttribute("aria-hidden", "true");
  veil.style.position = "fixed";
  veil.style.inset = "0";
  veil.style.zIndex = "99999";
  veil.style.pointerEvents = "none";
  veil.style.background =
    nextTheme === "dark"
      ? "radial-gradient(circle at center, #17171D 0%, #0B0B0F 100%)"
      : "#F5F5F0";
  veil.style.clipPath = `circle(0px at ${ox}px ${oy}px)`;
  document.body.appendChild(veil);

  const expand = veil.animate(
    [
      { clipPath: `circle(0px at ${ox}px ${oy}px)`, opacity: 0.92 },
      { clipPath: `circle(${maxR}px at ${ox}px ${oy}px)`, opacity: 0.95 },
    ],
    { duration: 480, easing: "cubic-bezier(0.6, 0.05, 0.3, 1)", fill: "forwards" }
  );

  expand.onfinish = () => {
    applyTheme(nextTheme);
    const fade = veil.animate([{ opacity: 0.95 }, { opacity: 0 }], {
      duration: 240,
      easing: "ease-out",
      fill: "forwards",
    });
    fade.onfinish = () => {
      veil.remove();
      onBusy?.(false);
    };
  };
}
