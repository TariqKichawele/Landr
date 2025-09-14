import { db } from "@/drizzle/db";
import { UsersTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidateUserCache } from "./dbCache";

export async function upsertUser(user: typeof UsersTable.$inferInsert) {
    await db
      .insert(UsersTable)
      .values(user)
      .onConflictDoUpdate({
        target: [UsersTable.id],
        set: user,
      })

      revalidateUserCache(user.id);
}

export async function deleteUser(id: string) {
    await db.delete(UsersTable).where(eq(UsersTable.id, id));

    revalidateUserCache(id);
}
