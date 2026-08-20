import { useEffect, useState } from 'react'

import { METER_FILTER, SLICE, STATUS, STRINGS } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  fetchMeterGrid,
  saveReading,
  setFilter,
  setPeriod,
  setSearch,
} from '../../store/slices/metersSlice'
import { currentPeriod } from '../../utils/format'
import { Input, Spinner } from '../atoms'
import { EmptyState, MeterGridRow, Notice, Tabs } from '../molecules'

const TAB_OPTIONS = [
  [METER_FILTER.all, STRINGS.meter.tabAll],
  [METER_FILTER.missingElectric, STRINGS.meter.tabMissingElectric],
  [METER_FILTER.missingWater, STRINGS.meter.tabMissingWater],
  [METER_FILTER.complete, STRINGS.meter.tabComplete],
] as const

type Draft = { electric: string; water: string }

function draftOf(electric: number | null, water: number | null): Draft {
  return { electric: electric === null ? '' : String(electric), water: water === null ? '' : String(water) }
}

export function MeterGrid() {
  const dispatch = useAppDispatch()
  const { rows, status, savingRoomIds, savedRoomIds, period, filter, search, error } =
    useAppSelector((state) => state[SLICE.meters])

  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const activePeriod = period || currentPeriod()

  useEffect(() => {
    if (!period) {
      dispatch(setPeriod(currentPeriod()))
    }
  }, [dispatch, period])

  useEffect(() => {
    void dispatch(fetchMeterGrid({ period: activePeriod, filter, search }))
  }, [dispatch, activePeriod, filter, search])

  // Server values seed the inputs; a row already being edited keeps its draft.
  useEffect(() => {
    setDrafts((current) => {
      const next: Record<string, Draft> = {}
      for (const row of rows) {
        next[row.room_id] =
          current[row.room_id] ?? draftOf(row.electric_new, row.water_new)
      }
      return next
    })
  }, [rows])

  function setDraft(roomId: string, patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [roomId]: { ...(current[roomId] ?? { electric: '', water: '' }), ...patch },
    }))
  }

  function save(roomId: string) {
    const draft = drafts[roomId]
    if (!draft) {
      return
    }
    void dispatch(
      saveReading({
        roomId,
        payload: {
          period: activePeriod,
          electric_new: draft.electric === '' ? null : Number(draft.electric),
          water_new: draft.water === '' ? null : Number(draft.water),
        },
      }),
    )
  }

  return (
    <section className="card">
      <div className="section-head">
        <h2>{STRINGS.meter.heading}</h2>
        <div className="toolbar">
          <Input
            type="month"
            value={activePeriod}
            aria-label={STRINGS.meter.periodLabel}
            onChange={(event) => dispatch(setPeriod(event.target.value))}
          />
          <Input
            value={search}
            placeholder={STRINGS.meter.searchPlaceholder}
            aria-label={STRINGS.common.search}
            onChange={(event) => dispatch(setSearch(event.target.value))}
          />
        </div>
      </div>

      <p data-tone="muted">{STRINGS.meter.subtitle}</p>

      <Tabs
        label={STRINGS.meter.heading}
        value={filter}
        options={TAB_OPTIONS}
        onChange={(value) => dispatch(setFilter(value))}
      />

      {error ? <Notice message={error} tone="danger" /> : null}
      {status === STATUS.loading && rows.length === 0 ? (
        <Spinner label={STRINGS.common.loading} />
      ) : null}

      {status === STATUS.succeeded && rows.length === 0 ? (
        <EmptyState message={STRINGS.meter.empty} />
      ) : (
        <div className="table-scroll table-cards">
          <table>
            <thead>
              <tr>
                <th>{STRINGS.meter.columnRoom}</th>
                <th>{STRINGS.meter.columnTenant}</th>
                <th>{STRINGS.meter.columnElectric}</th>
                <th>{STRINGS.meter.columnWater}</th>
                <th>{STRINGS.common.actions}</th>
                <th aria-label={STRINGS.common.actions} />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <MeterGridRow
                  key={row.room_id}
                  row={row}
                  electric={drafts[row.room_id]?.electric ?? ''}
                  water={drafts[row.room_id]?.water ?? ''}
                  saving={savingRoomIds.includes(row.room_id)}
                  saved={savedRoomIds.includes(row.room_id)}
                  onElectricChange={(value) => setDraft(row.room_id, { electric: value })}
                  onWaterChange={(value) => setDraft(row.room_id, { water: value })}
                  onSave={() => save(row.room_id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
