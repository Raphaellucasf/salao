import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Clean Luxury Theme - Dimas Dona Concept
        primary: {
          50: '#faf9f7',
          100: '#f5f3ef',
          200: '#e8e4dd',
          300: '#d4cdc0',
          400: '#bfb5a3',
          500: '#a89b86', // Bege Principal
          600: '#8f7e68',
          700: '#766551',
          800: '#5d4f3f',
          900: '#4a3f32',
        },
        accent: {
          50: '#fffbf0',
          100: '#fff6d9',
          200: '#ffecb3',
          300: '#ffdf80',
          400: '#ffce4d',
          500: '#d4af37', // Dourado Elegante
          600: '#b8941f',
          700: '#997816',
          800: '#7a5e12',
          900: '#5c460d',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717', // Preto Suave
          950: '#0a0a0a',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        display: ['var(--font-geist-sans)', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        'luxury': '12px',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'luxury': '0 4px 20px rgba(168, 155, 134, 0.08)',
        'luxury-hover': '0 8px 30px rgba(168, 155, 134, 0.15)',
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
