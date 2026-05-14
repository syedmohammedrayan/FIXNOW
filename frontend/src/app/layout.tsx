import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import DynamicBackground from "@/components/DynamicBackground";
import ChatbotIntegration from "@/components/chat/ChatbotIntegration";
import Script from "next/script";
import { GoogleMapsProvider } from "@/components/GoogleMapsProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FIXNOW PRO | Service Control Center",
  description: "Advanced service dispatch and technician tracking ecosystem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="https://ik.imagekit.io/smr2007/fixnow-logo.png" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <DynamicBackground />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <GoogleMapsProvider>
            {children}
          </GoogleMapsProvider>
        </ThemeProvider>
        
        <div className="chatbot-container">
          <ChatbotIntegration />
        </div>

        {/* ── Google Translate & Mobile Overrides ── */}
        <div id="google_translate_element" style={{ visibility: 'hidden', position: 'absolute', pointerEvents: 'none' }}></div>
        <Script id="google-translate-config" strategy="afterInteractive">
          {`
            window.googleTranslateElementInit = function() {
              try {
                if (window.google && window.google.translate) {
                  new window.google.translate.TranslateElement({
                    pageLanguage: 'en',
                    includedLanguages: 'en,hi,te,ta,or,ml,kn,ur,as,bn',
                    layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false
                  }, 'google_translate_element');
                }
              } catch (e) {
                console.error('Translate Init Error:', e);
              }
            };

            // Safe MutationObserver for mobile
            if (typeof document !== 'undefined' && document.body) {
              const observer = new MutationObserver((mutations) => {
                try {
                  const banner = document.querySelector('.goog-te-banner-frame');
                  if (banner) {
                    banner.remove();
                    document.body.style.top = '0';
                  }
                  const popup = document.querySelector('.goog-te-menu-value');
                  if (popup) {
                    // Keep it hidden or style it for Midnight Glass
                  }
                } catch (e) {}
              });
              observer.observe(document.body, { childList: true, subtree: true });
            }
          `}
        </Script>
        <Script 
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" 
          strategy="lazyOnload" 
        />
      </body>
    </html>
  );
}
