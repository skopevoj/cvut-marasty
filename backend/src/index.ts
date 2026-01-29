import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Validation schemas
const StatsPostSchema = z.object({
  questionHash: z.string(),
  isCorrect: z.boolean(),
  uid: z.string().length(64),
  username: z.string().min(1),
  userAnswers: z.any(), // Record of answers or string
});

// POST /stats - Update user and log result
app.post("/stats", async (req, res) => {
  try {
    const { questionHash, isCorrect, uid, username, userAnswers } =
      StatsPostSchema.parse(req.body);

    // Update or create user
    await prisma.user.upsert({
      where: { uid },
      update: { username },
      create: { uid, username },
    });

    // Create attempt record
    const attempt = await prisma.attempt.create({
      data: {
        questionHash,
        isCorrect,
        userUid: uid,
        userAnswers: JSON.stringify(userAnswers),
      },
    });

    res.status(201).json({ success: true, attemptId: attempt.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /stats/:hash - Get global stats for a question
app.get("/stats/:hash", async (req, res) => {
  const { hash } = req.params;

  try {
    const stats = await prisma.attempt.aggregate({
      where: { questionHash: hash },
      _count: { _all: true },
      _sum: {
        id: true, // This is just a placeholder to count correct ones below
      },
    });

    const total = stats._count._all;
    const correct = await prisma.attempt.count({
      where: { questionHash: hash, isCorrect: true },
    });

    res.json({
      questionHash: hash,
      totalAttempts: total,
      correctAttempts: correct,
      accuracy: total > 0 ? correct / total : 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Stats backend running at http://localhost:${PORT}`);
});
