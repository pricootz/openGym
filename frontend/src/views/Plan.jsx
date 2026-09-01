import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { DAYN, uid, exCount } from '../lib/format.js'
import { t } from '../lib/i18n.js'
import { dayAssignSheet, loadStarterPlan, planToolsSheet } from '../sheets.jsx'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'
import { glyphOf, DEFAULT_GLYPH } from '../lib/glyphs.js'

const WEEK = [1, 2, 3, 4, 5, 6, 0]

export default function Plan() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const today = new Date().getDay()

  const addRoutine = () => {
    const r = { id: uid(), name: t('New routine'), emoji: DEFAULT_GLYPH, ex: [] }
    update(s => { s.routines.push(r) })
    nav('/plan/r/' + r.id)
  }

  const trainingDays = WEEK.filter(d => S.week[d]).length
  const totalExercises = S.routines.reduce((n, r) => n + r.ex.length, 0)
  const daysForRoutine = id => WEEK.filter(d => S.week[d] === id)

  return <div className="plan-v2">
    <header className="plan-v2-head">
      <div>
        <div className="plan-v2-kicker"><Icon name="calendar" />{t('Your weekly routine')}</div>
        <h1>{t('Plan')}</h1>
        <p>{trainingDays ? `${trainingDays} / 7 ${t('Week schedule').toLowerCase()}` : t('Build my own plan')}</p>
      </div>
      <button className="iconbtn plan-share" onClick={planToolsSheet} aria-label={t('Share your plan')} title={t('Share your plan')}>
        <Icon name="upload" />
      </button>
    </header>

    <section className="plan-overview" aria-label={t('Plan')}>
      <div className="plan-overview-main">
        <span className="plan-overview-label">{t('Week schedule')}</span>
        <strong>{trainingDays}</strong>
        <span className="plan-overview-copy">{trainingDays === 1 ? 'training day' : 'training days'}</span>
      </div>
      <div className="plan-overview-stat">
        <span className="plan-overview-icon"><Icon name="clipboard" /></span>
        <strong>{S.routines.length}</strong>
        <small>{t('Routines')}</small>
      </div>
      <div className="plan-overview-stat">
        <span className="plan-overview-icon"><Icon name="dumbbell" /></span>
        <strong>{totalExercises}</strong>
        <small>{t('Exercises')}</small>
      </div>
    </section>

    <section className="plan-section">
      <div className="plan-section-head">
        <div>
          <span>{t('Week schedule')}</span>
          <h2>{t('This week')}</h2>
        </div>
        <small>{t('Tap a day to change it')}</small>
      </div>

      <div className="plan-week-grid">
        {WEEK.map(d => {
          const r = S.routines.find(x => x.id === S.week[d])
          const active = d === today
          return <button key={d} className={'plan-day' + (r ? ' has-routine' : ' rest-day') + (active ? ' is-today' : '')}
            onClick={() => dayAssignSheet(d)}>
            <span className="plan-day-top">
              <span className="plan-day-name">{t(DAYN[d])}</span>
              {active && <span className="plan-today-dot" aria-label={t('Today')} />}
            </span>
            <span className={'plan-day-icon' + (r ? ' filled' : '')}>
              <Icon name={r ? glyphOf(r.emoji) : 'moon'} />
            </span>
            <span className="plan-day-routine">{r ? r.name : t('Rest')}</span>
            <span className="plan-day-meta">{r ? exCount(r.ex.length) : 'Recovery'}</span>
            <span className="plan-day-chevron"><Icon name="chevronRight" /></span>
          </button>
        })}
      </div>
    </section>

    <section className="plan-section routines-section">
      <div className="plan-section-head routines-head">
        <div>
          <span>{t('Routines')}</span>
          <h2>{S.routines.length ? t('Your weekly routine') : t('No routines yet.')}</h2>
        </div>
        <Button size="sm" variant="tinted" icon="plus" onClick={addRoutine}>{t('New')}</Button>
      </div>

      {S.routines.length ? <div className="plan-routine-grid">
        {S.routines.map((r, idx) => {
          const days = daysForRoutine(r.id)
          return <button key={r.id} className="plan-routine-card" onClick={() => nav('/plan/r/' + r.id)}>
            <span className="plan-routine-top">
              <span className="plan-routine-icon"><Icon name={glyphOf(r.emoji)} /></span>
              <span className="plan-routine-index">{String(idx + 1).padStart(2, '0')}</span>
            </span>
            <span className="plan-routine-name">{r.name}</span>
            <span className="plan-routine-count">{exCount(r.ex.length)}</span>
            <span className="plan-routine-days">
              <Icon name="calendar" />
              {days.length ? days.map(d => t(DAYN[d])).join(' · ') : t('Not scheduled')}
            </span>
            <span className="plan-routine-open"><Icon name="chevronRight" /></span>
          </button>
        })}

        <button className="plan-routine-card plan-routine-add" onClick={addRoutine}>
          <span className="plan-routine-add-icon"><Icon name="plus" /></span>
          <strong>{t('New routine')}</strong>
          <small>{t('Build my own plan')}</small>
        </button>
      </div> : <div className="plan-empty-state">
        <span className="plan-empty-icon"><Icon name="clipboard" /></span>
        <h3>{t('No routines yet.')}</h3>
        <p>{t('Create one or load the starter plan.')}</p>
        <div className="plan-empty-actions">
          <Button variant="primary" icon="sparkles" onClick={loadStarterPlan}>{t('Load starter plan (Push / Pull / Legs)')}</Button>
          <Button icon="plus" onClick={addRoutine}>{t('New routine')}</Button>
        </div>
      </div>}
    </section>
  </div>
}
