const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const tinyCmd = require('..')

chai.use(chaiAsPromised)
const { expect } = chai

describe('tiny-proc', () => {
  it('should create, run and awaitExit without errors', async () => {
    const proc = tinyCmd.create('exit 0')
    proc.run()
    await proc.awaitExit()
  })

  it('should keep result, exitCode and isClosed', async () => {
    const initialResult = {}
    const proc = tinyCmd.create('exit 0')
    proc.run(initialResult)
    expect(proc.isClosed).to.equal(false)
    const result = await proc.awaitExit()
    expect(result).to.equal(initialResult)
    expect(proc.result).to.equal(result)
    expect(proc.exitCode).to.equal(0)
    expect(proc.isClosed).to.equal(true)
  })

  it('should subscribe to stdin and awaitExit should return correct result', async () => {
    const expectedResult = 'line1\nline2\n'
    const cmd = 'echo line1 && echo line2'
    const proc = tinyCmd.create(cmd)
    proc.on('stdout', data => {
      proc.result += data
    })
    proc.run('')
    const result = await proc.awaitExit()

    expect(result).to.equal(expectedResult)
  })

  describe('exitCode handling', () => {
    it('should throw if exitCode is not equal to expectedExitCode', async () => {
      const expectedExitCode = 0
      const cmd = 'exit 33'
      const proc = tinyCmd.create(cmd, expectedExitCode)
      proc.run()
      await expect(proc.awaitExit()).to.eventually.be.rejectedWith(Error)
    })

    it('should not throw if expectedExitCode is null', async () => {
      const cmd = 'exit 33'
      const proc = tinyCmd.create(cmd, null)
      proc.run()
      await proc.awaitExit()
    })

    it('should not throw if expectedExitCode is equal to expected', async () => {
      const expectedExitCode = 33
      const cmd = 'exit 33'
      const proc = tinyCmd.create(cmd, expectedExitCode)
      proc.run()
      await proc.awaitExit()
    })
  })

  describe('script with input', () => {
    it('should write and end to stdin', async () => {
      const name = 'John'
      const job = 'dev'
      const expectedResult =
`Hi
What's your name:
${name}... That's a nice name.
Hello, ${job} ${name}!
`
      const cmd = 'sh test/assets/script-with-input.sh'
      const proc = tinyCmd.create(cmd)
      proc.run('')
      proc.on('stdout', data => {
        proc.result += data
      })
      proc.write(name)
      proc.write('\n')
      proc.end(job)
      const result = await proc.awaitExit()
      expect(result).to.equal(expectedResult)
    })
  })
})