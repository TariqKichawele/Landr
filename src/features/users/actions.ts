"use server";

import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { getUserIdTag } from "./dbCache"
import { db } from "@/drizzle/db"
import { UsersTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

export async function getUser(id: string) {
  "use cache"
  cacheTag(getUserIdTag(id))

  return db.query.UsersTable.findFirst({
    where: eq(UsersTable.id, id),
  })
}