import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { CONTACT_FORM_ANCHOR, SLICE, STRINGS } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { clearLeadMessage, submitLead } from '../../store/slices/publicSlice'
import type { PublicRoom } from '../../types/models'
import { Button, Icon } from '../atoms'
import { FormField, Notice, TextareaField } from '../molecules'

interface ContactFormProps {
  /** Set when the visitor arrived here from a room's "book this room" button. */
  preselectedRoom: PublicRoom | null
}

const EMPTY = { name: '', phone: '', email: '', message: '' }

export function ContactForm({ preselectedRoom }: ContactFormProps) {
  const dispatch = useAppDispatch()
  const { submitting, leadMessage, error } = useAppSelector((state) => state[SLICE.publicSite])
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (preselectedRoom) {
      setForm((current) => ({
        ...current,
        message: `${STRINGS.room.bookThisRoom}: ${preselectedRoom.room_number}`,
      }))
    }
  }, [preselectedRoom])

  function update(field: keyof typeof EMPTY, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    if (leadMessage) {
      dispatch(clearLeadMessage())
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const result = await dispatch(
      submitLead({
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        message: form.message || null,
        room_id: preselectedRoom?.id ?? null,
      }),
    )
    if (submitLead.fulfilled.match(result)) {
      setForm(EMPTY)
    }
  }

  return (
    <section className="site-section contact-section" id={CONTACT_FORM_ANCHOR}>
      <div className="site-wrap">
        <h2>{STRINGS.home.contactHeading}</h2>
        <p>{STRINGS.home.contactBody}</p>

        <div className="contact-layout">
          <form className="card stack" onSubmit={onSubmit}>
            <FormField
              label={STRINGS.lead.nameLabel}
              name="lead-name"
              value={form.name}
              placeholder={STRINGS.lead.namePlaceholder}
              required
              disabled={submitting}
              onChange={(event) => update('name', event.target.value)}
            />
            <FormField
              label={STRINGS.lead.phoneLabel}
              name="lead-phone"
              value={form.phone}
              placeholder={STRINGS.lead.phonePlaceholder}
              required
              disabled={submitting}
              onChange={(event) => update('phone', event.target.value)}
            />
            <FormField
              label={STRINGS.lead.emailLabel}
              name="lead-email"
              type="email"
              value={form.email}
              placeholder={STRINGS.lead.emailPlaceholder}
              disabled={submitting}
              onChange={(event) => update('email', event.target.value)}
            />
            <TextareaField
              label={STRINGS.lead.messageLabel}
              name="lead-message"
              value={form.message}
              placeholder={STRINGS.lead.messagePlaceholder}
              disabled={submitting}
              onChange={(event) => update('message', event.target.value)}
            />

            {error ? <Notice message={error} tone="danger" /> : null}
            {leadMessage ? <Notice message={leadMessage} tone="success" /> : null}

            <Button
              type="submit"
              variant="accent"
              loading={submitting}
              loadingLabel={STRINGS.common.submitting}
            >
              {STRINGS.lead.submitAction}
            </Button>
          </form>

          <aside className="contact-info">
            <dl>
              <div>
                <dt>
                  <Icon name="pin" />
                  {STRINGS.home.contactAddressLabel}
                </dt>
                <dd>{STRINGS.home.contactAddress}</dd>
              </div>
              <div>
                <dt>
                  <Icon name="phone" />
                  {STRINGS.home.contactPhoneLabel}
                </dt>
                <dd>
                  <a className="num" href={`tel:${STRINGS.home.contactPhone}`}>
                    {STRINGS.home.contactPhone}
                  </a>
                </dd>
              </div>
              <div>
                <dt>
                  <Icon name="clock" />
                  {STRINGS.home.contactHoursLabel}
                </dt>
                <dd className="num">{STRINGS.home.contactHours}</dd>
              </div>
            </dl>
            <p className="contact-promise">
              <Icon name="check" />
              {STRINGS.home.contactPromise}
            </p>
          </aside>
        </div>
      </div>
    </section>
  )
}
