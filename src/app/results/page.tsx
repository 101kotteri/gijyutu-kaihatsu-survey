'use client'

import { useEffect, useState } from 'react'
import { Category, Rating } from '@/lib/types'

interface RawEvaluation {
  reviewer_name: string
  rating: Rating
  comment: string | null
}

interface ResponseResult {
  id: string
  response_text: string
  evaluationCount: number
  counts: Record<Rating, number>
  evaluations: RawEvaluation[]
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

// 除外対象として比較する審査員ID
const EXCLUDED_REVIEWER_ID = '審査員#LWG9CN'

function calcScore(counts: Record<Rating, number>) {
  return (counts.S * 2) + (counts.A * 1) + (counts.B * 0) + (counts.C * -1)
}

// 指定の審査員を除外した上で件数を再計算する
function recount(evaluations: RawEvaluation[], excludeReviewer: boolean) {
  const filtered = excludeReviewer
    ? evaluations.filter((e) => e.reviewer_name !== EXCLUDED_REVIEWER_ID)
    : evaluations
  const counts: Record<Rating, number> = { S: 0, A: 0, B: 0, C: 0, X: 0 }
  for (const ev of filtered) counts[ev.rating]++
  return { counts, evaluations: filtered, evaluationCount: filtered.length }
}

type Tab = 'category' | 'totalScore' | 'sRanking' | 'xRanking'

const TAB_LABELS: Record<Tab, string> = {
  category: 'カテゴリ別',
  totalScore: '総合スコア',
  sRanking: 'S評価ランキング',
  xRanking: 'X評価ランキング',
}

export default function ResultsPage() {
  const [data, setData] = useState<CategoryResult[]>([])
  const [reviewerCount, setReviewerCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [tab, setTab] = useState<Tab>('category')
  const [excludeReviewer, setExcludeReviewer] = useState(false)

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

  // フィルタ適用済みの全回答データ (カテゴリ情報付き)
  const allResponses = data.flatMap(({ category, responses }) =>
    responses.map((r) => {
      const { counts, evaluations, evaluationCount } = recount(r.evaluations, excludeReviewer)
      return { ...r, category, counts, evaluations, evaluationCount }
    })
  )

  const totalScoreRanking = [...allResponses].sort((a, b) => calcScore(b.counts) - calcScore(a.counts))
  const sRanking = allResponses
    .filter((r) => r.counts.S > 0)
    .sort((a, b) => b.counts.S - a.counts.S || calcScore(b.counts) - calcScore(a.counts))
  const xRanking = allResponses
    .filter((r) => r.counts.X >= 1)
    .sort((a, b) => b.counts.X - a.counts.X)

  const summaryText = `審査員 ${reviewerCount} 名 · 回答 ${totalResponses} 件 · 評価済み ${totalEvaluations} 件${lastUpdated ? ` · ${lastUpdated.toLocaleTimeString('ja-JP')} 時点` : ''}`
  const filterText = excludeReviewer ? '技術開発室のみ集計' : '全員の評価を集計'

  return (
    <>
      {/* 印刷用スタイル */}
      <style>{`
        @page { size: A4 portrait; margin: 33mm 4mm 1mm 4mm; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; font-size: 14px !important; }
          .bg-gray-950, .bg-gray-900, .bg-gray-800 { background: white !important; }
          .text-white, .text-gray-300, .text-gray-400 { color: #111 !important; }
          .border-gray-800, .border-gray-700 { border-color: #ccc !important; }
          .text-gray-500, .text-gray-600 { color: #555 !important; }
          .text-gray-700 { color: #888 !important; }

          /* カードが途中で切れないようにする */
          .print-card { break-inside: avoid; page-break-inside: avoid; }

          /* カードの余白を縮小 */
          .print-card { padding: 6px 8px !important; margin-bottom: 4px !important; }
          .print-card p, .print-card span { font-size: 13px !important; line-height: 1.5 !important; }

          /* カテゴリ見出しも切れないように */
          .print-section-header { break-after: avoid; page-break-after: avoid; }

          /* スペースを縮小 */
          .space-y-10 > * + * { margin-top: 14px !important; }
          .space-y-4 > * + * { margin-top: 4px !important; }
          .space-y-3 > * + * { margin-top: 4px !important; }
          .space-y-2 > * + * { margin-top: 2px !important; }
          .p-5 { padding: 6px 8px !important; }
          .p-6 { padding: 6px 8px !important; }
          .gap-4 { gap: 6px !important; }
          .gap-3 { gap: 4px !important; }
          .gap-2 { gap: 2px !important; }
          .h-6 { height: 12px !important; }
          .w-10, .h-10 { width: 24px !important; height: 24px !important; font-size: 14px !important; }
          .pl-14 { padding-left: 28px !important; }
          .text-3xl { font-size: 20px !important; }
          .text-2xl { font-size: 16px !important; }
          .text-sm { font-size: 13px !important; }
          .text-xs { font-size: 12px !important; }
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
          <h1 className="text-2xl font-black text-black">【{TAB_LABELS[tab]}】審査結果シート</h1>
          <p className="text-gray-600 text-xs">{summaryText}</p>
        </div>

        {/* タブ */}
        <div className="no-print flex gap-2 border-b border-gray-800 pb-0 flex-wrap">
          {(Object.keys(TAB_LABELS) as Tab[]).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                tab === key
                  ? 'bg-gray-800 text-white border border-gray-700 border-b-gray-800'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </div>

        {/* 審査員フィルタ (カテゴリ別以外で表示) */}
        {tab !== 'category' && (
          <div className="no-print flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
            <span className="text-xs text-gray-400">集計対象:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setExcludeReviewer(false)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  !excludeReviewer ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                全員
              </button>
              <button
                onClick={() => setExcludeReviewer(true)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  excludeReviewer ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                技術開発室
              </button>
            </div>
          </div>
        )}

        {/* ===== カテゴリ別ビュー ===== */}
        {tab === 'category' && (
          <div className="space-y-10">
            {data.map(({ category, responses }) => (
              <div key={category.id} className="space-y-4">
                <div className="print-section-header flex items-center gap-3 border-b border-gray-800 pb-3">
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

        {/* ===== 総合スコアランキング ===== */}
        {tab === 'totalScore' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">S=+2 / A=+1 / B=0 / C=-1（X除く）で合計 · {totalScoreRanking.length} 件</p>
            {totalScoreRanking.map((r, idx) => (
              <ScoreCard key={r.id} r={r} rank={idx + 1} highlightRating={null} />
            ))}
          </div>
        )}

        {/* ===== S評価ランキング ===== */}
        {tab === 'sRanking' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">S評価が1件以上ある回答を、S件数の多い順に表示 · {sRanking.length} 件</p>
            {sRanking.map((r, idx) => (
              <ScoreCard key={r.id} r={r} rank={idx + 1} highlightRating="S" />
            ))}
          </div>
        )}

        {/* ===== X評価ランキング ===== */}
        {tab === 'xRanking' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">X評価があった回答をX件数の多い順に表示 · {xRanking.length} 件</p>
            {xRanking.map((r, idx) => (
              <ScoreCard key={r.id} r={r} rank={idx + 1} highlightRating="X" />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function ResponseCard({ r, idx }: { r: ResponseResult; idx: number }) {
  return (
    <div className="print-card bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
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

function ScoreCard({
  r,
  rank,
  highlightRating,
}: {
  r: ResponseResult & { category: Category }
  rank: number
  highlightRating: Rating | null
}) {
  const score = calcScore(r.counts)
  return (
    <div className="print-card bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
      <div className="flex gap-4 items-start">
        <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg bg-gray-800 text-gray-400">
          {rank}
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 font-medium">{r.category.column_key}</span>
            {highlightRating !== 'X' && (
              <span className={`text-sm font-black ${score > 0 ? 'text-emerald-400' : score < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {score > 0 ? `+${score}` : score}点
              </span>
            )}
            {highlightRating && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RATING_COLORS[highlightRating]}`}>
                {highlightRating} {r.counts[highlightRating]}件
              </span>
            )}
          </div>
          <p className="text-white text-sm leading-relaxed">{r.response_text}</p>
        </div>
      </div>

      {r.evaluationCount > 0 && (
        <div className="flex gap-2 flex-wrap pl-14">
          {RATINGS.map((rating) => {
            if (rating === 'X' && highlightRating === null) return null
            return r.counts[rating] > 0 && (
              <span key={rating} className={`text-xs font-bold px-2 py-0.5 rounded-full ${RATING_COLORS[rating]}`}>
                {rating} {r.counts[rating]}
              </span>
            )
          })}
          <span className="text-xs text-gray-600">({r.evaluationCount}名評価)</span>
        </div>
      )}

      <div className="pl-14">
        <Comments evaluations={r.evaluations} />
      </div>
    </div>
  )
}

function Comments({ evaluations }: { evaluations: RawEvaluation[] }) {
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
