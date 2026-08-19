import { AMENITIES_ANCHOR, STRINGS } from '../../constants'
import { useInView } from '../../hooks'
import { stagger } from '../../utils/style'
import { Icon } from '../atoms'
import type { IconName } from '../atoms'
import { AmenityCard } from '../molecules'

/** The three the spec calls out as headline commitments. */
const AMENITIES = [
  { icon: 'fire', title: STRINGS.home.fireTitle, body: STRINGS.home.fireBody },
  { icon: 'wifi', title: STRINGS.home.internetTitle, body: STRINGS.home.internetBody },
  { icon: 'camera', title: STRINGS.home.otherTitle, body: STRINGS.home.otherBody },
] as const satisfies readonly { icon: IconName; title: string; body: string }[]

/** The smaller ones, which matter daily but do not need a paragraph each. */
const EXTRAS = [
  { icon: 'fingerprint', label: STRINGS.home.extraParking },
  { icon: 'camera', label: STRINGS.home.extraCamera },
  { icon: 'broom', label: STRINGS.home.extraCleaning },
  { icon: 'laundry', label: STRINGS.home.extraLaundry },
] as const satisfies readonly { icon: IconName; label: string }[]

export function AmenitiesSection() {
  const [ref, inView] = useInView<HTMLElement>()

  return (
    <section className="site-section" id={AMENITIES_ANCHOR} ref={ref} data-inview={inView}>
      <div className="site-wrap">
        <h2 className="reveal">{STRINGS.home.amenitiesHeading}</h2>
        <p className="reveal">{STRINGS.home.amenitiesBody}</p>

        <div className="amenity-grid">
          {AMENITIES.map((amenity, index) => (
            <AmenityCard
              key={amenity.title}
              icon={amenity.icon}
              title={amenity.title}
              body={amenity.body}
              index={index}
            />
          ))}
        </div>

        <p className="amenity-extras-heading reveal">{STRINGS.home.extrasHeading}</p>
        <ul className="amenity-extras">
          {EXTRAS.map((extra, index) => (
            <li className="chip reveal" key={extra.label} style={stagger(index)}>
              <Icon name={extra.icon} />
              {extra.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
