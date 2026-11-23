import { warmUp } from "./embed";

export function warmUpIfEnabled(): void {
  if (process.env.NEXT_PUBLIC_CHAT_ENABLED !== "true") return;
  // On Windows the native model crashes (see scripts/index-docker.sh); production runs Linux.
  if (process.platform === "win32") return;
  warmUp().catch((err) => console.error("[embed] warm-up failed", err));
}
