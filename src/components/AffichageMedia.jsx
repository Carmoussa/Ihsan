export default function AffichageMedia({ url, type }) {
  if (!url) return null
  if (type === 'image') {
    return (
      <img
        src={url}
        alt=""
        style={{ maxWidth: '100%', borderRadius: 4, marginBottom: 12, display: 'block' }}
      />
    )
  }
  if (type === 'audio') {
    return <audio controls src={url} style={{ width: '100%', marginBottom: 12 }} />
  }
  if (type === 'video') {
    return (
      <video
        controls
        src={url}
        style={{ maxWidth: '100%', borderRadius: 4, marginBottom: 12, display: 'block' }}
      />
    )
  }
  return null
}
