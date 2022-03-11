export default async function copyTextToClipboard (text: string) {

  try {

    if (!('clipboard' in navigator)) {
      throw new Error('Not supported')
    }

    // Get permission
    const result = await navigator.permissions.query({ name: "clipboard-write" as PermissionName })

    if (!['granted', 'prompt'].includes(result.state)) {
      throw new Error('Permission denied')
    }

    await navigator.clipboard.writeText(text)

  } catch (err: any) {

    // Failed to use navigator.clipboard, let's try document.execCommand

    const dummy = document.createElement('textarea')

    Object.assign(dummy.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      width: '1px',
      height: '1px',
      border: 'none',
      opacity: '0'
    })

    dummy.value = text

    document.body.append(dummy)

    dummy.select()

    const success = document.execCommand('copy')

    if (!success) {
      throw err
    }

  }

}
