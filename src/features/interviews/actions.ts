"use server"

import { serverEnv } from "@/data/env/server"
import { db } from "@/drizzle/db";
import { InterviewTable, JobInfoTable } from "@/drizzle/schema";
import { getJobInfoIdTag } from "@/features/jobInfos/dbCache";
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser";
import arcjet, { tokenBucket } from "@arcjet/next"
import { and, eq } from "drizzle-orm";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { insertInterview, updateInterview as updateInterviewDb } from "./db";
import { getInterviewIdTag } from "./dbCache";

const aj = arcjet({
    characteristics: ["userId"],
    key: serverEnv.ARCJET_KEY,
    rules: [
        tokenBucket({
            capacity: 12,
            refillRate: 4,
            interval: "1d",
            mode: "LIVE",
        }),
    ]
});

export async function createInterview({ jobInfoId }: { jobInfoId: string })
: Promise<{ error: true; message: string } | { error: false; id: string }> 
{
    const { userId } = await getCurrentUser({ allData: false });
    if (userId == null) {
        return {
            error: true,
            message: "Unauthorized",
        }
    }

    const jobInfo = await getJobInfo(jobInfoId, userId);
    if (jobInfo == null) {
        return {
            error: true,
            message: "Job info not found",
        }
    }

    const interview = await insertInterview({ jobInfoId, duration: "00:00:00" });

    return { error: false, id: interview.id };
}

async function getJobInfo(id: string, userId: string) {
    "use cache"
    cacheTag(getJobInfoIdTag(id))

    return db.query.JobInfoTable.findFirst({
        where: and(eq(JobInfoTable.id, id), eq(JobInfoTable.userId, userId)),
    })
}

export async function updateInterview(id: string, data: { humeChatId?: string, duration?: string }) {
    const { userId } = await getCurrentUser({ allData: false });
    if (userId == null) {
        return {
            error: true,
            message: "Unauthorized",
        }
    }

    const interview = await getInterview(id, userId);
    if (interview == null) {
        return {
            error: true,
            message: "Interview not found",
        }
    }

    await updateInterviewDb(id, data);

    return { error: false };
}

async function getInterview(id: string, userId: string) {
    "use cache"
    cacheTag(getInterviewIdTag(id))

   const interview = await db.query.InterviewTable.findFirst({
    where: eq(InterviewTable.id, id),
    with: {
        jobInfo: {
            columns: {
                id: true,
                userId: true,
                description: true,
                title: true,
                experienceLevel: true,
            }
        }
    }
   })

   if (interview == null) return null;

   cacheTag(getJobInfoIdTag(interview.jobInfoId));
   if (interview.jobInfo.userId !== userId) return null;

   return interview;
}

