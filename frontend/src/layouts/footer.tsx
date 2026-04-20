export default function AppFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-surface-container border border-slate-100 px-8 py-7">
      <div className="flex items-center justify-center">
        <div className="text-center">
          <p className="text-xs text-slate-500">© {currentYear} Tous droits réservés</p>
        </div>
      </div>
    </footer>
  )
}
