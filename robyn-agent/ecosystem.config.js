module.exports = {
  apps: [
    {
      name: 'robyn-agent',
      script: 'index.js',
      cwd: '/root/clawd/robyn-agent',
      env: {
        NODE_ENV: 'production',
        TZ: 'Europe/London',
      },
      env_file: '.env',
      max_memory_restart: '256M',
      restart_delay: 5000,
      max_restarts: 10,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,
    },
  ],
};
