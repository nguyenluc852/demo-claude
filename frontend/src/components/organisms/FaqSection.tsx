import { FAQ_ANCHOR, STRINGS } from '../../constants'
import { useInView } from '../../hooks'
import { FaqItem } from '../molecules'

const QUESTIONS = [
  { q: STRINGS.home.faq1Q, a: STRINGS.home.faq1A },
  { q: STRINGS.home.faq2Q, a: STRINGS.home.faq2A },
  { q: STRINGS.home.faq3Q, a: STRINGS.home.faq3A },
  { q: STRINGS.home.faq4Q, a: STRINGS.home.faq4A },
  { q: STRINGS.home.faq5Q, a: STRINGS.home.faq5A },
  { q: STRINGS.home.faq6Q, a: STRINGS.home.faq6A },
] as const

export function FaqSection() {
  const [ref, inView] = useInView<HTMLElement>()

  return (
    <section
      className="site-section faq-section"
      id={FAQ_ANCHOR}
      ref={ref}
      data-inview={inView}
    >
      <div className="site-wrap">
        <h2 className="reveal">{STRINGS.home.faqHeading}</h2>
        <p className="reveal">{STRINGS.home.faqBody}</p>

        <div className="faq-list">
          {QUESTIONS.map((item, index) => (
            <FaqItem key={item.q} question={item.q} answer={item.a} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
