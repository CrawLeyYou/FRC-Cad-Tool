import "./globals.css";
import { Inter as FontSans } from "next/font/google"

import { cn } from "@/lib/utils"

const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
  })

export default function RootLayout({ children }) {
  return (
    <html lang="en">
        <head>
            <title>FRC CAD Tools</title>
        </head>
      <body className={cn(
          "min-h-screen bg-background bg-dark font-sans",
          fontSans.variable
        )}>{children}</body>
    </html>
  );
}
