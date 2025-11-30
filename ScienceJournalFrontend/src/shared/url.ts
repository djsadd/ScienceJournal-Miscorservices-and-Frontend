export const toApiFilesUrl = (raw?: string | null): string | undefined => {
  if (!raw) return undefined

  try {
    // If it's already an absolute URL, normalize it against current origin for path extraction
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081'

    // Build a URL object using the current origin for relative paths
    const u = new URL(raw, currentOrigin)
    const path = u.pathname || ''

    // If the path already starts with /api/files, keep it
    if (/^\/api\/files\//.test(path)) return u.toString()

    // If we see /files/... (with or without domain), rewrite to /api/files/...
    const filesIndex = path.indexOf('/files/')
    if (filesIndex >= 0) {
      const suffix = path.slice(filesIndex) // /files/{id}/download
      // Build same-origin API path; queries preserved if needed
      const apiUrl = new URL(`/api${suffix}${u.search || ''}`, currentOrigin)
      return apiUrl.toString()
    }

    // Otherwise return as-is
    return u.toString()
  } catch {
    // If URL parsing fails, try minimal string-based fixes
    if (raw.startsWith('/files/')) return `/api${raw}`
    return raw
  }
}
