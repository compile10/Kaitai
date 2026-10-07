export interface PickedImage {
  uri: string;
  type: string;
  name: string;
}

let sequence = 0;
let pending: { id: string; image: PickedImage; expiresAt: number } | undefined;

/** Only picker callbacks register files; route parameters never supply file paths. */
export function registerPickedImage(image: PickedImage): string {
  const id = String(++sequence);
  pending = { id, image: { ...image }, expiresAt: Date.now() + 5 * 60_000 };
  return id;
}

/** Transfer a selected image once; the results screen keeps it locally for retries. */
export function takePickedImage(id: string): PickedImage | undefined {
  if (!pending || pending.id !== id) return undefined;
  const selected = pending;
  pending = undefined;
  return selected.expiresAt > Date.now() ? selected.image : undefined;
}
