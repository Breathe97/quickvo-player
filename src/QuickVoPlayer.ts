// import { PrWebSocket } from 'pr-ws'
import { PrPlayer } from 'pr-player'
import * as protos from './protos/index'
import { RoomUser } from './RoomUser'

// 解析自定义SEI信息
const parseSEI = (payload: Uint8Array) => {
  let index = 0

  let payloadType = 0
  while (true) {
    const num = payload[index]
    payloadType = payloadType + num
    index = index + 1
    if (num !== 0xff) break
  }

  let payloadSize = 0
  while (true) {
    const num = payload[index]
    payloadSize = payloadSize + num
    index = index + 1
    if (num !== 0xff) break
  }

  // 处理Type=5的user_data_unregistered
  if (payloadType === 5) {
    // UUID是user_data_unregistered的固定前缀，用于唯一标识业务角色（如直播房间ID、设备指纹等）。从Payload的第1个字节开始，连续读取16个字节（十六进制格式）
    const uuidBytes = payload.slice(index, index + 16)
    const arr = Array.from(uuidBytes, (item) => item.toString(16).padStart(2, '0'))
    const uuid = arr.join('')
    index = index + 16

    // 业务数据位于UUID之后，长度为Payload Size - 16
    const payloadDataLength = payloadSize - 16
    const payloadData = payload.slice(index, index + payloadDataLength)

    const res = protos.com.quick.voice.proto.SeiData.decode(payloadData)

    const { event = 0 } = res
    const data_remote = res.data

    let data

    switch (event) {
      case 0: // 布局事件
        {
          data = protos.com.quick.voice.proto.LayoutData.decode(res.data)
        }
        break
      case 1: // 自定义数据事件
        {
          data = protos.com.quick.voice.proto.CustomInfo.decode(res.data)
        }
        break
    }

    const result = { uuid, ...res, event, data_remote, data }

    return result
  }
}

interface Room {
  roomId?: string
  updateTime?: string
  author?: string
  version?: string
}

interface QuickVoPlayerOption {
  debug?: boolean
  ws?: string
}

export class QuickVoPlayer {
  option: QuickVoPlayerOption = {
    debug: false,
    ws: 'wss://livep2p.devplay.cc/websocket'
  }
  displayMode: 'original' | 'cut' = 'original'

  prPlayer: PrPlayer

  dom: Element | undefined

  room: Room = {
    roomId: '',
    updateTime: '',
    author: '',
    version: ''
  }

  usersMap: Map<string, RoomUser> = new Map()

  on = {
    users: (_users: any) => {}
  }

  constructor(option: QuickVoPlayerOption = {}) {
    // const data = {
    //   appId: 'A6B499768801E248ACA11E5F842DB6DF',
    //   userId: 'web_breathe',
    //   // "authId":"mobilePackageName" | "webRequestHostOrigin",
    //   platform: 'web',
    //   version: '1.0.1' // 连接版本号
    // }

    // const session = btoa(encodeURI(JSON.stringify(data)))

    // const url = `${this.option.ws}?s=${session}&t=${Date.now()}`

    // let ws = new WebSocket(url)

    const { debug = false } = option
    this.option.debug = debug
    this.prPlayer = new PrPlayer({ debug })
    this.prPlayer.on.demuxer.chunk = (_e) => {
      // console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;', `------->Breathe: e`, e)
    }
    this.prPlayer.on.decoder.sei = this.onSEI
  }

  start = async (url: string) => {
    this.stop()
    return this.prPlayer.start(url)
  }
  stop = () => {
    this.prPlayer.stop()
    this.usersMap = new Map()
    this.room.roomId = ''
    this.room.author = ''
    this.room.updateTime = ''
    this.room.version = ''
  }
  setMute = (state?: boolean | undefined) => {
    this.prPlayer.setMute(state)
  }
  getStream = () => {
    return this.prPlayer.getStream()
  }

  getAllUseUpdateKey = () => {
    const usersIns = [...this.usersMap.values()]
    const arr = Array.from(usersIns, (ins) => ins.updateTime)
    return arr.join('_')
  }

