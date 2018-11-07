# tiny-cmd
Set handlers for a spawned process, await result.

## Usage
Simple example, concat stdout:
```
const tinyCmd = require('tiny-cmd')
const cmd = 'echo -n hello && echo -n 123' // -n option - don't add new line
const proc = tinyCmd.proc(cmd)
proc.result = ''
proc.on('stdout', data => {
  proc.result += data
})
const res = await proc.run()
console.log('result:', res) // prints 'result: hello123'
```

You could've used `child_process.exec` in the example above. What if you need to run a script that expects user input in response to output?
```
const cmd = 'node --interactive'
const proc = await tinyCmd.proc(cmd)
proc.result = ''
proc.on('stdout', data => {
  const lastOut = data.toString().replace(/\n$/g, '').split('\n').pop()
  proc.result = lastOut
  if (lastOut === '> ') {
    proc.write('console.log(os.platform()); process.exit()\n')
  }
})
const res = await proc.run()
console.log(`result: '${res}'`)
```

## Options
- log
- 