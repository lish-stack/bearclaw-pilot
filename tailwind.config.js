/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1b2430',       // dark navy — text, dark UI chrome, footer/CTA background
        cloud: '#edeef1',     // light — BEARCLAW's PAGE background (unlike AVAIL, which uses this only for panels)
        slate: '#4a4e55',     // secondary text, borders
        rust: '#c97c2e',      // primary accent orange
        'rust-deep': '#a8621f', // hover/pressed state for rust
        'status-pass': '#7a9e7e',  // muted sage — score >= 80%
        'status-mid': '#c97c2e',   // rust accent — score 40-79%
        'status-fail': '#a85c4a',  // muted brick — score < 40%
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
