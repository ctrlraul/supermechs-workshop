/**
 * This is just for logs that I intent to keep in production
 */
export default class Logger {

  private name: string

  constructor (name: string) {
    this.name = name
  }

  log (...message: any[]): void {
    console.log(`[${this.name}]`, ...message)
  }

  warn (...message: any[]): void {
    console.warn(`[${this.name}]`, ...message)
  }

}
