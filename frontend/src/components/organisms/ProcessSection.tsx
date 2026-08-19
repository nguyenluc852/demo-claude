import { PROCESS_ANCHOR, STRINGS } from '../../constants'
import { useInView } from '../../hooks'
import { stagger } from '../../utils/style'

/**
 * The four steps as the system really runs them — step four describes the
 * account and verification email that signing a contract genuinely creates.
 */
const STEPS = [
  { title: STRINGS.home.step1Title, body: STRINGS.home.step1Body },
  { title: STRINGS.home.step2Title, body: STRINGS.home.step2Body },
  { title: STRINGS.home.step3Title, body: STRINGS.home.step3Body },
  { title: STRINGS.home.step4Title, body: STRINGS.home.step4Body },
] as const

export function ProcessSection() {
  const [ref, inView] = useInView<HTMLElement>()

  return (
    <section className="site-section" id={PROCESS_ANCHOR} ref={ref} data-inview={inView}>
      <div className="site-wrap">
        <h2 className="reveal">{STRINGS.home.processHeading}</h2>
        <p className="reveal">{STRINGS.home.processBody}</p>

        <ol className="process-steps">
          {STEPS.map((step, index) => (
            <li className="process-step reveal" key={step.title} style={stagger(index)}>
              <span className="process-number num">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
