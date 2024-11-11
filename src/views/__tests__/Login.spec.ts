import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import Login from '../Login.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: {} }]
})

describe('Login.vue', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      setItem: vi.fn(),
      getItem: vi.fn()
    })
  })

  it('renders login form correctly', () => {
    const wrapper = mount(Login, {
      global: {
        plugins: [router]
      }
    })
    
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    expect(wrapper.find('h1').text()).toBe('Welcome!')
  })

  it('disables submit button when secret key is empty', () => {
    const wrapper = mount(Login, {
      global: {
        plugins: [router]
      }
    })
    
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('enables submit button when secret key is not empty', async () => {
    const wrapper = mount(Login, {
      global: {
        plugins: [router]
      }
    })
    
    await wrapper.find('input[type="password"]').setValue('123456')
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
  })

  it('shows error message for short secret key', async () => {
    const wrapper = mount(Login, {
      global: {
        plugins: [router]
      }
    })
    
    await wrapper.find('input[type="password"]').setValue('12345')
    await wrapper.find('form').trigger('submit')
    
    expect(wrapper.find('.error-message').text()).toBe('Secret key must be at least 6 characters')
  })

  it('shows error message for invalid secret key', async () => {
    const wrapper = mount(Login, {
      global: {
        plugins: [router]
      }
    })
    
    await wrapper.find('input[type="password"]').setValue('wrongkey')
    await wrapper.find('form').trigger('submit')
    
    expect(wrapper.find('.error-message').text()).toBe('Invalid secret key')
  })

  it('successfully logs in with correct secret key', async () => {
    vi.stubEnv('VITE_SECRET_KEY', 'correct-key')
    
    const wrapper = mount(Login, {
      global: {
        plugins: [router]
      }
    })
    
    const routerPushSpy = vi.spyOn(router, 'push')
    
    await wrapper.find('input[type="password"]').setValue('correct-key')
    await wrapper.find('form').trigger('submit')
    
    // Wait for the setTimeout in handleSubmit
    await new Promise(resolve => setTimeout(resolve, 1100))
    
    expect(localStorage.setItem).toHaveBeenCalledWith('isAuthenticated', 'true')
    expect(routerPushSpy).toHaveBeenCalledWith('/')
  })
})
