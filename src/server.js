require("dotenv").config();

const app = require("./app");
const prisma = require("./config/db");

const PORT = Number(process.env.PORT) || 4000;

const start = async () => {
  try {
    await prisma.$connect();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

start();
