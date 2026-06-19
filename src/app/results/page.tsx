'use client'

import { useEffect, useState } from 'react'
import { Category, Rating } from '@/lib/types'

interface ResponseResult {
  id: string
  response_text: string
  evaluationCount: number
  counts: Record<Rating, number>
  evaluations: { reviewer_name: string; rating: Rating; comment: string | null }[]
}

interface CategoryResult {
  category: Category
  responses: ResponseResult[]
}

const RATING_COLORS: Record<Rating, string> = {
  S: 'bg-yellow-400 text-yellow-900',
  A: 'bg-emerald-500 text-white',
  B: 'bg-blue-500 text-white',
  C: 'bg-orange-500 text-white',
  X: 'bg-red-600 text-white',
}

const RATING_TEXT: Record<Rating, string> = {
  S: 'text-yellow-400',
  A: 'text-emerald-400',
  B: 'text-blue-400',
  C: 'text-orange-400',
  X: 'text-red-400',
}

const RATINGS: Rating[] = ['S', 'A', 'B', 'C', 'X']
const SCORE_MAP: Partial<Record<Rating, number>> = { A: 1, B: 0, C: -1, X: -2 }

function calcScore(counts: Record<Rating, number>) {
  return (counts.A * 1) + (counts.B * 0) + (counts.C * -1) + (counts.X * -2)
}

function isAdopted(counts: Record<Rating, number>) {
  return counts.S > 0
}

type Tab = 'category' | 'score'

