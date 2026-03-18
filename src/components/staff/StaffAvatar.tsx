import { useEffect, useState } from 'react'
import { staffApi } from '../../api/staff'

interface StaffAvatarProps {
  filename?: string
  alt: string
  className?: string
  fallback?: React.ReactNode
}

const StaffAvatar = ({ filename, alt, className = "", fallback }: StaffAvatarProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let isMounted = true
    let currentUrl: string | null = null

    const fetchImage = async () => {
      if (!filename) return
      
      setLoading(true)
      try {
        // Extract just the filename if a full path is provided
        const pureFileName = filename.split(/[/\\]/).pop() || filename
        const blob = await staffApi.getProfileImage(pureFileName)
        if (!isMounted) return
        
        currentUrl = URL.createObjectURL(blob)
        setImageUrl(currentUrl)
      } catch (error) {
        if (isMounted) {
          console.error('Failed to fetch profile image:', error)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchImage()

    return () => {
      isMounted = false
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }
    }
  }, [filename])

  if (!filename || (!imageUrl && !loading)) {
    return <>{fallback}</>
  }

  if (loading) {
    return (
      <div className={`${className} bg-gray-100 animate-pulse flex items-center justify-center`}>
        <div className="w-1/2 h-1/2 bg-gray-200 rounded-full" />
      </div>
    )
  }

  return (
    <img
      src={imageUrl || ''}
      alt={alt}
      className={`${className} object-cover`}
    />
  )
}

export default StaffAvatar
