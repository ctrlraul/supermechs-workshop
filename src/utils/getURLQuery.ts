export function getURLQuery () {

  const match = location.href.match(/\?(.*)/)

  if (match === null) {
    return new URLSearchParams('')
  }

  return new URLSearchParams(match[1])

}
