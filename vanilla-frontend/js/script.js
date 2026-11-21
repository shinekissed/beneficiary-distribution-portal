
'use strict';

// Hybrid Benefit Distribution Information System
// All information below is fictional demonstration data.

const ASSET = 'assets/illustrations/';

const pages = [
  'home', 'schedules', 'lookup', 'requirements',
  'process', 'service', 'waiting', 'announcements',
  'assistance'
];

const labels = [
  'Home', 'Schedules', 'Individual Lookup', 'Requirements',
  'Process Guide', 'Service Area', 'Waiting Time',
  'Announcements', 'Assistance'
];

const schedules = [
  {
    barangay: 'Barangay Maligaya',
    date: 'May 15, 2025',
    day: 'Thursday',
    time: '8:00 AM – 12:00 PM',
    venue: 'Maligaya Covered Court',
    group: 'Surnames A–L'
  },
  {
    barangay: 'Barangay Pag-asa',
    date: 'May 16, 2025',
    day: 'Friday',
    time: '1:00 PM – 5:00 PM',
    venue: 'Pag-asa Multipurpose Hall',
    group: 'All listed beneficiaries'
  },
  {
    barangay: 'Barangay San Isidro',
    date: 'May 19, 2025',
    day: 'Monday',
    time: '8:00 AM – 3:00 PM',
    venue: 'San Isidro Civic Center',
    group: 'Surnames M–Z'
  },
  {
    barangay: 'Barangay Mabini',
    date: 'May 21, 2025',
    day: 'Wednesday',
    time: '9:00 AM – 2:00 PM',
    venue: 'Mabini Elementary School Gym',
    group: 'All listed beneficiaries'
  }
];

const announcements = [
  {
    type: 'Schedule update',
    date: 'May 8, 2025',
    title: 'Barangay Mabini venue confirmed',
    text: 'The sample distribution venue is the Mabini Elementary School Gym. Please use the east gate entrance.'
  },
  {
    type: 'Reminder',
    date: 'May 6, 2025',
    title: 'Bring original documents',
    text: 'Prepare your original valid ID and reference slip. Photocopies may be requested at the validation desk.'
  },
  {
    type: 'Advisory',
    date: 'May 2, 2025',
    title: 'No fee is required',
    text: 'This fictional program does not collect processing fees. Report anyone asking for payment to the help desk.'
  }
];

const requirements = [
  [
    'Original valid ID',
    'Bring one government-issued or accepted local identification card.'
  ],
  [
    'Reference slip or code',
    'Keep your printed slip or written reference code easy to access.'
  ],
  [
    'Photocopy of ID',
    'Prepare one clear photocopy in case it is requested at validation.'
  ],
  [
    'Authorization documents',
    'If an authorized representative is allowed, bring the required letter and IDs.'
  ]
];

const steps = [
  [
    'Check your schedule',
    'Confirm the date, time, venue, and assigned group before leaving home.',
    'process-schedule.webp',
    'Senior beneficiary checking a distribution schedule'
  ],
  [
    'Proceed to reception',
    'Show your reference slip at the entrance and ask for accessibility support if needed.',
    'process-venue.webp',
    'Senior beneficiary arriving at reception'
  ],
  [
    'Present documents',
    'Bring your original documents to the validation counter for manual review.',
    'process-documents.webp',
    'Beneficiary presenting documents to staff'
  ],
  [
    'Follow staff instructions',
    'Wait in the designated seating area and listen for your name or counter call.',
    'process-guidance.webp',
    'Staff member giving directions'
  ],
  [
    'Complete the process',
    'Review any receipt or acknowledgment before leaving the service area.',
    'process-complete.webp',
    'Beneficiary reviewing an acknowledgment'
  ]
];

const main = document.getElementById('main-content');
const menu = document.getElementById('mobile-nav');
const menuToggle = document.getElementById('menu-toggle');
const moreToggle = document.getElementById('more-toggle');
const moreMenu = document.querySelector('.more-menu');

