'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Category } from '@/lib/types'
import CategorySelector from '@/components/CategorySelector'

export default function HomePage() {
  const router = useRouter()
  const [reviewerName, setReviewerName] = useState('')
  const [savedName, setSavedName] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [completedCounts, setCompletedCounts] = useState<Record<string, number>>({})
  const [totalCounts, setTotalCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const name = localStorage.getItem('reviewerName')
    if (name) {
      setSavedName(name)
      loadDashboard(name)
    }
  }, [])

  async function loadDashboard(name: string) {
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
          const res = await fetch(`/api/responses?categoryId=${cat.id}&reviewerName=${encodeURIComponent(name)}`)
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
    const name = reviewerName.trim()
    if (!name) return
    localStorage.setItem('reviewerName', name)
    setSavedName(name)
    loadDashboard(name)
  }

  function handleChangeName() {
    setSavedName(null)
    setReviewerName('')
    setCategories([])
    localStorage.removeItem('reviewerName')
  }

  function handleCategorySelect(categoryId: string) {
    router.push(`/review/${categoryId}`)
  }

  if (!savedName) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 animate-slide-up">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">アンケート審査</h1>
            <p className="text-gray-400 text-sm">技術開発部 — 社員アンケート結果審査</p>
          </div>

          <div className="bg-gray-900 rounded-3xl border border-gray-800 p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300" htmlFor="name">
                あなたのお名前
              </label>
              <input
                id="name"
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                placeholder="例: 山田 太郎"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleStart}
              disabled={!reviewerName.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
            >
              審査を開始する
            </button>
          </div>

          <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">評価基準</p>
            <div className="grid grid-cols-1 gap-1 text-xs text-gray-400">
              <span><span className="font-bold text-yellow-400">S</span> — 是非取り組みたい・自分1人でも実現したい</span>
              <span><span className="font-bold text-emerald-400">A</span> — 良い・前向きに検討</span>
              <span><span className="font-bold text-blue-400">B</span> — どちらでもいい・興味がない</span>
              <span><span className="font-bold text-orange-400">C</span> — やめたほうがいい・無理</span>
              <span><span className="font-bold text-red-400">X</span> — 他部署の課題・技術開発でやることではない</span>
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
          <div>
            <h1 className="text-2xl font-black">アンケート審査</h1>
            <p className="text-gray-400 text-sm mt-1">
              こんにちは、<span className="text-white font-semibold">{savedName}</span> さん
            </p>
          </div>
          <button
            onClick={handleChangeName}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors border border-gray-700 rounded-lg px-3 py-1.5"
          >
            名前を変更
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-500">読み込み中...</div>
        ) : (
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

            {Object.keys(totalCounts).length > 0 && (
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">全体の進捗</span>
                  <span className="font-bold">
                    {Object.values(completedCounts).reduce((a, b) => a + b, 0)} /{' '}
                    {Object.values(totalCounts).reduce((a, b) => a + b, 0)} 件
                  </span>
                </div>
                <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        Object.values(totalCounts).reduce((a, b) => a + b, 0) > 0
                          ? (Object.values(completedCounts).reduce((a, b) => a + b, 0) /
                              Object.values(totalCounts).reduce((a, b) => a + b, 0)) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
