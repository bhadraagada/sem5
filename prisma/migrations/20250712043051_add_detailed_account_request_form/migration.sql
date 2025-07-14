-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('STUDENT', 'FACULTY', 'STAFF', 'RESEARCHER', 'GUEST');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REQUIRES_CLARIFICATION');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "department" TEXT,
ADD COLUMN     "designation" TEXT,
ADD COLUMN     "employeeId" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "reasonForAccess" TEXT,
ADD COLUMN     "studentId" TEXT,
ADD COLUMN     "year" TEXT;

-- CreateTable
CREATE TABLE "AccountRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "userType" "UserType" NOT NULL,
    "studentId" TEXT,
    "employeeId" TEXT,
    "year" TEXT,
    "semester" TEXT,
    "department" TEXT NOT NULL,
    "course" TEXT,
    "designation" TEXT,
    "reasonForAccess" TEXT NOT NULL,
    "intendedUse" TEXT NOT NULL,
    "requestedRole" "Role" NOT NULL DEFAULT 'CLUB_MEMBER',
    "idProofDocument" TEXT,
    "letterDocument" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewComments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountRequest_userId_key" ON "AccountRequest"("userId");

-- CreateIndex
CREATE INDEX "AccountRequest_tenantId_idx" ON "AccountRequest"("tenantId");

-- CreateIndex
CREATE INDEX "AccountRequest_status_idx" ON "AccountRequest"("status");

-- CreateIndex
CREATE INDEX "AccountRequest_userType_idx" ON "AccountRequest"("userType");

-- CreateIndex
CREATE INDEX "AccountRequest_department_idx" ON "AccountRequest"("department");

-- CreateIndex
CREATE INDEX "User_studentId_idx" ON "User"("studentId");

-- CreateIndex
CREATE INDEX "User_employeeId_idx" ON "User"("employeeId");

-- AddForeignKey
ALTER TABLE "AccountRequest" ADD CONSTRAINT "AccountRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
