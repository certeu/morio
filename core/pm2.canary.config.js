module.exports = {
  apps: [
    {
      name: 'core',
      script: './src/index.mjs',
      cwd: '/morio/core',
      max_memory_restart: '250M',
      watch: false,
    },
  ],
}
