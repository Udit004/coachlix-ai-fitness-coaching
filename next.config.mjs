const nextConfig = {
  reactStrictMode: true,

  serverExternalPackages: [
    "@langchain/core",
    "@langchain/google-genai",
    "@langchain/mongodb",
    "@langchain/langgraph",
  ],

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;