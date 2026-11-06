require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const dns = require("node:dns");
dns.setServers(["1.1.1.1"]);
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();