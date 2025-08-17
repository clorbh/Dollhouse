import React, { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => localStorage.getItem('th-theme') === 'dark')
  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem('th-theme','dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('th-theme','light')
    }
  }, [dark])

  return (
    <button className="btn" onClick={() => setDark(d => !d)}>
      {dark ? '🌙' : '☀️'} Tema
    </button>
  )
}