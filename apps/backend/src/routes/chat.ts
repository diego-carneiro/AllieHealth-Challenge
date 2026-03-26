import { Router } from "express";
import {
  orchestrateChat,
  createChatContext,
  type ChatContext,
} from "../services/chatOrchestrator";

const router = Router();
const context: ChatContext = createChatContext();

router.post("/", async (req, res) => {
  const { message } = req.body as { message?: string };

  if (!message || !message.trim()) {
    return res.status(400).json({
      ok: false,
      message: "message is required",
    });
  }

  try {
    const result = await orchestrateChat(message.trim(), context);

    return res.json({
      ok: true,
      message: result.message,
      scheduleUpdated: result.mutated,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error.";
    return res.status(500).json({
      ok: false,
      message: `Something went wrong: ${msg}`,
    });
  }
});

export default router;
