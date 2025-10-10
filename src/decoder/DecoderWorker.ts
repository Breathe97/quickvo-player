import Worker from './index.worker.ts?worker&inline' // 在生产环境中，可能会遇到 MIME type is text/html 的错误。可以通过添加 ?inline 参数避免单独生成 Worker 文件。

export class DecoderWorker {
  worker = new Worker()

  constructor() {
    this.worker.onmessage = (e) => {
      const { type, action, data } = e.data

      switch (type) {
        case 'audio':
          {
            if (action === 'onDecode') {
              this.audio.onDecode(data)
            }
            if (action === 'onError') {
              this.audio.onError(data)
            }
          }
          break
        case 'video':
          {
            if (action === 'onDecode') {
              this.video.onDecode(data)
            }
            if (action === 'onError') {
              this.video.onError(data)
            }
          }
          break
      }
    }
  }

  audio = {
    init: async (config: AudioDecoderConfig) => {
      this.worker.postMessage({ type: 'audio', action: 'init', data: config })
    },
    decode: async (init: EncodedAudioChunkInit) => {
      this.worker.postMessage({ type: 'audio', action: 'decode', data: init })
    },
    onDecode: (_AudioData: AudioData) => {},
    onError: (_e: DOMException) => {},
    flush: () => {
      this.worker.postMessage({ type: 'audio', action: 'flush' })
    },
    destroy: () => {
      this.worker.postMessage({ type: 'audio', action: 'destroy' })
    }
  }

  video = {
    init: async (config: VideoDecoderConfig) => {
      this.worker.postMessage({ type: 'video', action: 'init', data: config })
    },
    decode: async (init: EncodedVideoChunkInit) => {
      this.worker.postMessage({ type: 'video', action: 'decode', data: init })
    },
    onDecode: (_frame: { img: ImageBitmap; timestamp: number }) => {},
    onError: (_e: DOMException) => {},
    flush: () => {
      this.worker.postMessage({ type: 'video', action: 'flush' })
    },
    destroy: () => {
      this.worker.postMessage({ type: 'video', action: 'destroy' })
    }
  }
}
