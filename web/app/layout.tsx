import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider, PeerProvider } from "./lib/providers";
import { ServiceWorkerRegister } from "./lib/providers/ServiceWorkerRegister";
import { Whiteboard } from "./components/whiteboard/Whiteboard";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ČVUT",
  description: "Příprava na rozsřel",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <head>
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="74b0a32a-6d0d-4174-9924-00eace73ee5e"
        />

        <meta name="darkreader-lock" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerRegister />
        <Toaster position="bottom-center" richColors closeButton />
        <PeerProvider>
          <StoreProvider>
            <Whiteboard />
            {children}
          </StoreProvider>
        </PeerProvider>
      </body>
    </html>
  );
}
