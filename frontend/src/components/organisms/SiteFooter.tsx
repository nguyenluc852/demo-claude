import {
  AMENITIES_ANCHOR,
  CONTACT_FORM_ANCHOR,
  FAQ_ANCHOR,
  PROCESS_ANCHOR,
  ROOMS_ANCHOR,
  STRINGS,
} from '../../constants'
import { Icon } from '../atoms'

const LINKS = [
  { anchor: ROOMS_ANCHOR, label: STRINGS.home.roomsHeading },
  { anchor: AMENITIES_ANCHOR, label: STRINGS.home.amenitiesHeading },
  { anchor: PROCESS_ANCHOR, label: STRINGS.home.processHeading },
  { anchor: FAQ_ANCHOR, label: STRINGS.home.faqHeading },
  { anchor: CONTACT_FORM_ANCHOR, label: STRINGS.home.contactHeading },
] as const

const CONTACTS = [
  { icon: 'pin', text: STRINGS.home.contactAddress, href: null },
  { icon: 'phone', text: STRINGS.home.contactPhone, href: `tel:${STRINGS.home.contactPhone}` },
  { icon: 'clock', text: STRINGS.home.contactHours, href: null },
] as const

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-wrap site-footer-grid">
        <div>
          <h3>{STRINGS.home.footerAboutHeading}</h3>
          <p>{STRINGS.home.footerAbout}</p>
        </div>

        <div>
          <h3>{STRINGS.home.footerLinksHeading}</h3>
          <ul>
            {LINKS.map((link) => (
              <li key={link.anchor}>
                <a href={`#${link.anchor}`}>{link.label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3>{STRINGS.home.footerContactHeading}</h3>
          <ul>
            {CONTACTS.map((contact) => (
              <li key={contact.text}>
                <Icon name={contact.icon} />
                {contact.href ? <a href={contact.href}>{contact.text}</a> : <span>{contact.text}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="site-wrap site-footer-legal">
        {STRINGS.app.title} — {STRINGS.home.footerNote} {STRINGS.home.footerRights}
      </div>
    </footer>
  )
}
