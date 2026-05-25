import { describe, it, expect, vi } from 'vitest'

// Mock supabase-config to prevent env var errors during import
vi.mock('../../supabase/supabase-config', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}))

import router from '../index'

describe('Router configuration', () => {
  it('all routes have a name property', () => {
    const routes = router.getRoutes()

    for (const route of routes) {
      expect(route.name, `Route ${route.path} is missing a name`).toBeDefined()
      expect(typeof route.name).toBe('string')
    }
  })

  it('all non-redirect routes have a component', () => {
    const routes = router.options.routes
    for (const route of routes) {
      if (!route.redirect) {
        expect(route.component, `Route ${route.path} missing component`).toBeDefined()
      }
    }
  })

  it('has a catch-all NotFound route', () => {
    const routes = router.options.routes
    const catchAll = routes.find(r => r.path === '/:pathMatch(.*)*')

    expect(catchAll).toBeDefined()
    expect(catchAll?.name).toBe('NotFound')
  })

  it('has expected number of routes (20 including catch-all)', () => {
    const routes = router.options.routes
    expect(routes.length).toBe(20)
  })
})
