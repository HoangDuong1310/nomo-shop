import Document, { Html, Head, Main, NextScript, DocumentContext, DocumentInitialProps } from 'next/document'
import mysql from 'mysql2/promise';

interface MyDocumentProps extends DocumentInitialProps {
  __STORE_INFO__?: any;
}

class MyDocument extends Document<MyDocumentProps> {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    // SSR fetch store settings (best effort)
    let storeInfo: any = {};
    try {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306'),
        user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
        password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
        database: process.env.DB_DATABASE || process.env.MYSQL_DATABASE || 'cloudshop'
      });
      try {
        const [rows]: any = await connection.execute(
          "SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'store.%'"
        );
        rows.forEach((r: any) => {
          const key = r.setting_key.replace('store.', '');
            storeInfo[key] = r.setting_value;
        });
      } finally {
        await connection.end();
      }
    } catch (e) {
      // Silent fail: fallback sẽ dùng default
      storeInfo = {};
    }
    return { ...initialProps, __STORE_INFO__: storeInfo };
  }

  render() {
    const preloaded = (this.props as any).__STORE_INFO__ || {};
    const serialized = JSON.stringify(preloaded).replace(/</g, '\\u003c');
    return (
      <Html lang="vi">
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
            rel="stylesheet"
          />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <body>
          {/* Preload store info to avoid flash of default store name */}
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__STORE_INFO__ = ${serialized};`
            }}
          />
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument 