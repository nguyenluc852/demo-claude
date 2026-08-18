import { useEffect } from 'react'

import { HEALTH_STATUS_OK, SLICE, STATUS, STRINGS } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchHealth } from '../../store/slices/healthSlice'
import { Spinner } from '../atoms'
import { StatusBadge } from '../molecules'

export function HealthBanner() {
  const dispatch = useAppDispatch()
  const { data, status } = useAppSelector((state) => state[SLICE.health])

  useEffect(() => {
    void dispatch(fetchHealth())
  }, [dispatch])

  if (status === STATUS.loading || status === STATUS.idle) {
    return <Spinner label={STRINGS.health.checking} />
  }

  if (status === STATUS.failed || data?.status !== HEALTH_STATUS_OK) {
    return <StatusBadge label={STRINGS.health.offline} tone="occupied" />
  }

  return (
    <StatusBadge
      label={`${STRINGS.health.online} (${STRINGS.health.versionLabel} ${data.version})`}
      tone="positive"
    />
  )
}
