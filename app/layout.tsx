import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hữu Tài & Hà Thủy — Wedding Invitation",
  description: "Thiệp cưới online của Hữu Tài & Hà Thủy",
  icons: {
    icon: "./favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}