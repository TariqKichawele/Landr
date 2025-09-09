import { Loader2Icon } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react'
import { getCurrentUser } from '@/services/clerk/lib/getCurrentUser';
import { cacheTag } from 'next/dist/server/use-cache/cache-tag';
import { JobInfoTable } from '@/drizzle/schema';
import { db } from '@/drizzle/db';
import { getJobInfoIdTag } from '@/features/jobInfos/dbCache';
import { and, eq } from 'drizzle-orm';
import { canCreateQuestion } from '@/features/questions/permissions';
import NewQuestionClientPage from './_NewQuestionClientPage';

const QuestionsPage = async ({ params }: { params: Promise<{ jobInfoId: string }> }) => {
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
    const { userId, redirectToSignIn } = await getCurrentUser({ allData: false })
    if (userId == null) return redirectToSignIn()

    if (!await canCreateQuestion()) return redirect("/app/upgrade");

    const jobInfo = await getJobInfo(jobInfoId, userId)
    if (jobInfo == null) return notFound()

    return <NewQuestionClientPage jobInfo={jobInfo} />
}

async function getJobInfo(id: string, userId: string) {
    "use cache"
    cacheTag(getJobInfoIdTag(id))

    return db.query.JobInfoTable.findFirst({
        where: and(eq(JobInfoTable.id, id), eq(JobInfoTable.userId, userId)),
    })
}



export default QuestionsPage