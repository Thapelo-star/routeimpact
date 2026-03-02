// ─────────────────────────────────────────────
// RouteImpact — Similar Projects Engine
// ─────────────────────────────────────────────

import { calculateHealth } from '@/lib/health/calculateHealth'

export interface SimilarProject {
  id: string
  title: string
  description: string | null
  theme: string | null
  status: string
  health: { score: number; rag: string; trend: string }
  sharedTags: string[]
  tagOverlap: number          // 0–1 score
  outcomeCount: number
  kpiCount: number
  lessons: {
    what_worked: string | null
    what_didnt: string | null
    recommendations: string | null
    key_drivers: string | null
    lessons_tags: string[]
    ai_summary: string | null
  } | null
}

export function findSimilarProjects(
  currentProject: any,
  allProjects: any[],
  limit = 3
): SimilarProject[] {
  const currentTags: string[] = currentProject.learnings?.[0]?.lessons_tags ?? []
  const currentTheme: string  = currentProject.theme ?? ''

  return allProjects
    .filter(p =>
      p.id !== currentProject.id &&
      p.status === 'COMPLETED' &&
      p.learnings?.length > 0
    )
    .map(p => {
      const pTags: string[] = p.learnings?.[0]?.lessons_tags ?? []

      // Tag overlap: Jaccard similarity
      const union        = new Set([...currentTags, ...pTags])
      const intersection = currentTags.filter(t => pTags.includes(t))
      const tagOverlap   = union.size > 0 ? intersection.length / union.size : 0

      // Theme match bonus
      const themeBonus = p.theme === currentTheme ? 0.3 : 0

      const score = tagOverlap + themeBonus

      const health = calculateHealth(p)

      return {
        id:           p.id,
        title:        p.title,
        description:  p.description,
        theme:        p.theme,
        status:       p.status,
        health: {
          score: health.score,
          rag:   health.rag,
          trend: health.trend,
        },
        sharedTags:   intersection,
        tagOverlap,
        outcomeCount: p.outcomes?.length ?? 0,
        kpiCount:     (p.outcomes ?? []).reduce(
          (sum: number, o: any) => sum + (o.indicators?.length ?? 0), 0
        ),
        lessons: p.learnings?.[0]
          ? {
              what_worked:     p.learnings[0].what_worked,
              what_didnt:      p.learnings[0].what_didnt,
              recommendations: p.learnings[0].recommendations,
              key_drivers:     p.learnings[0].key_drivers,
              lessons_tags:    p.learnings[0].lessons_tags ?? [],
              ai_summary:      p.learnings[0].ai_summary ?? null,
            }
          : null,
        _score: score,
      }
    })
    .sort((a: any, b: any) => b._score - a._score)
    .slice(0, limit)
    .map(({ _score, ...rest }) => rest) as SimilarProject[]
}