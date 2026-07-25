
const fs = require('fs');

const baseHead = \<!doctype html>
<html lang=\id\ class=\scroll-smooth\>
<head>
  <meta charset=\utf-8\ />
  <meta name=\iewport\ content=\width=device-width,initial-scale=1\ />
  <title>SiSurat Gampong</title>
  <script src=\https://cdn.tailwindcss.com\></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: { primary: '#546B41', secondary: '#99AD7A', accent: '#DCCCAC', base: '#FFF8EC' },
          fontFamily: { sans: ['Poppins', 'sans-serif'] },
        }
      }
    }
  </script>
  <style type=\	ext/tailwindcss\>
    @layer utilities {
      .glass { @apply bg-white/70 backdrop-blur-md border border-white/40 shadow-xl; }
      .glass-card { @apply bg-white/60 backdrop-blur-sm border border-white/50 shadow hover:shadow-xl transition-all duration-300 rounded-2xl; }
      .btn-primary { @apply bg-primary text-white px-6 py-2.5 rounded-xl hover:bg-[#3f5231] transition-all; }
      .btn-secondary { @apply bg-accent text-gray-800 px-6 py-2.5 rounded-xl hover:bg-[#cbb68d] transition-all; }
      .btn-outline { @apply border-2 border-primary text-primary px-6 py-2.5 rounded-xl hover:bg-primary hover:text-white transition-all; }
      .input-style { @apply w-full bg-white/50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary focus:bg-white; }
    }
    .gradient-bg { background: linear-gradient(135deg, #FFF8EC 0%, #e8f0df 100%); }
    .status-badge { @apply px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap; }
  </style>
  <link rel=\stylesheet\ href=\https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css\>
  <script src=\https://cdn.jsdelivr.net/npm/chart.js\></script>
  <link rel=\stylesheet\ href=\style.css\ />
</head>
<body class=\g-base font-sans text-gray-800 antialiased overflow-x-hidden selection:bg-primary selection:text-white\>
  <!-- Global Loader & Toast -->
  <div id=\globalLoader\ class=\ixed inset-0 z-50 hidden items-center justify-center bg-white/60 backdrop-blur-sm\>
    <div class=\nimate-spin rounded-full h-14 w-14 border-t-4 border-primary border-b-4\></div>
  </div>
  <div id=\	oast\ class=\ixed bottom-6 right-6 z-50 transform translate-y-20 opacity-0 transition-all duration-300\>
    <div class=\g-gray-800 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3\>
       <i class=\a-solid fa-circle-info text-secondary\></i><span id=\	oastMsg\ class=\ont-medium text-sm\></span>
    </div>
  </div>
\;

const footer = \
  <script src=\pp.js\></script>
</body>
</html>
\;

console.log('Done script base setup');
\

