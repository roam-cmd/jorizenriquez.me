import type { MouseEvent } from 'react'

export const DEFAULT_EMAIL_SUBJECT = 'Inquiry — Subject'
export const DEFAULT_EMAIL_BODY = 'Hi Joriz,\n\n'

/**
 * Builds a pre-filled `mailto:` URI targeting the given recipient.
 */
export function buildMailtoHref(
  email: string,
  subject = DEFAULT_EMAIL_SUBJECT,
  body = DEFAULT_EMAIL_BODY
): string {
  const params = new URLSearchParams({ subject, body })
  return `mailto:${email}?${params.toString()}`
}

/**
 * Builds a Gmail web compose URL pre-filled with recipient, subject, and body.
 */
export function buildGmailComposeUrl(
  email: string,
  subject = DEFAULT_EMAIL_SUBJECT,
  body = DEFAULT_EMAIL_BODY
): string {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: email,
    su: subject,
    body,
  })
  return `https://mail.google.com/mail/?${params.toString()}`
}

/**
 * Allows the native `mailto:` anchor to launch the visitor's configured mail
 * app, and automatically opens Gmail web compose in a new tab if the browser
 * retains focus after 550ms (i.e. no OS mail handler is configured).
 */
export function handleEmailLinkClick(
  _event: MouseEvent<HTMLAnchorElement>,
  email: string,
  subject = DEFAULT_EMAIL_SUBJECT,
  body = DEFAULT_EMAIL_BODY
): void {
  if (typeof window === 'undefined') {
    return
  }

  let handled = false
  const cleanup = () => {
    handled = true
    window.removeEventListener('blur', cleanup)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
  const onVisibilityChange = () => {
    if (document.hidden) {
      cleanup()
    }
  }

  window.addEventListener('blur', cleanup)
  document.addEventListener('visibilitychange', onVisibilityChange)

  window.setTimeout(() => {
    window.removeEventListener('blur', cleanup)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    if (!handled && document.hasFocus()) {
      window.open(
        buildGmailComposeUrl(email, subject, body),
        '_blank',
        'noopener,noreferrer'
      )
    }
  }, 550)
}
