<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

let lrtAudio: HTMLAudioElement | null = null;

// Play lrt.mp3 when LetterView is opened
onMounted(() => {
  lrtAudio = new Audio('/lrt.mp3');
  lrtAudio.play().catch((err) => {
    console.error('Error playing lrt.mp3:', err);
  });
});

// When the component is unmounted, stop the lrt.mp3 from playing
onUnmounted(() => {
  if (lrtAudio) {
    lrtAudio.pause();
    lrtAudio.currentTime = 0;
  }
});

const isExpanded = ref(false)
const router = useRouter()
const declineClickCount = ref(0)
const declineButtonStyle = ref({})
const showFinalMessage = ref(false)

// Reactive array to hold hearts data
const floatingHearts = ref<{ id: number; left: number }[]>([])

const hiddenClass = computed(() => isExpanded.value ? 'hidden' : '')
const isDeclineHidden = computed(() => declineClickCount.value >= 4)

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

let heartId = 0

const acceptLove = () => {
  console.log('Love accepted!')

  // Play the accept sound
  const acceptAudio = new Audio('/accept.wav');
  acceptAudio.play().catch((err) => {
    console.error('Error playing accept.wav:', err);
  });
  
  // Add several hearts to the array
  for (let i = 0; i < 10; i++) {
    floatingHearts.value.push({ 
      id: heartId++, 
      left: Math.random() * 100  // position horizontally as a percentage
    })
  }
  
  // Optionally, clear them after a delay (adjust as needed)
  setTimeout(() => {
    floatingHearts.value = []
  }, 3000)
}

const declineLove = () => {
  declineClickCount.value++
  
  if (declineClickCount.value >= 4) {
    showFinalMessage.value = true
    return
  }

  const scale = Math.max(0.6, 1 - (declineClickCount.value * 0.1))
  
  // Get viewport width
  const viewportWidth = window.innerWidth
  const buttonElement = document.querySelector('.decline-button') as HTMLElement
  if (!buttonElement) return
  
  const buttonWidth = buttonElement.offsetWidth
  
  const goToRight = Math.random() > 0.5
  
  const padding = 20
  let xPosition
  
  if (goToRight) {
    xPosition = viewportWidth - buttonWidth - padding
  } else {
    xPosition = padding
  }
  
  declineButtonStyle.value = {
    position: 'fixed',
    left: `${xPosition}px`,
    transform: `scale(${scale})`,
    transition: 'all 0.3s ease',
    background: '#e2e6ea',
    color: '#333'
  }
}
</script>

<template>
  <div class="letter-container">
    <button class="return-button" :class="hiddenClass" @click="router.push('/home')">Return Home</button>
    
    <!-- Cover view: shown if not expanded -->
    <div v-if="!isExpanded" class="letter-cover" @click="toggleExpand">
      <div class="cover-content">
        <div class="arrow top">▼</div>
        <div class="heart">♥</div>
        <div class="arrow bottom">▼</div>
      </div>
    </div>
    
    <!-- Full letter view, inside a transition for smooth expand/contract -->
    <transition name="expand">
      <div v-show="isExpanded" class="full-letter">
        <!-- Toggle arrows inside full letter view -->
        <div class="toggle-arrow top" @click="toggleExpand">▼</div>
        <header>
          <h1 class="header">A Valentine's Note</h1>
          <p class="subheader">A message from my heart to yours</p>
        </header>
        <div class="letter-content">
          <p>Dear Kaykay,</p>
          <p>
            Advanced Happy Valentine's Babiee! I'm not sure how I should sound for this letter but know that it's written with lots of love and you in my mind. 
          </p>
          <p>
            As Valentine's Day is nearing, I want to remind you of my love, our love. I found myself thinking..about us..about the joy..the sadness..and the experiences that we shared, the journey, and our story. You have been a blessing to my life babie. You decorated my life. Every moment we share paints my heart with love and joy. I reminisce about the first karaoke we had, it was just before valentine's day. From that moment, I knew that I wanted to be with you for all my life, I wanted to be your partner in this journey called life. Your smile lights up my days and you voice and laughter calms the chaos in my heart and mind. 
          </p>
          <p>
            This Valentine's Day, I want to remind you of the depth of my love. It is a love that transcends time and space, a love that grows stronger with each passing day. Thank you for being comforting and caring babie. Thank you for being my safe space. I can't wait to hug and kiss youuu my babiee. 
          </p>
          <p>
            Happy Valentine's Day Babiee!! Am lovee youuuuuu<b> 💖 </b><br>
            May our journey together be as enchanting as a starlit night and as warm as the first bloom of spring. I eagerly await each new day wrapped in your loving embrace.
          </p>
          <p>
            I love youuuu my babiee. I'm so grateful for you. I'm so grateful for us. I'm so grateful for our story. I'm so grateful for our love. I'm so grateful for our journey. I'm so grateful for our future. I'm so grateful for youuuu.
          </p>
          <p>Sincerely,</p>
          <p>Sharky Babie</p>
        </div>
        
        <div class="toggle-arrow bottom" @click="toggleExpand">▼</div>
      </div>
    </transition>

    <div class="invitation-message" :class="hiddenClass">
      <p>Will you be my valentine?</p>
    </div>
    <div class="button-container" :class="hiddenClass">
      <div class="accept-section">
        <button class="heart-button" @click="acceptLove">&#10084; Accept</button>
        <span v-if="showFinalMessage" class="final-message">
          This is your only choice &#128521;
        </span>
      </div>
      <button v-if="!isDeclineHidden" 
              class="decline-button" 
              @click="declineLove"
              :style="declineButtonStyle">&#128148; Decline</button>
    </div>

    <!-- Floating hearts container -->
    <div class="floating-hearts">
      <div 
        v-for="heart in floatingHearts" 
        :key="heart.id" 
        class="floating-heart" 
        :style="{ left: heart.left + '%' }">
        ♥
      </div>
    </div>

  </div>
