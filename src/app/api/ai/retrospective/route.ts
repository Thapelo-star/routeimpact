import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { learningId, projectId } = await req.json()

    if (!learningId || !projectId) {
      return NextResponse.json({ error: 'Missing learningId or projectId' }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch full project + learning data
    const { data: project } = await supabase
      .from('projects')
      .select(`
        title, description, theme, status,
        outcomes(outcome_title, indicators(name, target_value, unit)),
        checkins(overall_status, date),
        learnings(
          what_worked, what_didnt, recommendations,
          key_drivers, lessons_tags
        )
      `)
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const learning = project.learnings?.[0]
    if (!learning) {
      return NextResponse.json({ error: 'No learning found' }, { status: 404 })
    }

    // Build structured prompt
    const checkinStatuses = project.checkins
      ?.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((c: any) => c.overall_status)
      .join(' → ') || 'No check-ins'

    const kpiList = (project.outcomes ?? [])
      .flatMap((o: any) => o.indicators ?? [])
      .map((i: any) => `${i.name} (target: ${i.target_value ?? 'N/A'} ${i.unit ?? ''})`)
      .join(', ') || 'No KPIs defined'

    const prompt = `You are a sustainability intelligence analyst. Write a concise executive summary (3–4 sentences) for the following completed sustainability project retrospective. Be specific, data-informed, and actionable. Do not use bullet points — write in clear prose.

PROJECT: ${project.title}
THEME: ${project.theme || 'Not specified'}
DESCRIPTION: ${project.description || 'Not specified'}
KPIs: ${kpiList}
CHECK-IN TRAJECTORY: ${checkinStatuses}

RETROSPECTIVE:
- What worked: ${learning.what_worked || 'Not captured'}
- What didn't work: ${learning.what_didnt || 'Not captured'}
- Recommendations: ${learning.recommendations || 'Not captured'}
- Key drivers: ${learning.key_drivers || 'Not captured'}
- Lesson tags: ${(learning.lessons_tags ?? []).join(', ') || 'None'}

Write the executive summary now:`

    // Call Anthropic API
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!aiResponse.ok) {
      const err = await aiResponse.text()
      return NextResponse.json({ error: `AI API error: ${err}` }, { status: 500 })
    }

    const aiData = await aiResponse.json()
    const summary = aiData.content?.[0]?.text?.trim()

    if (!summary) {
      return NextResponse.json({ error: 'No summary returned from AI' }, { status: 500 })
    }

    // Save to database
    const { error: updateErr } = await supabase
      .from('learnings')
      .update({
        ai_summary: summary,
        ai_summary_generated_at: new Date().toISOString(),
      })
      .eq('id', learningId)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ summary })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}