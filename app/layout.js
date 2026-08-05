import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
});
const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata = {
  metadataBase: new URL("https://hunter-archive.vercel.app"),
  title: {
    default: "The Hunter Archive — Searchable Security Writeups & Bug Bounty Intelligence",
    template: "%s | The Hunter Archive",
  },
  description:
    "Search over 7,550+ bug bounty writeups, CTF walkthroughs, SSRF, RCE, IDOR, XSS exploit reports, and security research disclosures. Developed by JOJIN JOHN.",
  keywords: [
    "bug bounty writeups",
    "security writeups",
    "CTF walkthroughs",
    "pentest reports",
    "RCE payloads",
    "SSRF exploitation",
    "IDOR vulnerability",
    "XSS payloads",
    "OAuth bypass",
    "pentester land",
    "ethical hacking",
    "bug bounty methodology",
    "cyber security intelligence",
    "JOJIN JOHN",
    "The Hunter Archive",
  ],
  authors: [{ name: "JOJIN JOHN", url: "https://github.com/jojin1709" }],
  creator: "JOJIN JOHN",
  publisher: "The Hunter Archive",
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hunter-archive.vercel.app",
    siteName: "The Hunter Archive",
    title: "The Hunter Archive — Searchable Security Writeups & Bug Bounty Intelligence",
    description:
      "Search over 7,550+ bug bounty writeups, CTF walkthroughs, SSRF, RCE, IDOR, XSS exploit reports, and security research disclosures.",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Hunter Archive — Searchable Security Writeups",
    description: "Search 7,550+ bug bounty writeups and CTF walkthroughs. Developed by JOJIN JOHN.",
    creator: "@jojin1709",
  },
  alternates: {
    canonical: "https://hunter-archive.vercel.app",
    types: {
      "application/rss+xml": "https://hunter-archive.vercel.app/feed.xml",
    },
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "The Hunter Archive",
    url: "https://hunter-archive.vercel.app",
    description: "Search over 7,550+ bug bounty writeups, CTF walkthroughs, and security research disclosures.",
    author: {
      "@type": "Person",
      name: "JOJIN JOHN",
      url: "https://github.com/jojin1709",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: "https://hunter-archive.vercel.app/?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${display.variable} ${body.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}