const img = (file, alt, cls = 'feature-image') =>
  `<img src="${ASSET}${file}" alt="${alt}" class="${cls}" loading="lazy">`;

const link = (page, text, cls = '') =>
  `<a href="#/${page}" class="${cls}">${text}</a>`;

const intro = (eyebrow, title, description) => `
  <div class="page-intro">
    <p class="eyebrow">${eyebrow}</p>
    <h1>${title}</h1>
    <p>${description}</p>
  </div>
`;

const notice = text =>
  `<div class="notice" role="note">${text}</div>`;

const checklist = items => `
  <ul class="simple-list">
    ${items.map(x => `<li>${x}</li>`).join('')}
  </ul>
`;

const announcement = a => `
  <article class="announcement-item card">
    <p class="announcement-meta">${a.type} · ${a.date}</p>
    <h2>${a.title}</h2>
    <p class="muted">${a.text}</p>
  </article>
`;

// HOME PAGE

function homePage() {
  const descriptions = [
    'Find sample dates and venues by barangay.',
    'Check a fictional beneficiary record.',
    'Review what to bring on the day.',
    'Follow the distribution steps.',
    'Navigate counters and queue areas.',
    'See available wait estimates.'
  ];

  const icons = ['▦', '⌕', '▤', '➜', '⌖', '◷'];

  return `
    <section class="hero">
      <div class="hero-content">
        <div>
          <span class="hero-badge">
            ✓ Public information prototype
          </span>

          <h1>
            Benefit information, made easier to understand.
          </h1>

          <p>
            Find your sample schedule, prepare the right
            documents, and learn what to expect at the
            distribution site.
          </p>

          <div class="hero-actions">
            ${link('schedules', 'Check schedules →', 'btn btn-light')}
            ${link('lookup', 'Individual lookup', 'btn btn-outline')}
          </div>
        </div>

        ${img(
          'hero-welcome.webp',
          'Senior beneficiary using an information tablet with help from a staff member',
          'hero-image'
        )}
      </div>
    </section>

    <section class="quick-section">
      <div class="section-heading">
        <p class="eyebrow">Quick access</p>
        <h2>How can we help?</h2>
      </div>

      <div class="grid grid-3">
        ${pages.slice(1, 7).map((p, i) =>
          link(
            p,
            `<span class="quick-icon" aria-hidden="true">${icons[i]}</span>
             <span>
               <strong>${labels[i + 1]}</strong>
               <p>${descriptions[i]}</p>
             </span>`,
            'quick-card'
          )
        ).join('')}
      </div>
    </section>

    <section class="home-bottom">
      <div class="card announcement-preview">
        <div class="section-heading">
          <p class="eyebrow">Latest notices</p>
          <h2>Announcements</h2>
          ${link('announcements', 'View all →', 'text-link')}
        </div>

        ${announcements.slice(0, 2).map(a => `
          <article>
            <p class="announcement-meta">${a.type} · ${a.date}</p>
            <h3>${a.title}</h3>
            <p>${a.text}</p>
          </article>
        `).join('')}
      </div>

      <aside class="help-card">
        <span class="quick-icon" aria-hidden="true">?</span>
        <h2>Need assistance?</h2>
        <p>
          Our sample help desk guide explains who to approach
          and what information to prepare.
        </p>
        ${link('assistance', 'Get help →', 'text-link')}
      </aside>
    </section>
  `;
}

// SCHEDULES PAGE

function scheduleCard(s) {
  return `
    <article class="card schedule-card">
      <span class="pill">SCHEDULED</span>

      <h2 style="margin-top:14px">${s.barangay}</h2>

      <dl>
        <div>
          <dt>Date</dt>
          <dd>
            ${s.date}
            <span class="muted">(${s.day})</span>
          </dd>
        </div>

        <div>
          <dt>Time</dt>
          <dd>${s.time}</dd>
        </div>

        <div>
          <dt>Venue</dt>
          <dd>${s.venue}</dd>
        </div>

        <div>
          <dt>Group</dt>
          <dd>${s.group}</dd>
        </div>
      </dl>
    </article>
  `;
}

