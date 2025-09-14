import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser";
import { Loader2Icon } from "lucide-react";
import { Suspense } from "react";
import { unstable_cacheTag as cacheTag } from "next/cache";
import { JobInfoTable } from "@/drizzle/schema";
import { notFound, redirect } from "next/navigation";
import { db } from "@/drizzle/db";
import { getJobInfoIdTag } from "@/features/jobInfos/dbCache";
import { and, eq } from "drizzle-orm";
import { fetchAccessToken } from "hume";
import { serverEnv } from "@/data/env/server";
import { VoiceProvider } from "@humeai/voice-react";
import { StartCall } from "./_StartCall";
import { canCreateInterview } from "@/features/interviews/permissions";


export default async function NewInterviewPage({ params }: { params: Promise<{ jobInfoId: string }> }) {
    const { jobInfoId } = await params;

    return (
        <Suspense
            fallback={
                <div className="h-screen-header flex items-center justify-center">
                    <Loader2Icon className="animate-spin size-24" />
                </div>
            }
        >
          <SuspendedComponent jobInfoId={jobInfoId} />
        </Suspense>
    )
}

async function SuspendedComponent({ jobInfoId }: { jobInfoId: string }) {
    const { userId, redirectToSignIn, user } = await getCurrentUser({ allData: true });
    if (userId == null || user == null) return redirectToSignIn();

    if (!await canCreateInterview()) return redirect("/app/upgrade");

    const jobInfo = await getJobInfo(jobInfoId, userId);
    if (jobInfo == null) return notFound();

    const accessToken = await fetchAccessToken({
        apiKey: serverEnv.HUME_API_KEY,
        secretKey: serverEnv.HUME_SECRET_KEY,
    });

    return (
        <VoiceProvider>
            <StartCall jobInfo={jobInfo} accessToken={accessToken} user={user} />
        </VoiceProvider>
    )

}

async function getJobInfo(id: string, userId: string) {
    "use cache"
    cacheTag(getJobInfoIdTag(id))

    return db.query.JobInfoTable.findFirst({
        where: and(eq(JobInfoTable.id, id), eq(JobInfoTable.userId, userId)),
    })
}