</template>

<style scoped>
.letter-container {
  background: #fff8f8;
  width: 100%;
  min-height: 100vh;
  padding: 2rem;
  box-sizing: border-box;
  font-family: 'Georgia', serif;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
}

/* Return Home button */
.return-button {
  position: fixed;
  top: 1rem;
  left: 1rem;
  padding: 0.5rem 1rem;
  background: #e2e6ea;
  color: #333;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  opacity: 1;
  transition: opacity 0.3s ease;
  z-index: 10;
}

.return-button.hidden {
  opacity: 0;
  pointer-events: none;
}

/* Cover style: initial paper-letter look with heart and arrows */
.letter-cover {
  width: 100%;
  max-width: 400px;
  height: 300px;
  border: 1px solid #f5c6cb;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  background: #fff8f8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.cover-content {
  text-align: center;
}

.heart {
  font-size: 4rem;
  color: #d6336c;
  margin: 1rem 0;
}

.arrow {
  font-size: 2rem;
  color: #a62644;
  user-select: none;
}

.arrow.top {
  margin-bottom: 0.5rem;
}

.arrow.bottom {
  margin-top: 0.5rem;
}

/* Full letter view styling */
.full-letter {
  width: 100%;
  max-width: 600px;
  background: #fff8f8;
  padding: 2rem;
  border: 1px solid #f5c6cb;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  position: relative;
}

/* Toggle arrows inside expanded view */
.toggle-arrow {
  font-size: 2rem;
  color: #a62644;
  cursor: pointer;
  user-select: none;
  text-align: center;
}
.toggle-arrow.top {
  position: absolute;
  top: -1.5rem;
  left: 50%;
  transform: translateX(-50%);
}
.toggle-arrow.bottom {
  position: absolute;
  bottom: -1.5rem;
  left: 50%;
  transform: translateX(-50%);
}

header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.header {
  font-size: 2.5rem;
  color: #d6336c;
  margin: 0;
}

.subheader {
  font-size: 1.2rem;
  color: #a62644;
  margin: 0;
}

.letter-content {
  font-size: 1.15rem;
  line-height: 1.8;
  color: #333;
}

.letter-content p {
  margin: 1rem 0;
}

.button-container {
  text-align: center;
  margin: 1rem 0 2rem 0;
  opacity: 1;
  transition: opacity 0.3s ease;
  position: relative;
  min-height: 50px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
}

.accept-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.final-message {
  color: #d6336c;
  font-size: 1.1rem;
  font-style: italic;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.button-container.hidden {
  opacity: 0;
  pointer-events: none;
}

.heart-button,
.decline-button {
  font-size: 1rem;
  padding: 0.75rem 1.5rem;
  margin: 0 0.5rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

.heart-button {
  background: #d6336c;
  color: #fff;
}

.heart-button:hover {
  background: #bf285c;
}

.decline-button {
  position: relative;
  z-index: 2;
}

.decline-button:hover {
  background: #d6d8db;
}

/* Transition for expanding/contracting full letter view */
.expand-enter-active, .expand-leave-active {
  transition: all 0.3s ease;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  transform: scaleY(0.9);
}
.expand-enter-to, .expand-leave-from {
  opacity: 1;
  transform: scaleY(1);
}

.invitation-message {
  text-align: center;
  font-size: 1.2rem;
  color: #333;
  margin: 1rem 0 0 0;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.invitation-message.hidden {
  opacity: 0;
  pointer-events: none;
}

/* Responsive Design Adjustments */
@media (max-width: 600px) {
  .letter-container {
    padding: 1rem;
    justify-content: flex-start;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .letter-cover {
    margin-top: 3rem;
    margin-bottom: 1rem;
  }
  
  .full-letter {
    margin: 2rem 0;
  }
  
  .return-button {
    padding: 0.5rem;
    font-size: 0.9rem;
  }
  
  .letter-cover {
    max-width: 90%;
    height: auto;
    padding: 1rem;
  }
  
  .cover-content .heart {
    font-size: 3rem;
  }
  
  .cover-content .arrow {
    font-size: 1.5rem;
  }
  
  header .header {
    font-size: 2rem;
  }
  
  header .subheader {
    font-size: 1rem;
  }
  
  .letter-content {
    font-size: 1rem;
  }
  
  .toggle-arrow {
    font-size: 1.5rem;
  }
  
  .heart-button, .decline-button {
    font-size: 0.9rem;
    padding: 0.5rem 1rem;
    margin: 0.5rem;
  }
}

.floating-hearts {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  pointer-events: none;
  overflow: visible;
  z-index: 20;
}

.floating-heart {
  position: absolute;
  font-size: 1.5rem;
  color: #d6336c;
  animation: floatUp 3s ease-out forwards;
}

@keyframes floatUp {
  0% {
    bottom: 0;
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    bottom: 150%;
    opacity: 0;
    transform: translateY(-20px) scale(1.5);
  }
}

.accept-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  z-index: 50;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
