"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3002;
// Security headers
app.use((0, helmet_1.default)());
// CORS configuration
app.use((0, cors_1.default)({
    origin: true, // Allow all origins
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
// Body parser with size limit
app.use(express_1.default.json({ limit: "10kb" }));
// Global rate limiter: 100 requests per minute per IP
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, try again later." },
});
app.use(globalLimiter);
// Stricter rate limiter for write endpoints
const writeLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, try again later." },
});
// Helper: verify Cloudflare Turnstile token
async function verifyTurnstile(token) {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
        console.warn("TURNSTILE_SECRET_KEY not set, skipping verification");
        return true;
    }
    const verifyResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: secretKey, response: token }),
    });
    const outcome = await verifyResponse.json();
    return !!outcome.success;
}
// Validation schemas
const StatsPostSchema = zod_1.z.object({
    uid: zod_1.z.string().length(64),
    username: zod_1.z.string().min(1).max(50),
    questionHash: zod_1.z.string().max(100),
    token: zod_1.z.string().min(1).optional(),
    answers: zod_1.z
        .array(zod_1.z.object({
        hash: zod_1.z.string().max(100),
        isCorrect: zod_1.z.boolean(),
    }))
        .max(50),
});
// POST /stats - Update user and log result
app.post("/stats", writeLimiter, async (req, res) => {
    try {
        const { uid, username, questionHash, answers, token } = StatsPostSchema.parse(req.body);
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
        await prisma.$transaction(answers.map((ans) => prisma.attempt.create({
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
        })));
        res.status(201).json({ success: true });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// POST /stats/query - Get global stats for specific answer hashes
app.post("/stats/query", async (req, res) => {
    try {
        const { questionHash, answerHashes } = zod_1.z
            .object({
            questionHash: zod_1.z.string(),
            answerHashes: zod_1.z.array(zod_1.z.string()).max(50),
        })
            .parse(req.body);
        // Single query: get total attempts for the question
        const totalQuestionAttempts = await prisma.attempt.count({
            where: { answer: { questionHash } },
        });
        // Batch query: get per-answer stats in one round trip
        const rawStats = await prisma.$queryRaw(client_1.Prisma.sql `
      SELECT "answerHash",
             COUNT(*)::bigint AS total,
             SUM(CASE WHEN "isCorrect" THEN 1 ELSE 0 END)::bigint AS correct
      FROM "Attempt"
      WHERE "answerHash" IN (${client_1.Prisma.join(answerHashes)})
      GROUP BY "answerHash"
    `);
        const statsMap = new Map(rawStats.map((r) => [
            r.answerHash,
            { total: Number(r.total), correct: Number(r.correct) },
        ]));
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
        const rawStats = await prisma.$queryRaw(client_1.Prisma.sql `
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
    }
    catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// GET /fun-stats - Global fun statistics for the landing page
app.get("/fun-stats", async (_req, res) => {
    try {
        const [totalAttempts, totalUsers, totalQuestions, totalComments] = await Promise.all([
            prisma.attempt.count(),
            prisma.user.count(),
            prisma.question.count(),
            prisma.comment.count(),
        ]);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const attemptsToday = await prisma.attempt.count({
            where: { timestamp: { gte: todayStart } },
        });
        res.json({
            totalAttempts,
            totalUsers,
            totalQuestions,
            totalComments,
            attemptsToday,
        });
    }
    catch (error) {
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
    }
    catch (error) {
        console.error(`[GET /comments/${hash}] Error:`, error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// POST /comments - Add a new comment
app.post("/comments", writeLimiter, async (req, res) => {
    try {
        const { questionHash, uid, username, text, parentId, token } = zod_1.z
            .object({
            questionHash: zod_1.z.string(),
            uid: zod_1.z.string().length(64),
            username: zod_1.z.string().min(1).max(50),
            text: zod_1.z.string().min(1).max(200),
            parentId: zod_1.z.number().optional().nullable(),
            token: zod_1.z.string().min(1),
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error("[POST /comments] Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// Global error handler
app.use((err, req, res, next) => {
    console.error("[Global Error Handler]", err);
    res.status(500).json({ error: "Internal Server Error" });
});
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
    console.log(`Database: ${process.env.DATABASE_URL ? "Connected" : "No DATABASE_URL set"}`);
});
