import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/lib/supabase-server";
import { TenantHydrationProvider } from "@/components/TenantHydrationProvider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mission Control - Teseo",
  description: "B2B Tower Control by Teseo",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} antialiased`}
    >
      <body className="flex min-h-screen w-full flex-col">
        <TenantHydrationProvider>
          {user ? (
            <div className="flex min-h-screen w-full bg-muted/40">
              <Sidebar />
              <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 w-full">
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                  {children}
                </main>
              </div>
            </div>
          ) : (
            <main className="flex-1 flex flex-col">
              {children}
            </main>
          )}
          <Toaster />
        </TenantHydrationProvider>
      </body>
    </html>
  );
}
