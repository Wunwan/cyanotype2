/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Spec palette
        prussian: '#0c2540', // primary Prussian blue
        'mid-blue': '#1a4d80',
        'pale-blue': '#c8d4e0',
        cream: '#f0e8d8',
        // Figma-exact tokens (Figma wins where it specifies different hexes)
        ink: '#214371', // primary text blue used throughout Figma
        edge: '#8fb9c7', // pill-button / divider border
        bone: '#fcfaf1', // off-white paper card
        'bone-2': '#fdfaef',
      },
      fontFamily: {
        // Default font for everything (Malevice Inkbleed) with readable fallbacks
        sans: [
          '"Malevice Inkbleed"',
          '"Caveat"',
          '"Bradley Hand"',
          'cursive',
          'system-ui',
          'sans-serif',
        ],
        // Display serif — ONLY for the four headers (apply via `font-serif-display`)
        'serif-display': ['"Instrument Serif"', 'Georgia', 'serif'],
        // Handwritten — ONLY for the user's print note values (name/date/place)
        hand: ['"Homemade Apple"', '"Caveat"', 'cursive'],
      },
      transitionTimingFunction: {
        // A weighted, non-linear curve for the rare non-spring transition
        weighted: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
