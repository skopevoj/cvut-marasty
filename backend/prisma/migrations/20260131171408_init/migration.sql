-- CreateTable
CREATE TABLE "User" (
    "uid" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "Question" (
    "hash" TEXT NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "Answer" (
    "hash" TEXT NOT NULL,
    "questionHash" TEXT NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" SERIAL NOT NULL,
    "userUid" TEXT NOT NULL,
    "answerHash" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userUid" TEXT NOT NULL,
    "questionHash" TEXT NOT NULL,
    "parentId" INTEGER,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Answer_questionHash_idx" ON "Answer"("questionHash");

-- CreateIndex
CREATE INDEX "Attempt_answerHash_idx" ON "Attempt"("answerHash");

-- CreateIndex
CREATE INDEX "Attempt_userUid_idx" ON "Attempt"("userUid");

-- CreateIndex
CREATE INDEX "Attempt_answerHash_userUid_idx" ON "Attempt"("answerHash", "userUid");

-- CreateIndex
CREATE INDEX "Comment_questionHash_idx" ON "Comment"("questionHash");

-- CreateIndex
CREATE INDEX "Comment_userUid_idx" ON "Comment"("userUid");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionHash_fkey" FOREIGN KEY ("questionHash") REFERENCES "Question"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_answerHash_fkey" FOREIGN KEY ("answerHash") REFERENCES "Answer"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_userUid_fkey" FOREIGN KEY ("userUid") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userUid_fkey" FOREIGN KEY ("userUid") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_questionHash_fkey" FOREIGN KEY ("questionHash") REFERENCES "Question"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;
