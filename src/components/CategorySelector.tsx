'use client'

import { Category } from '@/lib/types'

interface CategorySelectorProps {
  categories: Category[]
  completedCounts: Record<string, number>
  totalCounts: Record<string, number>
  onSelect: (categoryId: string) => void
}

const COLUMN_COLORS: Record<string, string> = {
  A: 'from-blue-600 to-blue-800 border-blue-500',
  B: 'from-purple-600 to-purple-800 border-purple-500',
  C: 'from-emerald-600 to-emerald-800 border-emerald-500',
  D: 'from-orange-600 to-orange-800 border-orange-500',
}

export default function CategorySelector({ categories, completedCounts, totalCounts, onSelect }: CategorySelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {categories.map((cat) => {
        const completed = completedCounts[cat.id] ?? 0
        const total = totalCounts[cat.id] ?? 0
        const isDone = total > 0 && completed === total
        const colorClass = COLUMN_COLORS[cat.column_key] ?? 'from-gray-600 to-gray-800 border-gray-500'

        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`
              relative bg-gradient-to-br ${colorClass}
              border rounded-2xl p-6 text-left
              hover:brightness-110 active:scale-95
              transition-all duration-150 shadow-lg
            `}
          >
            {isDone && (
              <span className="absolute top-3 right-3 bg-white text-gray-800 text-xs font-bold px-2 py-0.5 rounded-full">
                完了
              </span>
            )}
            <div className="text-4xl font-black text-white/30 mb-2">{cat.column_key}</div>
            <p className="text-white text-sm font-medium leading-snug">{cat.name}</p>
            <p className="mt-3 text-white/60 text-xs">
              {completed} / {total} 件評価済み
            </p>
            <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/60 rounded-full transition-all duration-500"
                style={{ width: total > 0 ? `${(completed / total) * 100}%` : '0%' }}
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}