function schedulesPage() {
  return `
    ${intro(
      'Distribution calendar',
      'Search schedules by barangay',
      'Enter a barangay name to view fictional distribution dates, times, and venues for this prototype.'
    )}

    <section class="search-panel">
      <div class="search-panel-content">
        <label for="barangay" class="field-label">
          Barangay name
        </label>

        <div class="search-controls">
          <input
            id="barangay"
            class="field"
            placeholder="Try Maligaya or Mabini"
            autocomplete="off"
          >

          <button
            id="clear-search"
            type="button"
            class="btn btn-secondary"
            hidden
          >
            Clear search
          </button>
        </div>

        <p
          id="schedule-count"
          class="muted"
          aria-live="polite"
          style="margin:12px 0 0"
        ></p>
      </div>

      ${img(
        'schedule-search.webp',
        'Calendar and location pin for searching schedules'
      )}
    </section>

    <div
      id="schedule-results"
      class="grid grid-2"
      style="margin-top:24px"
    ></div>

    ${notice(
      'Schedules shown here are fictional and for demonstration only. Always confirm official information with your local office.'
    )}
  `;
}

function bindSchedules() {
  const input = document.getElementById('barangay');
  const clear = document.getElementById('clear-search');
  const results = document.getElementById('schedule-results');
  const count = document.getElementById('schedule-count');

  function update() {
    const term = input.value.trim().toLowerCase();

    const matches = schedules.filter(s =>
      s.barangay.toLowerCase().includes(term)
    );

    count.textContent =
      `Showing ${matches.length} of ${schedules.length} sample schedules`;

    clear.hidden = !input.value;

    results.innerHTML = matches.length
      ? matches.map(scheduleCard).join('')
      : `
        <div class="empty-state" style="grid-column:1/-1">
          <h2>No sample schedule found</h2>
          <p>Check the spelling or try another barangay name.</p>
        </div>
      `;
  }

  input.addEventListener('input', update);

  clear.addEventListener('click', () => {
    input.value = '';
    update();
    input.focus();
  });

  update();
}

// INDIVIDUAL LOOKUP PAGE

function lookupPage() {
  return `
    ${intro(
      'Beneficiary information',
      'Individual lookup',
      'Use the fictional sample credentials below to see how a beneficiary record may appear.'
    )}

    <div class="grid lookup-grid">
      <form id="lookup-form" class="card form-card" novalidate>
        <h2>Enter your information</h2>

        <p class="muted">
          Sample: <strong>Maria Santos</strong>
          and <strong>HBD-2025-0142</strong>
        </p>

        <div class="form-group">
          <label for="full-name" class="field-label">
            Full name *
          </label>

          <input
            id="full-name"
            class="field"
            placeholder="e.g., Maria Santos"
            autocomplete="name"
            aria-describedby="name-error"
          >

          <p id="name-error" class="form-error" hidden>
            Please enter your full name.
          </p>
        </div>

        <div class="form-group">
          <label for="reference" class="field-label">
            Reference code *
          </label>

          <input
            id="reference"
            class="field"
            placeholder="e.g., HBD-2025-0142"
            style="text-transform:uppercase"
            aria-describedby="code-error"
          >

          <p id="code-error" class="form-error" hidden>
            Please enter your reference code.
          </p>
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          style="width:100%;margin-top:24px"
        >
          Search sample record
        </button>

        <p class="muted" style="font-size:12px;margin-top:16px">
          Do not enter real personal information.
          This is a college prototype.
        </p>
      </form>

      <div id="lookup-result" aria-live="polite"></div>
    </div>
  `;
}

const lookupPlaceholder = `
  <div class="result-placeholder">
    <div>
      <span class="quick-icon" style="margin:0 auto">▣</span>
      <h2 style="margin-top:18px">
        Your sample result will appear here
      </h2>
      <p class="muted">
        Enter both fields, then select “Search sample record.”
      </p>
    </div>
  </div>
`;

