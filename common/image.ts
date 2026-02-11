/**
 * Shared constants for image upload/analysis (API and clients).
 * Must stay in sync with Google AI supported formats and size limits.
 */

// Maximum image size: 20MB (Google AI inline data limit)
export const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

// Allowed image MIME types (per Google AI docs: PNG, JPEG, WEBP, HEIC, HEIF)
export const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
]);
