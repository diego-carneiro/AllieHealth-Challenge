import "dotenv/config";
import express from "express";
import cors from "cors";
import rulesRoutes from "./routes/rules";
import employeesRoutes from "./routes/employees";
import scheduleRoutes from "./routes/schedule";
import chatRoutes from "./routes/chat";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "backend",
    message: "Server is running"
  });
});

app.use("/rules", rulesRoutes);
app.use("/employees", employeesRoutes);
app.use("/schedule", scheduleRoutes);
app.use("/chat", chatRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
