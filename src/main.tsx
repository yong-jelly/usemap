import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app";
import "./index.css";

/**
 * React 애플리케이션의 진입점(Entry point)입니다.
 * DOM의 #root 요소에 App 컴포넌트를 렌더링합니다.
 */
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
