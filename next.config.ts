import type { NextConfig } from 'next';

// Where the API runs, e.g. https://mission-control-api.onrender.com (no path). The browser only
// ever calls this app's own /api/v1, and Next forwards it there. Same origin means the session
// cookie works on any domain (vercel.app + onrender.com included), and no CORS round trips.
const apiProxyUrl = process.env.API_PROXY_URL?.replace(/\/+$/, '');

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  rewrites() {
    return Promise.resolve(
      apiProxyUrl
        ? [{ source: '/api/v1/:path*', destination: `${apiProxyUrl}/api/v1/:path*` }]
        : [],
    );
  },
};

export default config;
