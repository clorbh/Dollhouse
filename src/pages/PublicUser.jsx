import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function PublicUser({ username, nav, user }){
  const [profile, setProfile] = useState(null)
  const [chars, setChars] = useState([])

  useEffect(()=>{ (async()=>{
    try{
      const { data: p } = await supabase.from('users_profile').select('*').eq('username', username).single()
      setProfile(p)
      const { data: cs } = await supabase.from('characters').select('*').eq('user_id', p.id).eq('visibility','public').order('created_at',{ascending:false})
      setChars(cs||[])
    }catch{ setProfile(false) }
  })() }, [username])

  if (profile===false) return <div className="p-6">Usuário não encontrado.</div>
  if (!profile) return <div className="p-6">Carregando…</div>

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button className="btn" onClick={()=>nav(user?'/':'/')}>Voltar</button>
        <div className="text-lg font-semibold">@{profile.username}</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {chars.map(c => (
          <div key={c.id} className="rounded-2xl overflow-hidden border bg-white dark:bg-slate-800 shadow">
            <div className="aspect-video">
              <img src={(c.images||[])[0] || 'https://picsum.photos/seed/cover/600/400'} className="w-full h-full object-cover"/>
            </div>
            <div className="p-3">
              <div className="font-semibold">{c.name}</div>
              <button className="btn mt-2" onClick={()=>nav(`/character/${c.slug}`)}>Abrir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}