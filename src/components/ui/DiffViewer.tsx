// ``````tsx /c:/Project/orchetrix/orchetrix-frontend/src/components/ui/DiffViewer.tsx
import React from 'react'

interface DiffViewerProps {
  oldText: string
  newText: string
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ oldText, newText }) => {
  // Simple word-level diff for visualization
  const oldWords = oldText.split(/(\s+)/)
  const newWords = newText.split(/(\s+)/)

  // This is a very basic diff logic for visualization purposes
  // In a real senior-level project, we might use a library like 'diff' 
  // but here we implement a clean visual comparison
  
  return (
    <div className="grid grid-cols-2 gap-4 text-sm p-3 bg-gray-50 border rounded-md">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Original</p>
        <div className="p-2 bg-red-50 border border-red-100 rounded text-red-800 whitespace-pre-wrap">
          {oldWords.map((word, index) => {
            const isAdded = !newWords.includes(word)
            const isRemoved = !oldWords.includes(word)
            return (
              <span
                key={index}
                className={isRemoved ? 'bg-red-200 text-red-800 line-through' : 'text-red-800'}
              >
                {word}
              </span>
            )
          })}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">AI Generated</p>
        <div className="p-2 bg-green-50 border border-green-100 rounded text-green-800 whitespace-pre-wrap">
          {newWords.map((word, index) => {
            const isAdded = !oldWords.includes(word)
            const isRemoved = !newWords.includes(word)
            return (
              <span
                key={index}
                className={isAdded ? 'bg-green-200 text-green-800 underline' : 'text-green-800'}
              >
                {word}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}