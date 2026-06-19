'use client'

interface ReviewCardProps {
  text: string
  index: number
  total: number
  categoryName: string
}

export default function ReviewCard({ text, index, total, categoryName }: ReviewCardProps) {
  return (
    <div className="bg-gray-800 rounded-3xl border border-gray-700 p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          {categoryName}
        </span>
        <span className="text-sm text-gray-500">
          {index + 1} / {total}
        </span>
      </div>

      <div className="min-h-32 flex items-center">
        <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  )
}
