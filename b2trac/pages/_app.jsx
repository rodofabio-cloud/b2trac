import '../styles/globals.css';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>B2TRAC - Gestión de Ventas en Ruta</title>
        <meta name="application-name" content="B2TRAC" />
        <meta name="apple-mobile-web-app-title" content="B2TRAC" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
