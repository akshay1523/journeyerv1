/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://widget.getyourguide.com",
              "style-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net",
              "img-src 'self' data: blob: https://unpkg.com https://cdn.jsdelivr.net https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://*.googleusercontent.com https://*.gstatic.com https://encrypted-tbn*.gstatic.com",
              "connect-src 'self' https://unpkg.com https://cdn.jsdelivr.net https://serpapi.com",
              "frame-src https://widget.getyourguide.com",
              "font-src 'self' data:",
              "worker-src blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
