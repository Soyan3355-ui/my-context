export type Meter = { tokens: number | null; window: number; percent: number | null; usd: number | null; limits: { kind: string; percentUsed: number }[] }

declare module 'claude-code' {
  interface PluginState {
    'token-meter': { meter: Meter | null }
  }
}
