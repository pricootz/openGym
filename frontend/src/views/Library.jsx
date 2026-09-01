import { useState } from 'react'
import { useStore } from '../store/useStore.js'
import { EXDB, BODYPARTS, allExercises, equipmentOf } from '../lib/exercises.js'
import { bestWeightFor } from '../lib/history.js'
import { fmtNum } from '../lib/format.js'
import { t } from '../lib/i18n.js'
import { Thumb } from '../components/Media.jsx'
import { exerciseDetailSheet, addToRoutineSheet, customExSheet } from '../sheets.jsx'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'

export default function Library() {
  const S = useStore(s => s.S)
  const [q, setQ] = useState('')
  const [bp, setBp] = useState('')
  const [eq, setEq] = useState('')
  const [shown, setShown] = useState(40)
  const ql = q.toLowerCase().trim()
  const base = allExercises(S).filter(e => (!bp || e.bp === bp) && (!ql || e.n.toLowerCase().includes(ql) || e.tg.includes(ql) || e.eq.includes(ql) || (e.desc || '').toLowerCase().includes(ql)))
  const eqOpts = equipmentOf(base)
  const eqOn = eqOpts.includes(eq) ? eq : ''
  const f = eqOn ? base.filter(e => e.eq === eqOn) : base
  const activeFilters = (bp ? 1 : 0) + (eqOn ? 1 : 0) + (ql ? 1 : 0)

  const clearFilters = () => {
    setQ('')
    setBp('')
    setEq('')
    setShown(40)
  }

  return <div className="library-v2">
    <header className="library-head">
      <div>
        <div className="library-eyebrow"><Icon name="dumbbell" />{t('Exercise library')}</div>
        <h1>{t('Exercises')}</h1>
        <div className="library-sub">{t('{0} exercises with animations', EXDB.length)}</div>
      </div>
      <button className="library-create" onClick={() => customExSheet(null, ex => exerciseDetailSheet(ex), q.trim())}>
        <span><Icon name="plus" /></span>
        <strong>{t('Create')}</strong>
      </button>
    </header>

    <section className="library-search-panel">
      <div className="library-search">
        <Icon name="magnifier" />
        <input className="input" placeholder={t('Search exercises, muscles or equipment…')} value={q}
          onChange={e => { setQ(e.target.value); setShown(40) }} />
        {q && <button className="library-search-clear" onClick={() => { setQ(''); setShown(40) }} aria-label={t('Clear')}><Icon name="xmark" /></button>}
      </div>
      <div className="library-result-row">
        <div><strong>{f.length}</strong> {t('results')}</div>
        {activeFilters > 0 && <button onClick={clearFilters}>{t('Clear filters')}</button>}
      </div>
    </section>

    <section className="library-filter-block">
      <div className="library-filter-label"><span>{t('Body part')}</span>{bp && <b>{t(bp)}</b>}</div>
      <div className="chips library-chips">
        <button className={'chip nocap' + (!bp ? ' on' : '')} onClick={() => { setBp(''); setEq(''); setShown(40) }}>{t('All')}</button>
        {BODYPARTS.map(b => <button key={b} className={'chip' + (bp === b ? ' on' : '')} onClick={() => { setBp(b); setEq(''); setShown(40) }}>{t(b)}</button>)}
      </div>
    </section>

    {eqOpts.length > 1 && <section className="library-filter-block equipment">
      <div className="library-filter-label"><span>{t('Equipment')}</span>{eqOn && <b>{t(eqOn)}</b>}</div>
      <div className="chips library-chips">
        <button className={'chip nocap' + (!eqOn ? ' on' : '')} onClick={() => { setEq(''); setShown(40) }}>{t('Any equipment')}</button>
        {eqOpts.map(x => <button key={x} className={'chip' + (eqOn === x ? ' on' : '')} onClick={() => { setEq(x); setShown(40) }}>{t(x)}</button>)}
      </div>
    </section>}

    <div className="library-grid">
      <button className="exercise-card exercise-card-create" onClick={() => customExSheet(null, ex => exerciseDetailSheet(ex), q.trim())}>
        <span className="exercise-create-icon"><Icon name="sparkles" /></span>
        <span className="exercise-card-copy">
          <strong>{t('Create your own exercise')}</strong>
          <small>{t('Name + body part, no animation')}</small>
        </span>
        <span className="exercise-card-arrow"><Icon name="plus" /></span>
      </button>

      {f.slice(0, shown).map(e => {
        const best = bestWeightFor(S, e.id)
        return <article key={e.id} className="exercise-card" onClick={() => exerciseDetailSheet(e)}>
          <div className="exercise-card-media"><Thumb ex={e} /></div>
          <div className="exercise-card-body">
            <div className="exercise-card-meta">
              <span>{t(e.tg || e.bp)}</span>
              <span>{t(e.eq)}</span>
            </div>
            <h3 className="capitalize">{e.n}</h3>
            <div className="exercise-card-foot">
              <div className="exercise-best">
                {best > 0 ? <><small>{t('Best')}</small><strong>{fmtNum(best)} {S.unit}</strong></> : <small>{t('Not trained yet')}</small>}
              </div>
              <Button size="sm" variant="tinted" icon="plus" onClick={ev => { ev.stopPropagation(); addToRoutineSheet(e) }}>{t('Plan')}</Button>
            </div>
          </div>
        </article>
      })}
    </div>

    {f.length === 0 && <div className="library-empty">
      <span><Icon name="magnifier" /></span>
      <h2>{t('No match')}</h2>
      <p>{t('Try another search or clear the active filters.')}</p>
      <Button onClick={clearFilters}>{t('Clear filters')}</Button>
    </div>}

    {f.length > shown && <div className="library-more"><Button onClick={() => setShown(s => s + 40)}>{t('Show more')} · {f.length - shown}</Button></div>}
  </div>
}
