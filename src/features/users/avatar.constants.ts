export const MAX_AVATARS_PER_USER = 5;
export const MAX_AVATAR_SIZE_BYTES = 10 * 1024 * 1024;

export const AVATAR_MIME_TO_EXT: Readonly<Record<string, string>> = {
  'image/jpeg': '.jpeg',
  'image/png': '.png',
};
