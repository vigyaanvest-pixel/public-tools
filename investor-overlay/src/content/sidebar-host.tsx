import { createRoot } from "react-dom/client";
import { AppProvider, SidebarBridge, sidebarController } from "../sidebar/context/AppContext";
import { SidebarApp } from "../sidebar/SidebarApp";
import { getSettings } from "../shared/storage";
import { applyThemeClass } from "../shared/theme";
import sidebarCss from "../styles/sidebar.css?inline";

export { sidebarController };

export function mountSidebar(host: HTMLElement): void {
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = sidebarCss;
  shadow.appendChild(style);

  const mountPoint = document.createElement("div");
  mountPoint.className = "vv-sidebar-root theme-dark";
  shadow.appendChild(mountPoint);

  void getSettings().then((settings) => {
    applyThemeClass(mountPoint, settings);
  });

  const root = createRoot(mountPoint);
  root.render(
    <AppProvider>
      <SidebarBridge />
      <SidebarApp />
    </AppProvider>,
  );
}
