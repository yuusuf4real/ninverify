/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
  // Disable experimental features that may cause streaming issues
  experimental: {
    ppr: false, // Disable Partial Prerendering
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
  headers: async () => {
    const isDev = process.env.NODE_ENV === "development";

    // In development, use more permissive CSP to avoid blocking legitimate scripts
    if (isDev) {
      return [
        {
          source: "/:path*",
          headers: [
            {
              key: "Content-Security-Policy",
              value:
                "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https: wss:; frame-src 'self' https:;",
            },
          ],
        },
      ];
    }

    // Comprehensive Paystack domains and required sources
    const paystackDomains = [
      "https://js.paystack.co",
      "https://checkout.paystack.com",
      "https://api.paystack.co",
      "https://standard.paystack.com",
      "https://paystack.com",
      "https://s3-eu-west-1.amazonaws.com",
      "https://checkout.gointerpay.net",
      "https://checkout.rch.io",
    ];

    const scriptSrc = [
      "'self'",
      ...paystackDomains,
      "https://www.googletagmanager.com/gtag/",
      "https://applepay.cdn-apple.com/jsapi/v1.1.0/apple-pay-sdk.js",
      "https://www.googletagmanager.com/debug/",
      "https://www.google-analytics.com",
      "'unsafe-inline'", // Allow inline scripts for flexibility
      "'unsafe-eval'", // Allow eval for dynamic scripts
      // Required hashes for specific inline scripts
      "'sha256-wT8A7+MN/p4Bz/w+R+COOHf9HZ+xYskWOIu/JDwIvkg='",
      "'sha384-QQMs28J0n8Mw4Q1CHlPa/iPNoI8cHTH141eSbWme69K7V+4TvvHzfFm+PuE4JpxF'",
      "'sha384-kYN1NbScnNOnyvDqahb4am4uYrSJh/+eDDN9ipiMT/Xx6ivmTHrN4Eh1JD6JZ2Ek'",
      // Additional hashes suggested by browser
      "'sha256-nxe+84Sc1onrukVrcAE8E6muNe9ck6wnJtjP16ywLjg='",
      "'sha256-uPFcq4d4DccCX5vpbwhR8eQZeiQJayR2e0XPVCcyOJw='",
      // Allow browser extension scripts (common sources)
      "chrome-extension:",
      "moz-extension:",
      "safari-extension:",
      "ms-browser-extension:",
    ].join(" ");

    const connectSrc = [
      "'self'",
      ...paystackDomains,
      "https://sockjs-eu.pusher.com",
      "https://eu-assets.i.posthog.com",
      "https://eu.i.posthog.com",
      "https://www.google-analytics.com",
      "https://browser-intake-datadoghq.eu",
    ].join(" ");

    const styleSrc = [
      "'self'",
      "'unsafe-inline'",
      ...paystackDomains,
      "https://fonts.googleapis.com",
    ].join(" ");

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src ${scriptSrc}; style-src ${styleSrc}; style-src-elem ${styleSrc}; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src ${connectSrc}; frame-src ${paystackDomains.join(" ")}; object-src 'none'; base-uri 'self'; form-action 'self';`,
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
