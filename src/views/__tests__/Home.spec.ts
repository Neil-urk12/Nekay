import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Home from '../Home.vue'

describe('Home.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    // Type-safe fetch mock
    global.fetch = vi.fn() as unknown as typeof fetch
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  it('renders home component correctly', () => {
    wrapper = mount(Home)
    expect(wrapper.find('.home-container').exists()).toBe(true)
    expect(wrapper.find('.melody-header').exists()).toBe(true)
    expect(wrapper.find('.message-box').exists()).toBe(true)
  })

  it('determines correct time of day and background', () => {
    const mockDate = new Date('2024-01-01T08:00:00')
    vi.setSystemTime(mockDate)
    
    wrapper = mount(Home)
    const vm = wrapper.vm as any // For accessing template refs
    expect(vm.timeOfDay).toBe('morning')
    expect(vm.backgroundImage).toBe('url(/public/assets/bgsky.jpg)')
  })

  it('handles weather API fetch successfully', async () => {
    const mockWeatherData = {
      current: {
        temp_c: 25,
        condition: { text: 'Sunny', icon: 'sunny.png' },
        air_quality: {
          pm2_5: 10,
          pm10: 20
        }
      },
      forecast: {
        forecastday: [{
          day: {
            maxtemp_c: 30,
            mintemp_c: 20
          }
        }]
      }
    }

    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve(mockWeatherData)
    }) as unknown as typeof fetch

    wrapper = mount(Home)
    await vi.runAllTimersAsync()

    const vm = wrapper.vm as any
    expect(vm.currentWeather.temp_c).toBe(25)
    expect(vm.forecast.maxtemp_c).toBe(30)
    expect(vm.airQuality.pm2_5).toBe(10)
  })

  it('handles image loading error correctly', async () => {
    wrapper = mount(Home)
    const img = wrapper.find('.homeMelody')
    
    await img.trigger('error')
    
    const vm = wrapper.vm as any
    expect(vm.imageLoadError).toBe(true)
    expect(img.attributes('src')).toBe('/public/assets/melodysticker.gif')
  })

  it('handles weather API fetch error', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('API Error')) as unknown as typeof fetch

    wrapper = mount(Home)
    await vi.runAllTimersAsync()

    const vm = wrapper.vm as any
    expect(vm.weatherError).toBe('Unable to fetch weather data')
    expect(vm.isLoading).toBe(false)
  })
})