import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "./components/navbar";
import { Footer } from "./components/footer";
import { AIChatBubble } from "./components/ai-chat-bubble";
import { AuthProvider } from "./components/auth-provider";
import { ThemeProvider } from "./components/theme-provider";
import { ToastProvider } from "./components/ui/toast-provider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AtSpaces | Premium Coworking in Jordan",
  description:
    "Discover and book inspiring workspaces across Amman, Irbid, and Aqaba — hot desks, private offices, and meeting rooms.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})();` }} />
      </head>
      <body
        suppressHydrationWarning
        className={`${dmSans.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Navbar />
              <main className="min-h-screen">{children}</main>
              <Footer />
              <AIChatBubble />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
