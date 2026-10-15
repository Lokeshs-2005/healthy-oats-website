const buckets = new Map()

export const rateLimit = ({ windowMs = 15 * 60 * 1000, max = 20, keyPrefix = 'rl' } = {}) => {
  return (req, res, next) => {
    const forwarded = req.headers['x-forwarded-for']
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : req.ip) || 'unknown'
    const key = `${keyPrefix}:${ip.trim()}`
    const now = Date.now()
    const recent = (buckets.get(key) || []).filter((ts) => now - ts < windowMs)

    if (recent.length >= max) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' })
    }

    recent.push(now)
    buckets.set(key, recent)
    next()
  }
}
