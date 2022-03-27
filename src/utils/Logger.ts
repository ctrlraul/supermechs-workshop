
const matchFileName = /([^/]+)\?/
const style = 'color: hsl(hue, 70%, 60%); background-color: #111111'

const hueChange = 48
let hue = 0



/** This is just for logs that I intent to keep in production */
export default class Logger {

  private name: string
  private hue: string

  constructor () {

    const dummy = new Error()
    const stack = dummy.stack!.split('\n')
    
    stack.shift() // Remove error name
    stack.shift() // Remove this constructor call

    const match = stack[0].match(matchFileName)

    this.name = match ? match[1] : 'unknown'
    this.hue = String(hue)

    hue += hueChange

  }


  private console (method: keyof Logger, ...message: any[]): void {
    console[method](`%c[${this.name}]`, style.replace('hue', this.hue), ...message)
  }


  log (...message: any[]): void {
    this.console('log', ...message)
  }

  warn (...message: any[]): void {
    this.console('warn', ...message)
  }

  error (...message: any[]): void {
    this.console('error', ...message)
  }

}
