import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
    {
      protocol: "https",
      hostname: "image.mux.com"
      
    },{
      protocol: "https",
      hostname: "esl7fj06h7.ufs.sh"
    }
  ]}
};

export default nextConfig;
