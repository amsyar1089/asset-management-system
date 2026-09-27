import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import AvatarSVG from './AvatarSVG'
import './LoginForm.css'

// ─── helpers (identical to original script.js) ───────────────────────────────

function getPosition(el) {
  let xPos = 0, yPos = 0
  while (el) {
    if (el.tagName === 'BODY') {
      const xScroll = el.scrollLeft || document.documentElement.scrollLeft
      const yScroll = el.scrollTop || document.documentElement.scrollTop
      xPos += el.offsetLeft - xScroll + el.clientLeft
      yPos += el.offsetTop - yScroll + el.clientTop
    } else {
      xPos += el.offsetLeft - el.scrollLeft + el.clientLeft
      yPos += el.offsetTop - el.scrollTop + el.clientTop
    }
    el = el.offsetParent
  }
  return { x: xPos, y: yPos }
}

function getAngle(x1, y1, x2, y2) {
  return Math.atan2(y1 - y2, x1 - x2)
}

// ─────────────────────────────────────────────────────────────────────────────

export default function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const svgRef = useRef(null)
  const usernameRef = useRef(null)
  const blinkingRef = useRef(null)

  // mirrors original module-level vars
  const eyesCoveredRef = useRef(false)
  const mouthStatusRef = useRef('small')   // "small" | "medium" | "large"
  const eyeScaleRef = useRef(1)
  const scrollMaxRef = useRef(0)         // cached once on focus (like original)
  const svgCoordsRef = useRef({})
  const inputCoordsRef = useRef({})
  const screenCenterRef = useRef(0)

  const els = useRef({})

  // ── mount: query all SVG elements & init GSAP positions ──────────────────
  useEffect(() => {
    const c = svgRef.current
    if (!c) return
    const q = sel => c.querySelector(sel)

    els.current = {
      eyeL: q('.eyeL'), eyeR: q('.eyeR'),
      nose: q('.nose'), mouth: q('.mouth'),
      mouthBG: q('.mouthBG'), mouthSmallBG: q('.mouthSmallBG'),
      mouthMediumBG: q('.mouthMediumBG'), mouthLargeBG: q('.mouthLargeBG'),
      mouthMaskPath: q('#mouthMaskPath'), mouthOutline: q('.mouthOutline'),
      tooth: q('.tooth'), tongue: q('.tongue'), chin: q('.chin'),
      face: q('.face'), eyebrow: q('.eyebrow'),
      outerEarL: q('.earL .outerEar'), outerEarR: q('.earR .outerEar'),
      earHairL: q('.earL .earHair'), earHairR: q('.earR .earHair'),
      hair: q('.hair'),
      bodyBG: q('.bodyBGnormal'), bodyBGchanged: q('.bodyBGchanged'),
      armL: q('.armL'), armR: q('.armR'), twoFingers: q('.twoFingers'),
    }

    const { armL, armR, mouth } = els.current
    gsap.set(armL, { x: -93, y: 220, rotation: 105, transformOrigin: 'top left' })
    gsap.set(armR, { x: -93, y: 220, rotation: -105, transformOrigin: 'top right' })
    gsap.set(mouth, { transformOrigin: 'center center' })

    startBlinking(5)
    return () => { if (blinkingRef.current) blinkingRef.current.kill() }
  }, [])

  // ── blinking ─────────────────────────────────────────────────────────────
  function startBlinking(delay) {
    const d = delay ? Math.floor(Math.random() * delay) : 1
    const { eyeL, eyeR } = els.current
    blinkingRef.current = gsap.to([eyeL, eyeR], {
      duration: 0.1, delay: d, scaleY: 0, yoyo: true, repeat: 1,
      transformOrigin: 'center center',
      onComplete: () => startBlinking(12),
    })
  }

  // ── resetFace — identical to original ────────────────────────────────────
  function resetFace() {
    const { eyeL, eyeR, nose, mouth, chin, face, eyebrow,
      outerEarL, outerEarR, earHairL, earHairR, hair } = els.current
    gsap.to([eyeL, eyeR], { duration: 1, x: 0, y: 0, ease: 'expo.out' })
    gsap.to(nose, { duration: 1, x: 0, y: 0, scaleX: 1, scaleY: 1, ease: 'expo.out' })
    gsap.to(mouth, { duration: 1, x: 0, y: 0, rotation: 0, ease: 'expo.out' })
    gsap.to(chin, { duration: 1, x: 0, y: 0, scaleY: 1, ease: 'expo.out' })
    gsap.to([face, eyebrow], { duration: 1, x: 0, y: 0, skewX: 0, ease: 'expo.out' })
    gsap.to([outerEarL, outerEarR, earHairL, earHairR, hair],
      { duration: 1, x: 0, y: 0, scaleY: 1, ease: 'expo.out' })
  }

  // ── coverEyes / uncoverEyes — adds bodyBGchanged swap like original ───────
  function coverEyes() {
    const { armL, armR, bodyBG, bodyBGchanged } = els.current
    gsap.killTweensOf([armL, armR])
    gsap.set([armL, armR], { visibility: 'visible' })
    gsap.to(armL, { duration: 0.45, x: -93, y: 10, rotation: 0, ease: 'quad.out' })
    gsap.to(armR, { duration: 0.45, x: -93, y: 10, rotation: 0, ease: 'quad.out', delay: 0.1 })
    // swap body shape (original used morphSVG; we use visibility swap)
    gsap.set(bodyBG, { display: 'none' })
    gsap.set(bodyBGchanged, { display: 'block' })
    eyesCoveredRef.current = true
  }

  function uncoverEyes() {
    const { armL, armR, bodyBG, bodyBGchanged } = els.current
    gsap.killTweensOf([armL, armR])
    gsap.to(armL, { duration: 1.35, y: 220, ease: 'quad.out' })
    gsap.to(armL, { duration: 1.35, rotation: 105, ease: 'quad.out', delay: 0.1 })
    gsap.to(armR, { duration: 1.35, y: 220, ease: 'quad.out' })
    gsap.to(armR, {
      duration: 1.35, rotation: -105, ease: 'quad.out', delay: 0.1,
      onComplete: () => {
        gsap.set([armL, armR], { visibility: 'hidden' })
        // restore body shape
        gsap.set(bodyBGchanged, { display: 'none' })
        gsap.set(bodyBG, { display: 'block' })
      },
    })
    eyesCoveredRef.current = false
  }

  // ── calculateFaceMove — uses selectionEnd like original ──────────────────
  function calculateFaceMove() {
    const usernameEl = usernameRef.current
    if (!usernameEl) return

    // use actual caret position (original: email.selectionEnd)
    let carPos = usernameEl.selectionEnd
    if (carPos == null || carPos === 0) carPos = usernameEl.value.length

    const div = document.createElement('div')
    const span = document.createElement('span')
    const copyStyle = getComputedStyle(usernameEl)
    Array.from(copyStyle).forEach(p => { div.style[p] = copyStyle[p] })
    div.style.position = 'absolute'
    document.body.appendChild(div)
    div.textContent = usernameEl.value.substr(0, carPos)
    span.textContent = usernameEl.value.substr(carPos) || '.'
    div.appendChild(span)

    const usernameCoords = inputCoordsRef.current
    const screenCenter = screenCenterRef.current
    const scrollMax = scrollMaxRef.current

    const svgCoords = svgCoordsRef.current
    const eyeLCoords = { x: svgCoords.x + 84, y: svgCoords.y + 76 }
    const eyeRCoords = { x: svgCoords.x + 113, y: svgCoords.y + 76 }
    const noseCoords = { x: svgCoords.x + 97, y: svgCoords.y + 81 }
    const mouthCoords = { x: svgCoords.x + 100, y: svgCoords.y + 100 }

    let eyeLAngle, eyeRAngle, noseAngle, mouthAngle, dFromC
    const caretCoords = getPosition(span)
    dFromC = screenCenter - (caretCoords.x + usernameCoords.x)

    if (usernameEl.scrollWidth <= scrollMax) {
      eyeLAngle = getAngle(eyeLCoords.x, eyeLCoords.y, usernameCoords.x + caretCoords.x, usernameCoords.y + 25)
      eyeRAngle = getAngle(eyeRCoords.x, eyeRCoords.y, usernameCoords.x + caretCoords.x, usernameCoords.y + 25)
      noseAngle = getAngle(noseCoords.x, noseCoords.y, usernameCoords.x + caretCoords.x, usernameCoords.y + 25)
      mouthAngle = getAngle(mouthCoords.x, mouthCoords.y, usernameCoords.x + caretCoords.x, usernameCoords.y + 25)
    } else {
      eyeLAngle = getAngle(eyeLCoords.x, eyeLCoords.y, usernameCoords.x + scrollMax, usernameCoords.y + 25)
      eyeRAngle = getAngle(eyeRCoords.x, eyeRCoords.y, usernameCoords.x + scrollMax, usernameCoords.y + 25)
      noseAngle = getAngle(noseCoords.x, noseCoords.y, usernameCoords.x + scrollMax, usernameCoords.y + 25)
      mouthAngle = getAngle(mouthCoords.x, mouthCoords.y, usernameCoords.x + scrollMax, usernameCoords.y + 25)
    }
    document.body.removeChild(div)

    const eyeLX = Math.cos(eyeLAngle) * 20, eyeLY = Math.sin(eyeLAngle) * 10
    const eyeRX = Math.cos(eyeRAngle) * 20, eyeRY = Math.sin(eyeRAngle) * 10
    const noseX = Math.cos(noseAngle) * 23, noseY = Math.sin(noseAngle) * 10
    const mouthX = Math.cos(mouthAngle) * 23, mouthY = Math.sin(mouthAngle) * 10
    const mouthR = Math.cos(mouthAngle) * 6
    const chinX = mouthX * 0.8, chinY = mouthY * 0.5
    let chinS = 1 - (dFromC * 0.15) / 100
    if (chinS > 1) { chinS = 1 - (chinS - 1); if (chinS < 0.5) chinS = 0.5 }
    const faceX = mouthX * 0.3, faceY = mouthY * 0.4
    const faceSkew = Math.cos(mouthAngle) * 5
    const eyebrowSkew = Math.cos(mouthAngle) * 25
    const outerEarX = Math.cos(mouthAngle) * 4
    const outerEarY = Math.cos(mouthAngle) * 5
    const hairX = Math.cos(mouthAngle) * 6

    const { eyeL, eyeR, nose, mouth, chin, face, eyebrow,
      outerEarL, outerEarR, earHairL, earHairR, hair } = els.current
    gsap.to(eyeL, { duration: 1, x: -eyeLX, y: -eyeLY, ease: 'expo.out' })
    gsap.to(eyeR, { duration: 1, x: -eyeRX, y: -eyeRY, ease: 'expo.out' })
    gsap.to(nose, { duration: 1, x: -noseX, y: -noseY, rotation: mouthR, transformOrigin: 'center center', ease: 'expo.out' })
    gsap.to(mouth, { duration: 1, x: -mouthX, y: -mouthY, rotation: mouthR, transformOrigin: 'center center', ease: 'expo.out' })
    gsap.to(chin, { duration: 1, x: -chinX, y: -chinY, scaleY: chinS, ease: 'expo.out' })
    gsap.to(face, { duration: 1, x: -faceX, y: -faceY, skewX: -faceSkew, transformOrigin: 'center top', ease: 'expo.out' })
    gsap.to(eyebrow, { duration: 1, x: -faceX, y: -faceY, skewX: -eyebrowSkew, transformOrigin: 'center top', ease: 'expo.out' })
    gsap.to(outerEarL, { duration: 1, x: outerEarX, y: -outerEarY, ease: 'expo.out' })
    gsap.to(outerEarR, { duration: 1, x: outerEarX, y: outerEarY, ease: 'expo.out' })
    gsap.to(earHairL, { duration: 1, x: -outerEarX, y: -outerEarY, ease: 'expo.out' })
    gsap.to(earHairR, { duration: 1, x: -outerEarX, y: outerEarY, ease: 'expo.out' })
    gsap.to(hair, { duration: 1, x: hairX, scaleY: 1.2, transformOrigin: 'center bottom', ease: 'expo.out' })
  }

  // ── mouth shape — mirrors original morphSVG behaviour ────────────────────
  // Original: TweenMax.to([mouthBG, mouthOutline, mouthMaskPath], {morphSVG: mouthMediumBG})
  // mouthSmallBG/Medium/Large are REFERENCE shapes only — always display:none.
  // morphSVG reads their 'd' attribute and animates mouthBG/mouthOutline/mouthMaskPath.
  // Without the plugin we just setAttribute('d') directly on those three elements.
  const MOUTH_PATHS = {
    small: 'M100.2,101c-0.4,0-1.4,0-1.8,0c-2.7-0.3-5.3-1.1-8-2.5c-0.7-0.3-0.9-1.2-0.6-1.8c0.2-0.5,0.7-0.7,1.2-0.7c0.2,0,0.5,0.1,0.6,0.2c3,1.5,5.8,2.3,8.6,2.3s5.7-0.7,8.6-2.3c0.2-0.1,0.4-0.2,0.6-0.2c0.5,0,1,0.3,1.2,0.7c0.4,0.7,0.1,1.5-0.6,1.9c-2.6,1.4-5.3,2.2-7.9,2.5C101.7,101,100.5,101,100.2,101z',
    medium: 'M95,104.2c-4.5,0-8.2-3.7-8.2-8.2v-2c0-1.2,1-2.2,2.2-2.2h22c1.2,0,2.2,1,2.2,2.2v2c0,4.5-3.7,8.2-8.2,8.2H95z',
    large: 'M100 110.2c-9 0-16.2-7.3-16.2-16.2 0-2.3 1.9-4.2 4.2-4.2h24c2.3 0 4.2 1.9 4.2 4.2 0 9-7.2 16.2-16.2 16.2z',
  }

  function setMouthShape(status) {
    const { mouthBG, mouthOutline, mouthMaskPath, tooth, tongue } = els.current
    if (!mouthBG) return

    const path = MOUTH_PATHS[status]

    // Directly update the 'd' attribute of the three always-visible elements.
    // This is what morphSVG did (animated), we do it instantly since we don't
    // have the premium plugin.
    mouthBG.setAttribute('d', path)
    if (mouthOutline) mouthOutline.setAttribute('d', path)
    if (mouthMaskPath) mouthMaskPath.setAttribute('d', path)

    // tooth & tongue — exact x,y values from original onEmailInput
    if (status === 'medium') {
      gsap.to(tooth, { duration: 1, x: 0, y: 0, ease: 'expo.out' })
      gsap.to(tongue, { duration: 1, x: 0, y: 1, ease: 'expo.out' })
    } else if (status === 'large') {
      gsap.to(tooth, { duration: 1, x: 3, y: -2, ease: 'expo.out' })
      gsap.to(tongue, { duration: 1, y: 2, ease: 'expo.out' })
    } else {
      gsap.to(tooth, { duration: 1, x: 0, y: 0, ease: 'expo.out' })
      gsap.to(tongue, { duration: 1, x: 0, y: 0, ease: 'expo.out' })
    }
  }

  // ── onEmailInput equivalent — runs every keystroke, no short-circuit ──────
  function handleUsernameChange(e) {
    const val = e.target.value
    setUsername(val)
    calculateFaceMove()   // uses selectionEnd internally

    const { eyeL, eyeR } = els.current
    const len = val.length

    if (len > 0) {
      if (val.includes('@')) {
        mouthStatusRef.current = 'large'
        setMouthShape('large')
        gsap.to([eyeL, eyeR], { duration: 1, scaleX: 0.65, scaleY: 0.65, ease: 'expo.out', transformOrigin: 'center center' })
        eyeScaleRef.current = 0.65
      } else {
        mouthStatusRef.current = 'medium'
        setMouthShape('medium')
        gsap.to([eyeL, eyeR], { duration: 1, scaleX: 0.85, scaleY: 0.85, ease: 'expo.out' })
        eyeScaleRef.current = 0.85
      }
    } else {
      mouthStatusRef.current = 'small'
      setMouthShape('small')
      gsap.to([eyeL, eyeR], { duration: 1, scaleX: 1, scaleY: 1, ease: 'expo.out' })
      eyeScaleRef.current = 1
    }
  }

  // ── onEmailFocus equivalent — cache measurements once ────────────────────
  function handleUsernameFocus() {
    const usernameEl = usernameRef.current
    const svgEl = svgRef.current
    if (!usernameEl || !svgEl) return
    // cache coords & scrollMax (original: emailScrollMax = email.scrollWidth)
    svgCoordsRef.current = getPosition(svgEl)
    inputCoordsRef.current = getPosition(usernameEl)
    screenCenterRef.current = svgCoordsRef.current.x + svgEl.offsetWidth / 2
    scrollMaxRef.current = usernameEl.scrollWidth
    calculateFaceMove()
  }

  function handleUsernameBlur() {
    setTimeout(() => resetFace(), 100)
  }

  // ── password events ───────────────────────────────────────────────────────
  function handlePasswordFocus() {
    if (!eyesCoveredRef.current) coverEyes()
  }

  function handlePasswordBlur() {
    setTimeout(() => { if (eyesCoveredRef.current) uncoverEyes() }, 150)
  }

  function handleShowPassChange(e) {
    const checked = e.target.checked
    setShowPass(checked)
    const { twoFingers } = els.current
    if (checked) {
      gsap.to(twoFingers, { duration: 0.35, transformOrigin: 'bottom left', rotation: 30, x: -9, y: -2, ease: 'power2.inOut' })
    } else {
      gsap.to(twoFingers, { duration: 0.35, transformOrigin: 'bottom left', rotation: 0, x: 0, y: 0, ease: 'power2.inOut' })
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!username || !password) {
      setError('Please enter your email and password.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await onLogin(username, password)
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* Avatar */}
        <div className="svg-container" ref={svgRef}>
          <div className="svg-container-inner">
            <AvatarSVG />
          </div>
        </div>

        <h1 className="login-title">Asset Management System</h1>
        <p style={{ textAlign: 'center', color: '#888', fontSize: '0.82em', marginBottom: '1.2em', marginTop: '-0.8em' }}>Hospital Raja Permaisuri Bainun</p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div className="input-group">
            <label htmlFor="loginUsername">Email</label>
            <input
              id="loginUsername"
              type="email"
              ref={usernameRef}
              value={username}
              onChange={handleUsernameChange}
              onFocus={handleUsernameFocus}
              onBlur={handleUsernameBlur}
              autoComplete="email"
              placeholder="user@examedia.com.my"
            />
          </div>

          {/* Password */}
          <div className="input-group">
            <label htmlFor="loginPassword">Password</label>
            <input
              id="loginPassword"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={handlePasswordFocus}
              onBlur={handlePasswordBlur}
              autoComplete="current-password"
              placeholder="••••••••"
            />
            <label className="show-password-toggle">
              <input
                type="checkbox"
                checked={showPass}
                onChange={handleShowPassChange}
                onFocus={handlePasswordFocus}
              />
              Show password
            </label>
          </div>

          {/* Error */}
          {error && <p className="error-msg">{error}</p>}

          {/* Submit */}
          <div className="input-group" style={{ marginTop: '1.5em' }}>
            <button id="loginBtn" type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Signing In…' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
