import { Router } from "express";

const router = Router();

router.post("/", (req, res) => {
  const { message } = req.body as { message?: string };

  if (!message || !message.trim()) {
    return res.status(400).json({
      ok: false,
      message: "message is required",
    });
  }

  return res.json({
    ok: true,
    message:
      "Legacy chat commands were removed. The new assistant integration will be connected in the next step.",
  });
});

export default router;
