const nextConfig = {
  reactStrictMode: true,

  serverExternalPackages: [
    "@langchain/core",
    "@langchain/google-genai",
    "@langchain/mongodb",
    "@langchain/langgraph",
  ],

};

export default nextConfig;
