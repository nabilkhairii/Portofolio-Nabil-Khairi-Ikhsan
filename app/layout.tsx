import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
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
    <html lang="id" data-theme="dark" className={inter.variable} suppressHydrationWarning>
      <head>
        <style>{`
          html { color-scheme: dark; background-color: #000; color: #bbb; }
          html[data-theme="light"] { color-scheme: light; background-color: #fff; color: #3f3f46; }
          body { background-color: inherit; }
        `}</style>
        <script id="theme-init" dangerouslySetInnerHTML={{__html: `
          try {
            if (localStorage.getItem('theme') === 'light') {
              document.documentElement.dataset.theme = 'light';
              document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#ffffff');
            }
          } catch {}
        `}} />
      </head>
      <body className="bg-canvas text-bodytx font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
