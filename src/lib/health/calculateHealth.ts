// ─────────────────────────────────────────────
// RouteImpact — Health Score Engine
// ─────────────────────────────────────────────

export type HealthRag = 'GREEN' | 'AMBER' | 'RED' | 'NONE'

export interface HealthResult {
  score: number          // 0–100
  rag: HealthRag
  trend: 'improving' | 'declining' | 'stable' | 'no_data'
  isDrifting: boolean
  driftReasons: string[]
  breakdown: {
    kpiScore: number
    redKpiPenalty: number
    missedCheckinPenalty: number
    assumptionPenalty: number
  }
}

// ── Helpers ───────────────────────────────────

function daysSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
}

// ── Main Calculator ───────────────────────────

export function calculateHealth(project: any): HealthResult {
  const driftReasons: string[] = []

  // ── 1. KPI Performance Score (0–60 pts) ──
  // Gather all indicators with both a target and a latest value
  const allIndicators = (project.outcomes ?? []).flatMap((o: any) => o.indicators ?? [])

  // For each indicator, find the latest kpi_update across all checkins
  const allKpiUpdates = (project.checkins ?? []).flatMap((c: any) => c.kpi_updates ?? [])

  let kpiScore = 50 // neutral if no data
  let redKpiCount = 0

  if (allIndicators.length > 0) {
    const performances: number[] = []

    for (const ind of allIndicators) {
      const updates = allKpiUpdates
        .filter((u: any) => u.indicator_id === ind.id)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      const latest = updates[0]
      if (!latest) continue

      if (latest.status === 'RED') redKpiCount++

      // If we have a numeric target, compute % achieved
      if (ind.target_value && ind.target_value > 0 && latest.value !== null) {
        const pct = Math.min((latest.value / ind.target_value) * 100, 100)
        performances.push(pct)
      } else {
        // Status-only scoring
        if (latest.status === 'GREEN')  performances.push(100)
        if (latest.status === 'AMBER')  performances.push(60)
        if (latest.status === 'RED')    performances.push(20)
      }
    }

    if (performances.length > 0) {
      kpiScore = performances.reduce((a, b) => a + b, 0) / performances.length
    }
  }

  // ── 2. RED KPI Penalty (–8 pts each) ──
  const redKpiPenalty = redKpiCount * 8
  if (redKpiCount >= 2) {
    driftReasons.push(`${redKpiCount} KPIs are RED`)
  }

  // ── 3. Missed Check-in Penalty (–15 pts) ──
  let missedCheckinPenalty = 0
  const sortedCheckins = (project.checkins ?? []).sort((a: any, b: any) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const lastCheckin = sortedCheckins[0]

  if (!lastCheckin) {
    missedCheckinPenalty = 15
    driftReasons.push('No check-ins recorded')
  } else if (daysSince(lastCheckin.date) > 30) {
    missedCheckinPenalty = 15
    driftReasons.push(`No check-in for ${Math.floor(daysSince(lastCheckin.date))} days`)
  }

  // ── 4. Assumption Penalty (–10 pts each HIGH failed) ──
  const assumptions = project.assumptions ?? []
  const failedHigh = assumptions.filter(
    (a: any) => a.risk_level === 'HIGH' && a.status === 'FAILED'
  ).length
  const assumptionPenalty = failedHigh * 10
  if (failedHigh > 0) {
    driftReasons.push(`${failedHigh} HIGH-risk assumption${failedHigh > 1 ? 's' : ''} failed`)
  }

  // ── 5. Compute final score ──
  // kpiScore is 0–100, we weight it to 60% of total, then deduct penalties
  const raw = (kpiScore * 0.6) - redKpiPenalty - missedCheckinPenalty - assumptionPenalty
  const score = Math.max(0, Math.min(100, Math.round(raw + 40))) // +40 base so 100% KPI = 100

  // ── 6. RAG from score ──
  const rag: HealthRag =
    score >= 70 ? 'GREEN' :
    score >= 40 ? 'AMBER' : 'RED'

  // ── 7. Trend from last 2 checkins ──
  let trend: HealthResult['trend'] = 'no_data'
  if (sortedCheckins.length >= 2) {
    const latest  = sortedCheckins[0].overall_status
    const previous = sortedCheckins[1].overall_status
    const statusRank: Record<string, number> = { GREEN: 2, AMBER: 1, RED: 0 }
    const diff = (statusRank[latest] ?? 1) - (statusRank[previous] ?? 1)
    trend = diff > 0 ? 'improving' : diff < 0 ? 'declining' : 'stable'
  } else if (sortedCheckins.length === 1) {
    trend = 'stable'
  }

  // ── 8. Drift flag ──
  const isDrifting = score < 50 || driftReasons.length >= 2

  return {
    score,
    rag,
    trend,
    isDrifting,
    driftReasons,
    breakdown: {
      kpiScore: Math.round(kpiScore),
      redKpiPenalty,
      missedCheckinPenalty,
      assumptionPenalty,
    },
  }
}

// ── Portfolio-level aggregator ────────────────

export function calculatePortfolioHealth(projects: any[]): {
  avgScore: number
  rag: HealthRag
  driftingCount: number
  scores: { id: string; score: number; rag: HealthRag; isDrifting: boolean }[]
} {
  if (!projects.length) return { avgScore: 0, rag: 'NONE', driftingCount: 0, scores: [] }

  const scores = projects.map(p => {
    const h = calculateHealth(p)
    return { id: p.id, score: h.score, rag: h.rag, isDrifting: h.isDrifting }
  })

  const avgScore = Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length)
  const driftingCount = scores.filter(s => s.isDrifting).length
  const rag: HealthRag =
    avgScore >= 70 ? 'GREEN' :
    avgScore >= 40 ? 'AMBER' : 'RED'

  return { avgScore, rag, driftingCount, scores }
}