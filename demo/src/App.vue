<template>
  <div>
    <div style="font-size: 30px; line-height: 80px; padding-top: 40px">WebCodecsPlayer</div>
    <div style="margin: 8px 0; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap">
      <input style="padding: 6px; width: 240px" id="input" type="text" v-model="url" placeholder="https://xxxx.flv" />
      <div style="display: flex; gap: 12px">
        <button @click="changeDisplayMode" style="min-width: 86px">{{ displayMode }}</button>
        <button @click="play">Start</button>
        <button @click="stop">Stop</button>
      </div>
    </div>
    <div style="display: flex; align-items: center; justify-content: center; margin-top: 40px">
      <div id="player-view" style="min-width: 320px; max-width: 600px; height: 320px; aspect-ratio: 16/9; background-color: antiquewhite; display: flex; align-items: center; justify-content: center"></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, nextTick } from 'vue'
// import { PrPlayer } from 'pr-player'
// import { PrPlayer } from '../../dist/index'
import { QuickVoPlayer } from '../../src/index'

// const url = ref('https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/flv/xgplayer-demo-720p.flv')
const url = ref('https://stream.quickvo.live/stream_6873370840/1760321026453.flv?auth_key=1760407426-0-0-247cde978599a7a1edb58292a6d3785d')

const player = new QuickVoPlayer()

const play = async () => {
  player.init('#player-view', displayMode.value)
  player.start(url.value)
  player.setMute(false)
}

const stop = () => {
  player.stop()
}

const displayMode = ref<'cut' | 'original'>('original')

const changeDisplayMode = () => {
  displayMode.value = displayMode.value === 'original' ? 'cut' : 'original'
}
</script>
<style scoped></style>
