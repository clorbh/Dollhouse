import React, { useState } from 'react'
import { supabase } from '../lib/supabase.js'

const INVITE_CODE = 'Y8KK1' // simples no frontend; para produção, use uma tabela/trigger no Supabase

export default function Login({ nav }){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [invite, setInvite] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const doSignup = async() => {
    if (invite.trim() !== INVITE_CODE) { setMsg('Código de convite inválido.'); return }
    try {
      setLoading(true); setMsg('')
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      setMsg('Conta criada! Verifique seu email se necessário e faça login.')
    } catch(e){ setMsg(e.message) } finally { setLoading(false) }
  }

  const doSignin = async() => {
    try {
      setLoading(true); setMsg('')
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      nav('/')
    } catch(e){ setMsg(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto mt-10 card p-6">
      <h1 className="text-2xl font-bold mb-1">Entrar</h1>
      <p className="text-sm text-slate-500 mb-3">Use email e senha. Para cadastrar, informe o código de convite.</p>
      <input className="w-full mb-2 px-3 py-2 rounded-xl border bg-white dark:bg-slate-900" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="w-full mb-2 px-3 py-2 rounded-xl border bg-white dark:bg-slate-900" type="password" placeholder="senha" value={password} onChange={e=>setPassword(e.target.value)} />
      <input className="w-full mb-3 px-3 py-2 rounded-xl border bg-white dark:bg-slate-900" placeholder="código de convite (para cadastrar)" value={invite} onChange={e=>setInvite(e.target.value)} />
      <div className="flex gap-2">
        <button className="btnp flex-1" disabled={loading} onClick={doSignin}>Entrar</button>
        <button className="btn flex-1" disabled={loading} onClick={doSignup}>Cadastrar</button>
      </div>
      {msg && <div className="text-sm mt-3">{msg}</div>}
    </div>
  )
}