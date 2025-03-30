import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SocketProvider } from "./components/Socketprovider/SocketProvider";
import "./globals.css";
import { getUser } from "./lib/dal";
import Navbar from "./components/Navbar/Navbar";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  
  return (
    <html lang="en">
      <body className={`${inter.variable}`}>
        <SocketProvider>
          <Navbar user={user} />
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}
