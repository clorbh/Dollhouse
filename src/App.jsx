import React, { useEffect, useState } from 'react'
import ThemeToggle from './components/ThemeToggle.jsx'
import { supabase } from './lib/supabase.js'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import PublicUser from './pages/PublicUser.jsx'
import CharacterPage from './pages/CharacterPage.jsx'

function useHashRoute() {
  const get = () => window.location.hash.replace(/^#/, '') || '/'
  const [route, setRoute] = useState(get())
  useEffect(() => {
    const on = () => setRoute(get())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const nav = (to) => { window.location.hash = to }
  return [route, nav]
}

export default function App(){
  const [route, nav] = useHashRoute()
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    (async()=>{
      if (!supabase) { setChecking(false); return }
      const { data } = await supabase.auth.getUser()
      setUser(data?.user || null)
      setChecking(false)
      supabase.auth.onAuthStateChange((_e, sess) => setUser(sess?.user || null))
    })()
  }, [])

  if (checking) return <div className="p-6">Carregando…</div>

  // Public routes
  if (route.startsWith('/u/')) return <PublicUser username={route.split('/u/')[1]} nav={nav} user={user} />
  if (route.startsWith('/character/')) return <CharacterPage slug={route.split('/character/')[1]} nav={nav} user={user} />

  // App
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <header className="sticky top-0 z-10 bg-white/70 dark:bg-slate-900/60 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 grid place-items-center font-bold cursor-pointer" onClick={()=>nav('/')}>
            TH
          </div>
          <div className="font-semibold">Toyhouse Lite</div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle/>
            {user ? <button className="btn" onClick={async()=>{ await supabase.auth.signOut(); nav('/') }}>Sair</button> : null}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {user ? <Dashboard nav={nav} user={user}/> : <Login nav={nav}/>}
      </main>
    </div>
  )
}