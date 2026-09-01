import { useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { effectiveRoutine } from '../lib/history.js'
import { todayISO } from '../lib/format.js'
import { t } from '../lib/i18n.js'
import Icon from './Icon.jsx'

export default function TabBar({ onStart }) {
  const nav = useNavigate()
  const loc = useLocation()
  const S = useStore(s => s.S)
  const user = useStore(s => s.user)
  const isGuest = useStore(s => s.isGuest())
  if (!user && !isGuest) return null

  const cur = loc.pathname.split('/')[1] || 'home'
  const on = k => cur === k || (cur === 'history' && k === 'stats') || (cur === 'settings' && k === 'home')

  const startWorkout = () => {
    if (!S.active) {
      const r = effectiveRoutine(S, todayISO())
      if (r && r.ex.length) { onStart(r.id); return }
    }
    nav('/workout')
  }

  const Tab = ({ k, icon, to, label }) => (
    <button className={'m3-nav-item' + (on(k) ? ' on' : '')} onClick={() => nav(to)}>
      <span className="m3-nav-icon"><Icon name={icon} /></span>
      <span className="m3-nav-label">{label}</span>
    </button>
  )

  return (
    <nav id="tabbar" className="m3-nav" aria-label="Primary navigation">
      <Tab k="home" icon="house" to="/home" label={t('Home')} />
      <Tab k="plan" icon="calendar" to="/plan" label={t('Plan')} />
      <button className={'m3-nav-item m3-nav-start' + (cur === 'workout' ? ' on' : '') + (S.active ? ' rec' : '')} onClick={startWorkout}>
        <span className="m3-nav-icon"><Icon name={S.active ? 'play' : 'dumbbell'} /></span>
        <span className="m3-nav-label">{S.active ? t('Resume') : t('Start')}</span>
      </button>
      <Tab k="stats" icon="chart" to="/stats" label={t('Stats')} />
      <Tab k="library" icon="list" to="/library" label={t('Exercises')} />
    </nav>
  )
}
