import type { Metadata } from "next";
import { ItineraryProvider } from "@/context/ItineraryContext";
import { ThemeProvider } from "@/context/ThemeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Journeyer — Travel Dashboard",
  description: "Explore the world, one trip at a time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-primary-bg text-primary-text overflow-hidden">
        <ThemeProvider>
          <ItineraryProvider>
            {children}
          </ItineraryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}