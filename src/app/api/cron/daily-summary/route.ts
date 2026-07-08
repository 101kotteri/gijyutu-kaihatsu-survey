import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, column_key')
    .order('order_index', { ascending: true })

  const { data: responses } = await supabase
    .from('survey_responses')
    .select('id, category_id')

  const { data: evaluations } = await supabase
    .from('evaluations')
    .select('reviewer_name, response_id')

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: recentComments } = await supabase
    .from('evaluations')
    .select('id')
    .not('comment', 'is', null)
    .gt('updated_at', since24h)

  const reviewerCount = new Set((evaluations ?? []).map((e) => e.reviewer_name)).size
  const totalEvaluations = evaluations?.length ?? 0
  const recentCommentCount = recentComments?.length ?? 0

  const categoryByResponseId = new Map((responses ?? []).map((r) => [r.id, r.category_id]))
  const countByCategory: Record<string, number> = {}
  for (const cat of categories ?? []) countByCategory[cat.column_key] = 0
  for (const ev of evaluations ?? []) {
    const catId = categoryByResponseId.get(ev.response_id)
    const cat = categories?.find((c) => c.id === catId)
    if (cat) countByCategory[cat.column_key]++
  }

  const now = new Date()
  const timeStr = now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const categoryLines = Object.entries(countByCategory)
    .map(([key, count]) => `${key}: ${count}件`)
    .join(' / ')

  const commentLine = recentCommentCount > 0
    ? `💬 本日のコメント更新: *${recentCommentCount}件*`
    : `💬 本日のコメント更新: なし`

  const message = {
    text: [
      `📊 *審査進捗レポート* (${timeStr})`,
      `評価済み合計: *${totalEvaluations}件* (参加中の審査員: ${reviewerCount}名)`,
      categoryLines,
      commentLine,
    ].join('\n'),
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({ error: 'SLACK_WEBHOOK_URL not set' }, { status: 500 })
  }

  const slackRes = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  })

  if (!slackRes.ok) {
    return NextResponse.json({ error: 'Failed to send Slack message' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, totalEvaluations, reviewerCount })
}
