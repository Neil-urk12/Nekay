import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Pomodoro from '../Pomodoro.vue'

describe('Pomodoro.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  it('renders timer display correctly', () => {
    const wrapper = mount(Pomodoro)
    const timerDisplay = wrapper.find('.timer-display')
    expect(timerDisplay.text()).toBe('25:00')
  })

  it('displays correct button text based on timer state', async () => {
    const wrapper = mount(Pomodoro)
    const startButton = wrapper.find('.control-button.primary')
    
    expect(startButton.text()).toContain('Start')
    await startButton.trigger('click')
    expect(startButton.text()).toContain('Pause')
  })

  it('shows stats with initial values', () => {
    const wrapper = mount(Pomodoro)
    const statsContent = wrapper.find('.stats-content')
    
    expect(statsContent.text()).toContain('Completed Sessions: 0')
    expect(statsContent.text()).toContain('Total Focus Time: 0 minutes')
  })

  it('displays dancing melody when timer is running', async () => {
    const wrapper = mount(Pomodoro)
    const startButton = wrapper.find('.control-button.primary')
    
    expect(wrapper.find('.dancing-melody').exists()).toBe(false)
    await startButton.trigger('click')
    expect(wrapper.find('.dancing-melody').exists()).toBe(true)
  })

  it('resets timer when reset button is clicked', async () => {
    const wrapper = mount(Pomodoro)
    const startButton = wrapper.find('.control-button.primary')
    const resetButton = wrapper.find('.control-button.secondary')
    
    await startButton.trigger('click')
    vi.advanceTimersByTime(5000)
    await resetButton.trigger('click')
    
    expect(wrapper.find('.timer-display').text()).toBe('25:00')
  })

  it('updates timer display while running', async () => {
    const wrapper = mount(Pomodoro)
    const startButton = wrapper.find('.control-button.primary')
    
    await startButton.trigger('click')
    vi.advanceTimersByTime(1000)
    
    expect(wrapper.find('.timer-display').text()).toBe('24:59')
  })
})
