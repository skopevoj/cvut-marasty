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
  uid: z.string().length(64),
  username: z.string().min(1),
  questionHash: z.string(),
  answers: z.array(
    z.object({
      hash: z.string(),
      isCorrect: z.boolean(),
    }),
  ),
});

// POST /stats - Update user and log result
app.post("/stats", async (req, res) => {
  try {
    const { uid, username, questionHash, answers } = StatsPostSchema.parse(
      req.body,
    );

    // Update or create user
    await prisma.user.upsert({
      where: { uid },
      update: { username },
      create: { uid, username },
    });

    // Ensure question exists
    await prisma.question.upsert({
      where: { hash: questionHash },
      update: {},
      create: { hash: questionHash },
    });

    // Log attempts for each answer
    const results = await prisma.$transaction(
      answers.map((ans) =>
        prisma.attempt.create({
          data: {
            user: { connect: { uid: uid } },
            isCorrect: ans.isCorrect,
            answer: {
              connectOrCreate: {
                where: { hash: ans.hash },
                create: {
                  hash: ans.hash,
                  questionHash: questionHash,
                },
              },
            },
          },
        }),
      ),
    );

    res.status(201).json({ success: true, count: results.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /stats/query - Get global stats for specific answer hashes
app.post("/stats/query", async (req, res) => {
  try {
    const { questionHash, answerHashes } = z
      .object({
        questionHash: z.string(),
        answerHashes: z.array(z.string()),
      })
      .parse(req.body);

    const totalQuestionAttempts = await prisma.attempt.count({
      where: { answer: { questionHash } },
    });

    const answerStats = await Promise.all(
      answerHashes.map(async (hash) => {
        const stats = await prisma.attempt.aggregate({
          where: { answerHash: hash },
          _count: { _all: true },
        });

        const correct = await prisma.attempt.count({
          where: { answerHash: hash, isCorrect: true },
        });

        const total = stats._count._all;

        return {
          answerHash: hash,
          total,
          correct,
          accuracy: total > 0 ? correct / total : 0,
        };
      }),
    );

    res.json({
      questionHash,
      totalAttempts: totalQuestionAttempts,
      answerStats,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /stats/:hash - Debug endpoint to get all stats for a question hash
app.get("/stats/:hash", async (req, res) => {
  const { hash } = req.params;
  try {
    const answers = await prisma.answer.findMany({
      where: { questionHash: hash },
    });

    const answerStats = await Promise.all(
      answers.map(async (ans) => {
        const total = await prisma.attempt.count({
          where: { answerHash: ans.hash },
        });
        const correct = await prisma.attempt.count({
          where: { answerHash: ans.hash, isCorrect: true },
        });
        return {
          answerHash: ans.hash,
          total,
          correct,
          accuracy: total > 0 ? correct / total : 0,
        };
      }),
    );

    res.json({ questionHash: hash, answerStats });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /comments/:hash - Get all comments for a question
app.get("/comments/:hash", async (req, res) => {
  const { hash } = req.params;
  try {
    const comments = await prisma.comment.findMany({
      where: { questionHash: hash },
      select: {
        id: true,
        text: true,
        timestamp: true,
        questionHash: true,
        parentId: true,
        user: {
          select: { username: true },
        },
      },
      orderBy: { timestamp: "asc" },
    });
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /comments - Add a new comment
app.post("/comments", async (req, res) => {
  try {
    const { questionHash, uid, username, text, parentId } = z
      .object({
        questionHash: z.string(),
        uid: z.string().length(64),
        username: z.string().min(1),
        text: z.string().min(1).max(1000),
        parentId: z.number().optional().nullable(),
      })
      .parse(req.body);

    // Ensure user exists
    await prisma.user.upsert({
      where: { uid },
      update: { username },
      create: { uid, username },
    });

    // Ensure question exists
    await prisma.question.upsert({
      where: { hash: questionHash },
      update: {},
      create: { hash: questionHash },
    });

    const comment = await prisma.comment.create({
      data: {
        text,
        user: { connect: { uid } },
        question: { connect: { hash: questionHash } },
        ...(parentId && { parent: { connect: { id: parentId } } }),
      },
      select: {
        id: true,
        text: true,
        timestamp: true,
        questionHash: true,
        parentId: true,
        user: {
          select: { username: true },
        },
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Stats backend running at http://localhost:${PORT}`);
});
