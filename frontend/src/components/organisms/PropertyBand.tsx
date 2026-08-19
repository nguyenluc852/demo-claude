import { HOME_MEDIA, ROOM_STATUS, SLICE, STRINGS } from '../../constants'
import { useCountUp, useInView } from '../../hooks'
import { useAppSelector } from '../../store/hooks'
import { formatMoney } from '../../utils/format'
import { StatTile } from '../molecules'

/**
 * The building, and four figures counted off the rooms the API actually
 * returned — nothing here is a number someone typed into the marketing copy.
 */
export function PropertyBand() {
  const { rooms } = useAppSelector((state) => state[SLICE.publicSite])
  const [ref, inView] = useInView<HTMLElement>()

  const available = rooms.filter((room) => room.status === ROOM_STATUS.available).length
  const fromPrice = rooms.length > 0 ? Math.min(...rooms.map((room) => room.base_price)) : 0
  const maxArea = rooms.length > 0 ? Math.max(...rooms.map((room) => room.area)) : 0

  const total = useCountUp(rooms.length, inView)
  const free = useCountUp(available, inView)
  const price = useCountUp(fromPrice, inView)
  const area = useCountUp(maxArea, inView)

  return (
    <section
      className="property-band"
      ref={ref}
      data-inview={inView}
      style={{ backgroundImage: `url(${HOME_MEDIA.building})` }}
    >
      <div className="site-wrap">
        <span className="band-eyebrow reveal">{STRINGS.home.bandEyebrow}</span>
        <h2 className="reveal">{STRINGS.home.bandTitle}</h2>
        <p className="reveal">{STRINGS.home.bandBody}</p>

        <div className="stat-row">
          <StatTile label={STRINGS.home.statRooms} value={String(total)} index={0} />
          <StatTile label={STRINGS.home.statAvailable} value={String(free)} index={1} />
          <StatTile label={STRINGS.home.statFromPrice} value={formatMoney(price)} index={2} />
          <StatTile
            label={STRINGS.home.statMaxArea}
            value={`${area} ${STRINGS.room.areaUnit}`}
            index={3}
          />
        </div>
      </div>
    </section>
  )
}
