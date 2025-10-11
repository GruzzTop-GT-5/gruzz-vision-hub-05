import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    screens: {
      'xs': '360px',    // Малые телефоны
      'sm': '640px',    // Большие телефоны
      'md': '768px',    // Планшеты
      'lg': '1024px',   // Малые ПК/Ноутбуки
      'xl': '1280px',   // Средние ПК
      '2xl': '1536px',  // Большие ПК/Мониторы
      '3xl': '1920px',  // Телевизоры/Большие мониторы
      '4xl': '2560px',  // 4K экраны
    },
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
        "3xl": "1800px",
        "4xl": "2400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
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
        steel: {
          50: "hsl(222, 30%, 96%)",
          100: "hsl(222, 30%, 90%)",
          200: "hsl(222, 28%, 80%)",
          300: "hsl(222, 26%, 65%)",
          400: "hsl(222, 24%, 50%)",
          500: "hsl(222, 30%, 40%)",
          600: "hsl(222, 35%, 30%)",
          700: "hsl(222, 40%, 22%)",
          800: "hsl(222, 45%, 16%)",
          900: "hsl(222, 50%, 12%)",
        },
        gold: {
          400: "hsl(46, 95%, 65%)",
          500: "hsl(46, 95%, 58%)",
          600: "hsl(46, 85%, 50%)",
        },
        blue: {
          400: "hsl(217, 91%, 65%)",
          500: "hsl(217, 91%, 60%)",
          600: "hsl(217, 81%, 55%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        "slide-down": {
          from: {
            opacity: "0",
            transform: "translateY(-10px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slide-up": {
          from: {
            opacity: "1",
            transform: "translateY(0)",
          },
          to: {
            opacity: "0",
            transform: "translateY(-10px)",
          },
        },
        "float": {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-10px)",
          },
        },
        "glow": {
          "0%, 100%": {
            boxShadow: "0 0 20px hsla(217, 91%, 60%, 0.5)",
          },
          "50%": {
            boxShadow: "0 0 40px hsla(217, 91%, 60%, 0.7)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "float": "float 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
