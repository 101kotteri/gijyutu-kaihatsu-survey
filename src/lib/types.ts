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
  S: { label: 'S', description: '是非実現したい・自分1人でも取り組みたい・採用決定', color: 'rating-s' },
  A: { label: 'A', description: '良い・多少の課題はあっても前向きに検討', color: 'rating-a' },
  B: { label: 'B', description: 'どちらでもいい・意味がわからない・興味がない', color: 'rating-b' },
  C: { label: 'C', description: 'やめたほうがいい・本人の問題・無理', color: 'rating-c' },
  X: { label: 'X', description: '所属部署の問題では？技術開発室でやることではない（該当部署に報告を検討）', color: 'rating-x' },
}
