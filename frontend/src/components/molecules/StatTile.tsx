import { stagger } from '../../utils/style'

interface StatTileProps {
  label: string
  /** Already formatted — the caller owns the locale and the unit. */
  value: string
  index?: number
}

/**
 * A figure sitting on the building photo. Distinct from `StatCard`, which is a
 * surface tile inside the admin dashboard; this one reads over an image.
 */
export function StatTile({ label, value, index = 0 }: StatTileProps) {
  return (
    <div className="stat-tile reveal" style={stagger(index)}>
      <strong className="num">{value}</strong>
      <span>{label}</span>
    </div>
  )
}
