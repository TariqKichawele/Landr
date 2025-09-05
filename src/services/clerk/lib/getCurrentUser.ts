import { db } from "@/drizzle/db";
import { UsersTable } from "@/drizzle/schema";
import { getUserIdTag } from "@/features/users/dbCache";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { cacheTag } from "next/dist/server/use-cache/cache-tag"

export async function getCurrentUser({ allData = false }) {
    const { userId, redirectToSignIn } = await auth();

    return {
        userId,
        redirectToSignIn,
        user: allData && userId != null ? await getUser(userId) : undefined,
    }
}

async function getUser(userId: string) {
    "use cache"
    cacheTag(getUserIdTag(userId));

    return db.query.UsersTable.findFirst({
        where: eq(UsersTable.id, userId),
    })
}