/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {
    colors: { wine: { 50:'#f8f2f3', 100:'#f1e2e5', 200:'#e6c9cf', 300:'#d5a7b0', 400:'#a85c6a', 500:'#8f3f50', 600:'#7a3041', 700:'#642735', 800:'#4a1c28', 900:'#35131c' }, cream:'#fbf8f3', blush:'#ead7d2', ink:'#252122' },
    fontFamily: { sans:['DM Sans','sans-serif'], display:['Manrope','sans-serif'] },
    boxShadow: { soft:'0 24px 60px rgba(74,28,40,.10)', card:'0 12px 36px rgba(44,31,33,.08)' }
  } },
  plugins: []
}
