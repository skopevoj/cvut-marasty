import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QuizProvider } from "./lib/context/QuizContext";
import { StatsProvider } from "./lib/context/StatsContext";
import { SettingsProvider } from "./lib/context/SettingsContext";
import { WhiteboardProvider } from "./lib/context/WhiteboardContext";
import { Whiteboard } from "./components/whiteboard/Whiteboard";
import { ThemeProvider } from "./lib/context/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Čvut Marasty",
  description: "Rozstřelové otázky pro ČVUT",
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
        <SettingsProvider>
          <ThemeProvider>
            <StatsProvider>
              <QuizProvider>
                <WhiteboardProvider>
                  <Whiteboard />
                  {children}
                </WhiteboardProvider>
              </QuizProvider>
            </StatsProvider>
          </ThemeProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
