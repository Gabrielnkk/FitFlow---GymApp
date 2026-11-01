import { useState } from 'react'
import { getApiKey, setApiKey, setMode } from '../assistant/config'

export default function AssistantSettings() {
  const [saved, setSaved] = useState(getApiKey)
  const [value, setValue] = useState('')
  const [message, setMessage] = useState('')

  function handleSave() {
    const key = value.trim()
    if (!key) {
      setMessage('Cole a chave primeiro.')
      return
    }
    setApiKey(key)
    setSaved(key)
    setValue('')
    setMessage('Chave salva neste aparelho.')
  }

  function handleRemove() {
    setApiKey('')
    setMode('offline')
    setSaved('')
    setMessage('Chave removida.')
  }

  return (
    <section className="mb-4 rounded-xl bg-slate-800 p-4">
      <h2 className="mb-1 text-xl font-bold">Assistente IA (Gemini)</h2>
      <p className="mb-3 text-sm text-slate-400">
        O assistente offline funciona sem nada disso. Para a IA online, cole a sua chave de API do
        Google Gemini (crie em aistudio.google.com/apikey). Ela fica só neste aparelho e não entra no
        backup. No modo online, um resumo dos seus últimos treinos e a conversa são enviados ao
        Google.
      </p>

      {saved ? (
        <p className="mb-3 text-slate-300">Chave salva: ••••{saved.slice(-4)}</p>
      ) : (
        <p className="mb-3 text-slate-400">Nenhuma chave salva.</p>
      )}

      <input
        type="password"
        className="mb-3 w-full rounded-xl bg-slate-900 px-4 py-3 text-base outline-none ring-1 ring-slate-600 focus:ring-emerald-400"
        placeholder="Cole a chave do Gemini aqui"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleSave}
          className="rounded-xl bg-emerald-500 py-3 text-base font-bold text-slate-900 active:bg-emerald-600"
        >
          Salvar chave
        </button>
        <button
          onClick={handleRemove}
          disabled={!saved}
          className="rounded-xl bg-slate-700 py-3 text-base font-bold text-red-400 disabled:opacity-50"
        >
          Remover
        </button>
      </div>

      {message && <p className="mt-3 text-center text-sm text-slate-300">{message}</p>}
    </section>
  )
}