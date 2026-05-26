import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../styles/app.css";
import { AppProvider } from "../sidebar/context/AppContext";
import { SidePanelBootstrap } from "../sidebar/SidePanelBootstrap";
import { SidebarApp } from "../sidebar/SidebarApp";
import { getSettings } from "../shared/storage";
import { applyThemeClass } from "../shared/theme";

void getSettings().then((settings) => {
  applyThemeClass(document.body, settings);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider surface="sidepanel">
      <SidePanelBootstrap />
      <SidebarApp surface="sidepanel" />
    </AppProvider>
  </StrictMode>,
);
