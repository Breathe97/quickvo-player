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
// const url = ref('https://pull.pryun.vip/stream_5564094315/1763605928988.flv?auth_key=1763692328-0-0-c42f0978280e3d2e2eb0205fff4e0aaf')
// const url = ref('https://pull-f5.douyinliving.com/media/stream-118333372556903250.flv?arch_hrchy=s2&expire=1764229939&major_anchor_level=vip&s_anchor=1&sign=f9809ea5cf5415787273e5674a011511&t_id=037-202511201552196940FF516DA070739F59-Kht22F&unique_id=stream-118333372556903250_850_flv&volcSecret=f9809ea5cf5415787273e5674a011511&volcTime=1764229939&_session_id=033-2025112015521963962453573CA27F5E1A.1763625139639.34778&rsi=0&abr_pts=-800')
const url = ref('https://pull.pryun.vip/stream_10592/1765506490210.flv?auth_key=1765592890-0-0-b488ac16fedb3b163a25dfe6ab1836ee')

const player = new QuickVoPlayer({ debug: true })

const users = ref<any>([])
player.on.users = (e) => {
  console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;', `------->Breathe: e`, e)
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