function bindLookup() {
  const form = document.getElementById('lookup-form');
  const result = document.getElementById('lookup-result');
  const name = document.getElementById('full-name');
  const code = document.getElementById('reference');

  result.innerHTML = lookupPlaceholder;

  form.addEventListener('submit', e => {
    e.preventDefault();

    const n = name.value.trim();
    const c = code.value.trim();

    document.getElementById('name-error').hidden = !!n;
    document.getElementById('code-error').hidden = !!c;

    name.setAttribute('aria-invalid', String(!n));
    code.setAttribute('aria-invalid', String(!c));

    if (!n || !c) {
      result.innerHTML = lookupPlaceholder;
      (!n ? name : code).focus();
      return;
    }

    if (
      n.toLowerCase() === 'maria santos' &&
      c.toUpperCase() === 'HBD-2025-0142'
    ) {
      result.innerHTML = `
        <div class="card result-card">
          <p class="eyebrow">✓ Sample record found</p>
          <h2>Maria Santos</h2>

          <dl>
            <div>
              <dt>Reference code</dt>
              <dd>HBD-2025-0142</dd>
            </div>

            <div>
              <dt>Barangay</dt>
              <dd>Barangay Maligaya</dd>
            </div>

            <div>
              <dt>Sample schedule</dt>
              <dd>May 15, 2025 · 8:00 AM</dd>
            </div>

            <div>
              <dt>Status</dt>
              <dd>
                <span class="pill">FOR INFORMATION ONLY</span>
              </dd>
            </div>
          </dl>
        </div>
      `;
    } else {
      result.innerHTML = `
        <div
          class="card"
          style="background:#F7F4FB;border-color:#D8CCE9"
        >
          <h2>No matching sample record</h2>
          <p>
            Check the name and reference code.
            For this demo, use <strong>Maria Santos</strong>
            and <strong>HBD-2025-0142</strong>.
          </p>
        </div>
      `;
    }
  });
}

// REQUIREMENTS PAGE

function requirementsPage() {
  return `
    ${intro(
      'Before you visit',
      'Document checklist',
      'Prepare these sample requirements ahead of time for a smoother visit to the distribution site.'
    )}

    <div class="grid requirements-layout">
      <figure class="figure-reset">
        ${img(
          'requirements-checklist.webp',
          'Senior beneficiary organizing identification and documents'
        )}
      </figure>

      <div class="grid grid-2">
        ${requirements.map(([title, text], i) => `
          <article class="card requirement-item">
            <span class="number-icon">${i + 1}</span>
            <div>
              <h2 style="font-size:16px">${title}</h2>
              <p class="muted">${text}</p>
            </div>
          </article>
        `).join('')}
      </div>
    </div>

    <div class="reminders-layout" style="margin-top:28px">
      <div class="purple-panel">
        <h2>Important reminders</h2>

        ${checklist([
          'Bring original documents; do not leave them with unauthorized persons.',
          'Arrive only within your stated schedule to avoid crowding.',
          'Bring water and any personal medication you may need.',
          'There is no fee for checking information in this prototype.'
        ])}
      </div>

      ${img(
        'requirements-documents.webp',
        'Identification card, documents, checklist, and pen'
      )}
    </div>

    ${notice(
      'Requirements may vary in a real program. This checklist is fictional and does not verify or determine eligibility.'
    )}
  `;
}

// PROCESS GUIDE PAGE

function processPage() {
  return `
    ${intro(
      'What to expect',
      'Distribution process guide',
      'Follow these simple steps during your scheduled visit. On-site staff remain responsible for all official decisions.'
    )}

    <div>
      ${steps.map(([title, text, file, alt], i) => `
        <article class="process-step">
          <div class="process-image">
            ${img(file, alt)}
          </div>

          <div class="process-description">
            <p class="eyebrow">Step ${i + 1}</p>
            <h2>${title}</h2>
            <p class="muted">${text}</p>
          </div>
        </article>
      `).join('')}
    </div>

    ${notice(
      'This guide does not assign a queue number, verify documents, or approve benefits. Follow authorized personnel at the site.'
    )}
  `;
}

