/** @type {import('next').NextConfig} */
const nextConfig = {
    poweredByHeader: false,
    images: {
        domains: ["wcproducts.com"],
    },
    experimental: {
        reactCompiler: true,
    },
};

export default nextConfig;
