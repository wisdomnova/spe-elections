import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-figtree',
});

export const metadata: Metadata = {
  title: "SPE UNIBEN Elections",
  description: "Student Chapter Elections Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} font-sans antialiased`}>
        {children}
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}