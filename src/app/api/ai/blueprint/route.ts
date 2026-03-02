import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { type, theme, themes, outcomeTitle, description } = await req.json()

    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    let prompt = ''

    // ── SDG suggestions ──
    if (type === 'sdgs') {
      prompt = `You are a sustainability expert. Given these sustainability themes: ${themes?.join(', ')}, suggest the most relevant UN SDGs.

Return ONLY a valid JSON array of strings. Each string must be exactly one of these options:
"SDG 1 · No Poverty", "SDG 2 · Zero Hunger", "SDG 3 · Good Health", "SDG 4 · Quality Education",
"SDG 5 · Gender Equality", "SDG 6 · Clean Water", "SDG 7 · Clean Energy", "SDG 8 · Decent Work",
"SDG 9 · Industry & Innovation", "SDG 10 · Reduced Inequalities", "SDG 11 · Sustainable Cities",
"SDG 12 · Responsible Consumption", "SDG 13 · Climate Action", "SDG 14 · Life Below Water",
"SDG 15 · Life on Land", "SDG 16 · Peace & Justice", "SDG 17 · Partnerships"

Return 3-5 most relevant SDGs. Return ONLY the JSON array, nothing else.`
    }

    // ── Outcome suggestions ──
    else if (type === 'outcomes') {
      prompt = `You are a sustainability expert. Suggest 2 specific, measurable sustainability outcomes for a ${theme} themed project.
${description ? `Project description: ${description}` : ''}

Return ONLY a valid JSON array with this exact structure:
[
  {
    "outcome_title": "short measurable outcome title",
    "outcome_description": "1-2 sentence description of how it will be achieved"
  }
]

Make outcomes specific, ambitious but realistic, and measurable. Return ONLY the JSON array, nothing else.`
    }

    // ── KPI/Indicator suggestions ──
    else if (type === 'indicators') {
      prompt = `You are a sustainability measurement expert. Suggest 2 specific KPIs to measure this outcome: "${outcomeTitle}" (theme: ${theme}).

Return ONLY a valid JSON array with this exact structure:
[
  {
    "name": "indicator name",
    "unit": "unit of measurement",
    "baseline_value": "typical starting value as a number or null",
    "target_value": "ambitious but realistic target as a number or null",
    "frequency": "monthly",
    "measurement_method": "brief description of how to measure this"
  }
]

Return ONLY the JSON array, nothing else.`
    }

    // ── Risk/Assumption suggestions ──
    else if (type === 'assumptions') {
      prompt = `You are a sustainability risk expert. Suggest 3 common risks or assumptions for a ${themes?.join(', ')} sustainability project.
${description ? `Project description: ${description}` : ''}

Return ONLY a valid JSON array with this exact structure:
[
  {
    "text": "specific assumption or risk description",
    "risk_level": "HIGH" | "MEDIUM" | "LOW"
  }
]

Return ONLY the JSON array, nothing else.`
    }

    else {
      return NextResponse.json({ error: 'Invalid suggestion type' }, { status: 400 })
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
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!aiResponse.ok) {
      const err = await aiResponse.text()
      return NextResponse.json({ error: `AI API error: ${err}` }, { status: 500 })
    }

    const aiData = await aiResponse.json()
    const raw = aiData.content?.[0]?.text?.trim()

    // Strip markdown fences if present
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({ suggestions: parsed })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}