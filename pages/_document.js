// pages/_document.js

import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* Tailwind via CDNJS */}
          <link
            href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/3.3.2/tailwind.min.css"
            rel="stylesheet"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
