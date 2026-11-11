/** Bots that a message addresses with @Name (case-insensitive, Arabic names supported). */
export function mentionedBots<T extends { name: string }>(text: string, bots: T[]): T[] {
  const lower = text.toLowerCase();
  return bots.filter((b) => lower.includes(`@${b.name.toLowerCase()}`));
}

/** Most bots that answer one message, to bound cost per send. */
export const MAX_GROUP_REPLIES = 8;

/**
 * Bots that answer a member's message: every bot in the chat replies on its own;
 * an @mention narrows the reply to the bots it names.
 */
export function botsToAnswer<T extends { name: string }>(text: string, bots: T[]): T[] {
  const named = mentionedBots(text, bots);
  return (named.length ? named : bots).slice(0, MAX_GROUP_REPLIES);
}
