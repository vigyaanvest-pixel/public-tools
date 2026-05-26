export function hookSpaNavigation(onNavigate: () => void): () => void {
  const origPush = history.pushState.bind(history);
  const origReplace = history.replaceState.bind(history);

  history.pushState = (...args) => {
    origPush(...args);
    onNavigate();
  };
  history.replaceState = (...args) => {
    origReplace(...args);
    onNavigate();
  };

  window.addEventListener("popstate", onNavigate);

  return () => {
    history.pushState = origPush;
    history.replaceState = origReplace;
    window.removeEventListener("popstate", onNavigate);
  };
}
