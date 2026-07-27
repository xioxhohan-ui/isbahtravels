import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable browser source maps in production to prevent code/secrets leakage
  productionBrowserSourceMaps: false,

  // Image optimization — AVIF first (30% smaller), then WebP fallback
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    deviceSizes: [375, 640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "maps.googleapis.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "flagcdn.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },

  // Tree-shake heavy packages
  experimental: {
    optimizePackageImports: ["lucide-react", "@supabase/supabase-js", "@supabase/ssr"],
  },

  // Compress all responses
  compress: true,

  // Security headers on all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://*.google.com https://*.vercel-scripts.com https://*.vercel-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://*.sslcommerz.com https://*.googleapis.com https://flagcdn.com https://*.vercel-analytics.com; frame-ancestors 'none'; block-all-mixed-content;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
