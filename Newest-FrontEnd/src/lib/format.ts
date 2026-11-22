// Formatação de datas e números (antes em lib/settings.date, settings.like e settings.post).

export function formatDate(date: string | Date) {
  const postDate = new Date(date);
  const diffInHours = Math.floor((Date.now() - postDate.getTime()) / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) return "Agora há pouco";
  if (diffInHours < 24) return `Há ${diffInHours} hora${diffInHours > 1 ? "s" : ""}`;
  if (diffInDays < 7) return `Há ${diffInDays} dia${diffInDays > 1 ? "s" : ""}`;
  return postDate.toLocaleDateString("pt-BR");
}

export function formatDateLong(date?: string | Date) {
  if (!date) return "Data não disponível";

  const formatted = new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return formatted.replace(
    /(\d{2}) de (\p{L}+)/u,
    (_, day: string, month: string) => `${day} de ${month[0].toUpperCase()}${month.slice(1)}`,
  );
}

/** 999 → "999", 1500 → "1.5k", 2000000 → "2.0M" */
export function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

/** 0 → "0 posts", 1 → "1 post", 1200 → "1.2k posts" */
export function formatPostCount(count: number): string {
  if (count === 1) return "1 post";
  return `${formatCount(count || 0)} posts`;
}
