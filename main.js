const tinyCmd = require('.')

async function main() {
  const cmd = process.argv[2] || 'echo -n hello && echo -n 123'
  const proc = await tinyCmd.proc(cmd)
  proc.result = ''
  proc.on('stdout', data => {
    const lastOut = data.toString().replace(/\n$/g, '').split('\n').pop()
    proc.result = lastOut
    if (lastOut === '> ') {
      proc.write('console.log(os.platform()); process.exit()\n')
      return
    }
  })
  const res = await proc.run()
  console.log(`result: '${res}'`)
}

if (require.main === module) {
  main()
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
}