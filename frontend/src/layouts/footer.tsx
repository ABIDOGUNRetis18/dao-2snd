export default function AppFooter() {
  return (
    <footer className="bg-surface-container border border-slate-100 px-8 py-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-xs font-bold text-slate-500">2SND TECHNOLOGIES</p>
          <p className="text-[10px] text-slate-400 mt-1">Système de Précision</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500">© 2026 Tous droits réservés</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
            Aide
          </button>
          <button className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
            Documentation
          </button>
          <button className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
            Support
          </button>
        </div>
      </div>
    </footer>
  )
}
