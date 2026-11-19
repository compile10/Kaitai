/**
 * Placeholder decks for the Decks tab until the deck endpoints exist. The shape
 * is what the tab needs to render, not the stored `Deck` / `UserDeckData`.
 */

/**
 * A deck's banner photo from Unsplash. Unsplash requires hotlinking its image
 * URLs and crediting the photographer and Unsplash wherever the photo is shown
 * in full, so the credit travels with the image.
 */
export interface DeckBanner {
  /** images.unsplash.com URL without size parameters; see `bannerImageUrl`. */
  imageUrl: string;
  photographerName: string;
  /** The photographer's Unsplash profile. */
  photographerUrl: string;
  /** The photo's Unsplash page. */
  photoUrl: string;
}

/** Ask Unsplash's image CDN for a cropped, compressed copy `width` pixels wide. */
export function bannerImageUrl(banner: DeckBanner, width: number): string {
  return `${banner.imageUrl}?w=${Math.round(width)}&q=60&auto=format&fit=crop`;
}

export interface DeckSummary {
  id: string;
  name: string;
  cardCount: number;
  description?: string;
  /** Null for a starter deck the account hasn't added yet. */
  counts: { ready: number; new: number; training: number } | null;
  masteredPercent?: number;
  /** When the next card comes due, if nothing is due now. */
  nextDueLabel?: string;
  banner?: DeckBanner;
}

export const DUMMY_YOUR_DECKS: DeckSummary[] = [
  {
    id: "dummy-from-my-sentences",
    banner: {
      imageUrl: "https://images.unsplash.com/photo-1564284369929-026ba231f89b",
      photographerName: "Shigeki Wakabayashi",
      photographerUrl: "https://unsplash.com/@kugedo6060",
      photoUrl:
        "https://unsplash.com/photos/japanese-storefront-with-paper-lantern-6nuz52vsbWc",
    },
    name: "From my sentences",
    cardCount: 23,
    counts: { ready: 18, new: 5, training: 0 },
  },
  {
    id: "dummy-anime-phrases",
    banner: {
      imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf",
      photographerName: "Jezael Melgoza",
      photographerUrl: "https://unsplash.com/@jezar",
      photoUrl:
        "https://unsplash.com/photos/people-walking-on-road-near-well-lit-buildings-layMbSJ3YOE",
    },
    name: "Anime phrases",
    cardCount: 41,
    counts: { ready: 0, new: 0, training: 0 },
    nextDueLabel: "next in 6h",
  },
];

export const DUMMY_STARTER_DECKS: DeckSummary[] = [
  {
    id: "starter:jlpt-n5",
    banner: {
      imageUrl: "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3",
      photographerName: "David Edelstein",
      photographerUrl: "https://unsplash.com/@jlhopes",
      photoUrl: "https://unsplash.com/photos/mount-fuji-japan-N4DbvTUDikw",
    },
    name: "JLPT N5 Vocab",
    cardCount: 680,
    counts: { ready: 25, new: 10, training: 2 },
    masteredPercent: 31,
  },
  {
    id: "starter:jlpt-n4",
    banner: {
      imageUrl: "https://images.unsplash.com/photo-1573455494060-c5595004fb6c",
      photographerName: "Denys Nevozhai",
      photographerUrl: "https://unsplash.com/@dnevozhai",
      photoUrl:
        "https://unsplash.com/photos/alleyway-with-red-lanterns-in-tokyo-D68ADLeMh5Q",
    },
    name: "JLPT N4 Vocab",
    cardCount: 640,
    description: "Everyday verbs, adjectives & kanji compounds",
    counts: null,
  },
];
