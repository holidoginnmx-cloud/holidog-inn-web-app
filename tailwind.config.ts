import type { Config } from "tailwindcss";

// Tailwind v4 carga el tema principalmente vía `@theme` en `app/globals.css`
// y `globals.css` referencia este archivo con `@config "../tailwind.config.ts"`.
// Mantenemos la paleta aquí también para que herramientas como
// `prettier-plugin-tailwindcss` y editores con autocompletado la reconozcan.

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: "#063F52",
          mustard: "#EB9B22",
          ingreso: "#16A34A",
          egreso: "#DC2626",
        },
        neutral: {
          cream: "#FAF6F0",
          sand: "#F0E8D8",
          border: "#E5DDD0",
          ink: "#1A1A1A",
          muted: "#6B6B6B",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
      },
    },
  },
};

export default config;
