'use client'

import { Rating, RATING_LABELS } from '@/lib/types'

interface RatingButtonsProps {
  selected: Rating | null
  onSelect: (rating: Rating) => void
  disabled?: boolean
}

const BUTTON_STYLES: Record<Rating, string> = {
  S: 'bg-yellow-400 hover:bg-yellow-300 text-yellow-900 border-yellow-500 shadow-yellow-300/50',
  A: 'bg-emerald-500 hover:bg-emerald-400 text-white border-emerald-600 shadow-emerald-300/50',
  B: 'bg-blue-500 hover:bg-blue-400 text-white border-blue-600 shadow-blue-300/50',
  C: 'bg-orange-500 hover:bg-orange-400 text-white border-orange-600 shadow-orange-300/50',
  X: 'bg-red-600 hover:bg-red-500 text-white border-red-700 shadow-red-300/50',
}

const SELECTED_RING: Record<Rating, string> = {
  S: 'ring-4 ring-yellow-400 scale-110',
  A: 'ring-4 ring-emerald-400 scale-110',
  B: 'ring-4 ring-blue-400 scale-110',
  C: 'ring-4 ring-orange-400 scale-110',
  X: 'ring-4 ring-red-500 scale-110',
}

export default function RatingButtons({ selected, onSelect, disabled = false }: RatingButtonsProps) {
  const ratings: Rating[] = ['S', 'A', 'B', 'C', 'X']

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-4">
        {ratings.map((rating) => {
          const isSelected = selected === rating
          return (
            <button
              key={rating}
              onClick={() => onSelect(rating)}
              disabled={disabled}
              className={`
                relative flex flex-col items-center justify-center
                w-20 h-20 rounded-2xl border-2 font-black text-3xl
                transition-all duration-150 shadow-lg
                ${BUTTON_STYLES[rating]}
                ${isSelected ? SELECTED_RING[rating] : 'opacity-80'}
                ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer active:scale-95'}
              `}
            >
              {rating}
              {isSelected && (
                <span className="absolute -top-2 -right-2 bg-white text-gray-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow">
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </div>

      {selected && (
        <p className="text-center text-sm text-gray-400 animate-fade-in">
          <span className="font-bold text-white">{selected}</span>
          {' — '}
          {RATING_LABELS[selected].description}
        </p>
      )}

      <div className="flex justify-center gap-3 text-xs text-gray-500 flex-wrap">
        {ratings.map((r) => (
          <span key={r}>
            <span className="font-bold text-gray-300">{r}</span>: {RATING_LABELS[r].description}
          </span>
        ))}
      </div>
    </div>
  )
}
