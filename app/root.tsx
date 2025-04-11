// Learn more about Remix at: https://remix.run/docs/en/main
import "@shopify/polaris/build/esm/styles.css";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  LiveReload,
  useRouteError,
  isRouteErrorResponse,
  ScrollRestoration,
} from "@remix-run/react";

export function links() {
  return [
    { rel: "stylesheet", href: "/styles/app.css" },
  ];
}

export default function App() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta httpEquiv="Content-Security-Policy" content="frame-src 'self' https://*.shopify.com https://*.myshopify.com; script-src 'self' 'unsafe-inline' https://*.shopify.com;" />
        <Meta />
        <Links />
        <script src="/scripts/fix-iframe.js"></script>
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <LiveReload />
        <Scripts />
      </body>
    </html>
  );
}

// Error Boundary
export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <html>
      <head>
        <Meta />
        <Links />
        <script src="/scripts/fix-iframe.js"></script>
      </head>
      <body>
        <h1>
          {isRouteErrorResponse(error)
            ? `${error.status} ${error.statusText}`
            : error instanceof Error
            ? error.message
            : "Unknown Error"}
        </h1>
        <Scripts />
      </body>
    </html>
  );
}
