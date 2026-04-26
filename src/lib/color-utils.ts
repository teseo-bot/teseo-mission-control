import { converter, formatHex } from "culori";

// Creates converters between oklch and rgb (hex)
const oklch = converter("oklch");

/**
 * Converts any valid CSS color string (including OKLCH, HEX, RGB) to a HEX string (#RRGGBB).
 * Fallbacks to #000000 if parsing fails.
 */
export function toHexString(colorString: string | null | undefined): string {
  if (!colorString) return "#000000";
  try {
    const hex = formatHex(colorString);
    return hex || "#000000";
  } catch {
    return "#000000";
  }
}

/**
 * Converts any valid CSS color string (including HEX) to an OKLCH CSS string: "oklch(L C H)"
 * Fallbacks to black in OKLCH if parsing fails.
 */
export function toOklchString(colorString: string | null | undefined): string {
  if (!colorString) return "oklch(0 0 0)";
  try {
    const oklchColor = oklch(colorString);
    if (!oklchColor) return "oklch(0 0 0)";
    
    // culori might return undefined for chroma/hue if they are 0 (achromatic)
    const l = (oklchColor.l !== undefined ? oklchColor.l : 0).toFixed(3);
    const c = (oklchColor.c !== undefined ? oklchColor.c : 0).toFixed(3);
    const h = (oklchColor.h !== undefined ? oklchColor.h : 0).toFixed(2);
    
    return `oklch(${l} ${c} ${h})`;
  } catch {
    return "oklch(0 0 0)";
  }
}
