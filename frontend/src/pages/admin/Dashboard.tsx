import { Calendar, Hourglass, AlertTriangle, CheckSquare } from 'lucide-react'

const stats = [
  { label: 'Total DAO', value: '0', icon: Calendar, color: 'bg-gray-200', textColor: 'text-gray-600' },
  { label: 'En cours', value: '0', icon: Hourglass, color: 'bg-yellow-200', textColor: 'text-yellow-700' },
  { label: 'À risque', value: '0', icon: AlertTriangle, color: 'bg-red-200', textColor: 'text-red-700' },
  { label: 'Terminés', value: '0', icon: CheckSquare, color: 'bg-green-200', textColor: 'text-green-700' },
]

const daoData: any[] = []

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Bienvenue Admin</h1>
        <p className="text-slate-500 text-sm">Voici les statistiques des DAO.</p>
      </div>

      {/* Stats cards - connected row */}
      <div className="flex">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const isFirst = index === 0
          const isLast = index === stats.length - 1
          return (
            <div 
              key={stat.label} 
              className={`${stat.color} flex-1 p-4 ${isFirst ? 'rounded-l-lg' : ''} ${isLast ? 'rounded-r-lg' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-6 w-6 ${stat.textColor}`} />
                <div>
                  <p className={`text-xs font-medium ${stat.textColor} opacity-80`}>{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* DAO Table Section */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        {/* Table Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">TOUS LES DAO</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 text-sm font-medium rounded transition-colors">
              Rafraîchir
            </button>
            <button className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded transition-colors">
              Créer DAO
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Type de DAO</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Référence</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Autorité contractante</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Chef Projet</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Groupement</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Statut</th>
              </tr>
            </thead>
            <tbody>
              {daoData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-left text-sm text-slate-500">
                    Aucun DAO pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 pt-8">
        © 2026 2SND TECHNOLOGIES - Tous droits réservés.
      </footer>
    </div>
  )
}
