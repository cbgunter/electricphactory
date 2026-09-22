import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import SurveyPage from "./survey/SurveyPage.jsx";
import MatchPlayPage from "./matchplay/MatchPlayPage.jsx";
import MatchPlayAdmin from "./matchplay/MatchPlayAdmin.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/survey/2026-ms" element={<SurveyPage />} />
        <Route path="/matchplay" element={<MatchPlayPage />} />
        <Route path="/matchplay/tibbs" element={<MatchPlayAdmin />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
