import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SocketProvider } from "./components/socketprovider/SocketProvider";
import "./globals.css";

// Import Inter and generate a CSS variable
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Open Stream",
  description:
    "Stream fast and effortlessly—broadcast live without login. Start your stream instantly and let your audience watch you in real time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable}`}>
        <SocketProvider>{children}</SocketProvider>
      </body>
    </html>
  );
}
