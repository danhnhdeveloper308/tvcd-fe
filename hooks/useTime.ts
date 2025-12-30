"use client"

import { useState, useEffect } from 'react'

interface UseTimeOptions {
  interval?: number
  format24?: boolean
}

interface TimeState {
  hours: number
  minutes: number
  // seconds: number
  timestamp: Date
}

export function useTime(options: UseTimeOptions = {}) {
  const { interval = 1000, format24 = true } = options
  
  const [time, setTime] = useState<TimeState>(() => {
    const now = new Date()
    return {
      hours: format24 ? now.getHours() : now.getHours() % 12 || 12,
      minutes: now.getMinutes(),
      // seconds: now.getSeconds(),
      timestamp: now,
    }
  })

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime({
        hours: format24 ? now.getHours() : now.getHours() % 12 || 12,
        minutes: now.getMinutes(),
        // seconds: now.getSeconds(),
        timestamp: now,
      })
    }

    // Update immediately
    updateTime()

    // Set up interval
    const intervalId = setInterval(updateTime, interval)

    return () => clearInterval(intervalId)
  }, [interval, format24])

  return time
}

export default useTime