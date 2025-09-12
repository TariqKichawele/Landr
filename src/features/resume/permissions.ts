import { hasPermission } from "@/services/clerk/lib/hasPermission";

export async function canRunResumeAnalysis() {
    return await hasPermission("unlimited_resume_analysis");
}