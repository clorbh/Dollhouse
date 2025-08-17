import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { slugify } from '../utils/slug.js'

function uid(prefix='id'){ return `${prefix}_${Math.random().toString(36).slice(2,10)}_${Date.now()}` }

export default function Dashboard({ nav, user }){
  const [profile, setProfile] = useState(null)
  const [folders, setFolders] = useState([])
  const [chars, setChars] = useState([])
  const [incoming, setIncoming] = useState([])
  const [query, setQuery] = useState('')
  const [activeFolder, setActiveFolder] = useState(null)

  useEffect(() => { (async()=>{
    // ensure profile
    const { data: p } = await supabase.from('users_profile').select('*').eq('id', user.id).maybeSingle()
    if (!p) {
      const username = (user.email || 'user').split('@')[0].replace(/[^a-z0-9_]/gi,'').toLowerCase()
      await supabase.from('users_profile').insert({ id: user.id, username, display_name: username })
    }
    const { data: prof } = await supabase.from('users_profile').select('*').eq('id', user.id).single()
    setProfile(prof)
    const { data: fs } = await supabase.from('folders').select('*').eq('user_id', user.id).order('created_at',{ascending:true})
    setFolders(fs||[])
    const { data: cs } = await supabase.from('characters').select('*').eq('user_id', user.id).order('created_at',{ascending:false})
    setChars(cs||[])
    const { data: tr } = await supabase.from('transfers_view').select('*').eq('to_user_id', user.id).order('created_at',{ascending:false})
    setIncoming(tr||[])
  })() }, [user.id])

  const filtered = useMemo(()=>{
    const t = query.toLowerCase().trim()
    return (chars||[]).filter(c => {
      const inFolder = activeFolder ? c.folder_id === activeFolder : true
      const text = [c.name, c.description, ...(c.tags||[])].join(' ').toLowerCase()
      return inFolder && (t ? text.includes(t) : true)
    })
  }, [chars, query, activeFolder])

  if (!profile) return <div className="p-6">Carregando…</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      <aside className="md:col-span-3 space-y-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Pastas</h3>
            <button className="btn" onClick={async()=>{
              const name = prompt('Nome da pasta')
              if (!name) return
              const { data } = await supabase.from('folders').insert({ id: uid('fld'), user_id: user.id, name }).select().single()
              setFolders(x => [...x, data])
            }}>+ Nova</button>
          </div>
          <nav className="space-y-1">
            <button className={`btn w-full text-left ${activeFolder===null?'!bg-slate-900 !text-white dark:!bg-white dark:!text-slate-900':''}`} onClick={()=>setActiveFolder(null)}>Todas</button>
            {folders.map(f => (
              <div key={f.id} className="flex items-center gap-2">
                <button className={`btn w-full text-left ${activeFolder===f.id?'!bg-slate-900 !text-white dark:!bg-white dark:!text-slate-900':''}`} onClick={()=>setActiveFolder(f.id)}>{f.name}</button>
                <button className="btn" onClick={async()=>{
                  const name = prompt('Novo nome', f.name); if(!name) return;
                  const { data } = await supabase.from('folders').update({ name }).eq('id', f.id).select().single()
                  setFolders(xs => xs.map(x=>x.id===f.id?data:x))
                }}>Ren</button>
                <button className="btn" onClick={async()=>{
                  await supabase.from('folders').delete().eq('id', f.id)
                  setFolders(xs => xs.filter(x=>x.id!==f.id)); setActiveFolder(null)
                }}>Del</button>
              </div>
            ))}
          </nav>
        </div>

        <div className="card p-4">
          <h3 className="font-semibold mb-2">Perfil</h3>
          <input className="w-full mb-2 px-3 py-2 rounded-xl border bg-white dark:bg-slate-900" value={profile.display_name||''} onChange={e=>setProfile(p=>({...p, display_name:e.target.value}))} />
          <input className="w-full mb-2 px-3 py-2 rounded-xl border bg-white dark:bg-slate-900" value={profile.username||''} onChange={e=>setProfile(p=>({...p, username:e.target.value}))} />
          <textarea className="w-full mb-2 px-3 py-2 rounded-xl border bg-white dark:bg-slate-900" rows="3" value={profile.bio||''} onChange={e=>setProfile(p=>({...p, bio:e.target.value}))} />
          <button className="btnp" onClick={async()=>{
            const payload = { display_name: profile.display_name, username: profile.username, bio: profile.bio, avatar: profile.avatar||'' }
            const { data } = await supabase.from('users_profile').update(payload).eq('id', user.id).select().single()
            setProfile(data)
          }}>Salvar</button>
          <button className="btn ml-2" onClick={()=>nav(`/u/${profile.username}`)}>Ver público</button>
        </div>

        <div className="card p-4">
          <h3 className="font-semibold mb-2">Solicitações de Transferência</h3>
          {(incoming||[]).length===0 ? <div className="text-sm text-slate-500">Nada pendente.</div> : (
            <div className="space-y-2">
              {incoming.map(t => (
                <div key={t.id} className="p-2 rounded-xl border bg-white dark:bg-slate-900">
                  <div className="text-sm">Personagem: <code>{t.character_id}</code></div>
                  <div className="flex gap-2 mt-2">
                    <button className="btn" onClick={async()=>{
                      const { data } = await supabase.from('transfers').update({ status: 'accepted' }).eq('id', t.id).select().single()
                      await supabase.from('characters').update({ user_id: t.to_user_id }).eq('id', t.character_id)
                      setIncoming(prev => prev.filter(x=>x.id!==t.id))
                      const { data: cs } = await supabase.from('characters').select('*').eq('user_id', user.id).order('created_at',{ascending:false})
                      setChars(cs||[])
                    }}>Aceitar</button>
                    <button className="btn" onClick={async()=>{
                      await supabase.from('transfers').update({ status:'declined' }).eq('id', t.id)
                      setIncoming(prev => prev.filter(x=>x.id!==t.id))
                    }}>Recusar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      <section className="md:col-span-9 space-y-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Personagens</h3>
            <input className="px-3 py-2 rounded-xl border bg-white dark:bg-slate-900" placeholder="buscar…" value={query} onChange={e=>setQuery(e.target.value)} />
          </div>
          {filtered.length===0 ? <div className="text-slate-500">Nenhum personagem. Crie abaixo.</div> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(c => (
                <div key={c.id} className="rounded-2xl overflow-hidden border bg-white dark:bg-slate-800 shadow">
                  <div className="aspect-video bg-slate-100 dark:bg-slate-700 cursor-pointer" onClick={()=>nav(`/character/${c.slug}`)}>
                    <img src={(c.images||[])[0] || 'https://picsum.photos/seed/cover/600/400'} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs">{c.visibility==='public'?'Público':'Privado'}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn" onClick={async()=>{
                        const name = prompt('Novo nome', c.name); if(!name) return;
                        const slug = slugify(name)
                        const { data } = await supabase.from('characters').update({ name, slug }).eq('id', c.id).select().single()
                        setChars(xs => xs.map(x=>x.id===c.id?data:x))
                      }}>Renomear</button>
                      <button className="btn" onClick={async()=>{
                        await supabase.from('characters').delete().eq('id', c.id)
                        setChars(xs => xs.filter(x=>x.id!==c.id))
                      }}>Excluir</button>
                      <button className="btn" onClick={async()=>{
                        const to = prompt('Username destino'); if(!to) return;
                        // find user
                        const { data: u } = await supabase.from('users_profile').select('*').eq('username', to).maybeSingle()
                        if (!u) return alert('Usuário não encontrado')
                        await supabase.from('transfers').insert({ id: uid('trf'), character_id: c.id, from_user_id: user.id, to_user_id: u.id, status: 'pending' })
                        alert('Transferência criada.')
                      }}>Transferir</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-4">
          <h3 className="font-semibold mb-2">Novo personagem</h3>
          <NewCharacter onCreate={async(payload)=>{
            const { data } = await supabase.from('characters').insert(payload).select().single()
            setChars(xs => [data, ...xs])
          }} user={user} folders={folders} />
        </div>
      </section>
    </div>
  )
}

function NewCharacter({ onCreate, user, folders }){
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState([])
  const [tradeable, setTradeable] = useState(false)
  const [visibility, setVisibility] = useState('public')
  const [folderId, setFolderId] = useState('')
  const [images, setImages] = useState([])
  const [imgUrl, setImgUrl] = useState('')

  const addImageFile = (file) => {
    const r = new FileReader()
    r.onload = () => setImages(prev => [...prev, String(r.result)])
    r.readAsDataURL(file)
  }
  const addImageUrl = () => {
    const url = imgUrl.trim(); if(!url) return;
    setImages(prev => [...prev, url]); setImgUrl('')
  }
  const removeImage = (i) => setImages(prev => prev.filter((_,idx)=>idx!==i))

  return (
    <div className="space-y-2">
      <input className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-900" placeholder="Nome" value={name} onChange={e=>setName(e.target.value)} />
      <textarea className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-900" rows="4" placeholder="Descrição" value={description} onChange={e=>setDescription(e.target.value)} />
      <input className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-900" placeholder="tags (separe por vírgula)" value={tags.join(', ')} onChange={e=>setTags(e.target.value.split(',').map(x=>x.trim()).filter(Boolean))} />
      <div className="flex items-center gap-2">
        <label className="text-sm">Pasta:</label>
        <select className="px-3 py-2 rounded-xl border bg-white dark:bg-slate-900" value={folderId} onChange={e=>setFolderId(e.target.value)}>
          <option value="">Sem pasta</option>
          {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <label className="text-sm ml-4">Visibilidade:</label>
        <select className="px-3 py-2 rounded-xl border bg-white dark:bg-slate-900" value={visibility} onChange={e=>setVisibility(e.target.value)}>
          <option value="public">Público</option>
          <option value="private">Privado</option>
        </select>
        <label className="ml-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={tradeable} onChange={e=>setTradeable(e.target.checked)} /> Aceita troca
        </label>
      </div>

      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-auto border rounded-xl p-2 bg-slate-50 dark:bg-slate-900">
        {images.map((src,i)=>(
          <div key={i} className="relative group aspect-square overflow-hidden rounded-lg border">
            <img src={src} className="w-full h-full object-cover"/>
            <button className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded bg-white/90 border" onClick={()=>removeImage(i)}>Remover</button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input className="flex-1 px-3 py-2 rounded-xl border bg-white dark:bg-slate-900" placeholder="URL da imagem" value={imgUrl} onChange={e=>setImgUrl(e.target.value)} />
        <button className="btn" onClick={addImageUrl}>Adicionar</button>
        <label className="btn cursor-pointer">Upload
          <input type="file" accept="image/*" className="hidden" onChange={e=>{ const f=e.target.files?.[0]; if(f) addImageFile(f) }} />
        </label>
      </div>

      <button className="btnp" onClick={()=>{
        if (!name.trim()) return alert('Dê um nome')
        const slug = slugify(name)
        onCreate({ id: uid('chr'), user_id: user.id, folder_id: folderId||null, name: name.trim(), slug, description, tags, images, tradeable, visibility })
        setName(''); setDescription(''); setTags([]); setTradeable(false); setVisibility('public'); setFolderId(''); setImages([]); setImgUrl('');
      }}>Criar</button>
    </div>
  )
}