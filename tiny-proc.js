const assert = require('assert')
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
const longestHeader = Object.keys(debug).reduce((m, k) => Math.max(m, k))

const ios = ['stdin', 'stdout', 'stderr']

class TinyProc extends events.EventEmitter {
  static create(...args) {
    const tinyProc = new TinyProc(...args)
    return tinyProc
  }

  constructor(command, expectedExitCode=0) {
    super()
    this.command = command
    this.expectedExitCode = expectedExitCode
    this.spawnOptions = {
      shell: true,
    }
    this.exitCode = null
    this.isClosed = false
    this.spawned = null
    this.result = null
    this._createSubscriptions()
    this._exitPromise = this._makeExitPromise() // TODO: unsubscribe?
  }

  _createSubscriptions() {
    this.on('close', code => {
      this.isClosed = true
      this.exitCode = code
      this._log('exited', code)
    })
    this.on('error', err => {
      this.isClosed = true
      this._log('error', err)
    })
    ios.forEach(stream => {
      this.on(stream, data => this._log(stream, data.toString()))
    })
  }

  _makeExitPromise() {
    return new Promise((resolve, reject) => {
      this.once('close', code => resolve(code))
      this.once('error', err => reject(err))
    })
  }

  run(initialResult) {
    assert.equal(this.spawned, null, 'already running')
    assert(!this.isClosed, 'already closed')
    this.spawned = child_process.spawn(this.command, [], this.spawnOptions)
    if (arguments.length > 0) this.result = initialResult
    this._log('started', this.spawned.spawnargs.join(' '))
    this._pipeEvents()
  }

  _pipeEvents() {
    ios.forEach(stream => {
      this.spawned[stream].on('data', data => this.emit(stream, data))
    })
    this.spawned.on('close', code => this.emit('close', code))
    this.spawned.on('error', err => this.emit('error', err))
  }

  async awaitExit() {
    const code = await this._exitPromise
    if (this.expectedExitCode != null) {
      const errMsg = "unexpected exit code, do proc.run(cmd, null) if you don't care"
      assert.equal(code, this.expectedExitCode, errMsg)
    }
    return this.result
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
    const intro = `${''.padStart(longestHeader-type.length)}[${this.spawned.pid}]`
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