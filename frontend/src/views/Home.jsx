import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { effectiveRoutine, effectiveRoutineId, streakWeeks, lastBW } from '../lib/history.js'
import { fmtNum, fmtDate, todayISO, isoOf, weekKey, DAYS } from '../lib/format.js'
import { t, dateLocale } from '../lib/i18n.js'
import { bwSheet, goalSheet, dayOverrideSheet, calendarSheet, startFlow, loadStarterPlan, bwDeltaColor } from '../sheets.jsx'
import LineChart from '../components/LineChart.jsx'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'
import { glyphOf } from '../lib/glyphs.js'

// Home = a focused training dashboard. Deep charts & history still live in Stats.
export default function Home() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const user = useStore(s => s.user)
  const [weekOffset, setWeekOffset] = useState(0)

  const today = new Date()
  const routine = effectiveRoutine(S, todayISO())
  const todayOvr = S.dayPlan[todayISO()] !== undefined
  const bw = lastBW(S)
  const prevBW = S.bodyweight.length > 1 ? S.bodyweight[S.bodyweight.length - 2] : null
  const delta = bw && prevBW ? bw.w - prevBW.w : null
  const streak = streakWeeks(S)

  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7)
  const doneDays = new Set(S.workouts.map(w => w.d))
  const strip = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const iso = isoOf(d)
    const eff = effectiveRoutineId(S, iso)
    const ovr = S.dayPlan[iso] !== undefined
    const done = doneDays.has(iso)
    const dot = done ? ' done' : ovr && eff ? ' ovr' : eff ? ' plan' : ''
    strip.push(
      <div key={i} className={'wday' + (iso === todayISO() ? ' today' : '')} onClick={() => dayOverrideSheet(iso)}>
        <div className="lbl">{t(DAYS[d.getDay()])}</div>
        <div className="num">{d.getDate()}</div>
        <div className={'dot' + dot} />
      </div>
    )
  }

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const wkLabel = weekOffset === 0
    ? t('This week')
    : `${monday.getDate()} ${monday.toLocaleDateString(dateLocale(), { month: 'short' })} – ${sunday.getDate()} ${sunday.toLocaleDateString(dateLocale(), { month: 'short' })}`

  const wThisWeek = S.workouts.filter(w => weekKey(w.d) === weekKey(todayISO())).length
  const plannedPerWeek = Object.keys(S.week).filter(k => S.week[k]).length
  const bwPoints = S.bodyweight.slice(-30).map(b => ({ t: b.t || new Date(b.d).getTime(), y: b.w, d: b.d }))

  const onToday = () => {
    if (S.active) nav('/workout')
    else if (routine) startFlow(routine.id)
    else dayOverrideSheet(todayISO())
  }

  const sessionName = S.active
    ? t('{0} — in progress', S.active.name)
    : routine
      ? routine.name
      : t('Rest day')

  return <div className="narrow home-page">
    <section className="home-hero">
      <div className="home-hero-top">
        <div className="home-date">{today.toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <button className="iconbtn" onClick={() => nav('/settings')} aria-label={t('Settings')}>
          <Icon name="gear" />
        </button>
      </div>

      <h1 className="home-title">{user ? t('Hi {0}', user.name) : 'openGym'}</h1>

      <button className={'home-session' + (S.active ? ' active' : '')} onClick={onToday}>
        <span className="home-session-main">
          <span className="home-session-icon">
            <Icon name={S.active ? 'timer' : routine ? glyphOf(routine.emoji) : 'moon'} />
          </span>
          <span className="home-session-copy">
            <span className="home-session-kicker">{t('Today')}</span>
            <span className="home-session-name">{sessionName}{todayOvr && routine ? ' · ' + t('rescheduled') : ''}</span>
          </span>
        </span>
        <span className="home-session-action">
          <span>{S.active ? t('Resume') : routine ? t('Start') : t('Plan')}</span>
          <Icon name="chevronRight" />
        </span>
      </button>
    </section>

    <div className="home-metrics">
      <button className="home-metric" onClick={() => nav('/stats')}>
        <span className="home-metric-head"><Icon name="dumbbell" /><span>{t('Workouts')}</span></span>
        <strong>{wThisWeek}{plannedPerWeek ? '/' + plannedPerWeek : ''}</strong>
        <small>{t('this week')}</small>
      </button>
      <button className="home-metric" onClick={() => calendarSheet()}>
        <span className="home-metric-head"><Icon name="flame" /><span>{t('Week streak')}</span></span>
        <strong>{streak}</strong>
        <small>{t(S.workouts.length === 1 ? '{0} workout total' : '{0} workouts total', S.workouts.length)}</small>
      </button>
      <button className="home-metric" onClick={() => bwSheet()}>
        <span className="home-metric-head"><Icon name="scale" /><span>{t('Body weight')}</span></span>
        <strong>{bw ? `${fmtNum(bw.w)} ${S.unit}` : '—'}</strong>
        <small>{S.targetW ? `${t('Goal')} ${fmtNum(S.targetW)} ${S.unit}` : t('Log')}</small>
      </button>
    </div>

    {!S.routines.length && !S.active && (
      <div className="card">
        <div className="row" style={{ gap: 10, marginBottom: 7 }}>
          <span className="lrow-i"><Icon name="sparkles" /></span>
          <div className="big" style={{ fontSize: 24 }}>{t('Welcome!')}</div>
        </div>
        <div className="muted small" style={{ marginBottom: 14 }}>{t('Set up your weekly routine to get going — or load a ready-made Push / Pull / Legs plan.')}</div>
        <Button variant="primary" icon="sparkles" onClick={loadStarterPlan}>{t('Load starter plan (PPL)')}</Button>
        <div style={{ height: 8 }} />
        <Button onClick={() => nav('/plan')}>{t('Build my own plan')}</Button>
      </div>
    )}

    <section className="dashboard-section">
      <div className="dashboard-section-head">
        <h2>{t('This week')}</h2>
        <span>{wThisWeek}{plannedPerWeek ? ' / ' + plannedPerWeek : ''} {t('this week')}</span>
      </div>
      <div className="card week-card">
        <div className="week-card-nav">
          <button className="iconbtn" onClick={() => setWeekOffset(w => w - 1)} aria-label="Previous week"><Icon name="chevronLeft" /></button>
          <div className="week-card-label">{wkLabel}</div>
          <button className="iconbtn" onClick={() => setWeekOffset(w => w + 1)} aria-label="Next week"><Icon name="chevronRight" /></button>
        </div>
        <div className="week">{strip}</div>
      </div>
    </section>

    <section className="dashboard-section">
      <div className="dashboard-section-head">
        <h2>{t('Body weight')}</h2>
        <span>{bw ? fmtDate(bw.d, true) : t('No entries yet')}</span>
      </div>
      <div className="card">
        <div className="row between" style={{ marginBottom: 12 }}>
          <div className="row" style={{ gap: 8 }}>
            <Button size="sm" icon="target" style={S.targetW ? { color: 'var(--yellow)' } : undefined} onClick={goalSheet}>{S.targetW ? fmtNum(S.targetW) : t('Goal')}</Button>
            <Button size="sm" icon="plus" onClick={() => bwSheet()}>{t('Log')}</Button>
          </div>
          {delta !== null && delta !== 0 && (
            <span className="small row" style={{ gap: 3, fontWeight: 650, color: bwDeltaColor(delta, bw.w) }}>
              <Icon name={delta > 0 ? 'arrowUp' : 'arrowDown'} style={{ fontSize: 12 }} />
              {fmtNum(Math.abs(delta))}
            </span>
          )}
        </div>

        {bw ? <>
          <div className="weight-summary">
            <div className="weight-value">{fmtNum(bw.w)}<span>{S.unit}</span></div>
          </div>
          {S.targetW && (
            <div className="small row" style={{ color: 'var(--yellow)', marginTop: 8, gap: 5 }}>
              <Icon name="target" style={{ fontSize: 13 }} />
              <span>{t('Goal')} {fmtNum(S.targetW)} {S.unit} · {Math.abs(S.targetW - bw.w) < 0.05 ? t('reached!') : t(S.targetW > bw.w ? '{0} to gain' : '{0} to lose', fmtNum(Math.abs(S.targetW - bw.w)) + ' ' + S.unit)}</span>
            </div>
          )}
          <div className="chart" style={{ marginTop: 10 }}><LineChart points={bwPoints} h={138} unit={S.unit} goal={S.targetW} /></div>
        </> : <div className="muted small">{t("No entries yet — log your weight to start the curve. It's also asked before every workout.")}</div>}
      </div>
    </section>

    <button className="card tappable" style={{ cursor: 'pointer', width: '100%', textAlign: 'left' }} onClick={() => calendarSheet()}>
      <div className="row between">
        <div>
          <div className="row" style={{ gap: 8, fontSize: 20, fontWeight: 680, letterSpacing: '-.025em' }}>
            <Icon name="flame" style={{ color: 'var(--orange)' }} />
            {t('{0} week streak', streak)}
          </div>
          <div className="muted small" style={{ marginTop: 4 }}>{t(S.workouts.length === 1 ? '{0} workout total' : '{0} workouts total', S.workouts.length)}</div>
        </div>
        <Icon name="calendar" className="chev" style={{ fontSize: 20 }} />
      </div>
    </button>
  </div>
}
