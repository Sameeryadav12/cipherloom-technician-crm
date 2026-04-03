import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(217 33% 17%)",
        input: "hsl(217 33% 17%)",
        ring: "hsl(221 83% 53%)",
        background: "hsl(222 47% 11%)",
        foreground: "hsl(210 40% 98%)",
        muted: "hsl(217 33% 17%)",
        "muted-foreground": "hsl(215 20% 65%)",
        card: "hsl(222 47% 13%)",
        "card-foreground": "hsl(210 40% 98%)",
        primary: "hsl(221 83% 53%)",
        "primary-foreground": "hsl(210 40% 98%)"
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem"
      },
      boxShadow: {
        surface:
          "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 18px 40px -28px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.03)",
        "surface-lg":
          "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 24px 56px -32px rgba(0,0,0,0.85), 0 0 0 1px rgba(59,130,246,0.08)",
        glow: "0 0 48px -12px rgba(59, 130, 246, 0.35)"
      }
    }
  },
  plugins: []
} satisfies Config;
