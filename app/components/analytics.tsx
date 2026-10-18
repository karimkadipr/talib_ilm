import { useEffect } from "react";
import { useLocation } from "react-router";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Google Analytics 4, loaded only when the server has a measurement id (GA_MEASUREMENT_ID). The app
 * changes pages without reloading, so the automatic page view is turned off and one is sent here on
 * every navigation, the first page included.
 */
export function Analytics({ id }: { id: string | null }) {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Runs after the new page has rendered, so document.title is already the new page's.
    window.gtag?.("event", "page_view", { page_location: window.location.href, page_title: document.title });
  }, [pathname, search]);

  if (!id) return null;
  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${id}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config",${JSON.stringify(id)},{send_page_view:false});`,
        }}
      />
    </>
  );
}
