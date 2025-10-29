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
  let lastTick = Date.now();
  
  timer = setInterval(() => {
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - lastTick) / 1000);
    
    // Only update if at least 1 second has passed
    if (elapsedSeconds >= 1) {
      lastTick += elapsedSeconds * 1000; // Update lastTick by exact elapsed seconds
      
      if (timeLeft > 0) {
        // Decrement by actual elapsed seconds for accuracy
        timeLeft = Math.max(0, timeLeft - elapsedSeconds);
        self.postMessage({ type: 'TICK', timeLeft });
      }

      if (timeLeft <= 0) {
        pauseTimer();
        self.postMessage({ type: 'COMPLETE' });
      }
    }
  }, 100); // Check more frequently for better accuracy
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
