import { generateAiQuestionFeedback } from "@/services/ai/questions";
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser";
import z from "zod";
import { unstable_cacheTag as cacheTag } from "next/cache";
import { getQuestionIdTag } from "@/features/questions/dbCache";
import { getJobInfoIdTag } from "@/features/jobInfos/dbCache";
import { db } from "@/drizzle/db";
import { QuestionTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

const schema = z.object({
    prompt: z.string().min(1),
    questionId: z.string().min(1),
})


export async function POST(req: Request) {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
        return new Response("Invalid request body", { status: 400 });
    }

    const { questionId, prompt: answer } = result.data;
    const { userId } = await getCurrentUser({ allData: false });

    if (userId == null) {
        return new Response("Unauthorized", { status: 401 });
    }

    const question = await getQuestion(questionId, userId);
    if (question == null) {
        return new Response("Question not found", { status: 404 });
    }

    const feedback = generateAiQuestionFeedback({
        question: question.text,
        answer,
    })

    return feedback.toDataStreamResponse({ sendUsage: false });
}

async function getQuestion(id: string, userId: string) {
    "use cache"
    cacheTag(getQuestionIdTag(id))
  
    const question = await db.query.QuestionTable.findFirst({
      where: eq(QuestionTable.id, id),
      with: { jobInfo: { columns: { id: true, userId: true } } },
    })
  
    if (question == null) return null
    cacheTag(getJobInfoIdTag(question.jobInfo.id))
  
    if (question.jobInfo.userId !== userId) return null
    return question
}