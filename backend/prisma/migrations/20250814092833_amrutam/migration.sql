-- AlterTable
ALTER TABLE "time_slots" ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurringRuleId" TEXT;

-- CreateTable
CREATE TABLE "recurring_availability_rules" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_availability_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recurring_availability_rules_doctorId_dayOfWeek_startTime_e_key" ON "recurring_availability_rules"("doctorId", "dayOfWeek", "startTime", "endTime");

-- AddForeignKey
ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_recurringRuleId_fkey" FOREIGN KEY ("recurringRuleId") REFERENCES "recurring_availability_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_availability_rules" ADD CONSTRAINT "recurring_availability_rules_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
