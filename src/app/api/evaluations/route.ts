import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Rating } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { response_id, reviewer_name, rating, comment } = body as {
    response_id: string
    reviewer_name: string
    rating: Rating
    comment?: string
  }

  if (!response_id || !reviewer_name || !rating) {
    return NextResponse.json({ error: 'response_id, reviewer_name, rating are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('evaluations')
    .upsert(
      {
        response_id,
        reviewer_name,
        rating,
        comment: comment ?? null,
      },
      { onConflict: 'response_id,reviewer_name' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ evaluation: data })
}
