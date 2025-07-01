/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        gray: '#5e5e5e',
        tan: '#ffebb5',
      },
      fontFamily: {
        serif: ['Instrument Serif', 'serif'],
      },
      fontSize: {
        'body': '15px',
        'button': '15px',
        'header': '25px',
      },
      borderRadius: {
        'sm': '3px',
        'md': '6px',
      },
      borderWidth: {
        'thin': '0.5px',
      }
    },
  },
  plugins: [],
}

