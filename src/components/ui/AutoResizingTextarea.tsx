import React, { useEffect, useRef } from 'react'

interface AutoResizingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string
}

export const AutoResizingTextarea: React.FC<AutoResizingTextareaProps> = ({ value, ...props }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }

  useEffect(() => {
    adjustHeight()
  }, [value])

  return (
    <textarea
      ref={textareaRef}
      value={value}
      {...props}
      style={{ ...props.style, overflow: 'hidden', resize: 'none' }}
    />
  )
}
