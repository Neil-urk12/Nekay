import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePomodoro } from '../pomodoro'

describe('Pomodoro Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  it('initializes with correct default values', () => {
    const store = usePomodoro()
    expect(store.timeLeft).toBe(25 * 60)
    expect(store.isRunning).toBe(false)
    expect(store.stats.completedSessions).toBe(0)
  })

  it('decrements timer correctly', () => {
    const store = usePomodoro()
    store.startTimer()
    vi.advanceTimersByTime(1000)
    expect(store.timeLeft).toBe(25 * 60 - 1)
  })

  it('completes session when timer reaches zero', () => {
    const store = usePomodoro()
    store.timeLeft = 1
    store.startTimer()
    vi.advanceTimersByTime(1000)
    expect(store.stats.completedSessions).toBe(1)
    expect(store.timeLeft).toBe(25 * 60)
  })

  it('validates stats values', () => {
    const store = usePomodoro()
    store.stats.completedSessions = -1
    expect(() => store.validateStats()).toThrow('Completed sessions cannot be negative')
  })

  it('handles timer errors gracefully', () => {
    const store = usePomodoro()
    vi.spyOn(global, 'setInterval').mockImplementationOnce(() => {
      throw new Error('Timer error')
    })
    store.startTimer()
    expect(store.error).toBe('Timer error')
    expect(store.isRunning).toBe(false)
  })
})