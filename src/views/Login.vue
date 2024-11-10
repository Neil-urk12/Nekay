<template>
    <div class="login-container">
      <div class="login-box">
        <div class="melody-header">
          <div class="melody-ears">
            <div class="ear left"></div>
            <div class="ear right"></div>
          </div>
          <div class="melody-face">
            <div class="eyes"></div>
            <div class="nose"></div>
          </div>
        </div>
        
        <h1>Welcome!</h1>
        <form @submit.prevent="handleSubmit" class="login-form">
          <div class="input-group">
            <input
              type="password"
              v-model="secretKey"
              placeholder="Enter Secret Key"
              :class="{ 'error': hasError }"
            />
            <span class="error-message" v-if="hasError">{{ errorMessage }}</span>
          </div>
          
          <button type="submit" :disabled="!secretKey">
            Login
          </button>
        </form>
      </div>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { ref } from 'vue'
  
  const secretKey = ref('')
  const hasError = ref(false)
  const errorMessage = ref('')
  
  const handleSubmit = async () => {
    hasError.value = false
    errorMessage.value = ''
    
    if (secretKey.value.length < 6) {
      hasError.value = true
      errorMessage.value = 'Secret key must be at least 6 characters'
      return
    }
    
    try {
      if (secretKey.value !== process.env.VITE_SECRET_KEY) {
        throw new Error('Invalid secret key')
      }
      console.log('Secret key submitted:', secretKey.value)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('Login successful!')
    } catch (error) {
      hasError.value = true
      errorMessage.value = 'Invalid secret key'
    }
  }
  </script>
  
  <style scoped>
  .login-container {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #fff5f7;
    font-family: 'Arial Rounded MT Bold', Arial, sans-serif;
  }
  
  .login-box {
    background: white;
    padding: 2rem;
    border-radius: 20px;
    box-shadow: 0 8px 24px rgba(255, 182, 193, 0.2);
    width: 90%;
    max-width: 400px;
    text-align: center;
  }
  
  .melody-header {
    position: relative;
    height: 120px;
    margin-bottom: 1rem;
  }
  
  .melody-ears {
    position: relative;
    height: 60px;
  }
  
  .ear {
    position: absolute;
    width: 40px;
    height: 60px;
    background: #FFB6C1;
    border-radius: 20px;
    top: 0;
  }
  
  .ear.left {
    left: 50%;
    transform: translateX(-50px) rotate(-15deg);
  }
  
  .ear.right {
    right: 50%;
    transform: translateX(50px) rotate(15deg);
  }
  
  .melody-face {
    width: 100px;
    height: 100px;
    background: #FFB6C1;
    border-radius: 50%;
    position: relative;
    margin: -30px auto 0;
  }
  
  .eyes {
    position: relative;
    top: 40%;
    display: flex;
    justify-content: center;
    gap: 20px;
  }
  
  .eyes::before,
  .eyes::after {
    content: '';
    width: 8px;
    height: 8px;
    background: #000;
    border-radius: 50%;
    position: absolute;
  }
  
  .eyes::before {
    left: 30px;
  }
  
  .eyes::after {
    right: 30px;
  }
  
  .nose {
    width: 10px;
    height: 10px;
    background: #FF69B4;
    border-radius: 50%;
    position: absolute;
    left: 50%;
    top: 55%;
    transform: translateX(-50%);
  }
  
  h1 {
    color: #FF69B4;
    margin-bottom: 2rem;
    font-size: 2rem;
  }
  
  .login-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  input {
    padding: 1rem;
    border: 2px solid #FFB6C1;
    border-radius: 25px;
    font-size: 1rem;
    outline: none;
    transition: all 0.3s ease;
  }
  
  input:focus {
    border-color: #FF69B4;
    box-shadow: 0 0 0 3px rgba(255, 105, 180, 0.2);
  }
  
  input.error {
    border-color: #ff4466;
  }
  
  .error-message {
    color: #ff4466;
    font-size: 0.875rem;
  }
  
  button {
    background: #FF69B4;
    color: white;
    border: none;
    padding: 1rem;
    border-radius: 25px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  button:hover:not(:disabled) {
    background: #ff4499;
    transform: translateY(-2px);
  }
  
  button:disabled {
    background: #ffb6c1;
    cursor: not-allowed;
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  
  button:hover:not(:disabled) {
    animation: bounce 0.5s ease infinite;
  }
  </style>
