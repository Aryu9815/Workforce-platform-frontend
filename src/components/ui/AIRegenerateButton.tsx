import React, { useState } from 'react'
import { Sparkles, Loader2, Check, X } from 'lucide-react'
import { aiApi } from '../../api/ai'
import { showApiError } from '../../lib/utils'
import toast from 'react-hot-toast'

interface AIRegenerateButtonProps {
  value: string
  onRegenerated: (newValue: string) => void
  className?: string
  disabled?: boolean
}

export const AIRegenerateButton: React.FC<AIRegenerateButtonProps> = ({
  value,
  onRegenerated,
  className = '',
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [comparison, setComparison] = useState<{ old: string; new: string } | null>(null)

  const handleRegenerate = async () => {
    if (!value || value.trim().length === 0) {
      toast.error('Please enter some text first')
      return
    }

    setIsLoading(true)
    try {
      const response = await aiApi.regenerateMessage({ message: value })
      setComparison({
        old: response.old_message || value,
        new: response.generated_message
      })
    } catch (error) {
      showApiError(error, 'Failed to regenerate message')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = () => {
    if (comparison) {
      onRegenerated(comparison.new)
      setComparison(null)
      toast.success('AI suggestion applied')
    }
  }

  const handleReject = () => {
    setComparison(null)
    toast.success('AI suggestion discarded')
  }

  if (comparison) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between bg-purple-50">
            <div className="flex items-center gap-2 text-purple-700">
              <Sparkles className="h-5 w-5" />
              <h3 className="font-semibold">Review AI Improvements</h3>
            </div>
            <button onClick={handleReject} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Original:</h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded">{comparison.old}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Improved:</h4>
                <p className="text-gray-600 bg-purple-50 p-3 rounded">{comparison.new}</p>
              </div>
            </div>
          </div>

          <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
            <button
              onClick={handleReject}
              className="px-4 py-2 border rounded-md bg-white hover:bg-gray-100 text-sm font-medium text-gray-700 flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Keep Original
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Check className="h-4 w-4" />
              Accept AI Changes
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handleRegenerate}
      disabled={isLoading || disabled}
      title="Regenerate with AI"
      className={`p-1.5 rounded-md transition-all duration-200 
        ${isLoading 
          ? 'bg-purple-50 text-purple-400 cursor-not-allowed' 
          : 'bg-purple-100 text-purple-700 hover:bg-purple-200 active:scale-95'
        } ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
    </button>
  )
}