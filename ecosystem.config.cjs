module.exports = {
  apps: [
    {
      name: "lims-api",
      script: "./api/index.js",
      cwd: "./",
      watch: false,
      max_restarts: 15,
      restart_delay: 5000,
      min_uptime: "10s",
      out_file: "./logs/lims-api-out.log",
      error_file: "./logs/lims-api-error.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      }
    },
    {
      name: "lims-analyzer",
      script: "./analyzer-service/index.js",
      cwd: "./",
      watch: false,
      max_restarts: 10,
      restart_delay: 8000,
      min_uptime: "10s",
      out_file: "./logs/lims-analyzer-out.log",
      error_file: "./logs/lims-analyzer-error.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      env: {
        NODE_ENV: "production",
        ANALYZER_PORT: 9000
      }
    }
  ]
};
