import * as protos from './protos/index'

interface AudioInfo {
  remove: boolean
  isEnable: boolean // 是否开启设备
  updateTime: number // 更新时间
  isMute: boolean // 是否静音
  volume: number // 音量值
}

interface VideoInfo {
  remove: boolean
  isEnable: boolean // 是否开启设备
  updateTime: number // 更新时间
  isMute: boolean
  sx: number
  sy: number
  sw: number
  sh: number
  stream?: MediaStream // 用户流
}

const createAudioInfo = () => {
  return {
    remove: false,
    isEnable: false,
    updateTime: 0,
    isMute: false,
    volume: 0
  }
}

const createVideoInfo = () => {
  return {
    remove: false,
    isEnable: false,
    updateTime: 0,
    isMute: false,
    sx: 0,
    sy: 0,
    sw: 0,
    sh: 0
  }
}

export class RoomUser {
  userId = ''

  mc_audio: AudioInfo | undefined // 麦克风
  mc_video: VideoInfo | undefined // 摄像头

  ss_audio: AudioInfo | undefined // 屏幕共享视频
  ss_video: VideoInfo | undefined // 屏幕共享音频

  updateTime: number = 0

  constructor() {}

  getUpdateTimeKey = () => {
    const arr = []
    if (this.mc_audio) {
      arr.push(this.mc_audio.updateTime)
    }
    if (this.mc_video) {
      arr.push(this.mc_video.updateTime)
    }
    if (this.ss_audio) {
      arr.push(this.ss_audio.updateTime)
    }
    if (this.ss_video) {
      arr.push(this.ss_video.updateTime)
    }
    return arr.join('_')
  }

  init = (info: protos.com.quick.voice.proto.UserInfo) => {
    const { id, audios = [], videos = [] } = info
    this.userId = id

    const oldUpdateTimeKey = this.getUpdateTimeKey()

    // 先标记所有轨道均为待删除状态
    {
      if (this.mc_audio) {
        this.mc_audio.remove = true
      }
      if (this.mc_video) {
        this.mc_video.remove = true
      }
      if (this.ss_audio) {
        this.ss_audio.remove = true
      }
      if (this.ss_video) {
        this.ss_video.remove = true
      }
    }

    // 检查更新audio
    for (const audio of audios) {
      const { type = 0, isEnable = false, isMute = false, updateTime, volume = 0 } = audio
      switch (type) {
        case 0: // 麦克风
          {
            if (!this.mc_audio) {
              this.mc_audio = createAudioInfo()
            }
            this.mc_audio.remove = false
            if (this.mc_audio.updateTime === updateTime) break // 比对更新时间戳是否完全符合 不符合则需要更新

            this.mc_audio.isEnable = Boolean(isEnable)
            this.mc_audio.isMute = Boolean(isMute)
            this.mc_audio.updateTime = Number(updateTime)
            this.mc_audio.volume = Number(volume)
          }

          break
        case 1: // 屏幕共享音频
          {
            if (!this.ss_audio) {
              this.ss_audio = createAudioInfo()
            }
            this.ss_audio.remove = false
            if (this.ss_audio.updateTime === updateTime) break // 比对更新时间戳是否完全符合 不符合则需要更新

            this.ss_audio.isEnable = Boolean(isEnable)
            this.ss_audio.isMute = Boolean(isMute)
            this.ss_audio.updateTime = Number(updateTime)
            this.ss_audio.volume = Number(volume)
          }
          break
      }
    }

    // 检查更新video
    for (const video of videos) {
      const { type = 0, isEnable, isMute, updateTime, width, height, x, y } = video
      switch (type) {
        case 0: // //摄像头
          {
            if (!this.mc_video) {
              this.mc_video = createVideoInfo()
            }
            this.mc_video.remove = false
            if (this.mc_video.updateTime === updateTime) break // 比对更新时间戳是否完全符合 不符合则需要更新

            this.mc_video.isEnable = Boolean(isEnable)
            this.mc_video.isMute = Boolean(isMute)
            this.mc_video.updateTime = Number(updateTime) || 0
            this.mc_video.sx = x || 0
            this.mc_video.sy = y || 0
            this.mc_video.sw = width || 0
            this.mc_video.sh = height || 0
          }

          break
        case 1: // 屏幕共享视频
          {
            if (!this.ss_video) {
              this.ss_video = createVideoInfo()
            }
            this.ss_video.remove = false
            if (this.ss_video.updateTime === updateTime) break // 比对更新时间戳是否完全符合 不符合则需要更新

            this.ss_video.isEnable = Boolean(isEnable)
            this.ss_video.isMute = Boolean(isMute)
            this.ss_video.updateTime = Number(updateTime) || 0
            this.ss_video.sx = x || 0
            this.ss_video.sy = y || 0
            this.ss_video.sw = width || 0
            this.ss_video.sh = height || 0
          }
          break
      }
    }

    // 移除需要删除的信息
    if (this.mc_audio?.remove) {
      this.mc_audio = undefined
    }
    if (this.mc_video?.remove) {
      this.mc_video = undefined
    }
    if (this.ss_audio?.remove) {
      this.ss_audio = undefined
    }
    if (this.ss_video?.remove) {
      this.ss_video = undefined
    }

    const newUpdateTimeKey = this.getUpdateTimeKey()

    if (oldUpdateTimeKey !== newUpdateTimeKey) {
      this.updateTime = new Date().getTime()
    }
  }

  destroy = () => {
    this.mc_audio = undefined
    this.mc_video = undefined
    this.ss_audio = undefined
    this.ss_video = undefined
  }
}
