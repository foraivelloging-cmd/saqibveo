/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  allowedDevOrigins: [
    'ais-dev-avht62hik5nbzsakce2vt6-21412174491.europe-west1.run.app',
    'ais-pre-avht62hik5nbzsakce2vt6-21412174491.europe-west1.run.app',
    'localhost:3000',
    '*.run.app'
  ],
};

export default nextConfig;
