import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

const nextConfig: NextConfig = {
  output: isGitHubPages ? 'export' : undefined,
  assetPrefix: isGitHubPages ? '/jikan-kyuka-calculator/' : undefined,
  trailingSlash: isGitHubPages,
};

export default nextConfig;
