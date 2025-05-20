import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        gold: {
          50: "#fff9c4", // Very light gold
          100: "#fff59d", // Light gold
          200: "#fff176", // Soft gold
          300: "#ffee58", // Bright gold
          400: "#ffca28", // Vibrant gold
          500: "#ffc107", // Rich gold
          600: "#ffb300", // Deep gold
          700: "#ffa000", // Dark gold
          800: "#ff8f00", // Orange gold
          900: "#ff6f00", // Burnt gold
        },
        cream: {
          50: "#fffde7", // Very light cream
          100: "#fff8e1", // Light cream
          200: "#fff3bf", // Soft cream
          300: "#ffe082", // Warm cream
          400: "#ffd54f", // Vibrant cream
          500: "#ffa726", // Rich cream
          600: "#ff9800", // Deep cream
          700: "#fb8c00", // Dark cream
          800: "#f57c00", // Orange cream
          900: "#ef6c00", // Burnt cream
        },
        accent: {
          50: "#e8f5e9", // Very light mint
          100: "#c8e6c9", // Light mint
          200: "#a5d6a7", // Soft mint
          300: "#81c784", // Fresh mint
          400: "#66bb6a", // Vibrant mint
          500: "#4caf50", // Rich mint
          600: "#43a047", // Deep mint
          700: "#388e3c", // Dark mint
          800: "#2e7d32", // Forest mint
          900: "#1b5e20", // Emerald mint
        },
        gradient: {
          gold: "from-gold-400 to-gold-600",
          cream: "from-cream-300 to-cream-500",
          goldCream: "from-gold-400 to-cream-400",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
