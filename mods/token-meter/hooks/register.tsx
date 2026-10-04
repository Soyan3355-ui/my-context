import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Meter } from '../types'

const meter = atom({ plugin: 'token-meter', key: 'meter' } as const, null)

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))

// mood by usage: face, colour, one-liner
const mood = (p: number) =>
  p < 40 ? { face: '(´▽`)', color: 'green', say: 'ゆとりあるで～' }
  : p < 70 ? { face: '(・ω・)', color: 'yellow', say: 'ええペースやね' }
  : p < 90 ? { face: '(;´Д`)', color: 'magenta', say: 'ちょい多めやで' }
  : { face: '(>_<)', color: 'red', say: 'compactしよか！' }

const bar = (p: number, n = 10) => {
  const f = Math.max(0, Math.min(n, Math.round((p / 100) * n)))
  return '♥'.repeat(f) + '♡'.repeat(n - f)
}

export const register: Register = on => {
  on('session.measure', async ($, e, next) => {
    const m: Meter = {
      tokens: e.context.tokens ?? null,
      window: e.context.window,
      percent: e.context.percent ?? null,
      usd: e.cost?.usd ?? null,
      limits: e.rateLimits.map(r => ({ kind: r.kind, percentUsed: r.percentUsed })),
    }
    await update($, meter, () => m)

    if (m.percent !== null) {
      const k = mood(m.percent)
      $.ui.status(`${k.face} ${bar(m.percent, 5)} ${Math.round(m.percent)}%`)
    }

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const m = await read($, meter)
    if (e.props.hasSurvey) return next(e)

    const { Box, Text } = $.ui.resolve(e)

    if (!m || m.tokens === null || m.percent === null) {
      return (
        <Box>
          <Text dimColor>(•ᴗ•) ✨ トークンメーター待機中…</Text>
        </Box>
      )
    }

    const k = mood(m.percent)
    const cost = m.usd !== null ? `  💰 $${m.usd.toFixed(2)}` : ''
    const limits = m.limits.map(l => `  ⏳ ${l.kind} ${Math.round(l.percentUsed)}%`).join('')

    return (
      <Box>
        <Text color={k.color} bold>{k.face} </Text>
        <Text color={k.color}>{bar(m.percent)} </Text>
        <Text color={k.color} bold>{Math.round(m.percent)}% </Text>
        <Text dimColor>({fmt(m.tokens)}/{fmt(m.window)}){cost}{limits}  </Text>
        <Text color={k.color}>{k.say}</Text>
      </Box>
    )
  })
}
