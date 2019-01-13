# tiny-proc
Set handlers for a spawned process, await result.

## Usage
Simple example, concat stdout:
```
const tinyProc = require('tiny-proc')

const cmd = 'echo -n hello && echo -n 123' // -n option - don't add new line
const proc = tinyProc.create(cmd)
proc.run('')
proc.on('stdout', data => {
  proc.result += data
})
const res = await proc.awaitExit()

console.log('result:', res) // prints 'result: hello123'
```

run with DEBUG=tiny-proc:* to see all logs

## proc methods
- run(initialResult, expectedExitCode=0)
- write(chunk)
- end(chunk)
- awaitExit()

## fields
- spawnOptions
- spawned
- isClosed
- exitCode
- result

## events
- close
- error
- stdout
- stderr
- stdin