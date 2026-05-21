// 1729 — English UI strings (primary language)
// All new strings go here first, then sync to tr.js

const en = {
  // ─── Dynamic word ───
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
      trustTeamDesc: 'Manage your circle and invitations.',
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
    whyMeLabel: 'Why you?',
    whyMePlaceholder: 'Why you, and not someone else?',
    optional: 'optional',
    visibilityLabel: 'Visibility',
    visCircle: 'Circle',
    visCommunity: 'Community',
    visGlobal: 'Global',
  },

  // ─── Explore (Al) ───
  explore: {
    title: 'Explore',
    subtitle: 'Browse gifts from your circle and beyond.',
    tabFeed: 'Gifts',
    tabHistory: 'Received',
    filterTrustTeam: 'Circle',
    filterCommunity: 'Community',
    filterGlobal: 'Global',
    requestSupport: 'Request',
    requesting: 'Sending',
    empty: 'Nothing here yet.',
    historyEmpty: 'You haven\'t received any gifts yet.',
    error: 'Something went wrong. Want to try again?',
    markReceived: 'Mark as received',
    addToCircle: 'Add to your circle?',
    addToCircleHint: 'You received a gift from this person. Would you like to add them to your trust circle?',
    addToCircleYes: 'Add',
    addToCircleSkip: 'Skip',
    added: 'Added.',
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
    subtitle: 'Your trust circle and the people you\'ve invited.',
    tabCircle: 'Trust Circle',
    tabInvited: 'Invited',
    invite: 'Invite',
    emptyCircle: 'Your trust circle is empty.',
    emptyCircleHint: 'After receiving a gift, mark it as received to add that person here.',
    emptyInvited: 'You haven\'t invited anyone yet.',
    subscriptionActive: 'Active',
    subscriptionEnded: 'Ended',
    subscriptionPending: 'Pending',
    daysLeft: (n) => `${n}d left`,
    endSubscription: 'End',
    gaveGift: 'gave you a gift',
    modal: {
      title: 'Invite someone',
      step1: 'Their email',
      step2: 'Duration',
      step3: 'Community',
      step4: 'Code',
      emailLabel: 'Email address',
      emailPlaceholder: 'name@example.com',
      duration1: '1 month',
      duration6: '6 months',
      duration12: '12 months',
      communityNew: 'New community',
      communityGeneral: 'General (no community)',
      communityExisting: 'Existing community',
      communityNameLabel: 'Community name',
      membersAwareLabel: 'Members will know they\'re in a named group',
      next: 'Next',
      back: 'Back',
      generate: 'Generate code',
      codeReady: 'Share this code',
      codeHint: 'They\'ll need this to join.',
      copy: 'Copy',
      copied: 'Copied!',
      close: 'Done',
    },
  },

  // ─── Payment ───
  payment: {
    title: 'Join 1729',
    subtitle: 'You need an invite code to continue.',
    codeLabel: 'Invite code',
    codePlaceholder: 'XXXXXX',
    apply: 'Apply',
    invalidCode: 'Invalid or already used code.',
    codeAccepted: 'Code accepted.',
    requireCode: 'An invite code is required.',
    continue: 'Continue',
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
