import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3002;

// Rate limiting for comments: track IP -> timestamps
const commentRateLimit = new Map<string, number[]>();

// CORS configuration
app.use(
  cors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
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
    console.log(`[GET /comments/${hash}] Fetching comments`);
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
    console.log(`[GET /comments/${hash}] Found ${comments.length} comments`);
    res.json(comments);
  } catch (error) {
    console.error(`[GET /comments/${hash}] Error:`, error);
    res
      .status(500)
      .json({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      });
  }
});

// POST /comments - Add a new comment
app.post("/comments", async (req, res) => {
  try {
    // Rate limiting: 5 comments per IP per minute
    const ip = req.ip || "unknown";
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    if (!commentRateLimit.has(ip)) {
      commentRateLimit.set(ip, []);
    }

    const timestamps = commentRateLimit
      .get(ip)!
      .filter((t) => t > oneMinuteAgo);

    if (timestamps.length >= 5) {
      return res.status(429).json({
        error: "Too many comments. Maximum 5 per minute. Try again later.",
      });
    }

    timestamps.push(now);
    commentRateLimit.set(ip, timestamps);

    const { questionHash, uid, username, text, parentId, token } = z
      .object({
        questionHash: z.string(),
        uid: z.string().length(64),
        username: z.string().min(1),
        text: z.string().min(1).max(200),
        parentId: z.number().optional().nullable(),
        token: z.string().min(1),
      })
      .parse(req.body);

    // Verify Cloudflare Turnstile token
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (secretKey) {
      const verifyResponse = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secret: secretKey,
            response: token,
          }),
        },
      );

      const outcome: any = await verifyResponse.json();
      if (!outcome.success) {
        return res.status(403).json({
          error: "Invalid bot verification token",
          details: outcome["error-codes"],
        });
      }
    } else {
      console.warn("TURNSTILE_SECRET_KEY not set, skipping verification");
    }

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
    console.error("[POST /comments] Error:", error);
    res
      .status(500)
      .json({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      });
  }
});

// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("[Global Error Handler]", err);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  },
);

app.listen(PORT, () => {
  console.log(`🚀 Stats backend running at http://localhost:${PORT}`);
  console.log(
    `📊 Database: ${process.env.DATABASE_URL ? "Connected" : "No DATABASE_URL set"}`,
  );
});
