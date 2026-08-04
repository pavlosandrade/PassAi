import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PassAi — Gerenciador de Senhas Local & Seguro',
  description: 'Gerenciador de senhas pessoal e cofre seguro 100% local, criptografado (AES-256) e offline.',
  manifest: './manifest.json',
  verification: {
    google: 'M3arvZvhm12sXkhgqz0C0DBvmOfBW1UBnQjivakv_oA',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="google-site-verification" content="M3arvZvhm12sXkhgqz0C0DBvmOfBW1UBnQjivakv_oA" />
        <link rel="manifest" href="./manifest.json" />
        <meta name="theme-color" content="#0b0f19" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('./sw.js').catch(function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    });
                  });
                } else {
                  // Desregistra Service Workers ativos em ambiente de desenvolvimento local para evitar loops de GET
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (let registration of registrations) {
                      registration.unregister();
                    }
                  });
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
