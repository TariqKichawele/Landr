"use server"

import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { jobInfoSchema } from "./schema"
import z from "zod"
import { redirect } from "next/navigation";
import { insertJobInfo, updateJobInfo as updateJobInfoDb } from "./db";
import { unstable_cacheTag as cacheTag } from "next/cache";
import { db } from "@/drizzle/db";
import { eq, and } from "drizzle-orm";
import { JobInfoTable } from "@/drizzle/schema";
import { getJobInfoIdTag } from "./dbCache";

export async function createJobInfo(unsafeData: z.infer<typeof jobInfoSchema>) {
    const { userId } = await getCurrentUser({ allData: false });
    if (userId == null) {
        return {
            error: true,
            message: "Unauthorized",
        }
    }

    const { success, data } = jobInfoSchema.safeParse(unsafeData);
    if (!success) {
        return {
            error: true,
            message: "Invalid data",
        }
    }

    const jobInfo = await insertJobInfo({ ...data, userId });

    redirect(`/app/job-infos/${jobInfo.id}`);
}


export async function updateJobInfo(id: string, unsafeData: z.infer<typeof jobInfoSchema>) {
    const { userId } = await getCurrentUser({ allData: false });
    if (userId == null) {
        return {
            error: true,
            message: "Unauthorized",
        }
    }

    const { success, data } = jobInfoSchema.safeParse(unsafeData);
    if (!success) {
        return {
            error: true,
            message: "Invalid data",
        }
    }

    const existingJobInfo = await getJobInfo(id, userId);
    if (existingJobInfo == null) {
        return {
            error: true,
            message: "Job info not found",
        }
    }

    const jobInfo = await updateJobInfoDb(id, data);

    redirect(`/app/job-infos/${jobInfo.id}`);
}

async function getJobInfo(id: string, userId: string) {
    "use cache"
    cacheTag(getJobInfoIdTag(id))

    return db.query.JobInfoTable.findFirst({
        where: and(eq(JobInfoTable.id, id), eq(JobInfoTable.userId, userId)),
    })
}

