import { useState, useEffect } from 'react'
import './InstallPrompt.css'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow]                     = useState(false)
  const [isIOS, setIsIOS]                   = useState(false)
  const [isInstalled, setIsInstalled]       = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa_dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return

    // Detect iOS (Safari doesn't support beforeinstallprompt)
    const ua = navigator.userAgent
    const ios = /iphone|ipad|ipod/i.test(ua) && !window.MSStream
    setIsIOS(ios)

    if (ios) {
      // Show iOS instructions after 3s
      setTimeout(() => setShow(true), 3000)
      return
    }

    // Listen for Chrome/Edge/Android install event
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setShow(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Check if installed later
    window.addEventListener('appinstalled', () => {
      setShow(false)
      setIsInstalled(true)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShow(false)
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa_dismissed', Date.now().toString())
    setShow(false)
  }

  if (!show || isInstalled) return null

  return (
    <div className="install-banner" role="alert">
      <div className="install-icon">📲</div>
      <div className="install-text">
        <strong>Install AMS HRPB</strong>
        {isIOS ? (
          <span>
            Tap <strong>Share</strong> → <strong>Add to Home Screen</strong> to install
          </span>
        ) : (
          <span>Install as app on your device for a better experience</span>
        )}
      </div>
      {!isIOS && (
        <button className="install-btn-accept" onClick={handleInstall}>
          Install
        </button>
      )}
      <button className="install-btn-dismiss" onClick={handleDismiss} title="Dismiss">✕</button>
    </div>
  )
}
