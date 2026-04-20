/**
 * Utility functions for task progress styling
 */

export const getProgressColor = (progress: number = 0) => {
  if (progress < 33) return 'bg-red-500'
  if (progress < 66) return 'bg-amber-500'
  return 'bg-green-500'
}

export const getProgressTextColor = (progress: number = 0) => {
  if (progress < 33) return 'text-red-600'
  if (progress < 66) return 'text-amber-600'
  return 'text-green-600'
}

export const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
