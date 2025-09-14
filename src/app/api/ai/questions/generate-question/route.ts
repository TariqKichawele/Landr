import { db } from "@/drizzle/db";
import { JobInfoTable, questionDifficulties, QuestionTable } from "@/drizzle/schema";
import { getJobInfoIdTag } from "@/features/jobInfos/dbCache";
import { canCreateQuestion } from "@/features/questions/permissions";
import { PLAN_LIMIT_MESSAGE } from "@/lib/errorToast";
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser";
import { and, asc, eq } from "drizzle-orm";
import { unstable_cacheTag as cacheTag } from "next/cache";
import z from "zod";
import { createDataStreamResponse } from "ai";
import { getQuestionJobInfoTag } from "@/features/questions/dbCache";
import { generateAiQuestion } from "@/services/ai/questions";
import { insertQuestion } from "@/features/questions/db";


const schema = z.object({
    prompt: z.enum(questionDifficulties),
    jobInfoId: z.string().min(1),
})

export async function POST(req: Request) {
    const body = await req.json();
    const result = schema.safeParse(body);


    if(!result.success) {
        return new Response("Error generating question", { status: 400 });
    }

    const { prompt: difficulty, jobInfoId } = result.data;
    const { userId } = await getCurrentUser({ allData: false });
    if (userId == null) {
        return new Response("Unauthorized", { status: 401 });
    }

    if (!await canCreateQuestion()) {
        return new Response(PLAN_LIMIT_MESSAGE, { status: 403 });
    }

    const jobInfo = await getJobInfo(jobInfoId, userId);
    if (jobInfo == null) {
        return new Response("Job info not found", { status: 403 });
    }

    const previousQuestions = await getQuestions(jobInfoId);

    return createDataStreamResponse({
        execute: async dataStream => {
            const res = generateAiQuestion({
                previousQuestions,
                jobInfo,
                difficulty,
                onFinish: async question => {
                    const { id } = await insertQuestion({
                        text: question,
                        difficulty,
                        jobInfoId,
                    })

                    dataStream.writeData({ questionId: id })
                }
            })

            res.mergeIntoDataStream(dataStream, { sendUsage: false });
        }
    })
}

async function getQuestions(jobInfoId: string) {
    "use cache"
    cacheTag(getQuestionJobInfoTag(jobInfoId))
  
    return db.query.QuestionTable.findMany({
      where: eq(QuestionTable.jobInfoId, jobInfoId),
      orderBy: asc(QuestionTable.createdAt),
    })} 

async function getJobInfo(id: string, userId: string) {
    "use cache"
    cacheTag(getJobInfoIdTag(id))
  
    return db.query.JobInfoTable.findFirst({
      where: and(eq(JobInfoTable.id, id), eq(JobInfoTable.userId, userId)),
    })
}