import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@funnlio/api', '@funnlio/db', '@funnlio/shared', '@funnlio/integrations'],
  webpack: (config) => {
    // Resolve imports com extensão .js para arquivos .ts/.tsx nos packages internos
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    }
    return config
  },
}

export default nextConfig
