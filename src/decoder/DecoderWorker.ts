import Worker from './index.worker.ts?worker&inline' // 在生产环境中，可能会遇到 MIME type is text/html 的错误。可以通过添加 ?inline 参数避免单独生成 Worker 文件。

export class DecoderWorker {
  worker = new Worker()

  onDecode = (_frame: { img: ImageBitmap; timestamp: number }) => {}
  onError = (_e: DOMException) => {}

  constructor() {
    this.worker.onmessage = (e) => {
      const { action, data } = e.data
      if (action === 'onDecode') {
        this.onDecode(data)
      }
      if (action === 'onError') {
        this.onError(data)
      }
    }
  }

  initAudio = (config: AudioDecoderConfig) => {
    this.worker.postMessage({ action: 'initAudio', data: config })
  }

  initVideo = (config: VideoDecoderConfig) => {
    this.worker.postMessage({ action: 'initVideo', data: config })
  }

  decodeAudio = async (init: EncodedAudioChunkInit) => {
    this.worker.postMessage({ action: 'decodeAudio', data: init })
  }

  decodeVideo = async (init: EncodedVideoChunkInit) => {
    this.worker.postMessage({ action: 'decodeVideo', data: init })
  }

  flush = () => {
    this.worker.postMessage({ action: 'flush' })
  }

  destroy = () => {
    this.worker.postMessage({ action: 'destroy' })
  }
}
