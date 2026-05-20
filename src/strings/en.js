// 1729 — English UI strings (primary language)
// All new strings go here first, then sync to tr.js

const en = {
  // ─── Dynamic word (gift / thing) ───
  giftWord: 'gift',

  // ─── Auth ───
  auth: {
    signup: 'Sign up',
    login: 'Log in',
    email: 'Email',
    password: 'Password',
    processing: 'Processing',
    error: 'Something went wrong. Want to try again?',
  },

  // ─── Onboarding ───
  onboarding: {
    screen1: {
      headline: 'No name here. No title. No history. Just you.',
      cta: 'Ready',
    },
    screen2: {
      atmospheric: 'Nobody is watching.',
      question: 'If you had nothing to prove and nothing you had to do — what would you most enjoy spending your time on?',
      cta: 'Continue',
    },
    screen3: {
      atmospheric: 'This is not a talent test.',
      question: 'What do you "cheat" at? What feels like play to you, but work to everyone else?',
      cta: 'Continue',
    },
    screen4: {
      atmospheric: 'Receiving takes courage too.',
      question: 'What drains your energy? Where do you need someone else\'s gift?',
      cta: 'Continue',
    },
    screen5: {
      text: 'The last question is a little different.\nYour answer will become a card.\nSomeone will be able to see it. Request it.\nYou can choose to give — or not.\nBut for now, just write honestly.',
      cta: 'Continue',
    },
    screen6: {
      question: 'What is your effortless gift?',
      optionalLabel: 'Optional',
      optionalPlaceholder: 'Why you, and not someone else?',
      cta: 'Create my gift',
    },
    screen7: {
      ready: 'Your gift is ready.',
      cta: 'Continue',
    },
    saving: 'Saving',
    textareaPlaceholder: 'Write here.',
  },

  // ─── Nav ───
  nav: {
    dashboard: 'Home',
    questions: 'Questions',
    trustTeam: 'Circle',
    explore: 'Explore',
    give: 'Give',
    signOut: 'Sign out',
  },

  // ─── Dashboard ───
  dashboard: {
    activeCards: 'Active gifts',
    supportGiven: 'Gifts given',
    supportReceived: 'Gifts received',
    trustTeamSize: 'Circle size',
    recentActivity: 'Recent activity',
    noActivity: 'Nothing here yet.',
    gave: 'You gave a gift.',
    received: 'You received a gift.',
    quickActions: {
      createCard: 'New gift',
      createCardDesc: 'Create a new gift card.',
      explore: 'Explore',
      exploreDesc: 'Browse gifts from your circle and beyond.',
      editQuestions: 'Edit questions',
      editQuestionsDesc: 'Update your answers.',
      trustTeam: 'Circle',
      trustTeamDesc: 'Grow your network.',
    },
  },

  // ─── Give (Ver) ───
  give: {
    title: 'Give',
    subtitle: 'Manage your gift cards.',
    tabMy: 'My gifts',
    tabHistory: 'Given',
    cardActive: 'Active',
    cardInactive: 'Paused',
    newCard: 'New gift',
    newCardTitle: 'New gift',
    titleLabel: 'Title',
    descLabel: 'Description',
    create: 'Create',
    cancel: 'Cancel',
    creating: 'Creating',
    empty: 'No gifts yet.',
    historyEmpty: 'You haven\'t given any gifts yet.',
    error: 'Something went wrong. Want to try again?',
  },

  // ─── Explore (Al) ───
  explore: {
    title: 'Explore',
    subtitle: 'Browse gifts from your circle and beyond.',
    tabFeed: 'Gifts',
    tabHistory: 'Received',
    filterTrustTeam: 'Circle',
    filterTurkey: 'Turkey',
    filterGlobal: 'Global',
    requestSupport: 'Request',
    requesting: 'Sending',
    empty: 'Nothing here yet.',
    historyEmpty: 'You haven\'t received any gifts yet.',
    error: 'Something went wrong. Want to try again?',
  },

  // ─── Questions (SoruCevap) ───
  questions: {
    title: 'Questions',
    subtitle: 'View and edit your answers.',
    save: 'Save',
    saving: 'Saving',
    saved: 'Saved.',
    createCardLabel: 'Create a gift card from this answer.',
    error: 'Something went wrong. Want to try again?',
  },

  // ─── Circle (GuvenTakimi) ───
  trustTeam: {
    title: 'Circle',
    subtitle: 'Grow and manage your network.',
    invite: 'Invite',
    empty: 'Your circle is empty.',
    emptyHint: 'Invite someone to get started.',
    modal: {
      title: 'Create invite',
      emailLabel: 'Email',
      typeLabel: 'Invite type',
      typeDiscount: '50% discount',
      typePrepaid: 'Gift access (free for them)',
      generate: 'Generate code',
      close: 'Close',
      codeReady: 'Code ready.',
    },
    relations: {
      invited: 'Invited you.',
      joinedViaYou: 'Joined via your invite.',
      exchange: 'You exchanged gifts.',
    },
  },

  // ─── Payment ───
  payment: {
    title: 'Membership',
    subtitle: 'An invite code is required to join.',
    promoLabel: 'Invite code',
    promoPlaceholder: 'XXXXXX',
    apply: 'Apply',
    invalidCode: 'Invalid code.',
    invitedBy: (hex) => `${hex} invited you.`,
    discountApplied: '50% discount applied.',
    complete: (price) => price > 0 ? `Continue ($${price})` : 'Continue (free)',
    processing: 'Processing',
    testMode: 'Test mode — no real payment.',
    error: 'Something went wrong. Want to try again?',
  },

  // ─── Language selector ───
  language: {
    label: 'Language',
    en: 'English',
    tr: 'Türkçe',
  },

  // ─── Errors ───
  errors: {
    generic: 'Something went wrong. Want to try again?',
    dbError: 'Connection failed.',
  },
}

export default en
