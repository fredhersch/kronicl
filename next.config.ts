import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Ensure server-only code is not bundled for the client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        util: false,
        buffer: false,
        events: false,
        querystring: false,
        punycode: false,
        string_decoder: false,
        timers: false,
        domain: false,
        dns: false,
        dgram: false,
        cluster: false,
        worker_threads: false,
        perf_hooks: false,
        async_hooks: false,
        inspector: false,
        trace_events: false,
        v8: false,
        vm: false,
        wasi: false,
        readline: false,
        repl: false,
        tty: false,
        constants: false,
        process: false,
        module: false,
        _debug: false,
        debug: false,
        'agent-base': false,
        'https-proxy-agent': false,
        'teeny-request': false,
        http2: false,
      };
      
      // Explicitly exclude problematic packages from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'googleapis': 'googleapis',
        'google-auth-library': 'google-auth-library',
        'teeny-request': 'teeny-request',
        'https-proxy-agent': 'https-proxy-agent',
        'agent-base': 'agent-base',
        'firebase-admin': 'firebase-admin',
        '@google-cloud/firestore': '@google-cloud/firestore',
        '@google-cloud/storage': '@google-cloud/storage',
        'gcp-metadata': 'gcp-metadata',
        'gtoken': 'gtoken',
      });
      
      // Add alias to redirect problematic imports to empty modules
      config.resolve.alias = {
        ...config.resolve.alias,
        'googleapis': false,
        'google-auth-library': false,
        'firebase-admin': false,
        '@google-cloud/firestore': false,
        '@google-cloud/storage': false,
        'gcp-metadata': false,
        'gtoken': false,
        'teeny-request': false,
        'https-proxy-agent': false,
        'agent-base': false,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
        return [
        {
            source: '/__init.js',
            destination: `http://127.0.0.1:4000/__init.js`,
        },
        {
            source: '/flows/:path*',
            destination: `http://127.0.0.1:4000/flows/:path*`,
        },
        ];
    }
    return [];
  },
};

export default nextConfig;
