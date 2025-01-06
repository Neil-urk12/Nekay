<script setup lang='ts'>

</script>

<template>
  <div class="text-container">
    <div>
      <span class="hello">MELODY<div class="bow"></div></span>
    </div>
  </div>
</template>

<style scoped>
  .text-container {
    position: relative;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  .hello {
    font-size: 60px;
    color: #ff69b4;
    font-family: 'Comic Sans MS', cursive, sans-serif;
    font-weight: bold;
    text-shadow: 3px 3px 0 white;
    display: inline-block;
    position: relative;
  }

  .bow {
    position: absolute;
    top: 15px;
    left: 50%;
    transform: translateX(-50%);
    width: 30px;
    height: 15px;
    background-color: #ff69b4;
    border-radius: 50% 50% 0 0;
    border: 4px solid white;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
  }

  .bow::before,
  .bow::after {
    content: '';
    position: absolute;
    bottom: -3px;
    width: 12px;
    height: 15px;
    background-color: #ff69b4;
    border-radius: 50%;
    border-left: 4px solid white;
    border-right: 4px solid white;
    box-sizing: border-box;
  }

  .bow::before {
    left: -4px;
  }

  .bow::after {
    right: -4px;
  }
</style>

<script>
export default {
  name: 'HelloKittyCafeText'
}
</script>