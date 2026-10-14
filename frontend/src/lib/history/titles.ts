const titleCache = new Map<string, string>();

export function clearTitleCache(): void {
  titleCache.clear();
}

export function prettifySlug(slug: string): string {
  if (!slug || typeof slug !== 'string') return 'Unknown Question';

  let cleaned = slug.trim().toLowerCase();
  const prefixes = ['dsa-', 'hld-', 'lld-', 'sql-', 'beh-', 'behavioral-'];
  for (const p of prefixes) {
    if (cleaned.startsWith(p)) {
      cleaned = cleaned.slice(p.length);
      break;
    }
  }

  const words = cleaned
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));

  return words.join(' ') || slug;
}

export type TitlesFetcher = (slugs: string[]) => Promise<Record<string, string>>;

export async function resolveTitles(
  slugs: string[],
  fetcher?: TitlesFetcher
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (!slugs || slugs.length === 0) return result;

  const uniqueSlugs = Array.from(new Set(slugs.filter(Boolean)));
  const missingSlugs: string[] = [];

  for (const slug of uniqueSlugs) {
    if (titleCache.has(slug)) {
      result[slug] = titleCache.get(slug)!;
    } else {
      missingSlugs.push(slug);
    }
  }

  if (missingSlugs.length > 0 && fetcher) {
    const BATCH_SIZE = 50;
    for (let i = 0; i < missingSlugs.length; i += BATCH_SIZE) {
      const batch = missingSlugs.slice(i, i + BATCH_SIZE);
      try {
        const fetched = await fetcher(batch);
        for (const slug of batch) {
          const title = fetched[slug] || prettifySlug(slug);
          titleCache.set(slug, title);
          result[slug] = title;
        }
      } catch (err) {
        console.warn('[titles] Failed to fetch batch titles, falling back to prettified slugs', err);
        for (const slug of batch) {
          const fallback = prettifySlug(slug);
          titleCache.set(slug, fallback);
          result[slug] = fallback;
        }
      }
    }
  } else if (missingSlugs.length > 0) {
    for (const slug of missingSlugs) {
      const fallback = prettifySlug(slug);
      titleCache.set(slug, fallback);
      result[slug] = fallback;
    }
  }

  return result;
}
