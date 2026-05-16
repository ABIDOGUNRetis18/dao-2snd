import { useState } from 'react'
import { 
  Bell, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  FileText,
  Handshake,
  CalendarDays,
  CheckCircle2
} from 'lucide-react'

interface Notification {
  id: number
  type: 'evenement' | 'offre' | 'partenariat' | 'candidature' | 'rappel'
  titre: string
  description: string
  date: string
  heure: string
  lu: boolean
  priorite: 'haute' | 'moyenne' | 'basse'
}

interface CalendarEvent {
  date: string
  events: { titre: string; type: string; heure?: string }[]
}

export default function Calendrier() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 4, 1))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, type: 'evenement', titre: 'Séminaire développement durable', description: 'Début dans 5 jours. 67 inscrits sur 100 places.', date: '2026-05-20', heure: '09:00', lu: false, priorite: 'haute' },
    { id: 2, type: 'candidature', titre: 'Nouvelle candidature reçue', description: 'Jean Kokou a postulé pour le poste de Coordonnateur terrain.', date: '2026-05-16', heure: '14:30', lu: false, priorite: 'moyenne' },
    { id: 3, type: 'partenariat', titre: 'Renouvellement convention GIZ', description: 'La convention avec GIZ Togo expire dans 30 jours.', date: '2026-05-16', heure: '10:00', lu: false, priorite: 'haute' },
    { id: 4, type: 'offre', titre: 'Offre expirée', description: 'L\'offre "Recrutement Comptable Senior" a expiré hier.', date: '2026-05-15', heure: '08:00', lu: true, priorite: 'moyenne' },
    { id: 5, type: 'rappel', titre: 'Rapport mensuel', description: 'N\'oubliez pas de soumettre le rapport d\'activités du mois de mai.', date: '2026-05-31', heure: '17:00', lu: false, priorite: 'haute' },
    { id: 6, type: 'evenement', titre: 'Formation gestion de projets', description: 'Début de la formation le 5 juillet. Places complètes.', date: '2026-07-05', heure: '08:30', lu: true, priorite: 'basse' },
    { id: 7, type: 'candidature', titre: '3 candidatures en attente', description: 'Vous avez 3 candidatures en attente d\'évaluation.', date: '2026-05-16', heure: '09:00', lu: false, priorite: 'moyenne' },
  ])

  const calendarEvents: CalendarEvent[] = [
    { date: '2026-05-16', events: [{ titre: 'Évaluation candidatures', type: 'candidature', heure: '10:00' }, { titre: 'Réunion partenaires', type: 'partenariat', heure: '14:00' }] },
    { date: '2026-05-20', events: [{ titre: 'Séminaire développement durable', type: 'evenement', heure: '09:00' }] },
    { date: '2026-05-22', events: [{ titre: 'Clôture séminaire', type: 'evenement', heure: '17:00' }] },
    { date: '2026-05-25', events: [{ titre: 'Publication offre terrain', type: 'offre', heure: '10:00' }] },
    { date: '2026-05-31', events: [{ titre: 'Rapport mensuel', type: 'rappel', heure: '17:00' }] },
    { date: '2026-06-05', events: [{ titre: 'Comité de pilotage', type: 'partenariat', heure: '09:00' }] },
    { date: '2026-06-20', events: [{ titre: 'Conférence annuelle', type: 'evenement', heure: '08:00' }] },
  ]

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, lu: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, lu: true })))
  }

  const unreadCount = notifications.filter(n => !n.lu).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'evenement': return <CalendarDays className="h-4 w-4 text-orange-500" />
      case 'offre': return <FileText className="h-4 w-4 text-blue-500" />
      case 'partenariat': return <Handshake className="h-4 w-4 text-teal-500" />
      case 'candidature': return <Users className="h-4 w-4 text-purple-500" />
      case 'rappel': return <Bell className="h-4 w-4 text-red-500" />
      default: return <Bell className="h-4 w-4 text-slate-400" />
    }
  }

  const getPrioriteBadge = (priorite: string) => {
    switch (priorite) {
      case 'haute': return 'bg-red-100 text-red-700'
      case 'moyenne': return 'bg-yellow-100 text-yellow-700'
      case 'basse': return 'bg-slate-100 text-slate-500'
      default: return 'bg-slate-100 text-slate-500'
    }
  }

  // Calendar generation
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    return day === 0 ? 6 : day - 1
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const monthName = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return calendarEvents.find(e => e.date === dateStr)?.events || []
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'evenement': return 'bg-orange-500'
      case 'offre': return 'bg-blue-500'
      case 'partenariat': return 'bg-teal-500'
      case 'candidature': return 'bg-purple-500'
      case 'rappel': return 'bg-red-500'
      default: return 'bg-slate-400'
    }
  }

  const selectedEvents = selectedDate 
    ? calendarEvents.find(e => e.date === selectedDate)?.events || []
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-teal-600" />
            Calendrier & Notifications
          </h1>
          <p className="text-slate-500 text-sm mt-1">Suivez vos événements et notifications automatiques.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            Tout marquer comme lu ({unreadCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </button>
            <h2 className="text-sm font-semibold text-slate-800 capitalize">{monthName}</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          <div className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-slate-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const events = getEventsForDate(day)
                const isToday = dateStr === '2026-05-16'
                const isSelected = dateStr === selectedDate

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-start p-1 transition-colors ${
                      isSelected ? 'bg-teal-100 ring-2 ring-teal-500' :
                      isToday ? 'bg-teal-50 ring-1 ring-teal-300' :
                      events.length > 0 ? 'hover:bg-slate-50' :
                      'hover:bg-slate-50'
                    }`}
                  >
                    <span className={`text-xs font-medium ${
                      isToday ? 'text-teal-700 font-bold' :
                      isSelected ? 'text-teal-700' :
                      'text-slate-700'
                    }`}>
                      {day}
                    </span>
                    {events.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {events.slice(0, 3).map((e, idx) => (
                          <div key={idx} className={`w-1.5 h-1.5 rounded-full ${getEventColor(e.type)}`} />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected date events */}
          {selectedDate && selectedEvents.length > 0 && (
            <div className="p-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3">
                Événements du {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <div className="space-y-2">
                {selectedEvents.map((event, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                    <div className={`w-1 h-8 rounded-full ${getEventColor(event.type)}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{event.titre}</p>
                      {event.heure && (
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {event.heure}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {unreadCount}
                </span>
              )}
            </h2>
          </div>

          <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Aucune notification.</p>
              </div>
            ) : notifications.map(notif => (
              <div 
                key={notif.id} 
                onClick={() => markAsRead(notif.id)}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  notif.lu ? 'bg-white' : 'bg-teal-50/50'
                } hover:bg-slate-50`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-slate-50 rounded-lg mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm ${notif.lu ? 'text-slate-700' : 'font-semibold text-slate-800'}`}>
                        {notif.titre}
                      </p>
                      {!notif.lu && <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{notif.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(notif.date).toLocaleDateString('fr-FR')} à {notif.heure}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getPrioriteBadge(notif.priorite)}`}>
                        {notif.priorite}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3">Légende du calendrier</h3>
        <div className="flex flex-wrap gap-4">
          <span className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-3 h-3 rounded-full bg-orange-500" /> Événements
          </span>
          <span className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-3 h-3 rounded-full bg-blue-500" /> Offres
          </span>
          <span className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-3 h-3 rounded-full bg-teal-500" /> Partenariats
          </span>
          <span className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-3 h-3 rounded-full bg-purple-500" /> Candidatures
          </span>
          <span className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-3 h-3 rounded-full bg-red-500" /> Rappels
          </span>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 pt-8">
        © 2026 2SND TECHNOLOGIES - Tous droits réservés.
      </footer>
    </div>
  )
}
