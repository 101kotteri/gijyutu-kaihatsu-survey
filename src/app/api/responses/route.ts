import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get('categoryId')
  const reviewerName = searchParams.get('reviewerName')

  if (!categoryId) {
    return NextResponse.json({ error: 'categoryId is required' }, { status: 400 })
  }

  const { data: responses, error } = await supabase
    .from('survey_responses')
    .select('*')
    .eq('category_id', categoryId)
    .order('row_index', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!reviewerName || responses.length === 0) {
    return NextResponse.json({ responses, evaluations: [] })
  }

  const responseIds = responses.map((r) => r.id)
  const { data: evaluations, error: evalError } = await supabase
    .from('evaluations')
    .select('*')
    .in('response_id', responseIds)
    .eq('reviewer_name', reviewerName)

  if (evalError) {
    return NextResponse.json({ error: evalError.message }, { status: 500 })
  }

  return NextResponse.json({ responses, evaluations: evaluations ?? [] })
}
