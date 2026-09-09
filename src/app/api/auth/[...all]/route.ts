import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { observeRoute } from "@/lib/monitoring/logger";

const handlers = toNextJsHandler(auth);
export const GET = observeRoute("auth.get", handlers.GET);
export const POST = observeRoute("auth.post", handlers.POST);
