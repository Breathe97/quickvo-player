<template>
  <div>
    <div style="font-size: 30px; line-height: 80px; padding-top: 40px">QuickVoPlayer</div>
    <div style="margin: 8px 0; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap">
      <input style="padding: 6px; width: 240px" id="input" type="text" v-model="url" placeholder="https://xxxx.flv" />
      <div style="display: flex; gap: 12px">
        <button @click="play">Start</button>
        <button @click="setDisplay">DisplayMode: {{ display }}</button>
        <button @click="stop">Stop</button>
      </div>
    </div>
    <div class="play-view">
      <!-- <div class="canvas-video-frame">
        <div class="title">VideoFrame</div>
        <div id="canvas-video-frame-view" style="background-color: antiquewhite"></div>
      </div> -->
      <div v-show="display === 'original'" class="canvas-video-frame">
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
import { ref } from 'vue'
// import { QuickVoPlayer } from 'quickvo-player'
// import { QuickVoPlayer } from '../../dist/index'
import { QuickVoPlayer } from '../../src/index'

// const url = ref('https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/flv/xgplayer-demo-720p.flv')
// const url = ref('https://stream.quickvo.live/stream_6307965365/1761530210242.flv?auth_key=1761616610-0-0-ab441b82d17526cd63746b6549daa6a0')
const url = ref('https://pull.pryun.vip/stream_5564094315/1763605928988.flv?auth_key=1763692328-0-0-c42f0978280e3d2e2eb0205fff4e0aaf')
// const url = ref('https://stream.quickvo.live/stream_a9afa991-585e-4bb3-bbb0-0e947e6b87cf/1760941450189.flv?auth_key=1761027850-0-0-1ffff9d2523c75fe88e87ab8e96ef0b2')

const player = new QuickVoPlayer({ debug: true })

const users = ref<any>([])
player.on.users = (e) => {
  if (display.value === 'cut') {
    users.value = e
  }
}

const stop = () => {
  player.stop()
}

const play = async () => {
  await player.start(url.value)
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
  if (display.value === 'original') {
    users.value = []
  }
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
