import { STRINGS } from '../../constants'

const AMENITIES = [
  { title: STRINGS.home.fireTitle, body: STRINGS.home.fireBody },
  { title: STRINGS.home.internetTitle, body: STRINGS.home.internetBody },
  { title: STRINGS.home.otherTitle, body: STRINGS.home.otherBody },
] as const

export function AmenitiesSection() {
  return (
    <section className="site-section">
      <div className="site-wrap">
        <h2>{STRINGS.home.amenitiesHeading}</h2>
        <p>{STRINGS.home.amenitiesBody}</p>
        <div className="amenity-grid">
          {AMENITIES.map((amenity) => (
            <article className="amenity" key={amenity.title}>
              <h3>{amenity.title}</h3>
              <p>{amenity.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
