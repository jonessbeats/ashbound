/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Гасим warnings от опциональных зависимостей wagmi/walletconnect,
  // которые нужны только в React Native, а не в браузере.
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
    };
    return config;
  },
};

export default nextConfig;
