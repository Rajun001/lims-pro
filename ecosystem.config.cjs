module.exports = {
  apps: [
    {
      name: "lims-api",
      script: "./api/index.js",
      cwd: "./",
      watch: false,
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
      env: {
        NODE_ENV: "production",
        ANALYZER_PORT: 9000
      }
    }
  ]
};
