import React from 'react'
import { unlockVault } from '../state/vault'

export default function Unlock({ onUnlocked }:{ onUnlocked: (passphrase:string)=>void }){
  const [pw, setPw] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const submit = async (e:React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await unlockVault(pw)
      onUnlocked()
    } finally { setBusy(false) }
  }
  return (
    <form onSubmit={submit} className="max-w-md mx-auto mt-10 space-y-4 p-6 rounded-2xl border border-slate-800 bg-slate-900/60">
      <h2 className="text-xl font-semibold">Unlock Vault</h2>
      <input type="password" placeholder="Vault passphrase" value={pw} onChange={e=>setPw(e.target.value)} className="w-full" required />
      <button className="primary w-full py-2" disabled={busy}>{busy?'Unlocking…':'Unlock'}</button>
      <p className="text-xs text-slate-500">Your passphrase never leaves this device. Vault is decrypted locally.</p>
    </form>
  )
}
