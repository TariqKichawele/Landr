import { drizzle } from "drizzle-orm/node-postgres";
import { serverEnv } from "@/data/env/server";
import * as schema from "@/drizzle/schema";

export const db = drizzle(serverEnv.DATABASE_URL, { schema });