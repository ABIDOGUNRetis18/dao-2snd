import { useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  Download,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Handshake,
  CalendarDays
} from 'lucide-react'

interface KPI {
  label: string
  value: string
  variation: string
  isPositive: boolean
  icon: React.ElementType
  color: string
}

interface ProjetImpact {
  id: number
  nom: string
  beneficiaires: number
  objectif: number
  budget_alloue: number
  budget_utilise: number
  statut: 'en_cours' | 'termine' | 'planifie'
}

export default function Reporting() {
  const [periode, setPeriode] = useState('trimestre')

  const kpis: KPI[] = [
    { label: 'Bénéficiaires touchés', value: '2,450', variation: '+18%', isPositive: true, icon: Users, color: 'text-purple-600' },
    { label: 'Projets actifs', value: '7', variation: '+2', isPositive: true, icon: Target, color: 'text-teal-600' },
    { label: 'Taux de réalisation', value: '78%', variation: '+5%', isPositive: true, icon: TrendingUp, color: 'text-blue-600' },
    { label: 'Budget utilisé', value: '65%', variation: '-3%', isPositive: true, icon: BarChart3, color: 'text-orange-600' },
  ]

  const [projets] = useState<ProjetImpact[]>([
    { id: 1, nom: 'Programme WASH Phase 2', beneficiaires: 800, objectif: 1000, budget_alloue: 50000000, budget_utilise: 35000000, statut: 'en_cours' },
    { id: 2, nom: 'Formation Professionnelle Jeunesse', beneficiaires: 450, objectif: 500, budget_alloue: 30000000, budget_utilise: 28000000, statut: 'en_cours' },
    { id: 3, nom: 'Santé Maternelle et Infantile', beneficiaires: 600, objectif: 600, budget_alloue: 40000000, budget_utilise: 40000000, statut: 'termine' },
    { id: 4, nom: 'Éducation Digitale', beneficiaires: 200, objectif: 800, budget_alloue: 25000000, budget_utilise: 8000000, statut: 'en_cours' },
    { id: 5, nom: 'Agriculture Durable', beneficiaires: 400, objectif: 400, budget_alloue: 35000000, budget_utilise: 35000000, statut: 'termine' },
  ])

  const activitesParMois = [
    { mois: 'Jan', offres: 3, evenements: 1, partenariats: 0 },
    { mois: 'Fév', offres: 2, evenements: 2, partenariats: 1 },
    { mois: 'Mar', offres: 4, evenements: 1, partenariats: 0 },
    { mois: 'Avr', offres: 1, evenements: 3, partenariats: 1 },
    { mois: 'Mai', offres: 3, evenements: 2, partenariats: 1 },
  ]

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'en_cours': return { label: 'En cours', cls: 'bg-blue-100 text-blue-700' }
      case 'termine': return { label: 'Terminé', cls: 'bg-green-100 text-green-700' }
      case 'planifie': return { label: 'Planifié', cls: 'bg-gray-100 text-gray-600' }
      default: return { label: statut, cls: 'bg-gray-100 text-gray-500' }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-teal-600" />
            Reporting & Analyse d'Impact
          </h1>
          <p className="text-slate-500 text-sm mt-1">Suivi automatisé de vos indicateurs de performance et d'impact.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={periode}
            onChange={e => setPeriode(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
          >
            <option value="mois">Ce mois</option>
            <option value="trimestre">Ce trimestre</option>
            <option value="semestre">Ce semestre</option>
            <option value="annee">Cette année</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Download className="h-4 w-4" />
            Exporter PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <Icon className={`h-5 w-5 ${kpi.color}`} />
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  kpi.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {kpi.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {kpi.variation}
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{kpi.value}</p>
              <p className="text-xs text-slate-500 mt-1">{kpi.label}</p>
            </div>
          )
        })}
      </div>

      {/* Activity chart (simplified bar chart) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Activités par mois</h2>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-500" />
              Offres
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-orange-500" />
              Événements
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-teal-500" />
              Partenariats
            </span>
          </div>
        </div>

        <div className="flex items-end gap-6 h-40">
          {activitesParMois.map(mois => {
            const maxVal = 5
            return (
              <div key={mois.mois} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-1 h-32 w-full justify-center">
                  <div 
                    className="w-4 bg-blue-500 rounded-t-sm transition-all"
                    style={{ height: `${(mois.offres / maxVal) * 100}%` }}
                    title={`Offres: ${mois.offres}`}
                  />
                  <div 
                    className="w-4 bg-orange-500 rounded-t-sm transition-all"
                    style={{ height: `${(mois.evenements / maxVal) * 100}%` }}
                    title={`Événements: ${mois.evenements}`}
                  />
                  <div 
                    className="w-4 bg-teal-500 rounded-t-sm transition-all"
                    style={{ height: `${(mois.partenariats / maxVal) * 100}%` }}
                    title={`Partenariats: ${mois.partenariats}`}
                  />
                </div>
                <span className="text-xs text-slate-500 font-medium">{mois.mois}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Impact by project */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Impact par projet</h2>
          <Target className="h-4 w-4 text-slate-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Projet</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Bénéficiaires</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Progression</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Budget</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Statut</th>
              </tr>
            </thead>
            <tbody>
              {projets.map(projet => {
                const progressBenef = Math.round((projet.beneficiaires / projet.objectif) * 100)
                const progressBudget = Math.round((projet.budget_utilise / projet.budget_alloue) * 100)
                const badge = getStatutBadge(projet.statut)
                return (
                  <tr key={projet.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-slate-800">{projet.nom}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="text-slate-700">{projet.beneficiaires.toLocaleString('fr-FR')} / {projet.objectif.toLocaleString('fr-FR')}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${progressBenef >= 100 ? 'bg-green-500' : progressBenef >= 50 ? 'bg-teal-500' : 'bg-orange-500'}`}
                            style={{ width: `${Math.min(progressBenef, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600">{progressBenef}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="text-slate-700 text-xs">
                        {(projet.budget_utilise / 1000000).toFixed(0)}M / {(projet.budget_alloue / 1000000).toFixed(0)}M FCFA
                      </p>
                      <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1">
                        <div 
                          className={`h-1.5 rounded-full ${progressBudget >= 90 ? 'bg-red-500' : progressBudget >= 50 ? 'bg-orange-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(progressBudget, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Publications</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Offres publiées</span>
              <span className="text-sm font-bold text-slate-800">12</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Communiqués</span>
              <span className="text-sm font-bold text-slate-800">8</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Projets documentés</span>
              <span className="text-sm font-bold text-slate-800">5</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-50 rounded-lg">
              <CalendarDays className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Événements</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Organisés</span>
              <span className="text-sm font-bold text-slate-800">15</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Participants totaux</span>
              <span className="text-sm font-bold text-slate-800">1,250</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Taux de remplissage</span>
              <span className="text-sm font-bold text-slate-800">85%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-teal-50 rounded-lg">
              <Handshake className="h-5 w-5 text-teal-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Partenariats</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Actifs</span>
              <span className="text-sm font-bold text-slate-800">8</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Total engagements</span>
              <span className="text-sm font-bold text-slate-800">280M FCFA</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Nouveaux ce trimestre</span>
              <span className="text-sm font-bold text-slate-800">2</span>
            </div>
          </div>
        </div>
      </div>

      {/* Note: no funding requests */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Information</p>
          <p className="text-xs text-amber-700 mt-1">
            En tant qu'organisation, vous n'avez pas accès aux demandes de financement. 
            Contactez l'administration pour toute question relative aux financements.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 pt-8">
        © 2026 2SND TECHNOLOGIES - Tous droits réservés.
      </footer>
    </div>
  )
}
