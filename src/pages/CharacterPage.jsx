import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function CharacterPage({ slug, nav, user }){
  const [c, setC] = useState(null)
  const [owner, setOwner] = useState(null)
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')

  useEffect(()=>{ (async()=>{
    try {
      const { data: ch } = await supabase.from('characters').select('*').eq('slug', slug).maybeSingle()
      if (!ch) { setC(false); return }
      setC(ch)
      const { data: p } = await supabase.from('users_profile').select('*').eq('id', ch.user_id).single()
      setOwner(p)
      const { data: cms } = await supabase.from('comments').select('*, users_profile:author_id(id,username,display_name,avatar)').eq('character_id', ch.id).order('created_at',{ascending:true})
      setComments(cms||[])
    } catch { setC(false) }
  })() }, [slug])

  if (c===false) return <div className="p-6">Personagem não encontrado.</div>
  if (!c) return <div className="p-6">Carregando…</div>

  const cover = (c.images||[])[0] || 'https://picsum.photos/seed/cover/600/400'
  const canComment = !!user

  return (
    <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2 rounded-2xl overflow-hidden border bg-white dark:bg-slate-800 shadow">
        <img src={cover} className="w-full object-cover"/>
        <div className="p-4 space-y-2">
          <h1 className="text-2xl font-bold">{c.name}</h1>
          <div className="text-sm whitespace-pre-wrap">{c.description}</div>
          <div className="flex flex-wrap gap-1">{(c.tags||[]).map(t => <span key={t} className="pill">#{t}</span>)}</div>
        </div>
      </div>
      <div className="space-y-4">
        <button className="btn" onClick={()=>window.history.back()}>Voltar</button>
        <div className="card p-4">
          <h3 className="font-semibold mb-2">Comentários</h3>
          {(comments||[]).length===0 ? <div className="text-sm text-slate-500">Seja o primeiro a comentar.</div> : (
            <div className="space-y-3">
              {comments.map(cm => (
                <div key={cm.id} className="p-2 border rounded-xl bg-white dark:bg-slate-900">
                  <div className="text-xs mb-1 font-medium">@{cm.users_profile?.username || '?'}</div>
                  <div className="text-sm whitespace-pre-wrap">{cm.content}</div>
                </div>
              ))}
            </div>
          )}
          {canComment ? (
            <div className="pt-2 flex items-center gap-2">
              <input className="flex-1 px-3 py-2 rounded-xl border bg-white dark:bg-slate-900" placeholder="Escreva um comentário" value={text} onChange={e=>setText(e.target.value)} />
              <button className="btn" onClick={async()=>{
                if (!text.trim()) return
                const id = `cmt_${Math.random().toString(36).slice(2,10)}_${Date.now()}`
                const payload = { id, character_id: c.id, author_id: user.id, content: text.trim() }
                const { data } = await supabase.from('comments').insert(payload).select('*, users_profile:author_id(id,username,display_name,avatar)').single()
                setComments(prev => [...prev, data]); setText('')
              }}>Enviar</button>
            </div>
          ) : <div className="text-xs text-slate-500 pt-2">Faça login para comentar.</div>}
        </div>
      </div>
    </div>
  )
}