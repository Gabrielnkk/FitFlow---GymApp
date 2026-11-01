export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="p-4">
      <h1 className="mb-2 text-3xl font-bold text-emerald-400">{title}</h1>
      <p className="text-slate-400">Em construção. Vamos fazer esta tela nas próximas etapas.</p>
    </div>
  )
}