// SERVICE AREA PAGE

function servicePage() {
  const counters = [
    [
      '01',
      'Reception',
      'Schedule check and general directions'
    ],
    [
      '02',
      'Document Review',
      'Manual checking by authorized staff'
    ],
    [
      '03',
      'Assistance Desk',
      'Senior citizen, PWD, and general help'
    ],
    [
      '04',
      'Release Area',
      'Final on-site processing and exit'
    ]
  ];

  return `
    ${intro(
      'On-site guidance',
      'Service area and counters',
      'Use this sample layout to understand where to go and how to move through the venue.'
    )}

    ${img(
      'service-area.webp',
      'Organized barangay service area with reception, seating, and directional guidance',
      'service-banner'
    )}

    <div class="grid service-layout" style="margin-top:24px">
      <section class="card">
        <h2>Sample service counters</h2>

        <div class="grid grid-2">
          ${counters.map(([n, title, text]) => `
            <article class="counter-card">
              <span class="counter-number">${n}</span>
              <h3>${title}</h3>
              <p class="muted">${text}</p>
            </article>
          `).join('')}
        </div>
      </section>

      <aside class="tips-panel">
        <h2>Queue instructions</h2>

        ${checklist([
          'Enter through the marked reception entrance.',
          'Have your documents ready, but keep them secure.',
          'Use priority seating if directed by staff.',
          'Approach a counter only when called.'
        ])}
      </aside>
    </div>

    <div class="card" style="margin-top:24px">
      <h2>Accessibility and safety</h2>
      <p class="muted">
        Senior citizens, persons with disabilities, pregnant
        visitors, and those needing assistance may approach
        the help desk. Priority support is handled by on-site
        staff; this website does not assign queue positions.
      </p>
    </div>
  `;
}

// WAITING TIME PAGE

function waitingPage() {
  return `
    ${intro(
      'Planning your visit',
      'Estimated waiting time',
      'Wait estimates may be shown only when enough reliable historical information is available.'
    )}

    <section class="card waiting-panel">
      <span class="quick-icon" style="margin:0 auto">◷</span>

      <p class="eyebrow" style="margin-top:24px">
        Current estimate
      </p>

      <h2>Estimate unavailable</h2>

      <p class="muted">
        There is not enough historical sample data to provide
        a responsible estimate. Actual waiting times can change
        based on attendance and manual processing.
      </p>

      <div class="tips-panel" style="margin-top:30px;text-align:left">
        <h3>Helpful planning tips</h3>

        ${checklist([
          'Arrive within your assigned time window, not hours early.',
          'Prepare documents before entering the reception line.',
          'Allow extra time for travel and accessibility needs.'
        ])}
      </div>
    </section>

    <p
      class="muted"
      style="text-align:center;margin:24px auto;max-width:680px"
    >
      This prototype does not provide live monitoring,
      queue assignment, or real-time crowd counts.
    </p>
  `;
}

// ANNOUNCEMENTS PAGE

function announcementsPage() {
  return `
    ${intro(
      'Public notices',
      'Announcements and reminders',
      'Review recent fictional updates before visiting a distribution site.'
    )}

    ${announcements.map(announcement).join('')}

    ${notice(
      'All names, dates, locations, and announcements on this website are fictional sample data for a BSIT-3 project.'
    )}
  `;
}

// ASSISTANCE PAGE

