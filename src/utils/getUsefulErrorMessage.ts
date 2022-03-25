/** This is an attempt to solve some dumb shit I've seen happening there */


const matchFileName = /[^/]+\.\w+/
const matchLineAndCol = /\d+:\d+$/


export function getUsefulErrorMessage (error: any): any {

  const lines = []

  if ('message' in error) {

    // Behold the fucking useless fetch error message
    if (error.message === 'Failed to fetch') {

      if (window.navigator.onLine === false) {
        lines.push('No internet connection')
      } else {
        lines.push('Network error')
      }

    } else {

      lines.push(error.message)

    }

  }
  
  if ('stack' in error) {

    const stack: string = error.stack
    
    const stackLines = stack
      .split('\n')
      .map(line => {

        line = line.trim()

        const fileName = line.match(matchFileName)
        const lineAndCol = line.match(matchLineAndCol)

        if (fileName === null || lineAndCol === null) {
          return line
        }

        return `at ${fileName} (${lineAndCol})`

      })

    // Remove error name and this funtion's line
    stackLines.splice(0, 2)

    lines.push(...stackLines)

  }

  return lines.length ? lines : error

}
