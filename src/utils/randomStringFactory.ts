const defaultCharset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-'

export function randomString (length: number): string {

  let str = ''

  for (let i = length; i--;) {
    str += defaultCharset[Math.floor(Math.random() * defaultCharset.length)];
  }

  return str

}
