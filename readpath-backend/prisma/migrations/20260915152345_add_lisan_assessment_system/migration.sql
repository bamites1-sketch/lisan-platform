/*
  Warnings:

  - You are about to drop the `assessment_scores` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `assessmentId` on the `assessment_responses` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `assessments` table. All the data in the column will be lost.
  - You are about to drop the column `overallScore` on the `assessments` table. All the data in the column will be lost.
  - You are about to drop the column `readinessScore` on the `assessments` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `assessments` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `assessments` table. All the data in the column will be lost.
  - You are about to drop the column `targetGrade` on the `assessments` table. All the data in the column will be lost.
  - You are about to drop the column `assessmentId` on the `reading_profiles` table. All the data in the column will be lost.
  - Added the required column `submissionId` to the `assessment_responses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `assessments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grade` to the `assessments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passage` to the `assessments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `skillAreas` to the `assessments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `assessments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assessmentSubmissionId` to the `reading_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "assessment_scores_assessmentId_skillArea_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "assessment_scores";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "assessment_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "assignmentType" TEXT NOT NULL,
    "targetId" TEXT,
    "targetGrade" TEXT,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "assessment_assignments_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assessment_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "audioUrl" TEXT,
    "duration" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "submittedAt" DATETIME,
    "reviewedAt" DATETIME,
    "reviewedBy" TEXT,
    "overallScore" INTEGER,
    "fluencyScore" INTEGER,
    "accuracyScore" INTEGER,
    "comprehensionScore" INTEGER,
    "wordsPerMinute" INTEGER,
    "correctWords" INTEGER,
    "totalWords" INTEGER,
    "strengths" TEXT,
    "weaknesses" TEXT,
    "feedback" TEXT,
    "recommendations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "assessment_submissions_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assessment_submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_assessment_responses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "timeSpent" INTEGER,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "assessment_responses_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "assessment_submissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assessment_responses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_assessment_responses" ("answer", "attempts", "createdAt", "hintsUsed", "id", "isCorrect", "questionId", "timeSpent") SELECT "answer", "attempts", "createdAt", "hintsUsed", "id", "isCorrect", "questionId", "timeSpent" FROM "assessment_responses";
DROP TABLE "assessment_responses";
ALTER TABLE "new_assessment_responses" RENAME TO "assessment_responses";
CREATE TABLE "new_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "passage" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "skillAreas" TEXT NOT NULL,
    "instructions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_assessments" ("createdAt", "id", "status", "updatedAt") SELECT "createdAt", "id", "status", "updatedAt" FROM "assessments";
DROP TABLE "assessments";
ALTER TABLE "new_assessments" RENAME TO "assessments";
CREATE TABLE "new_reading_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "assessmentSubmissionId" TEXT NOT NULL,
    "readinessScore" INTEGER NOT NULL,
    "currentGrade" TEXT NOT NULL,
    "targetGrade" TEXT NOT NULL,
    "phonemicAwarenessScore" INTEGER NOT NULL,
    "phonicsDecodingScore" INTEGER NOT NULL,
    "fluencyScore" INTEGER NOT NULL,
    "vocabularyScore" INTEGER NOT NULL,
    "comprehensionScore" INTEGER NOT NULL,
    "strengths" TEXT NOT NULL,
    "weaknesses" TEXT NOT NULL,
    "priorities" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reading_profiles_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reading_profiles_assessmentSubmissionId_fkey" FOREIGN KEY ("assessmentSubmissionId") REFERENCES "assessment_submissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_reading_profiles" ("comprehensionScore", "createdAt", "currentGrade", "fluencyScore", "id", "phonemicAwarenessScore", "phonicsDecodingScore", "priorities", "readinessScore", "recommendations", "strengths", "studentId", "targetGrade", "updatedAt", "vocabularyScore", "weaknesses") SELECT "comprehensionScore", "createdAt", "currentGrade", "fluencyScore", "id", "phonemicAwarenessScore", "phonicsDecodingScore", "priorities", "readinessScore", "recommendations", "strengths", "studentId", "targetGrade", "updatedAt", "vocabularyScore", "weaknesses" FROM "reading_profiles";
DROP TABLE "reading_profiles";
ALTER TABLE "new_reading_profiles" RENAME TO "reading_profiles";
CREATE UNIQUE INDEX "reading_profiles_assessmentSubmissionId_key" ON "reading_profiles"("assessmentSubmissionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "assessment_submissions_assessmentId_studentId_key" ON "assessment_submissions"("assessmentId", "studentId");
