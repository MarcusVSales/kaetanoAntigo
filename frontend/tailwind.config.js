/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/pages/**/*.{js,jsx}','./src/components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'site-bg':'#FFFFFF','site-bg2':'#F5F5F5','site-border':'#E0E0E0',
        'site-text':'#0A0A0A','site-text2':'#444444','site-text3':'#888888',
      },
      fontFamily: { sans:['Montserrat','sans-serif'], display:['Cormorant Garamond','Georgia','serif'] },
    },
  },
  plugins:[],
};
