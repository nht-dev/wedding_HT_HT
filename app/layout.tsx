import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hữu Tài & Hà Thủy — Wedding Invitation",
  description: "Thiệp cưới online của Hữu Tài & Hà Thủy",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "/",
    title: "Hữu Tài & Hà Thủy — Wedding Invitation",
    description: "Thiệp cưới online của Hữu Tài & Hà Thủy",
    siteName: "Hữu Tài & Hà Thủy",
    images: [
      {
        url: "/pictures/slide1/HTH_0194.JPG",
        width: 1200,
        height: 900,
        alt: "Hữu Tài và Hà Thủy trong ngày cưới",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hữu Tài & Hà Thủy — Wedding Invitation",
    description: "Thiệp cưới online của Hữu Tài & Hà Thủy",
    images: ["/pictures/slide1/HTH_0194.JPG"],
  },
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