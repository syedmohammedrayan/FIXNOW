import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import DynamicBackground from "@/components/DynamicBackground";
import ChatbotIntegration from "@/components/chat/ChatbotIntegration";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";

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
      <body className={`${inter.className} bg-slate-950`}>
        <DynamicBackground />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <div className="chatbot-container">
          <ChatbotIntegration />
        </div>

        {/* Google Translate Integration */}
        <div id="google_translate_element" style={{ display: 'none' }}></div>
        <Script id="google-translate-config" strategy="afterInteractive">
          {`
            window.googleTranslateElementInit = function() {
              if (window.google && window.google.translate) {
                new window.google.translate.TranslateElement({
                  pageLanguage: 'en',
                  includedLanguages: 'en,hi,te,ta,or,ml,kn,ur,as,bn',
                  autoDisplay: false
                }, 'google_translate_element');
              }
            }

            // MutationObserver to strictly remove the Google Translate banner
            const observer = new MutationObserver((mutations) => {
              const banner = document.querySelector('.goog-te-banner-frame');
              if (banner) {
                banner.remove();
                document.body.style.top = '0px';
                document.documentElement.style.top = '0px';
              }
              // Also hide tooltips
              const tooltips = document.querySelectorAll('.goog-tooltip, .goog-te-balloon-frame, #goog-gt-tt');
              tooltips.forEach(t => t.style.display = 'none');
            });

            observer.observe(document.body, { childList: true, subtree: true });
          `}
        </Script>
        <Script 
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" 
          strategy="lazyOnload" 
        />
        <Analytics />
      </body>
    </html>
  );
}
