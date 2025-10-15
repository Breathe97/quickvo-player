<template>
  <div>
    <div style="font-size: 30px; line-height: 80px; padding-top: 40px">WebCodecsPlayer</div>
    <div style="margin: 8px 0; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap">
      <input style="padding: 6px; width: 240px" id="input" type="text" v-model="url" placeholder="https://xxxx.flv" />
      <div style="display: flex; gap: 12px">
        <button @click="play">Start</button>
        <button @click="setDisplay">DisplayMode: {{ display }}</button>
        <button @click="stop">Stop</button>
      </div>
    </div>
    <div class="play-view">
      <div class="canvas-video-frame">
        <div class="title">VideoFrame</div>
        <div id="canvas-video-frame-view" style="background-color: antiquewhite"></div>
      </div>
      <div class="canvas-video-frame">
        <div class="title">MediaStream</div>
        <div id="canvas-video-stream-view" style="background-color: aquamarine"></div>
      </div>
      <div v-for="user in users" :key="user.userId" class="canvas-video-cut">
        <div class="title">Cut: {{ user.userId }}</div>
        <div id="canvas-video-cut-view" style="background-color: dimgray">
          <video :srcObject="user.mc_video?.stream" autoplay style="width: 100%; height: 100%"></video>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, nextTick } from 'vue'
// import { QuickVoPlayer } from 'pr-player'
// import { QuickVoPlayer } from '../../dist/index'
import { QuickVoPlayer } from '../../src/index'

// const url = ref('https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/flv/xgplayer-demo-720p.flv')
const url = ref('https://stream.quickvo.live/stream_1580201172/1760493179893.flv?auth_key=1760579579-0-0-f34a6cd7a074dbc0cf78b028d55a5b65')

const users = ref<any>([])

const player = new QuickVoPlayer()

player.on.users = (e) => {
  if (display.value === 'cut') {
    users.value = e
  }
}

const stop = () => {
  player.stop()
}

const play = async () => {
  player.start(url.value)
  player.setMute(false)

  {
    const stream = player.getStream()
    if (stream) {
      const dom = document.querySelector('#canvas-video-stream-view')
      const view = document.createElement('video')
      view.style.width = '100%'
      view.style.height = '100%'
      view.srcObject = stream
      view.play()
      dom?.replaceChildren(view)
    }
  }
}

const display = ref<'cut' | 'original'>('original')
const setDisplay = () => {
  display.value = display.value === 'original' ? 'cut' : 'original'
  player.setDisplayMode(display.value)
}
</script>
<style scoped>
.play-view {
  position: relative;
  padding: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  justify-content: center;
  gap: 12px;
}

.canvas-video-frame,
.canvas-video-cut {
  flex: 1;
  min-width: 320px;
  max-width: 600px;
  aspect-ratio: 16/9;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  font-size: 20px;
  line-height: 40px;
}

#canvas-video-frame-view,
#canvas-video-stream-view,
#canvas-video-cut-view {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
</style>
