'use client'

interface ProgressBarProps {
  current: number
  total: number
  rated: number
}

export default function ProgressBar({ current, total, rated }: ProgressBarProps) {
  const ratedPercent = total > 0 ? (rated / total) * 100 : 0

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>評価済み: {rated} / {total}</span>
        <span>{Math.round(ratedPercent)}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${ratedPercent}%` }}
        />
      </div>
    </div>
  )
}
