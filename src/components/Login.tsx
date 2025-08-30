import React from 'react'
import { onSignerConnect } from '../state/vault'

export default function Login({ onConnected }:{ onConnected: (pubkey:string)=>void }){
  const [err, setErr] = React.useState<string | null>(null)
  const connect = async () => {
    try {
      const pk = await onSignerConnect()
      onConnected(pk)
    } catch (e:any) {
      setErr(e.message || String(e))
    }
  }
  return (
    <div className="max-w-md mx-auto mt-24 space-y-4 p-6 rounded-2xl border border-slate-800 bg-slate-900/60">
      <h1 className="text-2xl font-semibold">Nostr Password Manager</h1>
      <p className="text-sm text-slate-400">Connect a NIP-07 signer to continue.</p>
      <button className="primary w-full py-2" onClick={connect}>Connect Nostr Signer</button>
      {err && <div className="text-rose-400 text-sm">{err}</div>}
      <p className="text-xs text-slate-500">
        We never see your nsec. Signing is handled by your browser extension / signer.
      </p>
    </div>
  )
}
