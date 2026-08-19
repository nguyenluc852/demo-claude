import { CONTACT_FORM_ANCHOR, LOCALE, ROOMS_ANCHOR, STRINGS } from '../../constants'
import { useInView } from '../../hooks'
import { formatMoney } from '../../utils/format'
import { Button, Icon } from '../atoms'
import type { IconName } from '../atoms'

/**
 * The page's signature: one month of one room, written out the way the owner
 * writes it into the ledger. The headline claims the arithmetic is checkable,
 * so the hero shows the arithmetic instead of asserting it again.
 *
 * These are the seeded property's real figures and the price list's real rates,
 * so the sum below is the same sum the invoice service produces.
 */
const ELECTRIC_RATE = 3_500
const WATER_RATE = 25_000
const RENT = 4_700_000
const SERVICES = 180_000

const ELECTRIC = { from: 1_240, to: 1_420 }
const WATER = { from: 86, to: 100 }

const rate = (value: number) => value.toLocaleString(LOCALE)

const electricUsed = ELECTRIC.to - ELECTRIC.from
const waterUsed = WATER.to - WATER.from

const ROWS = [
  {
    label: STRINGS.home.ledgerRowElectric,
    work: `${ELECTRIC.from} → ${ELECTRIC.to}  ·  ${electricUsed} kWh × ${rate(ELECTRIC_RATE)}`,
    amount: electricUsed * ELECTRIC_RATE,
  },
  {
    label: STRINGS.home.ledgerRowWater,
    work: `${WATER.from} → ${WATER.to}  ·  ${waterUsed} m³ × ${rate(WATER_RATE)}`,
    amount: waterUsed * WATER_RATE,
  },
  { label: STRINGS.home.ledgerRowRent, work: STRINGS.home.ledgerRentWork, amount: RENT },
  { label: STRINGS.home.ledgerRowService, work: STRINGS.home.ledgerServiceWork, amount: SERVICES },
] as const

const TOTAL = ROWS.reduce((sum, row) => sum + row.amount, 0)

/** Each line lands in turn, so the sum reads as something being written down. */
const ROW_DELAY_MS = 90

/** The three commitments a visitor scans for before reading anything else. */
const CHIPS = [
  { icon: 'fire', label: STRINGS.home.heroChipFire },
  { icon: 'wifi', label: STRINGS.home.heroChipInternet },
  { icon: 'camera', label: STRINGS.home.heroChipSecurity },
] as const satisfies readonly { icon: IconName; label: string }[]

function scrollTo(anchor: string) {
  document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' })
}

export function LedgerHero() {
  const [ref, inView] = useInView<HTMLElement>(0.05)

  return (
    <section className="hero" ref={ref} data-inview={inView}>
      <div className="site-wrap hero-grid">
        <div>
          <span className="hero-eyebrow">{STRINGS.home.heroEyebrow}</span>
          <h1>{STRINGS.home.heroTitle}</h1>
          <p>{STRINGS.home.heroBody}</p>

          <div className="hero-actions">
            <Button variant="accent" onClick={() => scrollTo(ROOMS_ANCHOR)}>
              {STRINGS.home.heroPrimaryAction}
            </Button>
            <Button variant="secondary" onClick={() => scrollTo(CONTACT_FORM_ANCHOR)}>
              {STRINGS.home.heroSecondaryAction}
            </Button>
          </div>

          <ul className="hero-chips">
            {CHIPS.map((chip) => (
              <li className="chip" key={chip.label}>
                <Icon name={chip.icon} />
                {chip.label}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="ledger">
            <div className="ledger-head">
              <span>{STRINGS.home.ledgerCaption}</span>
              <span>{STRINGS.home.ledgerPeriodLabel}</span>
            </div>
            <div className="ledger-rows">
              {ROWS.map((row, index) => (
                <div
                  className="ledger-row"
                  key={row.label}
                  style={{ animationDelay: `${index * ROW_DELAY_MS}ms` }}
                >
                  <span className="ledger-label">{row.label}</span>
                  <span className="ledger-work">{row.work}</span>
                  <span className="ledger-amount">{formatMoney(row.amount)}</span>
                </div>
              ))}
              <div
                className="ledger-row"
                data-total="true"
                style={{ animationDelay: `${ROWS.length * ROW_DELAY_MS}ms` }}
              >
                <span className="ledger-label">{STRINGS.home.ledgerRowTotal}</span>
                <span className="ledger-work" />
                <span className="ledger-amount">{formatMoney(TOTAL)}</span>
              </div>
            </div>
          </div>
          <p className="ledger-note">{STRINGS.home.ledgerNote}</p>
        </div>
      </div>
    </section>
  )
}
