// RootLayout is the Next.js App Router root — wraps every page in the app.
// Everything here is server-rendered by default unless marked 'use client'.
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// ThemeProvider enables light/dark mode toggling via next-themes.
import { ThemeProvider } from "@/components/theme-provider";
// DynamicBackground renders the animated glass/particle backdrop behind all pages.
import DynamicBackground from "@/components/DynamicBackground";
// ChatbotIntegration is the floating AI assistant available on every page.
import ChatbotIntegration from "@/components/chat/ChatbotIntegration";
// next/script handles third-party script loading strategies (defer, lazy, beforeInteractive).
import Script from "next/script";
// GoogleMapsProvider loads the Maps JS API once at the root so all child components can use it.
import { GoogleMapsProvider } from "@/components/GoogleMapsProvider";

// Inter is loaded via next/font for zero-CLS font loading (no layout shift).
const inter = Inter({ subsets: ["latin"] });

// Metadata is consumed by Next.js to populate <title> and <meta description> for SEO.
export const metadata: Metadata = {
  title: "FIXNOW",
  description: "Advanced Home Services Ecosystem.",
};

// RootLayout receives children (each page component) and wraps them in shared providers.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning prevents React from warning about theme-class mismatches
    // that occur when the HTML is rendered on the server but the theme is set client-side.
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>

        {/* Animated background rendered behind the ThemeProvider so it respects the theme */}
        <DynamicBackground />
        <ThemeProvider
          attribute="class"    // Applies theme as a CSS class on <html>
          defaultTheme="dark"
          enableSystem         // Uses the OS/browser preferred color scheme as default
          disableTransitionOnChange
        >
          {/* GoogleMapsProvider ensures the Maps API script is loaded only once */}
          <GoogleMapsProvider>
            <div id="main-content">
              {children}
            </div>
          </GoogleMapsProvider>
        </ThemeProvider>

        {/* Floating AI chatbot — positioned outside ThemeProvider to prevent z-index conflicts */}
        <div className="chatbot-container">
          <ChatbotIntegration />
        </div>

        {/* ── Google Translate Integration ── */}
        {/* Hidden div is the anchor the Google Translate widget mounts into */}
        <div id="google_translate_element" style={{ visibility: 'hidden', position: 'absolute', pointerEvents: 'none' }}></div>
        <Script id="google-translate-config" strategy="afterInteractive">
          {`
            // Called by the Google Translate script once it loads.
            window.googleTranslateElementInit = function() {
              try {
                if (window.google && window.google.translate) {
                  new window.google.translate.TranslateElement({
                    pageLanguage: 'en',
                    // Supports 10 Indian languages for regional accessibility.
                    includedLanguages: 'en,hi,te,ta,or,ml,kn,ur,as,bn',
                    layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false
                  }, 'google_translate_element');
                }
              } catch (e) {
                console.error('Translate Init Error:', e);
              }
            };

            // MutationObserver removes the intrusive Google Translate banner that pushes the body down.
            if (typeof document !== 'undefined' && document.body) {
              const observer = new MutationObserver((mutations) => {
                try {
                  const banner = document.querySelector('.goog-te-banner-frame');
                  if (banner) {
                    banner.remove();
                    document.body.style.top = '0'; // Undo the body top push
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
        {/* lazyOnload ensures the Translate script doesn't block the page render */}
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="lazyOnload"
        />
        {/* Razorpay checkout must be loaded beforeInteractive so it's available when the user pays */}
        <Script
          id="razorpay-checkout"
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
