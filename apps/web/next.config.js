/** @type {import('next').NextConfig} */
const { i18n } = require('./next-i18next.config');

const nextConfig = {
  // Disabled Turbopack due to internal error
  i18n,
};

module.exports = nextConfig;