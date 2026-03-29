/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://ibcxaytaewufzluxnjbc.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliY3hheXRhZXd1ZnpsdXhuamJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NDk3OTEsImV4cCI6MjA4OTMyNTc5MX0.KAn8sKGlbIpACo5UO6oDWIyJZoIJfC4XBx4hGM7xjiw',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.magichour.ai' },
    ],
  },
}

module.exports = nextConfig
