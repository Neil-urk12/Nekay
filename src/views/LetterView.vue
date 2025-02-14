<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { getFirestore, collection, addDoc } from 'firebase/firestore'
import { useRouter } from 'vue-router'

let lrtAudio: HTMLAudioElement | null = null
let heartsInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  lrtAudio = new Audio('/lrt.mp3')
  lrtAudio.play().catch((err) => {
    console.error('Error playing lrt.mp3:', err)
  })
})

onUnmounted(() => {
  if (lrtAudio) {
    lrtAudio.pause()
    lrtAudio.currentTime = 0
  }
  if (heartsInterval) clearInterval(heartsInterval)
})

const showAcceptModal = ref(false)
const closeAcceptModal = () => {
  showAcceptModal.value = false
}

const isExpanded = ref(false)
const router = useRouter()
const declineClickCount = ref(0)
const declineButtonStyle = ref({})
const showFinalMessage = ref(false)

const floatingHearts = ref<{ id: number; left: number; style?: { fontSize: string; transform?: string; animationDuration: string; animationDelay: string } }[]>([])

const hiddenClass = computed(() => isExpanded.value ? 'hidden' : '')
const isDeclineHidden = computed(() => declineClickCount.value >= 4)

const toggleExpand = () => isExpanded.value = !isExpanded.value

let heartId = 0

const createHeart = () => {
  const newHeartId = heartId++
  const randomSize = Math.random() * (1.8 - 1.2) + 1.2
  const randomDuration = Math.random() * (8 - 6) + 6
  const randomDelay = Math.random() * 0.5;

  floatingHearts.value.push({
    id: newHeartId,
    left: Math.random() * 100,
    style: {
      fontSize: `${randomSize}rem`,
      animationDuration: `${randomDuration}s`,
      animationDelay: `${randomDelay}s`
    }
  })

  setTimeout(() => {
    floatingHearts.value = floatingHearts.value.filter(heart => heart.id !== newHeartId)
  }, randomDuration * 1000 + (randomDelay * 1000))
}

const acceptLove = () => {
  console.log('Love accepted!')
  showAcceptModal.value = true

  const acceptAudio = new Audio('/accept.wav')
  acceptAudio.play().catch((err) => {
    console.error('Error playing accept.wav:', err)
  })

  for (let i = 0; i < 15; i++) createHeart()

  setTimeout(() => {
    const burstInterval = setInterval(() => {
      createHeart()
    }, 100)

    setTimeout(() => {
      clearInterval(burstInterval)

      heartsInterval = setInterval(() => {
        createHeart()
      }, 500);
    }, 10000);
  }, 500);
}

const declineLove = () => {
  declineClickCount.value++

  if (declineClickCount.value >= 4) {
    showFinalMessage.value = true
    return
  }

  const scale = Math.max(0.6, 1 - (declineClickCount.value * 0.1))

  const viewportWidth = window.innerWidth
  const buttonElement = document.querySelector('.decline-button') as HTMLElement
  if (!buttonElement) return

  const buttonWidth = buttonElement.offsetWidth

  const goToRight = Math.random() > 0.5

  const padding = 20
  let xPosition

  if (goToRight) xPosition = viewportWidth - buttonWidth - padding
  else xPosition = padding
  
  declineButtonStyle.value = {
    position: 'fixed',
    left: `${xPosition}px`,
    transform: `scale(${scale})`,
    transition: 'all 0.3s ease',
    background: '#e2e6ea',
    color: '#333'
  }
}

const checkboxes = reactive({
  pizza: false,
  cake: false,
  movies: false,
  stardew: false
})

const showSuccessModal = ref(false)
const closeSuccessModal = () => showSuccessModal.value = false

const db = getFirestore()

const submitAgreement = async () => {
  try {
    await addDoc(collection(db, 'agreements'), {
      pizza: checkboxes.pizza,
      cake: checkboxes.cake,
      movies: checkboxes.movies,
      stardew: checkboxes.stardew,
      timestamp: new Date()
    })
    console.log('Agreement stored successfully!')
    showAcceptModal.value = false
    showSuccessModal.value = true
  } catch (error) {
    console.error('Error storing agreement:', error)
    closeAcceptModal()
  }
}
</script>

