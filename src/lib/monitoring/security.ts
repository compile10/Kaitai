import { log, reportError } from "./logger";
import { flushMonitoring } from "./server";

export async function reportInviteBypass() {
  reportError(new Error("auth.invite_bypass"), "auth.invite_bypass");
  log("fatal", "auth.invite_bypass", { event: "auth.invite_bypass" });
  // Bound the wait so a collector outage cannot stall signup recovery.
  let timer: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    flushMonitoring(),
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, 2000);
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}
