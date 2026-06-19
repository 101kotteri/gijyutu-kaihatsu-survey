'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Category, SurveyResponse, Evaluation, Rating } from '@/lib/types'
import ReviewCard from '@/components/ReviewCard'
import RatingButtons from '@/components/RatingButtons'
import ProgressBar from '@/components/ProgressBar'

interface ResponseWithEval extends SurveyResponse {
  evaluation: Evaluation | null
}

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const categoryId = params.categoryId as string

  const [reviewerName, setReviewerName] = useState<string | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [items, setItems] = useState<ResponseWithEval[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showComplete, setShowComplete] = useState(false)

  const currentItem = items[currentIndex] ?? null
  const ratedCount = items.filter((i) => i.evaluation !== null).length

  const loadData = useCallback(async (name: string) => {
    setLoading(true)
    setError(null)
    try {
      const catRes = await fetch('/api/categories')
      if (!catRes.ok) throw new Error('カテゴリの取得に失敗しました')
      const { categories } = await catRes.json()
      const cat = categories.find((c: Category) => c.id === categoryId)
      if (!cat) throw new Error('カテゴリが見つかりません')
      setCategory(cat)

      const res = await fetch(`/api/responses?categoryId=${categoryId}&reviewerName=${encodeURIComponent(name)}`)
      if (!res.ok) throw new Error('回答の取得に失敗しました')
      const { responses, evaluations } = await res.json()

      const evalMap = new Map<string, Evaluation>()
      for (const ev of evaluations) {
        evalMap.set(ev.response_id, ev)
      }

      const merged: ResponseWithEval[] = responses.map((r: SurveyResponse) => ({
        ...r,
        evaluation: evalMap.get(r.id) ?? null,
      }))
      setItems(merged)

      // 未評価の最初のアイテムにジャンプ
      const firstUnrated = merged.findIndex((i) => i.evaluation === null)
      setCurrentIndex(firstUnrated >= 0 ? firstUnrated : 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [categoryId])

  useEffect(() => {
    const name = localStorage.getItem('reviewerName')
    if (!name) {
      router.replace('/')
      return
    }
    setReviewerName(name)
    loadData(name)
  }, [categoryId, router, loadData])

  useEffect(() => {
    if (currentItem?.evaluation) {
      setComment(currentItem.evaluation.comment ?? '')
    } else {
      setComment('')
    }
  }, [currentIndex, currentItem])

  async function handleRate(rating: Rating) {
    if (!currentItem || !reviewerName || saving) return

    setSaving(true)
    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response_id: currentItem.id,
          reviewer_name: reviewerName,
          rating,
          comment: comment.trim() || null,
        }),
      })
      if (!res.ok) throw new Error('評価の保存に失敗しました')
      const { evaluation } = await res.json()

      setItems((prev) =>
        prev.map((item) =>
          item.id === currentItem.id ? { ...item, evaluation } : item
        )
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  function handleNext() {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      setShowComplete(true)
    }
  }

  function goTo(index: number) {
    if (index < 0 || index >= items.length) return
    setCurrentIndex(index)
    setShowComplete(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        読み込み中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-indigo-400 hover:underline"
          >
            トップに戻る
          </button>
        </div>
      </div>
    )
  }

  if (showComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-6 animate-slide-up">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-black">カテゴリ完了！</h2>
          <p className="text-gray-400">
            <span className="text-white font-bold">{category?.name}</span> の審査が完了しました。
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setShowComplete(false)
                setCurrentIndex(0)
              }}
              className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              回答を見直す
            </button>
            <button
              onClick={() => router.push('/?back=1')}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-colors"
            >
              カテゴリ選択に戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-gray-500 hover:text-white transition-colors text-sm"
          >
            ← 戻る
          </button>
          <div className="flex-1">
            <ProgressBar current={currentIndex} total={items.length} rated={ratedCount} />
          </div>
        </div>

        {/* 回答カード */}
        {currentItem && category && (
          <div className="animate-slide-up" key={currentItem.id}>
            <ReviewCard
              text={currentItem.response_text}
              index={currentIndex}
              total={items.length}
              categoryName={category.name}
            />
          </div>
        )}

        {/* 評価ボタン */}
        <div className="bg-gray-900 rounded-3xl border border-gray-800 p-6 space-y-5">
          <RatingButtons
            selected={currentItem?.evaluation?.rating ?? null}
            onSelect={handleRate}
            disabled={saving}
          />

          {/* コメント入力 */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400">
              コメント（任意）
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="補足や理由があれば記入してください..."
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {saving && (
            <p className="text-center text-xs text-indigo-400 animate-pulse">保存中...</p>
          )}

          {/* 次へボタン */}
          <button
            onClick={handleNext}
            disabled={!currentItem?.evaluation || saving}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
          >
            {currentIndex < items.length - 1 ? '次へ →' : '完了'}
          </button>
        </div>

        {/* ナビゲーション */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => goTo(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="text-sm text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-4 py-2"
          >
            ← 前へ
          </button>

          {/* ドット表示 (最大15件まで) */}
          <div className="flex gap-1.5 flex-wrap justify-center max-w-xs">
            {items.slice(0, 15).map((item, i) => (
              <button
                key={item.id}
                onClick={() => goTo(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-150 ${
                  i === currentIndex
                    ? 'bg-indigo-400 scale-125'
                    : item.evaluation
                    ? 'bg-emerald-600 hover:bg-emerald-400'
                    : 'bg-gray-700 hover:bg-gray-500'
                }`}
                title={`${i + 1}件目${item.evaluation ? ` (${item.evaluation.rating})` : ''}`}
              />
            ))}
            {items.length > 15 && (
              <span className="text-xs text-gray-600">+{items.length - 15}</span>
            )}
          </div>

          <button
            onClick={() => goTo(currentIndex + 1)}
            disabled={currentIndex === items.length - 1}
            className="text-sm text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-4 py-2"
          >
            次へ →
          </button>
        </div>
      </div>
    </div>
  )
}