  checkAndCreateUser = (userId: string, info: protos.com.quick.voice.proto.UserInfo) => {
    if (!this.usersMap.has(userId)) {
      const userIns = new RoomUser()
      this.usersMap.set(userId, userIns)
      userIns.init(info)
      if (userIns) {
        if (userIns.mc_video) {
          const { sx, sy, sw, sh } = userIns.mc_video

          const key = `${userIns.userId}_mc_video`

          const { worker, stream, destroy } = this.prPlayer.cut.create(key, { sx, sy, sw, sh })
          userIns.mc_video.worker = worker

          if (this.displayMode === 'original') {
            worker.setPause(true)
          }
          userIns.mc_video.stream = stream
          userIns.mc_video.destroy = () => {
            destroy()
            this.prPlayer.cut.remove(key)
            this.usersMap.delete(userIns.userId)
          }
        }
        if (userIns.ss_video) {
          const { sx, sy, sw, sh } = userIns.ss_video
          const key = `${userIns.userId}_ss_video`
          const { worker, stream, destroy } = this.prPlayer.cut.create(key, { sx, sy, sw, sh })
          userIns.ss_video.worker = worker

          if (this.displayMode === 'original') {
            worker.setPause(true)
          }
          userIns.ss_video.stream = stream
          userIns.ss_video.destroy = () => {
            destroy()
            this.prPlayer.cut.remove(key)
            this.usersMap.delete(userIns.userId)
          }
        }
      }
    } else {
      const userIns = this.usersMap.get(userId)
      userIns?.init(info)
      // 根据当前用户持有轨道 更新渲染器
      if (userIns?.mc_video) {
        const { sx, sy, sw, sh } = userIns.mc_video
        userIns?.mc_video.worker?.setCut({ sx, sy, sw, sh })
      }
      if (userIns?.ss_video) {
        const { sx, sy, sw, sh } = userIns.ss_video
        userIns?.ss_video.worker?.setCut({ sx, sy, sw, sh })
      }
    }
  }

  /**
   * 监听SEI信息
   */
  onSEI = (payload: Uint8Array) => {
    try {
      const res = parseSEI(payload)
      // console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;', `------->Breathe: onSEI`, res)
      if (!res) return
      const { event, data } = res as any
      switch (event) {
        case 0: // 布局事件
          {
            const { roomId, userMap } = data
            if (roomId !== this.room.roomId) return

            const oldUpdateTimeKey = this.getAllUseUpdateKey()

            const userIds = Object.keys(userMap)

            // 移除不存在的用户
            {
              const usersIns = [...this.usersMap.values()]

              for (const userIns of usersIns) {
                if (!userIds.includes(userIns.userId)) {
                  userIns?.destroy()
                }
              }
            }

            // 更新其余用户的信息
            for (const userId of userIds) {
              const info = userMap[userId] as protos.com.quick.voice.proto.UserInfo
              this.checkAndCreateUser(userId, info)
            }

            const newUpdateTimeKey = this.getAllUseUpdateKey()

            if (oldUpdateTimeKey !== newUpdateTimeKey) {
              if (this.on.users) {
                const users = [...this.usersMap.values()]
                const arr = Array.from(users, ({ userId, mc_audio, mc_video, ss_audio, ss_video, updateTime }) => ({ userId, mc_audio, mc_video, ss_audio, ss_video, updateTime }))
                this.on.users(arr)
              }
            }
          }
          break
        case 1: // 房间信息
          {
            const { roomId, updateTime } = data
            const { author, version } = data.customKeyMap
            this.room.roomId = roomId
            this.room.updateTime = updateTime
            this.room.author = author
            this.room.version = version
          }
          break
      }
    } catch (error) {
      console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;', `------->onSEI: error`, error)
    }
  }

  setDisplayMode = (mode: 'original' | 'cut') => {
    this.displayMode = mode
    switch (mode) {
      case 'original': // 原画 开启主渲染 暂停裁剪渲染
        {
          this.prPlayer.setPause(false)
          const usersIns = [...this.usersMap.values()]
          for (const userIns of usersIns) {
            userIns.mc_video?.worker?.setPause(true)
            userIns.ss_video?.worker?.setPause(true)
          }
        }
        break
      case 'cut': // 裁剪 暂停主渲染 开启剪切渲染
        {
          this.prPlayer.setPause(true)
          const usersIns = [...this.usersMap.values()]
          for (const userIns of usersIns) {
            userIns.mc_video?.worker?.setPause(false)
            userIns.ss_video?.worker?.setPause(false)
          }
        }
        break
    }
  }
}
