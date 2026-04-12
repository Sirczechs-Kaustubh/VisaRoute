module.exports = {
  apps: [
    {
      name: "visaroute",
      script: "./server.js",
      cwd: ".",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      error_file: "./logs/visaroute-error.log",
      out_file: "./logs/visaroute-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,
    },
  ],
};
