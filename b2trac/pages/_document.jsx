import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="B2TRAC - Sistema integrado de gestión de ventas en ruta" />
        <meta name="application-name" content="B2TRAC" />
        <meta name="apple-mobile-web-app-title" content="B2TRAC" />
        <meta name="theme-color" content="#667eea" />
        <title>B2TRAC</title>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
