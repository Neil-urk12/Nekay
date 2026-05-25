import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('displayCriticalError', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders error message as text content, not HTML', async () => {
    const { displayCriticalError } = await import('../utils/displayCriticalError')
    const xssPayload = '<img src=x onerror=alert(1)>'

    displayCriticalError(new Error(xssPayload))

    // Should NOT create an img element — textContent escapes HTML
    expect(document.querySelector('img')).toBeNull()
    expect(document.body.textContent).toContain(xssPayload)
  })

  it('does not use innerHTML with user-controlled content', async () => {
    const { displayCriticalError } = await import('../utils/displayCriticalError')
    const spy = vi.spyOn(document.body, 'innerHTML', 'set')

    displayCriticalError(new Error('test error'))

    // innerHTML should not be set with error message interpolated
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('uses replaceChildren for safe DOM construction', async () => {
    const { displayCriticalError } = await import('../utils/displayCriticalError')
    const spy = vi.spyOn(document.body, 'replaceChildren')

    displayCriticalError(new Error('test'))

    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('displays heading, help text, and error message', async () => {
    const { displayCriticalError } = await import('../utils/displayCriticalError')

    displayCriticalError(new Error('something broke'))

    expect(document.body.textContent).toContain('Unable to Start App')
    expect(document.body.textContent).toContain('refreshing the page')
    expect(document.body.textContent).toContain('something broke')
  })
})
