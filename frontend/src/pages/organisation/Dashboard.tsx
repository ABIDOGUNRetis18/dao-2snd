import { useState } from 'react'
import { 
  FileText, 
  Users, 
  CalendarDays, 
  Handshake, 
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Building2
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface StatCard {
  label: string
  value: string
  icon: React.ElementType
  color: string
  textColor: string
  trend?: string
}

interface RecentActivity {
  id: number
  type: 'offre' | 'evenement' | 'candidature' | 'partenariat'
  title: string
  date: string
  status: string
}

export default function OrganisationDashboard() {
  const [recentActivities] = useState<RecentActivity[]>([
    { id: 1, type: 'offre', title: 'Appel à candidatures - Programme Jeunesse 2026', date: '2026-05-15', status: 'Publiée' },
    { id: 2, type: 'evenement', title: 'Séminaire sur le développement durable', date: '2026-06-20', status: 'Inscriptions ouvertes' },
    { id: 3, type: 'candidature', title: 'Jean Kokou - Coordonnateur terrain', date: '2026-05-14', status: 'En cours d\'évaluation' },
    { id: 4, type: 'partenariat', title: 'Convention avec UNICEF Togo', date: '2026-05-10', status: 'Signé' },
    { id: 5, type: 'offre', title: 'Communiqué - Résultats du programme Alpha', date: '2026-05-08', status: 'Publiée' },
  ])

  const stats: StatCard[] = [
    { label: 'Offres publiées', value: '12', icon: FileText, color: 'bg-blue-50', textColor: 'text-blue-600', trend: '+3 ce mois' },
    { label: 'Candidatures reçues', value: '48', icon: Users, color: 'bg-purple-50', textColor: 'text-purple-600', trend: '+15 cette semaine' },
    { label: 'Événements planifiés', value: '5', icon: CalendarDays, color: 'bg-orange-50', textColor: 'text-orange-600', trend: '2 ce mois' },
    { label: 'Partenariats actifs', value: '8', icon: Handshake, color: 'bg-teal-50', textColor: 'text-teal-600', trend: '+1 nouveau' },
  ]

  const quickActions = [
    { label: 'Publier une offre', icon: FileText, path: '/organisation/offres', color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Créer un événement', icon: CalendarDays, path: '/organisation/evenements', color: 'bg-orange-600 hover:bg-orange-700' },
    { label: 'Voir les candidatures', icon: Users, path: '/organisation/candidatures', color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'Voir le reporting', icon: BarChart3, path: '/organisation/reporting', color: 'bg-teal-600 hover:bg-teal-700' },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'offre': return <FileText className="h-4 w-4 text-blue-500" />
      case 'evenement': return <CalendarDays className="h-4 w-4 text-orange-500" />
      case 'candidature': return <Users className="h-4 w-4 text-purple-500" />
      case 'partenariat': return <Handshake className="h-4 w-4 text-teal-500" />
      default: return <Clock className="h-4 w-4 text-slate-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    if (status.includes('Publiée') || status.includes('Signé')) {
      return 'bg-green-100 text-green-700'
    }
    if (status.includes('ouvertes') || status.includes('cours')) {
      return 'bg-yellow-100 text-yellow-700'
    }
    return 'bg-slate-100 text-slate-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-teal-600" />
            Tableau de bord Organisation
          </h1>
          <p className="text-slate-500 text-sm mt-1">Vue d'ensemble de vos activités et projets.</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className={`${stat.color} rounded-xl p-5 border border-slate-100`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className={`h-5 w-5 ${stat.textColor}`} />
                </div>
                <TrendingUp className={`h-4 w-4 ${stat.textColor} opacity-60`} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
              {stat.trend && (
                <p className={`text-xs mt-2 ${stat.textColor} font-medium`}>{stat.trend}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.label}
                to={action.path}
                className={`${action.color} text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-colors text-center`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activities */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Activités récentes</h2>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <div className="divide-y divide-slate-50">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                <div className="p-2 bg-slate-50 rounded-lg">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{activity.title}</p>
                  <p className="text-xs text-slate-400">{new Date(activity.date).toLocaleDateString('fr-FR')}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(activity.status)}`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Impact summary */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Résumé d'impact</h2>
            <BarChart3 className="h-4 w-4 text-slate-400" />
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm text-slate-700">Projets complétés</span>
              </div>
              <span className="text-lg font-bold text-slate-800">7</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-purple-500" />
                <span className="text-sm text-slate-700">Bénéficiaires touchés</span>
              </div>
              <span className="text-lg font-bold text-slate-800">2,450</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Handshake className="h-5 w-5 text-teal-500" />
                <span className="text-sm text-slate-700">Partenaires mobilisés</span>
              </div>
              <span className="text-lg font-bold text-slate-800">8</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-orange-500" />
                <span className="text-sm text-slate-700">Événements organisés</span>
              </div>
              <span className="text-lg font-bold text-slate-800">15</span>
            </div>
            <Link 
              to="/organisation/reporting"
              className="flex items-center justify-center gap-2 mt-4 w-full py-2 bg-teal-50 text-teal-600 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors"
            >
              Voir le rapport complet
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 pt-8">
        © 2026 2SND TECHNOLOGIES - Tous droits réservés.
      </footer>
    </div>
  )
}
