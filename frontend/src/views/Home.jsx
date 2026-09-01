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
      <button key={i} className={'wday' + (iso === todayISO() ? ' today' : '')} onClick={() => dayOverrideSheet(iso)}>
        <span className="lbl">{t(DAYS[d.getDay()])}</span>
        <span className="num">{d.getDate()}</span>
        <span className={'dot' + dot} />
      </button>
    )
  }

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const wkLabel = weekOffset === 0
    ? t('This week')
    : `${monday.getDate()} ${monday.toLocaleDateString(dateLocale(), { month: 'short' })} – ${sunday.getDate()} ${sunday.toLocaleDateString(dateLocale(), { month: 'short' })}`

  const wThisWeek = S.workouts.filter(w => weekKey(w.d) === weekKey(todayISO())).length
  const plannedPerWeek = Object.keys(S.week).filter(k => S.week[k]).length
  const weekProgress = plannedPerWeek ? Math.min(100, Math.round((wThisWeek / plannedPerWeek) * 100)) : 0
  const bwPoints = S.bodyweight.slice(-30).map(b => ({ t: b.t || new Date(b.d).getTime(), y: b.w, d: b.d }))

  const onToday = () => {
    if (S.active) nav('/workout')
    else if (routine) startFlow(routine.id)
    else dayOverrideSheet(todayISO())
  }

  const sessionName = S.active ? S.active.name : routine ? routine.name : t('Rest day')
  const sessionAction = S.active ? t('Resume') : routine ? t('Start') : t('Plan')
  const sessionIcon = S.active ? 'play' : routine ? glyphOf(routine.emoji) : 'plus'
  const exerciseCount = S.active?.entries?.length ?? routine?.ex?.length ?? 0
  const dateLabel = today.toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' })

  return <div className="narrow home-page zen-home">
    <header className="zen-home-topbar">
      <div className="zen-wordmark">
        <span className="zen-wordmark-mark"><Icon name="dumbbell" /></span>
        <span>openGym</span>
      </div>
      <button className="iconbtn" onClick={() => nav('/settings')} aria-label={t('Settings')}>
        <Icon name="gear" />
      </button>
    </header>

    <section className="zen-greeting">
      <div className="zen-greeting-kicker">{dateLabel}</div>
      <h1>{user ? t('Hi {0}', user.name) : t('Ready to train?')}</h1>
    </section>

    <section className={'zen-training-hero' + (S.active ? ' is-active' : '')}>
      <div>
        <div className="zen-session-kicker"><i />{S.active ? t('Workout in progress') : t('Today')}</div>
        <h2 className="zen-session-title">{sessionName}</h2>
        <div className="zen-session-sub">
          {S.active
            ? t('{0} sets completed so far.', S.active.entries.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0))
            : routine
              ? t('Your session is ready. Open it and keep the rest simple.')
              : t('No workout planned. Use today as recovery or choose a session manually.')}
        </div>
        <div className="zen-session-meta">
          {!!exerciseCount && <span className="zen-tonal-chip"><Icon name="list" />{exerciseCount} {t('Exercises')}</span>}
          {todayOvr && routine && <span className="zen-tonal-chip"><Icon name="calendar" />{t('rescheduled')}</span>}
          <span className="zen-tonal-chip"><Icon name="flame" />{t('{0} week streak', streak)}</span>
        </div>
      </div>

      {!!plannedPerWeek && (
        <div className="zen-week-progress" aria-label={`${weekProgress}% ${t('This week')}`}>
          <div className="zen-week-ring" style={{ '--p': weekProgress }}><span>{weekProgress}%</span></div>
          <div className="zen-week-copy">
            <strong>{t('This week')}</strong>
            <small>{wThisWeek} / {plannedPerWeek} {t('Workouts')}</small>
          </div>
        </div>
      )}

      <button className={'zen-start-orb' + (S.active ? ' active' : '')} data-label={sessionAction} onClick={onToday} aria-label={sessionAction}>
        <Icon name={sessionIcon} />
      </button>
    </section>

    <section className="zen-glance" aria-label="Training overview">
      <button className="zen-glance-card" onClick={() => nav('/stats')}>
        <span className="zen-glance-icon"><Icon name="dumbbell" /></span>
        <span className="zen-glance-value">{wThisWeek}{plannedPerWeek ? '/' + plannedPerWeek : ''}</span>
        <span className="zen-glance-label">{t('Workouts')} · {t('this week')}</span>
      </button>
      <button className="zen-glance-card" onClick={() => calendarSheet()}>
        <span className="zen-glance-icon"><Icon name="flame" /></span>
        <span className="zen-glance-value">{streak}</span>
        <span className="zen-glance-label">{t('Week streak')}</span>
      </button>
      <button className="zen-glance-card" onClick={() => bwSheet()}>
        <span className="zen-glance-icon"><Icon name="scale" /></span>
        <span className="zen-glance-value">{bw ? fmtNum(bw.w) : '—'}</span>
        <span className="zen-glance-label">{bw ? S.unit : t('Body weight')}</span>
      </button>
    </section>

    {!S.routines.length && !S.active && (
      <section className="card zen-empty-onboarding">
        <div className="row" style={{ gap: 12, marginBottom: 10 }}>
          <span className="lrow-i"><Icon name="sparkles" /></span>
          <div>
            <div className="big" style={{ fontSize: 24 }}>{t('Welcome!')}</div>
            <div className="muted small" style={{ marginTop: 3 }}>{t('Set up your weekly routine to get going — or load a ready-made Push / Pull / Legs plan.')}</div>
          </div>
        </div>
        <div className="row" style={{ alignItems: 'stretch', flexWrap: 'wrap' }}>
          <Button variant="primary" icon="sparkles" onClick={loadStarterPlan}>{t('Load starter plan (PPL)')}</Button>
          <Button onClick={() => nav('/plan')}>{t('Build my own plan')}</Button>
        </div>
      </section>
    )}

    <section className="zen-section">
      <div className="zen-section-head">
        <h2>{t('This week')}</h2>
        <span>{wThisWeek}{plannedPerWeek ? ' / ' + plannedPerWeek : ''} {t('this week')}</span>
      </div>
      <div className="zen-week-card">
        <div className="zen-week-nav">
          <button className="iconbtn" onClick={() => setWeekOffset(w => w - 1)} aria-label="Previous week"><Icon name="chevronLeft" /></button>
          <div className="zen-week-label">{wkLabel}</div>
          <button className="iconbtn" onClick={() => setWeekOffset(w => w + 1)} aria-label="Next week"><Icon name="chevronRight" /></button>
        </div>
        <div className="week">{strip}</div>
      </div>
    </section>

    <section className="zen-section">
      <div className="zen-section-head">
        <h2>{t('Body weight')}</h2>
        <span>{bw ? fmtDate(bw.d, true) : t('No entries yet')}</span>
      </div>
      <div className="zen-weight-card">
        <div className="zen-weight-top">
          <div>
            <div className="zen-weight-value">{bw ? fmtNum(bw.w) : '—'}<span>{bw ? S.unit : ''}</span></div>
            {delta !== null && delta !== 0 && bw && (
              <div className="small row" style={{ gap: 4, marginTop: 7, fontWeight: 650, color: bwDeltaColor(delta, bw.w) }}>
                <Icon name={delta > 0 ? 'arrowUp' : 'arrowDown'} />
                {fmtNum(Math.abs(delta))} {S.unit}
              </div>
            )}
            {S.targetW && bw && (
              <div className="small muted" style={{ marginTop: 7 }}>
                {t('Goal')} {fmtNum(S.targetW)} {S.unit}
              </div>
            )}
          </div>
          <div className="zen-weight-actions">
            <Button size="sm" icon="target" onClick={goalSheet}>{S.targetW ? fmtNum(S.targetW) : t('Goal')}</Button>
            <Button size="sm" variant="primary" icon="plus" onClick={() => bwSheet()}>{t('Log')}</Button>
          </div>
        </div>

        {bw
          ? <div className="chart"><LineChart points={bwPoints} h={150} unit={S.unit} goal={S.targetW} /></div>
          : <div className="muted small">{t("No entries yet — log your weight to start the curve. It's also asked before every workout.")}</div>}
      </div>
    </section>
  </div>
}
