const NEW_FOR_MS = 7 * 24 * 60 * 60 * 1000;

/** A piece is new for a week after it was published, so returning buyers see what changed. */
export function isNew(publishedAt: Date, now: Date): boolean {
  return now.getTime() - publishedAt.getTime() < NEW_FOR_MS;
}
