import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate'; // Correct import for tailwindcss-animate

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}', // Merged app content paths
    './pages/**/*.{js,ts,jsx,tsx,mdx}', // Merged pages content paths
    './components/**/*.{js,ts,jsx,tsx,mdx}', // Merged components content paths
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'card': '20px', // Large rounded corners for cards (20-28px)
        'card-lg': '24px',
        'card-xl': '28px',
      },
      boxShadow: {
        'inner-dark': 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
        'outer-dark': '0 4px 6px rgba(0, 0, 0, 0.2)',
        'card': '0 4px 6px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(0, 0, 0, 0.3)',
      },
      colors: {
        // Custom color palette (from the first file)
        primary: '#4169E1', // Royal Blue
        shade1: '#2E3A87', // Darker Navy Blue
        accent: '#66BB6A', // Green for conversions (will be overridden by the second 'accent' if not careful)
        amber: '#FFC107',
        lightBlue: '#42A5F5',
        red: '#EF5350',
        teal: '#26A69A',
        purple: '#AB47BC',
        white: '#FFFFFF',
        grayBg: '#f0f2f5',
        support: '#F44336', // For support/contact
        // Pie chart/traffic source colors
        organic: '#4CAF50',
        social: '#2196F3',
        paid: '#FF9800',
        direct: '#9C27B0',
        referral: '#F44336',

        // Shadcn/ui colors (from the second file)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        // IMPORTANT: The 'primary' and 'accent' from the first file will be overridden
        // by the HSL values from the second file if both are directly under 'colors'.
        // To avoid this, you might want to rename the first set of 'primary' and 'accent'
        // or decide which takes precedence. I've kept the HSL definitions as they are
        // typically used for theming with Shadcn UI.
        'primary-hsl': { // Renamed to avoid clash, consider if this is what you want
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        'accent-hsl': { // Renamed to avoid clash, consider if this is what you want
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        // Dark Fintech Palette
        'bg-primary': '#0B0E14',
        'bg-secondary': '#0F131A',
        'bg-tertiary': '#141A23',
        'card-bg': '#151A23',
        'card-border': 'rgba(255, 255, 255, 0.04)',
        'accent-blue': '#3B82F6',
        'accent-blue-dark': '#2563EB',
        'text-primary': '#E5E7EB',
        'text-secondary': '#9CA3AF',
        'text-muted': '#6B7280',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;