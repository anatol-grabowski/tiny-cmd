const child_process = require('child_process')
const events = require('events')

class TinyProc extends events.EventEmitter {
  constructor(command) {
    super()
    this.command = command
    this.spawned = null
    this.options = {
      log: true,
    }
    this.spawnOptions = {
      shell: true,
    }
    this.result = null
  }
  
  run() {
    return new Promise((resolve, reject) => {
      const exitHandler = (code) => {
        this._log('exited', code)
        resolve(this.result)
      }
      const errorHandler = (err) => {
        this._log('error', err)
        reject(err)
      }
      this.spawned = child_process.spawn(this.command, [], this.spawnOptions)
      this._log('started', this.spawned.spawnargs.join(' '))
      this._addHandlers()
      this.spawned.on('close', exitHandler)
      this.spawned.on('error', errorHandler)
    })
  }

  write(message) {
    this.spawned.stdin.write(message)
    this._log('stdin', message)
  }

  _addHandlers() {
    const io = ['stdin', 'stdout', 'stderr']
    io.forEach(stream => {
      this.spawned[stream].on('data', data => {
        this._log(stream, data.toString())
        this.emit(stream, data)
      })
    }) 
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

const tinyCmd = {
  run: async function(cmd, options={}) {
    const tinyProc = this.proc(cmd, options)
    const result = await tinyProc.run()
    return result
  },
  proc: function(cmd, options={}) {
    const tinyProc = new TinyProc(cmd)
    tinyProc.options = {
      ...tinyProc.options,
      ...options,
    }
    return tinyProc
  }
}

module.exports = tinyCmd