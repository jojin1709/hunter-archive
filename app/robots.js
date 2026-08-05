export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://hunter-archive.vercel.app/sitemap.xml",
  };
}
