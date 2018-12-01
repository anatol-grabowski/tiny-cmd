const child_process = require('child_process')
const events = require('events')
const debug = require('debug')('tiny-cmd')
const assert = require('assert')

const io = ['stdin', 'stdout', 'stderr']
class TinyProc extends events.EventEmitter {
  static proc(cmd, options={}) {
    const tinyProc = new TinyProc(cmd)
    tinyProc.options = {
      ...tinyProc.options,
      ...options,
    }
    return tinyProc
  }

  constructor(command) {
    super()
    this.command = command
    this.spawned = null
    this.exited = false
    this.options = {
      log: true,
    }
    this.spawnOptions = {
      shell: true,
    }
    this.result = null
    this.on('close', code => {
      this.exited = true
      this._log('exited', code)
    })
    this.on('error', err => {
      this.exited = true
      this._log('error', err)
    })
    io.forEach(stream => {
      this.on(stream, data => this._log(stream, data.toString()))
    })
  }

  run(initialResult) {
    assert(!this.exited, 'proc already exited')
    this.spawned = child_process.spawn(this.command, [], this.spawnOptions)
    if (arguments.length > 0) this.result = initialResult
    this._log('started', this.spawned.spawnargs.join(' '))
    io.forEach(stream => {
      this.spawned[stream].on('data', data => this.emit(stream, data))
    })
    this.spawned.on('close', code => this.emit('close', code))
    this.spawned.on('error', err => this.emit('error', err))
  }

  async awaitExit() {
    if (this.exited) return this.result
    return new Promise((resolve, reject) => {
      this.on('close', () => resolve(this.result))
      this.on('error', err => reject(err))
    })
  }

  write(message) {
    this.spawned.stdin.write(message)
    this._log('stdin', message)
  }

  _log(type, message) {
    if (!this.options.log) return
    const intro = `[${this.spawned.pid}] ${type.padStart(7)}:`
    if (typeof message === 'string') {
      message = message.replace(/\n$/g, '')
      message = message.split('\n')
      message.forEach(msg => console.log(intro, msg))
      return
    }
    console.log(intro, message)
  }
}

module.exports = TinyProc