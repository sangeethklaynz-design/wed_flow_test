/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/assets/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "4000",
        pathname: "/assets/**",
      },
      {
        protocol: "https",
        hostname: "api-wedflow.framelabs.lk",
        pathname: "/assets/**",
      },
    ],
  },
  async rewrites() {
    const api = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(
      /\/$/,
      ""
    );
    return [
      {
        source: "/assets/events/:path*",
        destination: `${api}/assets/events/:path*`,
      },
    ];
  },
};

export default nextConfig;
