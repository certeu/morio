module.exports = {
  apps: [
    {
      name: 'core',
      script: './dist/index.mjs',
      cwd: '/morio/api',
      max_memory_restart: '250M',
      watch: false,
    },
  ],
}