function assistancePage() {
  return `
    ${intro(
      'We are here to guide you',
      'Assistance and contact guidance',
      'Know where to ask for help and what information to prepare before speaking with a help desk representative.'
    )}

    <div class="assistance-banner">
      ${img(
        'assistance-desk.webp',
        'Staff member assisting a senior beneficiary'
      )}

      <div class="assistance-banner-content">
        <div>
          <span class="quick-icon">?</span>

          <h2 style="margin-top:20px">
            On-site help is available
          </h2>

          <p class="muted">
            Approach the assistance desk for clear directions
            and accessibility support during your visit.
          </p>
        </div>
      </div>
    </div>

    <div class="grid grid-3" style="margin-top:24px">
      <article class="card">
        <h2>Sample hotline</h2>
        <p class="contact-highlight">(02) 8000-1234</p>
        <p class="muted">
          Monday–Friday, 8:00 AM–5:00 PM
        </p>
      </article>

      <article class="card">
        <h2>Sample email</h2>
        <p
          class="contact-highlight"
          style="font-size:18px;overflow-wrap:anywhere"
        >
          help@hbd-demo.example
        </p>
        <p class="muted">
          Replies within two sample working days
        </p>
      </article>

      <article class="card">
        <h2>On-site help desk</h2>
        <p class="muted">
          Located near the reception entrance at each sample
          venue. Look for the blue Assistance Desk sign.
        </p>
      </article>
    </div>

    <div class="grid grid-2" style="margin-top:24px">
      <div class="purple-panel">
        <h2>Prepare before contacting us</h2>

        ${checklist([
          'Your fictional reference code',
          'Your listed barangay',
          'The date and venue you are asking about',
          'A short, clear description of your concern'
        ])}
      </div>

      <div class="tips-panel">
        <h2>Protect your information</h2>
        <p>
          Do not share passwords, PINs, or banking details.
          Authorized help desk staff should never ask for
          payment to check a schedule or provide general guidance.
        </p>
      </div>
    </div>
  `;
}

// PAGE NAVIGATION

const renderers = {
  home: homePage,
  schedules: schedulesPage,
  lookup: lookupPage,
  requirements: requirementsPage,
  process: processPage,
  service: servicePage,
  waiting: waitingPage,
  announcements: announcementsPage,
  assistance: assistancePage
};

function closeMenus() {
  menu.hidden = true;

  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open menu');
  menuToggle.textContent = '☰';

  moreMenu.classList.remove('open');
  moreToggle.setAttribute('aria-expanded', 'false');
}

function render() {
  const requested = location.hash.startsWith('#/')
    ? location.hash.slice(2)
    : 'home';

  const page = pages.includes(requested)
    ? requested
    : 'home';

  main.classList.toggle('home-layout', page === 'home');
  main.innerHTML = renderers[page]();

  document.querySelectorAll('[data-page]').forEach(a => {
    const active = a.dataset.page === page;

    a.classList.toggle('active', active);

    if (active) {
      a.setAttribute('aria-current', 'page');
    } else {
      a.removeAttribute('aria-current');
    }
  });

  moreToggle.classList.toggle(
    'active',
    pages.slice(5).includes(page)
  );

  closeMenus();

  if (page === 'schedules') {
    bindSchedules();
  }

  if (page === 'lookup') {
    bindLookup();
  }

  window.scrollTo({
    top: 0,
    behavior: 'instant'
  });
}

// MOBILE MENU

menuToggle.addEventListener('click', () => {
  const opening = menu.hidden;

  menu.hidden = !opening;

  menuToggle.setAttribute(
    'aria-expanded',
    String(opening)
  );

  menuToggle.setAttribute(
    'aria-label',
    opening ? 'Close menu' : 'Open menu'
  );

  menuToggle.textContent = opening ? '✕' : '☰';
});

// DESKTOP MORE MENU

moreToggle.addEventListener('click', () => {
  const open = moreMenu.classList.toggle('open');

  moreToggle.setAttribute(
    'aria-expanded',
    String(open)
  );
});

document.addEventListener('click', e => {
  if (!moreMenu.contains(e.target)) {
    moreMenu.classList.remove('open');
    moreToggle.setAttribute('aria-expanded', 'false');
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeMenus();
  }
});

// LOAD THE CORRECT PAGE WHEN URL CHANGES

window.addEventListener('hashchange', render);

// INITIAL PAGE LOAD

render();
