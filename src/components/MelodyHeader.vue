<script setup lang='ts'>

</script>

<template>
  <div class="text-container">
    <div>
      <span class="my">MY </span>
      <span class="hello">MELODY<div class="bow"></div></span>
    </div>
    <div class="cafe">
      <div class="coffee-cup">
        <div class="heart"></div>
      </div>
      <span class="c">C</span>
      <span class="a">A</span>
      <span class="f">F</span>
      <span class="e">E</span>
      <div class="donut">
        <div class="sprinkles">
          <div class="sprinkle"></div>
          <div class="sprinkle"></div>
          <div class="sprinkle"></div>
          <div class="sprinkle"></div>
          <div class="sprinkle"></div>
        </div>
      </div>
    </div>
    <div class="wiki">
      <span class="w">W</span>
      <span class="i1">I</span>
      <span class="k">K</span>
      <span class="i2">I</span>
    </div>
  </div>
</template>

<style scoped>
  .text-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .my {
    font-size: 50px;
    color: #ff69b4;
    font-family: 'Comic Sans MS', cursive, sans-serif;
    font-weight: bold;
    text-shadow: 3px 3px 0 white;
    display: inline-block;
  }

  .hello {
    font-size: 80px;
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

  .kitty {
    font-size: 80px;
    color: #ff69b4;
    font-family: 'Comic Sans MS', cursive, sans-serif;
    font-weight: bold;
    text-shadow: 3px 3px 0 white;
    display: inline-block;
  }

  .cafe {
    font-size: 55px;
    font-family: 'Comic Sans MS', cursive, sans-serif;
    font-weight: bold;
    text-shadow: 3px 3px 0 white;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 5px;
  }

  .c {
    color: #ffb300;
  }
  .a {
    color: #f48fb1;
  }
  .f {
    color: #81d4fa;
  }
  .e {
    color: #a5d6a7;
  }

  .coffee-cup {
    width: 40px;
    height: 25px;
    background-color: #ffcdd2;
    border-radius: 0 0 20px 20px;
    border: 4px solid white;
    position: relative;
    margin-right: 8px;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    box-sizing: border-box;
  }

  .coffee-cup::before {
    content: '';
    position: absolute;
    top: -7px;
    left: -10px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 4px solid white;
    border-right-color: transparent;
    border-bottom-color: transparent;
    box-sizing: border-box;
  }

  .heart {
    position: absolute;
    top: 4px;
    width: 10px;
    height: 10px;
    background-color: #f06292;
    transform: rotate(-45deg);
  }

  .heart::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 0;
    width: 10px;
    height: 6px;
    background-color: #f06292;
    border-top-left-radius: 50%;
    border-top-right-radius: 50%;
  }

  .donut {
    width: 40px;
    height: 40px;
    background-color: #ffcc80;
    border-radius: 50%;
    border: 4px solid white;
    position: relative;
    margin-left: 8px;
    box-sizing: border-box;
  }

  .donut::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 14px;
    height: 14px;
    background-color: #f48fb1;
    border-radius: 50%;
  }

  .sprinkles {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .sprinkle {
    position: absolute;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background-color: white;
  }

  .sprinkle:nth-child(1) { top: 15%; left: 25%; }
  .sprinkle:nth-child(2) { top: 35%; right: 20%; }
  .sprinkle:nth-child(3) { bottom: 30%; left: 35%; }
  .sprinkle:nth-child(4) { top: 65%; right: 35%; }
  .sprinkle:nth-child(5) { bottom: 15%; left: 55%; }

  .wiki {
    font-size: 90px;
    font-family: 'Comic Sans MS', cursive, sans-serif;
    font-weight: bold;
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }

  .w {
    color: #81d4fa;
    text-shadow: 3px 3px 0 white;
  }
  .i1 {
    color: #a5d6a7;
    text-shadow: 3px 3px 0 white;
  }
  .k {
    color: #ffb300;
    text-shadow: 3px 3px 0 white;
  }
  .i2 {
    color: #f48fb1;
    text-shadow: 3px 3px 0 white;
  }
</style>

<script>
export default {
  name: 'HelloKittyCafeText'
}
</script>