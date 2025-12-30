/** @type {import('next').NextConfig} */
const nextConfig = {
    images:{
        // domains: ['drive.google.com', 'lh3.googleusercontent.com', 'coach.com'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.googleusercontent.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'drive.google.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // eslint: {
    //     ignoreDuringBuilds: true,
    // },
    reactStrictMode: true,
};

export default nextConfig;
