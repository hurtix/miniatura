import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración para producción 
  compress: true,
  poweredByHeader: false,
  
  // Optimizaciones para imágenes
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 días
  },

  // Configuración para Canvas en servidor Linux
  serverExternalPackages: ['canvas', 'sharp'],
  
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  }
};

export default nextConfig;