<template>
  <div class="letter-container">
    <button class="return-button" :class="hiddenClass" @click="router.push('/home')">Return Home</button>

    <div v-if="!isExpanded" class="letter-cover" @click="toggleExpand">
      <div class="cover-content">
        <div class="arrow top">▼</div>
        <div class="heart">♥</div>
        <div class="arrow bottom">▼</div>
      </div>
    </div>

    <transition name="expand">
      <div v-show="isExpanded" class="full-letter">
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
            As Valentine's Day is nearing, I want to remind you of my love, our love. I found myself thinking..about us..about the joy..the sadness..and the experiences that we shared, the journey, and our story. You have been a blessing to my life babie. You decorated my life. Every moment we share paints my heart with love and joy. I reminisce about the first karaoke we had, it was just before valentine's day. From that moment, I knew that I wanted to be with you for all my life, I wanted to be your partner in this journey called life. Your <b>smile</b> lights up my days and you <b>voice</b> and <b>laughter</b> calms the chaos in my heart and mind.
          </p>
          <p>
            May our journey together be as enchanting as a starlit night and as warm as the first bloom of spring. I eagerly await each new day wrapped in your loving embrace.
          </p>
          <p>Happy Valentine's Day Babiee!! Am lovee youuuuuu<b> 💖 </b><br></p>
          <p>
            Thank you for being comforting and caring babie. Thank you for being my safe space. I can't wait to hug and kiss youuu my babiee. I love youuuu my babiee. I'm so grateful for you. I'm so grateful for us. I'm so grateful for our story. I'm so grateful for our love. I'm so grateful for our journey. I'm so grateful for our future. I'm so grateful for youuuu. <br><b>I LOVEEE YOUUUUUU</b>
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

    <div
      v-for="heart in floatingHearts"
      :key="heart.id"
      class="floating-heart"
      :style="{ left: heart.left + '%', ...heart.style }">
      ♥
    </div>

    <transition name="fade">
      <div v-if="showAcceptModal" class="accept-overlay" @click.self="closeAcceptModal">
        <div class="modal-content">
          <h2>Date? Sunday?</h2>
          <p>Do you agree to have a date on Sunday? Please select your preferences:</p>
          <div class="checkbox-list">
            <label><input type="checkbox" v-model="checkboxes.pizza"> Pizza?</label>
            <label><input type="checkbox" v-model="checkboxes.cake"> Cake?</label>
            <label><input type="checkbox" v-model="checkboxes.movies"> Movies?</label>
            <label><input type="checkbox" v-model="checkboxes.stardew"> Stardew?</label>
          </div>
          <button @click="submitAgreement">Agree</button>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showSuccessModal" class="accept-overlay" @click.self="closeSuccessModal">
        <div class="modal-content">
          <h2>Woohoo!</h2>
          <p>Your preferences have been recorded. We can't wait for Sunday's date!</p>
          <button @click="closeSuccessModal">Close</button>
        </div>
      </div>
    </transition>

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
  color: #d6336c;
  animation: floatUp cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
  will-change: transform, opacity;
}

@keyframes floatUp {
  0% {
    top: 100%;
    opacity: 0;
    transform: translateY(0) translateX(-50%) scale(0.5);
  }
  10% {
    opacity: 1;
  }
  50% {
    transform: translateY(-100vh) translateX(calc(-50% + 30px)) scale(1);
  }
  90% {
    opacity: 1;
  }
  100% {
    top: -20%;
    opacity: 0;
    transform: translateY(-100vh) translateX(calc(-50% - 30px)) scale(0.8);
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

.modal-content {
  background: #fff;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  text-align: center;
}

.modal-content h2 {
  margin-bottom: 1rem;
  color: #d6336c;
}

.modal-content p {
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
  color: #333;
}

.modal-content button {
  padding: 0.5rem 1rem;
  background: #d6336c;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.modal-content button:hover {
  background: #bf285c;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.fade-enter-to, .fade-leave-from {
  opacity: 1;
}

.checkbox-list {
  margin: 1rem 0;
  text-align: left;
}
.checkbox-list label {
  display: block;
  margin-bottom: 0.5rem;
}
</style>
