import { useState } from 'react'
import { resolveMediaUrl } from '../../api'

const PLACEHOLDER = '/assets/image-placeholder.svg'
export default function MediaImage({ src, alt = '', onError, ...props }) {
  const resolved = resolveMediaUrl(src)
  const [failed, setFailed] = useState(null)
  const fallback = !resolved || failed === resolved
  return (
    <img
      loading={props.fetchPriority === 'high' ? 'eager' : 'lazy'}
      {...props}
      alt={alt}
      src={fallback ? PLACEHOLDER : resolved}
      decoding="async"
      onError={(event) => {
        if (!fallback) setFailed(resolved)
        else onError?.(event)
      }}
    />
  )
}
