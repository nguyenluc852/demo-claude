import { stagger } from '../../utils/style'
import { Icon } from '../atoms'
import type { IconName } from '../atoms'

interface AmenityCardProps {
  icon: IconName
  title: string
  body: string
  /** Position in its grid, so the reveal can stagger card by card. */
  index?: number
}

export function AmenityCard({ icon, title, body, index = 0 }: AmenityCardProps) {
  return (
    <article className="amenity reveal" style={stagger(index)}>
      <span className="amenity-icon">
        <Icon name={icon} />
      </span>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  )
}
