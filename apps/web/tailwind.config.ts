import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Stitch Institutional Design Palette
        primary: '#00236f', // Institutional Navy
        'primary-container': '#1e3a8a',
        'on-primary': '#ffffff',
        'on-primary-container': '#90a8ff',
        'primary-fixed': '#dce1ff',
        'on-primary-fixed': '#00164e',

        secondary: '#0051d5', // Royal Blue Actions
        'secondary-container': '#316bf3',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#fefcff',
        'secondary-fixed': '#dbe1ff',
        'on-secondary-fixed': '#00174b',

        surface: '#f8f9ff', // Cool Light Background
        background: '#f8f9ff',
        'surface-bright': '#f8f9ff',
        'surface-dim': '#cbdbf5',
        'surface-container-lowest': '#ffffff', // Crisp White Cards
        'surface-container-low': '#eff4ff',
        'surface-container': '#e5eeff',
        'surface-container-high': '#dce9ff',
        'surface-container-highest': '#d3e4fe',
        'on-surface': '#0b1c30', // High-contrast navy text
        'on-surface-variant': '#444651', // Secondary text

        outline: '#757682',
        'outline-variant': '#c5c5d3',

        // Feedback & Semantic Colors
        tertiary: '#003120',
        'tertiary-fixed': '#85f8c4', // Verification Emerald
        'tertiary-fixed-dim': '#68dba9',
        'on-tertiary-fixed': '#002114',
        'tertiary-container': '#004a32',
        'on-tertiary': '#ffffff',

        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#93000a',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        heading: ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
        'headline-xl': ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
        'headline-lg': ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
        'headline-md': ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
        'headline-sm': ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
        'body-lg': ['var(--font-inter)', 'Inter', 'sans-serif'],
        'body-md': ['var(--font-inter)', 'Inter', 'sans-serif'],
        'body-sm': ['var(--font-inter)', 'Inter', 'sans-serif'],
        'label-md': ['var(--font-inter)', 'Inter', 'sans-serif'],
        'label-sm': ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      spacing: {
        'space-xs': '0.25rem', // 4px
        'space-sm': '0.5rem',  // 8px
        'space-md': '1rem',    // 16px
        'space-lg': '1.5rem',  // 24px
        'space-xl': '2rem',    // 32px
      },
      borderRadius: {
        sm: '0.25rem', // 4px
        DEFAULT: '0.375rem',
        md: '0.5rem', // 8px
        lg: '0.75rem', // 12px
        xl: '1rem', // 16px
      },
    },
  },
  plugins: [],
};

export default config;
