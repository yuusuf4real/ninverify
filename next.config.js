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
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
  headers: async () => {
    const isDev = process.env.NODE_ENV === "development";
    const scriptSrc = isDev
      ? "'self' https://checkout.paystack.com https://s3-eu-west-1.amazonaws.com/pstk-public-files/js/pusher.min.js https://checkout.gointerpay.net/ https://checkout.rch.io/v2.22/fingerprint https://www.googletagmanager.com/gtag/ https://applepay.cdn-apple.com/jsapi/v1.1.0/apple-pay-sdk.js https://www.googletagmanager.com/debug/ https://www.google-analytics.com 'unsafe-inline' 'unsafe-eval'"
      : "'self' https://checkout.paystack.com https://s3-eu-west-1.amazonaws.com/pstk-public-files/js/pusher.min.js https://checkout.gointerpay.net/ https://checkout.rch.io/v2.22/fingerprint https://www.googletagmanager.com/gtag/ https://applepay.cdn-apple.com/jsapi/v1.1.0/apple-pay-sdk.js https://www.googletagmanager.com/debug/ https://www.google-analytics.com 'unsafe-inline'";

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src ${scriptSrc}; script-src-elem ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.paystack.co https://checkout.paystack.com https://standard.paystack.com https://sockjs-eu.pusher.com https://eu-assets.i.posthog.com https://eu.i.posthog.com https://www.google-analytics.com https://browser-intake-datadoghq.eu; frame-src https://checkout.paystack.com; object-src 'none'; base-uri 'self'; form-action 'self';`,
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
