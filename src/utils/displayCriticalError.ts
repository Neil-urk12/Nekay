export function displayCriticalError(error: unknown): void {
  console.error('Critical initialization error:', error)

  const container = document.createElement('div')
  container.style.cssText = 'padding: 20px; text-align: center;'

  const heading = document.createElement('h1')
  heading.textContent = 'Unable to Start App'

  const help = document.createElement('p')
  help.textContent = 'Please try refreshing the page. If the problem persists, clear your browser data.'

  const errorPre = document.createElement('pre')
  errorPre.style.color = 'red'
  errorPre.textContent = String(error instanceof Error ? error.message : 'Unknown error')

  container.replaceChildren(heading, help, errorPre)
  document.body.replaceChildren(container)
}
