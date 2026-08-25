import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// Inter = pengganti open-source yang didokumentasikan untuk BMW Type Next
// Latin. Variabel, jadi pasangan 300 (body) / 700 (display) yang dipakai
// sistemnya ada dalam satu berkas, dan next/font men-self-host-nya (tanpa
// permintaan ke Google Fonts saat halaman dibuka).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "M. Nabil Khairi Ikhsan — Electronics Engineering Portfolio",
  description:
    "Portofolio M. Nabil Khairi Ikhsan — Applied Bachelor (D4) Electronics Engineering. PCB Design, PLC Programming, Embedded Systems, Industrial Automation.",
};

export const viewport: Viewport = { themeColor: "#000000" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: skrip di bawah menulis data-theme sebelum React
    // sempat menghidrasi, dan itu memang yang diinginkan.
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <body className="bg-canvas text-bodytx font-sans antialiased">
        {/* Tema dipasang sebelum paint pertama supaya tidak ada kedip
            putih/hitam. Default gelap: desainnya lahir di kanvas hitam, mode
            terang itu pilihan. Tombolnya sendiri diurus portfolio-runtime.js. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`document.documentElement.dataset.theme = localStorage.getItem('theme') || 'dark';`}
        </Script>
        {children}
      </body>
    </html>
  );
}
