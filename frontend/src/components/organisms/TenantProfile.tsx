import { useEffect } from 'react'

import { SLICE, STATUS, STRINGS } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchTenantOverview } from '../../store/slices/tenantSlice'
import { formatDate, formatMoney } from '../../utils/format'
import {
  contractStatusLabel,
  contractStatusTone,
  paymentCycleLabel,
  roomStatusLabel,
  roomStatusTone,
  roomTypeLabel,
} from '../../utils/labels'
import { Spinner, Text } from '../atoms'
import { Notice, StatCard, StatusBadge } from '../molecules'

/** Everything about who the tenant is and what they signed — the reference
 *  screen, kept off the overview so the overview can stay about usage. */
export function TenantProfile() {
  const dispatch = useAppDispatch()
  const { overview, status, error } = useAppSelector((state) => state[SLICE.tenant])

  useEffect(() => {
    void dispatch(fetchTenantOverview())
  }, [dispatch])

  if (status === STATUS.loading || status === STATUS.idle) {
    return <Spinner label={STRINGS.common.loading} />
  }

  if (!overview) {
    return <Notice message={error ?? STRINGS.tenant.noContract} tone="danger" />
  }

  const { contract, room } = overview

  return (
    <div className="stack">
      <section className="card">
        <div className="section-head">
          <h2>{STRINGS.tenant.profileHeading}</h2>
        </div>
        <div className="stat-grid">
          <StatCard
            label={STRINGS.tenant.profileName}
            value={contract.tenant_name}
            variant="text"
          />
          <StatCard label={STRINGS.tenant.profilePhone} value={contract.tenant_phone} />
          <StatCard
            label={STRINGS.tenant.profileEmail}
            value={contract.tenant_email}
            variant="text"
          />
          <StatCard label={STRINGS.tenant.profileIdCard} value={contract.tenant_id_card} />
          <StatCard
            label={STRINGS.tenant.profileOccupants}
            value={`${contract.occupants} ${STRINGS.tenant.profileOccupantsUnit}`}
          />
        </div>
        {contract.note ? (
          <p>
            <Text tone="muted">
              {STRINGS.tenant.profileNote}: {contract.note}
            </Text>
          </p>
        ) : null}
      </section>

      <section className="card">
        <div className="section-head">
          <h2>{STRINGS.tenant.contractHeading}</h2>
          <StatusBadge
            label={contractStatusLabel(contract.status)}
            tone={contractStatusTone(contract.status)}
          />
        </div>
        <div className="stat-grid">
          <StatCard label={STRINGS.contract.startLabel} value={formatDate(contract.start_date)} />
          <StatCard label={STRINGS.contract.endLabel} value={formatDate(contract.end_date)} />
          <StatCard label={STRINGS.contract.depositLabel} value={formatMoney(contract.deposit)} />
          <StatCard
            label={STRINGS.contract.cycleLabel}
            value={paymentCycleLabel(contract.payment_cycle)}
          />
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <h2>
            {STRINGS.tenant.roomHeading} · {room.room_number}
          </h2>
          <StatusBadge label={roomStatusLabel(room.status)} tone={roomStatusTone(room.status)} />
        </div>
        <div className="stat-grid">
          <StatCard label={STRINGS.room.typeLabel} value={roomTypeLabel(room.room_type)} />
          <StatCard
            label={STRINGS.room.areaLabel}
            value={`${room.area} ${STRINGS.room.areaUnit}`}
          />
          <StatCard label={STRINGS.room.priceLabel} value={formatMoney(room.base_price)} />
          <StatCard label={STRINGS.room.floorLabel} value={String(room.floor)} />
        </div>
        {room.amenities.length > 0 ? (
          <p>
            <Text tone="muted">{room.amenities.join(' · ')}</Text>
          </p>
        ) : null}
      </section>
    </div>
  )
}
