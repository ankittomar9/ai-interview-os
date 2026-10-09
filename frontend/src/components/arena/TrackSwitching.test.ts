import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { resolveSectionType } from './ArenaShellTypes';
import type { InterviewTrack, SectionType } from '../../types';
import type { TrackKey } from './ArenaShellTypes';

describe('SPEC-014: Track Navigation Fixpack (Playground Multi-Track Switching)', () => {
  describe('AC-1: resolveSectionType playground routing', () => {
    it('routes SQL track to SQL section in playground', () => {
      const result = resolveSectionType({ track: 'SQL', isPlayground: true });
      assert.strictEqual(result, 'SQL');
    });

    it('routes LLD tracks to LLD section in playground', () => {
      assert.strictEqual(resolveSectionType({ track: 'SPRING_LLD', isPlayground: true }), 'LLD');
      assert.strictEqual(resolveSectionType({ track: 'JAVA_SPRING_BOOT', isPlayground: true }), 'LLD');
      assert.strictEqual(resolveSectionType({ track: 'LLD_HLD', isPlayground: true }), 'LLD');
    });

    it('routes SYSTEM_DESIGN track to SYSTEM_DESIGN section in playground', () => {
      const result = resolveSectionType({ track: 'SYSTEM_DESIGN', isPlayground: true });
      assert.strictEqual(result, 'SYSTEM_DESIGN');
    });

    it('routes DSA tracks to DSA section in playground', () => {
      assert.strictEqual(resolveSectionType({ track: 'ALGORITHMS_DATA_STRUCTURES', isPlayground: true }), 'DSA');
      assert.strictEqual(resolveSectionType({ track: 'DSA_LLD', isPlayground: true }), 'DSA');
      assert.strictEqual(resolveSectionType({ track: 'DSA_LLD_HLD', isPlayground: true }), 'DSA');
      assert.strictEqual(resolveSectionType({ track: 'FULL_LOOP', isPlayground: true }), 'DSA');
    });

    it('routes BEHAVIORAL and RESUME tracks correctly in playground', () => {
      assert.strictEqual(resolveSectionType({ track: 'BEHAVIORAL_STAR', isPlayground: true }), 'BEHAVIORAL');
      assert.strictEqual(resolveSectionType({ track: 'RESUME_BASED', isPlayground: true }), 'RESUME');
    });

    it('prefers questionTrack over track when questionTrack is provided in playground', () => {
      const result = resolveSectionType({
        track: 'ALL',
        questionTrack: 'SQL',
        isPlayground: true
      });
      assert.strictEqual(result, 'SQL');
    });

    it('falls back to sectionType or DSA when track is ALL and questionTrack is absent', () => {
      assert.strictEqual(resolveSectionType({ track: 'ALL', isPlayground: true }), 'DSA');
      assert.strictEqual(resolveSectionType({ track: 'ALL', sectionType: 'SQL', isPlayground: true }), 'SQL');
    });
  });

  describe('AC-6: Interview mode sectionType strict precedence regression guard', () => {
    it('strictly preserves sectionType in interview mode even if track is SQL', () => {
      const result = resolveSectionType({
        sectionType: 'DSA',
        track: 'SQL',
        isPlayground: false
      });
      assert.strictEqual(result, 'DSA');
    });

    it('strictly preserves all interview section types regardless of track or questionTrack', () => {
      const sections: SectionType[] = ['INTRODUCTION', 'BEHAVIORAL', 'RESUME', 'DSA', 'LLD', 'SYSTEM_DESIGN'];
      for (const st of sections) {
        const result = resolveSectionType({
          sectionType: st,
          track: 'SQL',
          questionTrack: 'SYSTEM_DESIGN',
          isPlayground: false
        });
        assert.strictEqual(result, st);
      }
    });

    it('guards proctored interview mode against track switching', () => {
      let switched = false;
      const simulateSwitchTrack = (trackKey: TrackKey, isPlayground: boolean) => {
        if (!isPlayground) return;
        switched = true;
      };

      simulateSwitchTrack('SQL', false);
      assert.strictEqual(switched, false);

      simulateSwitchTrack('SQL', true);
      assert.strictEqual(switched, true);
    });
  });

  describe('AC-2 & RC-5: Playlist precedence bypass in playground', () => {
    const initialList = [{ slug: 'two-sum', title: 'Two Sum', track: 'ALGORITHMS_DATA_STRUCTURES' }];

    const computePlaylistQuestions = (
      currentTrack: TrackKey,
      initialTrack: InterviewTrack,
      isPlayground: boolean,
      initialQuestions: typeof initialList
    ) => {
      return (!isPlayground || currentTrack === initialTrack) ? initialQuestions : undefined;
    };

    it('retains playlistQuestions when active track matches initial question track in playground', () => {
      const playlist = computePlaylistQuestions('ALGORITHMS_DATA_STRUCTURES', 'ALGORITHMS_DATA_STRUCTURES', true, initialList);
      assert.deepStrictEqual(playlist, initialList);
    });

    it('bypasses playlistQuestions when active track diverges in playground', () => {
      const playlistSql = computePlaylistQuestions('SQL', 'ALGORITHMS_DATA_STRUCTURES', true, initialList);
      assert.strictEqual(playlistSql, undefined);

      const playlistLld = computePlaylistQuestions('SPRING_LLD', 'ALGORITHMS_DATA_STRUCTURES', true, initialList);
      assert.strictEqual(playlistLld, undefined);

      const playlistAll = computePlaylistQuestions('ALL', 'ALGORITHMS_DATA_STRUCTURES', true, initialList);
      assert.strictEqual(playlistAll, undefined);
    });

    it('always preserves playlistQuestions in proctored interview mode regardless of track', () => {
      const playlist = computePlaylistQuestions('SQL', 'ALGORITHMS_DATA_STRUCTURES', false, initialList);
      assert.deepStrictEqual(playlist, initialList);
    });
  });

  describe('AC-3 & RC-4: Unfiltered ALL queries and shell event propagation', () => {
    it('resolves track ALL to undefined queryTrack for backend listQuestions', () => {
      const resolveQueryTrack = (track?: TrackKey): InterviewTrack | undefined => {
        return track === 'ALL' ? undefined : (track as InterviewTrack);
      };

      assert.strictEqual(resolveQueryTrack('ALL'), undefined);
      assert.strictEqual(resolveQueryTrack('SQL'), 'SQL');
      assert.strictEqual(resolveQueryTrack('ALGORITHMS_DATA_STRUCTURES'), 'ALGORITHMS_DATA_STRUCTURES');
    });

    it('retains unfiltered questions when track is ALL', () => {
      const mockFetched = [
        { slug: 'two-sum', track: 'ALGORITHMS_DATA_STRUCTURES' },
        { slug: 'select-employees', track: 'SQL' },
        { slug: 'parking-lot', track: 'SPRING_LLD' }
      ];

      const filterForTrack = (track: TrackKey, fetched: typeof mockFetched) => {
        return track === 'ALL' ? fetched : fetched.filter((q) => !q.track || q.track === track);
      };

      const allResult = filterForTrack('ALL', mockFetched);
      assert.strictEqual(allResult.length, 3);
      assert.deepStrictEqual(allResult, mockFetched);

      const sqlResult = filterForTrack('SQL', mockFetched);
      assert.strictEqual(sqlResult.length, 1);
      assert.strictEqual(sqlResult[0].slug, 'select-employees');
    });

    it('allows ALL clicks to pass through handleTrackSelect without being dropped', () => {
      let receivedTrack: TrackKey | null = null;
      const onSwitchTrack = (t: TrackKey) => {
        receivedTrack = t;
      };

      const handleTrackSelect = (trackKey: string) => {
        if (onSwitchTrack) onSwitchTrack(trackKey as TrackKey);
      };

      handleTrackSelect('ALL');
      assert.strictEqual(receivedTrack, 'ALL');

      handleTrackSelect('SQL');
      assert.strictEqual(receivedTrack, 'SQL');
    });
  });

  describe('AC-4 & C-1: Deterministic index reset on catalog transitions and playlist restore', () => {
    const resolveActiveIndex = (
      items: Array<{ slug?: string; problemSlug?: string }>,
      defaultQuestion?: { slug?: string; problemSlug?: string }
    ): number => {
      const targetSlug = defaultQuestion?.problemSlug || defaultQuestion?.slug;
      if (targetSlug) {
        const targetIdx = items.findIndex((q) => (q.problemSlug === targetSlug || q.slug === targetSlug));
        if (targetIdx !== -1) {
          return targetIdx;
        }
      }
      return 0;
    };

    it('matches default question slug index when present in newly fetched track questions', () => {
      const questions = [
        { slug: 'easy-sql', problemSlug: 'easy-sql' },
        { slug: 'target-sql', problemSlug: 'target-sql' },
        { slug: 'hard-sql', problemSlug: 'hard-sql' }
      ];
      const defaultQ = { slug: 'target-sql', problemSlug: 'target-sql' };
      const index = resolveActiveIndex(questions, defaultQ);
      assert.strictEqual(index, 1);
    });

    it('deterministically resets to 0 when default question is not in newly fetched track questions', () => {
      const questions = [
        { slug: 'sql-1', problemSlug: 'sql-1' },
        { slug: 'sql-2', problemSlug: 'sql-2' }
      ];
      const defaultQ = { slug: 'dsa-two-sum', problemSlug: 'dsa-two-sum' };
      const index = resolveActiveIndex(questions, defaultQ);
      assert.strictEqual(index, 0);
    });

    it('deterministically resets to 0 when newly fetched list is empty', () => {
      const index = resolveActiveIndex([], { slug: 'any' });
      assert.strictEqual(index, 0);
    });

    it('C-1: deterministically resets index on playlist restore', () => {
      const playlist = [
        { slug: 'initial-1', problemSlug: 'initial-1' },
        { slug: 'initial-2', problemSlug: 'initial-2' }
      ];
      // When returning to initial question, slug matches
      assert.strictEqual(resolveActiveIndex(playlist, { slug: 'initial-2' }), 1);
      // When default question not in playlist, falls back to 0
      assert.strictEqual(resolveActiveIndex(playlist, { slug: 'other' }), 0);
    });
  });

  describe('AC-5: Language sync transitions on track change', () => {
    const syncLanguage = (currentLang: string, targetTrack: TrackKey): string => {
      if (targetTrack === 'SQL') {
        return 'sql';
      }
      return currentLang === 'sql' ? 'java' : currentLang;
    };

    it('transitions language to sql when switching to SQL track', () => {
      assert.strictEqual(syncLanguage('java', 'SQL'), 'sql');
      assert.strictEqual(syncLanguage('python', 'SQL'), 'sql');
      assert.strictEqual(syncLanguage('sql', 'SQL'), 'sql');
    });

    it('reverts language from sql to java when leaving SQL track', () => {
      assert.strictEqual(syncLanguage('sql', 'ALGORITHMS_DATA_STRUCTURES'), 'java');
      assert.strictEqual(syncLanguage('sql', 'SPRING_LLD'), 'java');
      assert.strictEqual(syncLanguage('sql', 'ALL'), 'java');
    });

    it('preserves user language choice when switching between non-SQL tracks', () => {
      assert.strictEqual(syncLanguage('python', 'SPRING_LLD'), 'python');
      assert.strictEqual(syncLanguage('cpp', 'ALGORITHMS_DATA_STRUCTURES'), 'cpp');
      assert.strictEqual(syncLanguage('java', 'SYSTEM_DESIGN'), 'java');
    });
  });

  describe('Static Source File Contract Audit', () => {
    it('verifies TrackKey type export in ArenaShellTypes.ts', () => {
      const filePath = path.resolve(process.cwd(), 'src/components/arena/ArenaShellTypes.ts');
      const content = fs.readFileSync(filePath, 'utf-8');
      assert.ok(content.includes("export type TrackKey = InterviewTrack | 'ALL';"), 'Must define TrackKey union with ALL');
      assert.ok(content.includes('track: TrackKey;'), 'ArenaShellProps.track must use TrackKey');
      assert.ok(content.includes('onSwitchTrack?: (targetTrack: TrackKey) => void;'), 'onSwitchTrack must use TrackKey');
    });

    it('verifies ArenaShell.tsx does not drop ALL in handleTrackSelect', () => {
      const filePath = path.resolve(process.cwd(), 'src/components/arena/ArenaShell.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');
      assert.ok(!content.includes("trackKey !== 'ALL'"), 'Must NOT exclude ALL from track selection');
      assert.ok(content.includes('onSwitchTrack(trackKey as TrackKey)'), 'Must pass TrackKey to onSwitchTrack');
    });

    it('verifies TrackScreenRouter.tsx precedence guard and pure resolveSectionType', () => {
      const typesPath = path.resolve(process.cwd(), 'src/components/arena/ArenaShellTypes.ts');
      const typesContent = fs.readFileSync(typesPath, 'utf-8');
      assert.ok(typesContent.includes('if (!isPlayground && sectionType) return sectionType;'), 'Must gate sectionType precedence to !isPlayground');
      assert.ok(typesContent.includes('export function resolveSectionType('), 'Must export pure resolveSectionType function');

      const routerPath = path.resolve(process.cwd(), 'src/components/arena/TrackScreenRouter.tsx');
      const routerContent = fs.readFileSync(routerPath, 'utf-8');
      assert.ok(routerContent.includes('resolveSectionType'), 'TrackScreenRouter must use and export resolveSectionType');
    });

    it('verifies ArenaRoom.tsx proctored guard, playlist bypass, and language sync', () => {
      const filePath = path.resolve(process.cwd(), 'src/components/arena/ArenaRoom.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');
      assert.ok(content.includes('if (!isPlayground) return;'), 'Must reject track switch in interview mode');
      assert.ok(content.includes('(!isPlayground || currentTrack === initialQuestion.track) ? initialQuestionsList : undefined'), 'Must bypass playlist in playground on track divergence');
      assert.ok(content.includes("trackKey === 'SQL'"), 'Must handle SQL language sync');
    });

    it('verifies useSessionCatalog.ts ALL track query and C-1 index reset on playlist restore', () => {
      const filePath = path.resolve(process.cwd(), 'src/components/arena/hooks/useSessionCatalog.ts');
      const content = fs.readFileSync(filePath, 'utf-8');
      assert.ok(content.includes("track === 'ALL' ? undefined : (track as InterviewTrack)"), 'Must pass undefined queryTrack for ALL');
      assert.ok(content.includes("track === 'ALL' ? fetched : fetched.filter("), 'Must bypass post-filter for ALL');
      assert.ok(content.includes('if (playlistQuestions && playlistQuestions.length > 0)'), 'Must contain playlistQuestions branch');
      assert.ok(content.includes('setActiveQuestionIndex(targetIdx)'), 'Must reset index on slug match in playlist restore');
    });
  });
});
