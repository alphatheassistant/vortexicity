
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "rgb(39, 43, 51)",
        input: "rgb(29, 33, 41)",
        background: {
          DEFAULT: "hsl(var(--background))",
        },
        foreground: {
          DEFAULT: "hsl(var(--foreground))",
        },
        
        sidebar: {
          DEFAULT: "rgb(26, 30, 38)",
          foreground: "rgb(214, 221, 235)",
        },
        
        editor: {
          DEFAULT: "rgb(21, 25, 33)",
          line: "rgba(255, 255, 255, 0.05)",
        },
        
        terminal: {
          DEFAULT: "rgb(26, 30, 38)",
          foreground: "rgb(214, 221, 235)",
        },
        
        'status-bar': "rgb(23, 27, 35)",
        
        tab: {
          active: "rgb(31, 35, 43)",
          inactive: "rgb(26, 30, 38)",
        },
        
        // Syntax highlighting
        syntax: {
          string: "rgb(152, 195, 121)",
          keyword: "rgb(198, 120, 221)",
          function: "rgb(97, 175, 239)",
          comment: "rgb(106, 115, 125)",
          variable: "rgb(224, 108, 117)",
        },
      },
    },
  },
  plugins: [],
}
