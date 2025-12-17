let timer = null
let timeLeft = 0
let isRunning = false

globalThis.onmessage = function (e) {
  const { type, payload } = e.data

  switch (type) {
    case 'START':
      timeLeft = payload.timeLeft
      startTimer()
      break
    case 'PAUSE':
      pauseTimer()
      break
    case 'RESET':
      resetTimer(payload.duration)
      break
    case 'SYNC':
      syncTime(payload.serverTime)
      break
  }
}

function startTimer() {
  if (isRunning)
    return

  isRunning = true

  timer = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--
      globalThis.postMessage({ type: 'TICK', timeLeft })
    }
    else {
      pauseTimer()
      globalThis.postMessage({ type: 'COMPLETE' })
    }
  }, 1000)
}

function pauseTimer() {
  if (!isRunning)
    return

  isRunning = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function resetTimer(duration) {
  pauseTimer()
  timeLeft = duration
  globalThis.postMessage({ type: 'TICK', timeLeft })
}

function syncTime(serverTime) {
  const timeDiff = Date.now() - serverTime
  if (Math.abs(timeDiff) > 2000) {
    timeLeft = Math.max(0, timeLeft - Math.floor(timeDiff / 1000))
    globalThis.postMessage({ type: 'TICK', timeLeft })
  }
}
