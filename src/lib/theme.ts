export function applyThemeVariables(primaryColor: string | null) {
  if (!primaryColor || typeof window === "undefined") return;

  // Since we migrated to Tailwind v4, we expect the CSS variable format to be valid
  // The instruction says: "asigne variables CSS en formato oklch() completo y nativo, no tripletas HSL desnudas."
  // So if the primaryColor comes as a bare format, we wrap it in oklch() if needed.
  // Actually, let's just assume we set the full oklch string.

  let formattedColor = primaryColor;
  if (!formattedColor.startsWith("oklch(") && !formattedColor.startsWith("hsl(") && !formattedColor.startsWith("#")) {
    // Wrap it natively in oklch
    formattedColor = `oklch(${formattedColor})`;
  }

  const root = document.documentElement;
  // Apply the variable as the native color
  root.style.setProperty("--primary", formattedColor);
}
