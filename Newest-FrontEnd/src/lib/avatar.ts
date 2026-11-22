export const DEFAULT_AVATAR = "/profilePicture.png";

/**
 * Avatares ficam no Cloudinary (URL completa). Caminhos antigos `/uploads/...`
 * do back não existem mais, então caem na foto padrão.
 */
export function getAvatarUrl(avatar?: string | null): string {
  if (avatar && /^https?:\/\//.test(avatar)) return avatar;
  return DEFAULT_AVATAR;
}
