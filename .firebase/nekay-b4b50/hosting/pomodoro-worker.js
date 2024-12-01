let timer = null;
let timeLeft = 0;
let isRunning = false;

self.onmessage = function(e) {
  const { type, payload } = e.data;
  
  switch (type) {
    case 'START':
      timeLeft = payload.timeLeft;
      startTimer();
      break;
    case 'PAUSE':
      pauseTimer();
      break;
    case 'RESET':
      resetTimer(payload.duration);
      break;
    case 'SYNC':
      syncTime(payload.serverTime);
      break;
  }
};

function startTimer() {
  if (isRunning) return;
  
  isRunning = true;
  const startTime = Date.now();
  
  timer = setInterval(() => {
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
    
    if (timeLeft > 0) {
      timeLeft--;
      self.postMessage({ type: 'TICK', timeLeft });
    } else {
      pauseTimer();
      self.postMessage({ type: 'COMPLETE' });
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
  timeLeft = duration;
  self.postMessage({ type: 'TICK', timeLeft });
}

function syncTime(serverTime) {
  const timeDiff = Date.now() - serverTime;
  if (Math.abs(timeDiff) > 2000) { // If difference is more than 2 seconds
    timeLeft = Math.max(0, timeLeft - Math.floor(timeDiff / 1000));
    self.postMessage({ type: 'TICK', timeLeft });
  }
}
