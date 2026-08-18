/**
 * Every user-facing string in the app. Components must never inline text.
 *
 * Grouped by the screen or component that renders them, so a translator (or a
 * future i18n layer) can move a whole group at once.
 */
export const STRINGS = {
  app: {
    title: 'ClaudePractice',
    tagline: 'React + TypeScript on FastAPI',
  },
  health: {
    checking: 'Checking API…',
    online: 'API is up',
    offline: 'API unreachable — is the backend running?',
    versionLabel: 'version',
  },
  items: {
    heading: 'Items',
    empty: 'No items yet. Add the first one.',
    loading: 'Loading items…',
    nameLabel: 'Name',
    namePlaceholder: 'Item name',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Optional description',
    addAction: 'Add item',
    deleteAction: 'Delete',
    retryAction: 'Retry',
  },
  errors: {
    generic: 'Something went wrong. Please try again.',
    network: 'Cannot reach the server.',
    nameRequired: 'Name is required.',
  },
} as const
