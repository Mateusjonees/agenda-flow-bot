import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";

// Performance: Remove strict mode in production for faster rendering
const isDev = import.meta.env.DEV;

const Root = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <App />
  </ThemeProvider>
);

createRoot(document.getElementById("root")!).render(
  isDev ? (
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  ) : (
    <Root />
  )
);
