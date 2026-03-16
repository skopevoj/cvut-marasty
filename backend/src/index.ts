import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { PrismaClient, Prisma } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3002;
// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body parser with size limit
app.use(express.json({ limit: "10kb" }));

// Global rate limiter: 100 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, try again later." },
});
app.use(globalLimiter);

// Stricter rate limiter for write endpoints
const writeLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, try again later." },
});

// Helper: verify Cloudflare Turnstile token
async function verifyTurnstile(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.warn("TURNSTILE_SECRET_KEY not set, skipping verification");
    return true;
  }

  const verifyResponse = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secretKey, response: token }),
    },
  );

  const outcome: any = await verifyResponse.json();
  return !!outcome.success;
}

// Validation schemas
const StatsPostSchema = z.object({
  uid: z.string().length(64),
  username: z.string().min(1).max(50),
  questionHash: z.string().max(100),
  token: z.string().min(1).optional(),
  answers: z
    .array(
      z.object({
        hash: z.string().max(100),
        isCorrect: z.boolean(),
      }),
    )
    .max(50),
});

// POST /stats - Update user and log result
app.post("/stats", writeLimiter, async (req, res) => {
  try {
    const { uid, username, questionHash, answers, token } =
      StatsPostSchema.parse(req.body);

    // Verify Turnstile token if provided
    if (token) {
      const valid = await verifyTurnstile(token);
      if (!valid) {
        return res
          .status(403)
          .json({ error: "Invalid bot verification token" });
      }
    }

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
    await prisma.$transaction(
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

    res.status(201).json({ success: true });
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
        answerHashes: z.array(z.string()).max(50),
      })
      .parse(req.body);

    // Single query: get total attempts for the question
    const totalQuestionAttempts = await prisma.attempt.count({
      where: { answer: { questionHash } },
    });

    // Batch query: get per-answer stats in one round trip
    const rawStats = await prisma.$queryRaw<
      { answerHash: string; total: bigint; correct: bigint }[]
    >(Prisma.sql`
      SELECT "answerHash",
             COUNT(*)::bigint AS total,
             SUM(CASE WHEN "isCorrect" THEN 1 ELSE 0 END)::bigint AS correct
      FROM "Attempt"
      WHERE "answerHash" IN (${Prisma.join(answerHashes)})
      GROUP BY "answerHash"
    `);

    const statsMap = new Map(
      rawStats.map((r) => [
        r.answerHash,
        { total: Number(r.total), correct: Number(r.correct) },
      ]),
    );

    const answerStats = answerHashes.map((hash) => {
      const s = statsMap.get(hash) || { total: 0, correct: 0 };
      return {
        answerHash: hash,
        total: s.total,
        correct: s.correct,
        accuracy: s.total > 0 ? s.correct / s.total : 0,
      };
    });

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
    // Single batch query instead of N+1
    const rawStats = await prisma.$queryRaw<
      { answerHash: string; total: bigint; correct: bigint }[]
    >(Prisma.sql`
      SELECT a."answerHash",
             COUNT(*)::bigint AS total,
             SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END)::bigint AS correct
      FROM "Attempt" a
      JOIN "Answer" ans ON ans."hash" = a."answerHash"
      WHERE ans."questionHash" = ${hash}
      GROUP BY a."answerHash"
    `);

    const answerStats = rawStats.map((r) => {
      const total = Number(r.total);
      const correct = Number(r.correct);
      return {
        answerHash: r.answerHash,
        total,
        correct,
        accuracy: total > 0 ? correct / total : 0,
      };
    });

    res.json({ questionHash: hash, answerStats });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /fun-stats - Global fun statistics for the landing page
app.get("/fun-stats", async (_req, res) => {
  try {
    // Count distinct question submissions (not individual answer rows).
    // A "submission" = one user + one question + same second.
    const [submissionsResult, todayResult] = await Promise.all([
      prisma.$queryRaw<[{ count: bigint }]>(Prisma.sql`
        SELECT COUNT(*) AS count FROM (
          SELECT DISTINCT a."userUid", ans."questionHash", date_trunc('second', a."timestamp")
          FROM "Attempt" a
          JOIN "Answer" ans ON ans."hash" = a."answerHash"
        ) sub
      `),
      prisma.$queryRaw<[{ count: bigint }]>(Prisma.sql`
        SELECT COUNT(*) AS count FROM (
          SELECT DISTINCT a."userUid", ans."questionHash", date_trunc('second', a."timestamp")
          FROM "Attempt" a
          JOIN "Answer" ans ON ans."hash" = a."answerHash"
          WHERE a."timestamp" >= CURRENT_DATE
        ) sub
      `),
    ]);

    const [totalUsers, totalQuestions, totalComments] = await Promise.all([
      prisma.user.count(),
      prisma.question.count(),
      prisma.comment.count(),
    ]);

    res.json({
      totalAttempts: Number(submissionsResult[0].count),
      totalUsers,
      totalQuestions,
      totalComments,
      attemptsToday: Number(todayResult[0].count),
    });
  } catch (error) {
    console.error("[GET /fun-stats] Error:", error);
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
    console.error(`[GET /comments/${hash}] Error:`, error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /comments - Add a new comment
app.post("/comments", writeLimiter, async (req, res) => {
  try {
    const { questionHash, uid, username, text, parentId, token } = z
      .object({
        questionHash: z.string(),
        uid: z.string().length(64),
        username: z.string().min(1).max(50),
        text: z.string().min(1).max(200),
        parentId: z.number().optional().nullable(),
        token: z.string().min(1),
      })
      .parse(req.body);

    // Verify Cloudflare Turnstile token
    const valid = await verifyTurnstile(token);
    if (!valid) {
      return res
        .status(403)
        .json({ error: "Invalid bot verification token" });
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
    res.status(500).json({ error: "Internal Server Error" });
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
    res.status(500).json({ error: "Internal Server Error" });
  },
);

// Graceful shutdown
async function shutdown() {
  console.log("Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

app.listen(PORT, () => {
  console.log(`Stats backend running at http://localhost:${PORT}`);
  console.log(
    `Database: ${process.env.DATABASE_URL ? "Connected" : "No DATABASE_URL set"}`,
  );
});
