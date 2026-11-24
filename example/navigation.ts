import { useEffect, useState } from "react";
import { normalizeAppPath } from "chainwip-design-system";
import { booksPath } from "./routes";

export function normalizeDemoLocation() {
  const url = new URL(window.location.href);
  const path = normalizeAppPath(url.pathname);
  url.pathname = path === "/" ? booksPath : path;
  if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
}

/** デモ内のリンクとブラウザーの履歴を同じ URL に同期する。 */
export function useDemoNavigation() {
  const [href, setHref] = useState(() => window.location.href);
  useEffect(() => {
    const onPopState = () => setHref(window.location.href);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (path: string, replace = false) => {
    const next = new URL(path, window.location.href);
    if (next.href === window.location.href) return;
    if (replace) {
      window.history.replaceState(window.history.state, "", next);
    } else {
      window.history.pushState(null, "", next);
      window.scrollTo(0, 0);
    }
    setHref(next.href);
  };

  return { url: new URL(href), navigate };
}
