const child_process = require('child_process')
const events = require('events')
const debug = {
  'started': require('debug')('tiny-cmd:started'),
  'exited':  require('debug')('tiny-cmd:exited'),
  'error':   require('debug')('tiny-cmd:error'),
  'stdin':   require('debug')('tiny-cmd:stdin'),
  'stdout':  require('debug')('tiny-cmd:stdout'),
  'stderr':  require('debug')('tiny-cmd:stderr'),
}
const assert = require('assert')

const io = ['stdin', 'stdout', 'stderr']
class TinyProc extends events.EventEmitter {
  static create(cmd) {
    const tinyProc = new TinyProc(cmd)
    return tinyProc
  }

  constructor(command) {
    super()
    this.command = command
    this.spawned = null
    this.exited = false
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

  write(...args) {
    this.spawned.stdin.write(...args)
    this._log('stdin', args[0])
  }

  end(...args) {
    this.spawned.stdin.end(...args)
    this._log('stdin', args[0])
  }

  _log(type, message) {
    const intro = `${''.padStart(7-type.length)}[${this.spawned.pid}]`
    if (typeof message === 'string') {
      message = message.replace(/\n$/g, '')
      message = message.split('\n')
      message.forEach(msg => debug[type](intro, msg))
      return
    }
    debug[type](intro, message)
  }
}

module.exports = TinyProc