export default function ResultsPage() {
  const [data, setData] = useState<CategoryResult[]>([])
  const [reviewerCount, setReviewerCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [tab, setTab] = useState<Tab>('category')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/results')
      if (!res.ok) throw new Error('データの取得に失敗しました')
      const { result, reviewerCount: rc } = await res.json()
      setData(result)
      setReviewerCount(rc)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">読み込み中...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-400">{error}</div>

  const totalResponses = data.reduce((a, c) => a + c.responses.length, 0)
  const totalEvaluations = data.reduce((a, c) => a + c.responses.reduce((b, r) => b + r.evaluationCount, 0), 0)

  // スコアランキング用データ
  const allResponses = data.flatMap(({ category, responses }) =>
    responses.map((r) => ({ ...r, category }))
  )
  const adopted = allResponses.filter((r) => isAdopted(r.counts))
  const scoring = allResponses
    .filter((r) => !isAdopted(r.counts))
    .sort((a, b) => calcScore(b.counts) - calcScore(a.counts))

  const summaryText = `審査員 ${reviewerCount} 名 · 回答 ${totalResponses} 件 · 評価済み ${totalEvaluations} 件${lastUpdated ? ` · ${lastUpdated.toLocaleTimeString('ja-JP')} 時点` : ''}`

  return (
    <>
      {/* 印刷用スタイル */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          body { background: white !important; color: black !important; }
          .bg-gray-950, .bg-gray-900, .bg-gray-800 { background: white !important; }
          .text-white, .text-gray-300, .text-gray-400 { color: #111 !important; }
          .border-gray-800, .border-gray-700 { border-color: #ddd !important; }
          .text-gray-500, .text-gray-600 { color: #666 !important; }
          .text-gray-700 { color: #999 !important; }
        }
      `}</style>

      <div className="min-h-screen p-6 max-w-5xl mx-auto space-y-8">
        {/* ヘッダー */}
        <div className="no-print flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-black">審査結果シート</h1>
            <p className="text-gray-500 text-xs">{summaryText}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setLoading(true); load() }}
              className="text-xs border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white rounded-lg px-3 py-1.5 transition-colors"
            >
              更新
            </button>
            <button
              onClick={() => window.print()}
              className="text-xs border border-indigo-700 hover:border-indigo-500 text-indigo-400 hover:text-indigo-200 rounded-lg px-3 py-1.5 transition-colors"
            >
              PDF出力
            </button>
          </div>
        </div>

        {/* 印刷時タイトル */}
        <div className="hidden print:block space-y-1 mb-6">
          <h1 className="text-2xl font-black text-black">
            {tab === 'category' ? '【カテゴリ別】審査結果シート' : '【スコアランキング】審査結果シート'}
          </h1>
          <p className="text-gray-600 text-xs">{summaryText}</p>
        </div>

        {/* タブ */}
        <div className="no-print flex gap-2 border-b border-gray-800 pb-0">
          {([['category', 'カテゴリ別'], ['score', 'スコアランキング']] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                tab === key
                  ? 'bg-gray-800 text-white border border-gray-700 border-b-gray-800'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ===== カテゴリ別ビュー ===== */}
        {tab === 'category' && (
          <div className="space-y-10">
            {data.map(({ category, responses }) => (
              <div key={category.id} className="space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
                  <span className="text-3xl font-black text-gray-700">{category.column_key}</span>
                  <h2 className="text-sm font-semibold text-gray-300">{category.name}</h2>
                </div>
                <div className="space-y-3">
                  {responses.map((r, idx) => (
                    <ResponseCard key={r.id} r={r} idx={idx} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== スコアランキングビュー ===== */}
        {tab === 'score' && (
          <div className="space-y-10">
            {/* 採用 */}
            {adopted.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-yellow-800 pb-3">
                  <span className="text-xl font-black text-yellow-400">★ 採用</span>
                  <span className="text-xs text-gray-500">S評価あり — {adopted.length} 件</span>
                </div>
                <div className="space-y-3">
                  {adopted.map((r, idx) => (
                    <ScoreCard key={r.id} r={r} rank={idx + 1} adopted />
                  ))}
                </div>
              </div>
            )}

            {/* スコアランキング */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
                <span className="text-xl font-black text-gray-300">スコア順</span>
                <span className="text-xs text-gray-500">A=+1 / B=0 / C=-1 / X=-2 · {scoring.length} 件</span>
              </div>
              <div className="space-y-3">
                {scoring.map((r, idx) => (
                  <ScoreCard key={r.id} r={r} rank={idx + 1} adopted={false} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function ResponseCard({ r, idx }: { r: ResponseResult; idx: number }) {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
      <div className="flex gap-3">
        <span className="text-xs text-gray-600 mt-0.5 shrink-0">#{idx + 1}</span>
        <p className="text-white text-sm leading-relaxed">{r.response_text}</p>
      </div>

      {r.evaluationCount > 0 ? (
        <div className="space-y-2">
          <div className="flex gap-1.5">
            {RATINGS.map((rating) => {
              const count = r.counts[rating]
              const pct = r.evaluationCount > 0 ? (count / r.evaluationCount) * 100 : 0
              return (
                <div key={rating} className="flex-1 space-y-1">
                  <div className="h-6 bg-gray-800 rounded overflow-hidden">
                    <div className={`h-full ${RATING_COLORS[rating].split(' ')[0]} transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={`font-bold ${RATING_TEXT[rating]}`}>{rating}</span>
                    <span className="text-gray-500">{count}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <Comments evaluations={r.evaluations} />
        </div>
      ) : (
        <p className="text-xs text-gray-600">未評価</p>
      )}
    </div>
  )
}

function ScoreCard({ r, rank, adopted }: { r: ResponseResult & { category: Category }; rank: number; adopted: boolean }) {
  const score = calcScore(r.counts)
  return (
    <div className={`bg-gray-900 rounded-2xl border p-5 space-y-4 ${adopted ? 'border-yellow-800/60' : 'border-gray-800'}`}>
      <div className="flex gap-4 items-start">
        {/* ランク */}
        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${adopted ? 'bg-yellow-400/20 text-yellow-400' : 'bg-gray-800 text-gray-400'}`}>
          {adopted ? '★' : rank}
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 font-medium">{r.category.column_key}</span>
            {!adopted && (
              <span className={`text-sm font-black ${score > 0 ? 'text-emerald-400' : score < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {score > 0 ? `+${score}` : score}点
              </span>
            )}
            {adopted && <span className="text-xs font-bold text-yellow-400">採用</span>}
          </div>
          <p className="text-white text-sm leading-relaxed">{r.response_text}</p>
        </div>
      </div>

      {r.evaluationCount > 0 && (
        <div className="flex gap-2 flex-wrap pl-14">
          {RATINGS.map((rating) => r.counts[rating] > 0 && (
            <span key={rating} className={`text-xs font-bold px-2 py-0.5 rounded-full ${RATING_COLORS[rating]}`}>
              {rating} {r.counts[rating]}
            </span>
          ))}
          {!adopted && (
            <span className="text-xs text-gray-600">
              ({r.evaluationCount}名評価)
            </span>
          )}
        </div>
      )}

      <div className="pl-14">
        <Comments evaluations={r.evaluations} />
      </div>
    </div>
  )
}

function Comments({ evaluations }: { evaluations: ResponseResult['evaluations'] }) {
  const withComments = evaluations.filter((e) => e.comment)
  if (withComments.length === 0) return null
  return (
    <div className="space-y-1 pt-1 border-t border-gray-800">
      {withComments.map((e, i) => (
        <div key={i} className="flex gap-2 text-xs">
          <span className={`shrink-0 font-bold px-1.5 py-0.5 rounded text-[10px] ${RATING_COLORS[e.rating]}`}>{e.rating}</span>
          <span className="text-gray-400 leading-relaxed">{e.comment}</span>
        </div>
      ))}
    </div>
  )
}
