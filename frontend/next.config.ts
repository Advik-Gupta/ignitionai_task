import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Recording needs HTTPS on a phone, so local testing goes through a tunnel.
  // The dev server refuses cross-origin requests from hosts not listed here.
  allowedDevOrigins: ['*.trycloudflare.com', '*.ngrok-free.app'],
};

export default nextConfig;
