export type Rating = 'S' | 'A' | 'B' | 'C' | 'X'

export interface Category {
  id: string
  name: string
  column_key: 'A' | 'B' | 'C' | 'D'
  order_index: number
  created_at: string
}

export interface SurveyResponse {
  id: string
  category_id: string
  response_text: string
  row_index: number
  created_at: string
}

export interface Evaluation {
  id: string
  response_id: string
  reviewer_name: string
  rating: Rating
  comment: string | null
  created_at: string
  updated_at: string
}

export interface SurveyResponseWithEvaluation extends SurveyResponse {
  evaluation?: Evaluation | null
}

export const RATING_LABELS: Record<Rating, { label: string; description: string; color: string }> = {
  S: { label: 'S', description: '是非取り組みたい・自分1人でも実現したい', color: 'rating-s' },
  A: { label: 'A', description: '良い・前向きに検討', color: 'rating-a' },
  B: { label: 'B', description: 'どちらでもいい・興味がない', color: 'rating-b' },
  C: { label: 'C', description: 'やめたほうがいい・無理', color: 'rating-c' },
  X: { label: 'X', description: '他部署の課題・技術開発でやることではない', color: 'rating-x' },
}
