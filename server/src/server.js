import app from "./app.js";
import { config } from "./config/env.js";

const PORT = config.port || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`===================================================`);
  console.log(`🔒 AI SCAM DETECTOR BACKEND STATUS: ONLINE`);
  console.log(`🌐 Server running at: http://0.0.0.0:${PORT}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`===================================================`);
});
