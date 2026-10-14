import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  prettifySlug,
  resolveTitles,
  clearTitleCache,
  type TitlesFetcher,
} from './titles.js';

describe('titles lib', () => {
  beforeEach(() => {
    clearTitleCache();
  });

  it('prettifySlug: handles family prefixes, multi-dash, and clean slugs', () => {
    assert.strictEqual(prettifySlug('dsa-two-sum-target'), 'Two Sum Target');
    assert.strictEqual(prettifySlug('hld-url-shortener-bitly'), 'Url Shortener Bitly');
    assert.strictEqual(prettifySlug('lld-parking-lot-system'), 'Parking Lot System');
    assert.strictEqual(prettifySlug('sql-second-highest-salary'), 'Second Highest Salary');
    assert.strictEqual(prettifySlug('beh-tell-me-about-a-time'), 'Tell Me About A Time');
    assert.strictEqual(prettifySlug('behavioral-conflict-resolution'), 'Conflict Resolution');
    assert.strictEqual(prettifySlug('already-clean-slug'), 'Already Clean Slug');
    assert.strictEqual(prettifySlug('single'), 'Single');
    assert.strictEqual(prettifySlug(''), 'Unknown Question');
  });

  it('resolveTitles: chunks >50 slugs into batches of <= 50', async () => {
    const slugs: string[] = [];
    for (let i = 1; i <= 75; i++) {
      slugs.push(`dsa-problem-${i}`);
    }

    const batchCalls: string[][] = [];
    const spyFetcher: TitlesFetcher = async (batch) => {
      batchCalls.push(batch);
      const res: Record<string, string> = {};
      for (const s of batch) {
        res[s] = `Title for ${s}`;
      }
      return res;
    };

    const titles = await resolveTitles(slugs, spyFetcher);

    assert.strictEqual(batchCalls.length, 2);
    assert.strictEqual(batchCalls[0].length, 50);
    assert.strictEqual(batchCalls[1].length, 25);
    assert.strictEqual(Object.keys(titles).length, 75);
    assert.strictEqual(titles['dsa-problem-1'], 'Title for dsa-problem-1');
  });

  it('resolveTitles: cache hit skips fetcher invocation on second call', async () => {
    let callCount = 0;
    const spyFetcher: TitlesFetcher = async (batch) => {
      callCount++;
      return {
        'dsa-two-sum': 'Two Sum',
      };
    };

    const first = await resolveTitles(['dsa-two-sum'], spyFetcher);
    assert.strictEqual(callCount, 1);
    assert.strictEqual(first['dsa-two-sum'], 'Two Sum');

    const second = await resolveTitles(['dsa-two-sum'], spyFetcher);
    assert.strictEqual(callCount, 1); // cached, not called again
    assert.strictEqual(second['dsa-two-sum'], 'Two Sum');
  });

  it('resolveTitles: degrades gracefully to prettifySlug when fetcher returns missing title or throws', async () => {
    const failingFetcher: TitlesFetcher = async () => {
      throw new Error('Network error');
    };

    const titles = await resolveTitles(['dsa-merge-intervals'], failingFetcher);
    assert.strictEqual(titles['dsa-merge-intervals'], 'Merge Intervals');
  });
});
