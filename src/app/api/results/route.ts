import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .order('order_index', { ascending: true })

  if (catError) return NextResponse.json({ error: catError.message }, { status: 500 })

  const { data: responses, error: resError } = await supabase
    .from('survey_responses')
    .select('*')
    .order('row_index', { ascending: true })

  if (resError) return NextResponse.json({ error: resError.message }, { status: 500 })

  const { data: evaluations, error: evalError } = await supabase
    .from('evaluations')
    .select('*')

  if (evalError) return NextResponse.json({ error: evalError.message }, { status: 500 })

  // レスポンスごとに評価を集計
  const evalsByResponse = new Map<string, typeof evaluations>()
  for (const ev of evaluations) {
    if (!evalsByResponse.has(ev.response_id)) evalsByResponse.set(ev.response_id, [])
    evalsByResponse.get(ev.response_id)!.push(ev)
  }

  const result = categories.map((cat) => {
    const catResponses = responses.filter((r) => r.category_id === cat.id)
    return {
      category: cat,
      responses: catResponses.map((r) => {
        const evs = evalsByResponse.get(r.id) ?? []
        const counts = { S: 0, A: 0, B: 0, C: 0, X: 0 }
        for (const ev of evs) counts[ev.rating as keyof typeof counts]++
        return {
          ...r,
          evaluationCount: evs.length,
          counts,
          evaluations: evs,
        }
      }),
    }
  })

  // 集計サマリー
  const reviewerIds = [...new Set(evaluations.map((e) => e.reviewer_name))]

  return NextResponse.json({ result, reviewerCount: reviewerIds.length })
}
