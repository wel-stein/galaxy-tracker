import { useCallback, useEffect, useRef, useState } from 'react'

// Manages the rear-facing camera stream used for the AR "实景背景".
// Returns a ref to attach to a <video>, the on/off state, a toggle, and
// any error message.
export function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [on, setOn] = useState(false)
  const [error, setError] = useState(null)

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setOn(false)
  }, [])

  const toggle = useCallback(() => {
    if (on) {
      stop()
      return
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('此浏览器不支持摄像头')
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((s) => {
        streamRef.current = s
        const v = videoRef.current
        if (v) {
          v.srcObject = s
          v.play()
        }
        setOn(true)
        setError(null)
      })
      .catch((e) => {
        setError('无法开启摄像头:' + e.message)
      })
  }, [on, stop])

  // Ensure the stream is released on unmount.
  useEffect(() => stop, [stop])

  return { videoRef, on, toggle, error }
}
