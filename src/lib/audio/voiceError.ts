/** Replace only the internal provider quota notice; never conceal a failed operation. */
export function voiceErrorMessage(message: unknown): string {
  if (typeof message !== "string" || !message.trim()) return "Voice service unavailable";
  if (message.trim() === "Cartesia credit or request limit reached. Check your Cartesia account.") {
    return "Voice is unavailable right now. Please try later.";
  }
  return message;
}