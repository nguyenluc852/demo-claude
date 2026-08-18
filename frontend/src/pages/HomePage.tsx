import { useState } from 'react'

import {
  AmenitiesSection,
  ContactForm,
  LedgerHero,
  RoomShowcase,
  SiteHeader,
} from '../components/organisms'
import { SiteLayout } from '../components/templates'
import { STRINGS } from '../constants'
import type { PublicRoom } from '../types/models'

export function HomePage() {
  /** Lifted so a room's "book this room" can pre-fill the form further down. */
  const [bookingRoom, setBookingRoom] = useState<PublicRoom | null>(null)

  return (
    <SiteLayout
      header={<SiteHeader />}
      footer={
        <footer className="site-footer">
          <div className="site-wrap">
            {STRINGS.app.title} — {STRINGS.home.footerNote}
          </div>
        </footer>
      }
    >
      <LedgerHero />
      <AmenitiesSection />
      <RoomShowcase onBookRoom={setBookingRoom} />
      <ContactForm preselectedRoom={bookingRoom} />
    </SiteLayout>
  )
}
