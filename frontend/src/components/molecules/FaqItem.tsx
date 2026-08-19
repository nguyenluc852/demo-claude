import { stagger } from '../../utils/style'
import { Icon } from '../atoms'

interface FaqItemProps {
  question: string
  answer: string
  index?: number
}

/** Native `<details>`: open/close needs no state, and works without JavaScript. */
export function FaqItem({ question, answer, index = 0 }: FaqItemProps) {
  return (
    <details className="faq-item reveal" style={stagger(index)}>
      <summary>
        <span>{question}</span>
        <Icon name="chevron" />
      </summary>
      <div className="faq-answer">
        <p>{answer}</p>
      </div>
    </details>
  )
}
