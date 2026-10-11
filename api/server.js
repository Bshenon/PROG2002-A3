const pool = require("./event_db");
const { createApp } = require("./app");
const port = Number(process.env.PORT || 3060);
pool
  .query("SELECT 1")
  .then(() => {
    const server = createApp(pool).listen(port, () =>
      console.log("API running on port " + port),
    );
    process.on("SIGTERM", () => server.close(() => pool.end()));
  })
  .catch((error) => {
    console.error("Database connection failed:", error.code || error.message);
    process.exit(1);
  });
