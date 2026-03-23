import type { Metadata } from "next";
import { Geist, Geist_Mono } from 'next/font/google';
import "./globals.css";
import ClientLayout from "./ClientLayout";
import { createClient } from "@/lib/supabase/server";
import { SessionProvider } from "@/context/SessionContext";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "Argentum | Build in public. Prove it forever.",
  description: "The ultimate platform for builders to verify their progress on-chain.",
  openGraph: {
    title: "Argentum | Build in public. Prove it forever.",
    description: "The ultimate platform for builders to verify their progress on-chain.",
    url: "https://argentum-silk.vercel.app",
    siteName: "Argentum",
    images: [
      {
        url: "/og-image.png", // Assuming this will be added or generated
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Argentum",
    description: "Build in public. Prove it forever.",
    creator: "@argentum",
    images: ["/og-image.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  // Use getUser() (validates with Supabase server) instead of getSession() (reads stale cookie)
  const { data: { user } } = await supabase.auth.getUser();
  const { data: { session } } = user
    ? await supabase.auth.getSession()
    : { data: { session: null } };

    const { data: settings } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single() as { data: any, error: any };

    const isMaintenance = settings?.value === true;
    
    // Admin check to bypass maintenance
    const adminIds = (process.env.ADMIN_USER_IDS || '').split(',');
    const isAdmin = session?.user && adminIds.includes(session.user.id);

    return (
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <body className="antialiased bg-background text-foreground">
          <SessionProvider initialSession={session}>
            {isMaintenance && !isAdmin ? (
              <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#050505]">
                <div className="w-24 h-24 mb-8 relative">
                   <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full animate-pulse" />
                   <img src="/logo.png" alt="Argentum" className="w-full h-auto relative z-10 opacity-50 grayscale" />
                </div>
                <h1 className="text-4xl font-black tracking-tighter mb-4 text-foreground uppercase">Protocol Sealed</h1>
                <p className="max-w-md text-foreground/40 text-sm font-medium leading-relaxed mb-8">
                  Argentum is currently undergoing scheduled maintenance. <br/>
                  The protocol will be back online shortly. Follow @argentum for updates.
                </p>
                <div className="px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-full">
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Maintenance Active</span>
                </div>
              </div>
            ) : (
              <ClientLayout>
                {children}
              </ClientLayout>
            )}
          </SessionProvider>
        </body>
      </html>
    );
}
