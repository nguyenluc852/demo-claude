import { CONTACT_FORM_ANCHOR, HOME_MEDIA, ROOMS_ANCHOR, STRINGS } from '../../constants'
import { useInView } from '../../hooks'
import { Button, Icon } from '../atoms'
import type { IconName } from '../atoms'

/** The three commitments a visitor scans for before reading anything else. */
const CHIPS = [
  { icon: 'fire', label: STRINGS.home.heroChipFire },
  { icon: 'wifi', label: STRINGS.home.heroChipInternet },
  { icon: 'camera', label: STRINGS.home.heroChipSecurity },
] as const satisfies readonly { icon: IconName; label: string }[]

function scrollTo(anchor: string) {
  document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' })
}

export function HomeHero() {
  const [ref, inView] = useInView<HTMLElement>(0.05)

  return (
    <section className="hero" ref={ref} data-inview={inView}>
      <div className="site-wrap">
        <div className="hero-panel">
          <div>
            <span className="hero-eyebrow reveal">
              <Icon name="pin" />
              {STRINGS.home.heroEyebrow}
            </span>
            <h1 className="reveal">{STRINGS.home.heroTitle}</h1>
            <p className="reveal">{STRINGS.home.heroBody}</p>

            <div className="hero-actions reveal">
              <Button variant="accent" onClick={() => scrollTo(ROOMS_ANCHOR)}>
                {STRINGS.home.heroPrimaryAction}
              </Button>
              <Button variant="secondary" onClick={() => scrollTo(CONTACT_FORM_ANCHOR)}>
                {STRINGS.home.heroSecondaryAction}
              </Button>
            </div>

            <ul className="hero-chips reveal">
              {CHIPS.map((chip) => (
                <li className="chip" key={chip.label}>
                  <Icon name={chip.icon} />
                  {chip.label}
                </li>
              ))}
            </ul>
          </div>

          <figure className="hero-figure reveal">
            <img src={HOME_MEDIA.hero} alt={STRINGS.home.heroImageAlt} />
          </figure>
        </div>
      </div>
    </section>
  )
}
