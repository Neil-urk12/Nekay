let timer = null;
let timeLeft = 0;
let isRunning = false;

self.onmessage = function(e) {
  const { type, payload } = e.data;
  
  switch (type) {
    case 'START':
      if (payload && typeof payload.timeLeft === 'number') {
        timeLeft = payload.timeLeft;
        startTimer();
      }
      break;
    case 'PAUSE':
      pauseTimer();
      break;
    case 'RESET':
      if (payload && typeof payload.duration === 'number') {
        resetTimer(payload.duration);
      }
      break;
    case 'SYNC':
      if (payload && typeof payload.serverTime === 'number') {
        syncTime(payload.serverTime);
      }
      break;
    default:
      console.warn('Unknown message type:', type);
  }
};

function startTimer() {
  if (isRunning) return;
  
  isRunning = true;
  const startTime = Date.now();
  let lastTick = startTime;
  
  timer = setInterval(() => {
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - lastTick) / 1000);
    
    if (elapsedSeconds >= 1) {
      lastTick = currentTime;
      if (timeLeft > 0) {
        timeLeft--;
        self.postMessage({ type: 'TICK', timeLeft });
      }

      if (timeLeft <= 0) {
        pauseTimer();
        self.postMessage({ type: 'COMPLETE' });
      }
    }
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  
  isRunning = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function resetTimer(duration) {
  pauseTimer();
  timeLeft = Math.max(0, duration); // Ensure non-negative
  self.postMessage({ type: 'TICK', timeLeft });
}

function syncTime(serverTime) {
  const timeDiff = Date.now() - serverTime;
  if (Math.abs(timeDiff) > 2000) { // If difference is more than 2 seconds
    const adjustment = Math.floor(timeDiff / 1000);
    timeLeft = Math.max(0, timeLeft - adjustment);
    self.postMessage({ type: 'TICK', timeLeft });
  }
}
