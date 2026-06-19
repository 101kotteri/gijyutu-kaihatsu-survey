'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Category } from '@/lib/types'
import CategorySelector from '@/components/CategorySelector'

function generateAnonymousId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let id = ''
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return `審査員#${id}`
}

function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [reviewerId, setReviewerId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [completedCounts, setCompletedCounts] = useState<Record<string, number>>({})
  const [totalCounts, setTotalCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forceShowCategories, setForceShowCategories] = useState(false)

  useEffect(() => {
    if (searchParams.get('back') === '1') setForceShowCategories(true)
    const stored = localStorage.getItem('reviewerName')
    if (stored) {
      setReviewerId(stored)
      loadDashboard(stored)
    }
  }, [])

  async function loadDashboard(id: string) {
    setLoading(true)
    setError(null)
    try {
      const catRes = await fetch('/api/categories')
      if (!catRes.ok) throw new Error('カテゴリの取得に失敗しました')
      const { categories: cats } = await catRes.json()
      setCategories(cats)

      const counts: Record<string, number> = {}
      const totals: Record<string, number> = {}

      await Promise.all(
        cats.map(async (cat: Category) => {
          const res = await fetch(`/api/responses?categoryId=${cat.id}&reviewerName=${encodeURIComponent(id)}`)
          if (!res.ok) return
          const { responses, evaluations } = await res.json()
          totals[cat.id] = responses.length
          counts[cat.id] = evaluations.length
        })
      )

      setTotalCounts(totals)
      setCompletedCounts(counts)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  function handleStart() {
    const id = generateAnonymousId()
    localStorage.setItem('reviewerName', id)
    setReviewerId(id)
    loadDashboard(id)
  }

  function handleCategorySelect(categoryId: string) {
    router.push(`/review/${categoryId}`)
  }

  if (!reviewerId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 animate-slide-up">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">アンケート審査</h1>
            <p className="text-gray-400 text-sm">技術開発室 — 社員アンケート結果審査</p>
          </div>

          <div className="bg-gray-900 rounded-3xl border border-gray-800 p-8 space-y-6">
            <button
              onClick={handleStart}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors"
            >
              審査を開始する
            </button>
            <p className="text-center text-xs text-gray-500">
              名前入力は不要です。個人は特定されません。
            </p>
          </div>

          <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">評価基準</p>
            <div className="grid grid-cols-1 gap-1 text-xs text-gray-400">
              <span><span className="font-bold text-yellow-400">S</span> — 是非実現したい・自分1人でも取り組みたい・採用決定</span>
              <span><span className="font-bold text-emerald-400">A</span> — 良い・多少の課題はあっても前向きに検討</span>
              <span><span className="font-bold text-blue-400">B</span> — どちらでもいい・意味がわからない・興味がない</span>
              <span><span className="font-bold text-orange-400">C</span> — やめたほうがいい・本人の問題・無理</span>
              <span><span className="font-bold text-red-400">X</span> — 所属部署の問題では？技術開発室でやることではない</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-8 animate-slide-up">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black">アンケート審査</h1>
          <button
            onClick={() => {
              if (!confirm('全ての回答をリセットして最初からやり直しますか？')) return
              localStorage.removeItem('reviewerName')
              setReviewerId(null)
              setCategories([])
              setCompletedCounts({})
              setTotalCounts({})
              setForceShowCategories(false)
            }}
            className="text-xs text-gray-600 hover:text-red-400 transition-colors border border-gray-800 hover:border-red-800 rounded-lg px-3 py-1.5"
          >
            {reviewerId} · やり直す
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-500">読み込み中...</div>
        ) : (() => {
          const totalAll = Object.values(totalCounts).reduce((a, b) => a + b, 0)
          const completedAll = Object.values(completedCounts).reduce((a, b) => a + b, 0)
          const allDone = totalAll > 0 && completedAll === totalAll

          if (allDone && !forceShowCategories) {
            return (
              <div className="text-center space-y-4 py-12 animate-slide-up">
                <div className="text-6xl">🎊</div>
                <h2 className="text-2xl font-black">お疲れ様でした！</h2>
                <p className="text-gray-400 text-sm">全 {totalAll} 件の審査が完了しました。</p>
                <button
                  onClick={() => setForceShowCategories(true)}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors border border-gray-700 rounded-lg px-4 py-2"
                >
                  見直す
                </button>
              </div>
            )
          }

          return (
            <>
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
                  カテゴリを選択
                </h2>
                <CategorySelector
                  categories={categories}
                  completedCounts={completedCounts}
                  totalCounts={totalCounts}
                  onSelect={handleCategorySelect}
                />
              </div>

              {totalAll > 0 && (
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">全体の進捗</span>
                    <span className="font-bold">{completedAll} / {totalAll} 件</span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${(completedAll / totalAll) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )
        })()}
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense>
      <HomePage />
    </Suspense>
  )
}
