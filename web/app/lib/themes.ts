import type { Theme } from "./types";

export const THEMES: { id: Theme; label: string; colors: [string, string, string] }[] = [
  { id: "dark", label: "Dark", colors: ["#101014", "#18181c", "#6c8eef"] },
  { id: "marast", label: "MARAST", colors: ["#2d2d2d", "#383838", "#5aabbd"] },
  { id: "light", label: "Light", colors: ["#f4f4f6", "#ffffff", "#4a6cf7"] },
  { id: "catppuccin-mocha", label: "Catppuccin Mocha", colors: ["#1e1e2e", "#313244", "#89b4fa"] },
  { id: "catppuccin-latte", label: "Catppuccin Latte", colors: ["#eff1f5", "#e6e9ef", "#1e66f5"] },
  { id: "tokyo-night", label: "Tokyo Night", colors: ["#1a1b26", "#24283b", "#7aa2f7"] },
  { id: "tokyo-night-light", label: "Tokyo Night Light", colors: ["#d5d6db", "#e4e5ea", "#34548a"] },
  { id: "ayu-dark", label: "Ayu Dark", colors: ["#0a0e14", "#0d1117", "#e6b450"] },
  { id: "night-owl", label: "Night Owl", colors: ["#03243d", "#0b3255", "#82aaff"] },
];
