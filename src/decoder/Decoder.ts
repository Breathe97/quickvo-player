export class Decoder {
  private audioDecoderConfig: AudioDecoderConfig | undefined
  private audioDecoder: AudioDecoder | undefined

  private videoDecoderConfig: VideoDecoderConfig | undefined
  private videoDecoder: VideoDecoder | undefined

  private hasKeyFrame = false

  constructor() {}

  audio = {
    init: async (config: AudioDecoderConfig) => {
      this.audio.destroy()
      this.audioDecoderConfig = { ...config }
      this.audioDecoder = new AudioDecoder({
        output: async (data: AudioData) => {
          this.audio.onDecode && this.audio.onDecode(data)
        },
        error: (e) => {
          this.audio.onError && this.audio.onError(e)
        }
      })

      this.audioDecoder.configure(this.audioDecoderConfig)
    },
    decode: async (init: EncodedAudioChunkInit) => {
      // console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;', `------->Breathe: init`, init)
      if (!this.audioDecoder) return
      const chunk = new EncodedAudioChunk(init)
      // console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;', `------->Breathe: chunk`, chunk)
      this.audioDecoder.decode(chunk)
    },
    onDecode: (_AudioData: AudioData) => {},
    onError: (_e: DOMException) => {},
    flush: () => {
      this.audioDecoder?.flush()
    },
    destroy: () => {
      this.audioDecoderConfig = undefined
      this.audioDecoder?.close()
      this.audioDecoder = undefined
    }
  }

  video = {
    init: async (config: VideoDecoderConfig) => {
      this.video.destroy()
      this.videoDecoderConfig = { ...config }
      this.videoDecoder = new VideoDecoder({
        output: async (frame: VideoFrame) => {
          const img = await createImageBitmap(frame)
          const timestamp = frame.timestamp
          frame.close()
          if (img.width > 0 && img.height > 0) {
            this.video.onDecode && this.video.onDecode({ img, timestamp })
          } else {
            img.close()
          }
        },
        error: (e) => {
          this.video.onError && this.video.onError(e)
        }
      })

      this.videoDecoder.configure(this.videoDecoderConfig)
    },
    decode: async (init: EncodedVideoChunkInit) => {
      if (!this.videoDecoder) return
      if (init.type === 'key') {
        this.hasKeyFrame = true
      }
      if (this.hasKeyFrame && this.videoDecoder.decodeQueueSize < 2) {
        const chunk = new EncodedVideoChunk(init)
        this.videoDecoder.decode(chunk)
      }
    },
    onDecode: (_frame: { img: ImageBitmap; timestamp: number }) => {},
    onError: (_e: DOMException) => {},
    flush: () => {
      this.videoDecoder?.flush()
    },
    destroy: () => {
      this.videoDecoderConfig = undefined
      this.videoDecoder?.close()
      this.videoDecoder = undefined
      this.hasKeyFrame = false
    }
  }
}
