/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Neobrutalism design system
        styleswap: {
          bg:        '#fffce1', // Creamy yellow background
          surface:   '#ffffff', // White cards
          surface2:  '#f0f0f0', // Light gray for slight contrast
          border:    '#000000', // Pitch black borders
          border2:   '#000000', 
          text:      '#000000', // Black text
          muted:     '#333333', 
          subtle:    '#666666',
          accent:    '#ff5757', // Bright red accent
          'accent-hover': '#e04848',
          'accent-dim':   '#ffaaaa',
          error:     '#ff0000',
          success:   '#00cc00',
          warning:   '#ffcc00',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'neo': '0.5rem', // Slightly rounded corners for blocks
      },
      boxShadow: {
        'neo-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
        'neo': '4px 4px 0px 0px rgba(0,0,0,1)',
        'neo-lg': '8px 8px 0px 0px rgba(0,0,0,1)',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
