import { useState } from 'react'

import {
  AmenitiesSection,
  ContactForm,
  FaqSection,
  LedgerHero,
  ProcessSection,
  PropertyBand,
  RoomShowcase,
  SiteFooter,
  SiteHeader,
} from '../components/organisms'
import { SiteLayout } from '../components/templates'
import type { PublicRoom } from '../types/models'

export function HomePage() {
  /** Lifted so a room's "book this room" can pre-fill the form further down. */
  const [bookingRoom, setBookingRoom] = useState<PublicRoom | null>(null)

  return (
    <SiteLayout header={<SiteHeader />} footer={<SiteFooter />}>
      <LedgerHero />
      <PropertyBand />
      <AmenitiesSection />
      <RoomShowcase onBookRoom={setBookingRoom} />
      <ProcessSection />
      <FaqSection />
      <ContactForm preselectedRoom={bookingRoom} />
    </SiteLayout>
  )
}
