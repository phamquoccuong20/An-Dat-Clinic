"use strict";

/* Package System */
require("dotenv").config();
const path = require("path");
const environment = {
  BASE_URL: process.env.BASE_URL,
  API_URL: process.env.API_URL,
  CDN_URL: process.env.CDN_URL,
  CDN_URL_S3: process.env.CDN_URL_S3,
  PREFIX_API: process.env.PREFIX_API,
};

module.exports = {
  distDir: "_next",
  poweredByHeader: false,
  env: { ...environment },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8101', // Nếu API chạy trên cổng 8101
        pathname: '/public/upload/**', // Đường dẫn cụ thể
      },
    ],
    domains: [
      "cdn.datafirst.solutions",
      "res.cloudinary.com",
      "cdn.mcvnetworks.us",
      "static.datafirst.solutions",
    ],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  sassOptions: {
    includePaths: [
      path.join(__dirname, "node_modules"),
      path.join(__dirname, "public/scss"),
    ],
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.resolve.alias["@public"] = path.join(__dirname, "public");
    config.resolve.alias["@config"] = path.join(__dirname, "src/config");
    config.resolve.alias["@features"] = path.join(__dirname, "src/features");
    config.resolve.alias["@libs"] = path.join(__dirname, "src/libs");
    config.resolve.alias["@modules"] = path.join(__dirname, "src/modules");
    config.resolve.alias["@views"] = path.join(__dirname, "src/views");
    config.resolve.alias["@utils"] = path.join(__dirname, "src/utils");
    config.resolve.alias["@themes"] = path.join(__dirname, "src/themes");
    config.resolve.alias["@components"] = path.join(__dirname, "components");
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/dashboards",
      },
    ];
  },
  eslint: {
    dirs: ["pages", "src"],
  },
};
