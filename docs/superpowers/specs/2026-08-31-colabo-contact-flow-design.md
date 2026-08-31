# Colabo Contact Flow Design

Date: 2026-08-31
Status: Approved in conversation, pending written-spec review

## Goal

Replace the current long project-inquiry form with a low-friction message composer that asks only for a name and message before letting the visitor choose how to continue. Preserve the existing dark, restrained portfolio identity while adding one memorable, purposeful motion moment.

The design must keep `sv_project` and `sv_manager` compatible with the shared D1 database. Existing inquiry records and legacy fields must remain readable.

## Scope

This release includes:

- A two-field composer on `/colabo`.
- Name/company parsing through the first `/` character.
- One primary `Send message` button.
- An anchored liquid action sheet with four delivery choices.
- WhatsApp and email handoff with prefilled content.
- A private-note flow that stores an inquiry in D1.
- Optional contact-method collection for private notes.
- Updated inquiry display in `sv_manager`.
- Schema synchronization and a D1 migration.
- Accessible keyboard, focus, error, loading, and reduced-motion behavior.

This release does not implement realtime chat or WebSockets. Live chat remains visible as a disabled `Coming soon` option. The future chat service will be specified and implemented independently because it requires Durable Object lifecycle, presence, notification, abuse-control, and retention decisions.

## Primary UX

The initial form contains:

1. `Name / Company`
2. `Message`
3. `Send message`

Typing the first slash splits the identity:

```text
Wahyu / Kakyu
```

becomes `name = Wahyu` and reveals a separate company input prefilled with `Kakyu`. The company field remains editable. Removing all company text collapses it again. Only the first slash is structural; later slashes remain part of the company value.

The initial button does not submit. It opens the delivery chooser while preserving all form state.

## Delivery Chooser

The selected visual direction is an anchored liquid sheet. On desktop, the sheet grows from the button's position. On small screens, the same element resolves as a bottom sheet.

The sheet presents four choices:

- **Private note**: subtitle `Send to my private inbox`.
- **WhatsApp**: subtitle `Continue in WhatsApp`.
- **Email**: subtitle `Open your mail app`.
- **Live chat**: subtitle `Coming soon`; disabled and not focusable as an action.

`Private note` replaces the vague label `Direct`. It accurately describes that the message is saved to the private admin inbox rather than handed to an external application.

### WhatsApp

Open a `https://wa.me/<number>?text=<encoded>` URL in a new tab from the user's click. The composed text includes the visitor name, optional company, and message. This route does not write to D1.

### Email

Open `mailto:wahyu@kakyu.dev` with an encoded subject and body. The body includes the visitor name, optional company, and message. This route does not write to D1.

### Private note

Advance the sheet to an optional contact step:

- Email
- WhatsApp
- Telegram
- Instagram
- Messenger
- X
- Threads
- No contact

Selecting a platform reveals one relevant input for an address, number, URL, or handle. Social-network options collect contact information; they do not open public share composers or attempt unsupported prefilled direct messages.

The visitor then confirms with `Send privately`. The server validates and stores the inquiry. `No contact` permits an anonymous reply-free message.

## Motion

The primary interaction uses a liquid-morph illusion rather than a simulated fluid engine:

1. The button compresses slightly on press.
2. Its border radius becomes asymmetrical to form a droplet silhouette.
3. The droplet translates and scales into the anchored sheet.
4. Sheet content fades and translates in after the container establishes its final geometry.

Duration is 420–520 ms with an exponential or quintic ease-out. There is no bounce or elastic overshoot. Animation is limited to transform, opacity, and clip-path where supported; layout is not animated frame-by-frame.

With `prefers-reduced-motion: reduce`, the sheet appears immediately with a short opacity transition or no transition. Focus moves into the sheet after opening and returns to `Send message` after closing. Escape and backdrop click close the chooser without clearing the composer.

## Components and Responsibilities

- `ColaboComposer.svelte`: name/message state, company parsing, channel selection, and progressive steps.
- `ContactChannelSheet.svelte`: focus management, dialog semantics, motion states, channel choices, and private-contact step.
- `contact-links.ts`: pure builders for WhatsApp and `mailto:` URLs.
- `/colabo?/inquire`: private-note validation, Turnstile verification, and D1 insertion.
- `sv_manager /inquiries`: displays nullable email plus the chosen contact type/value.

The page owns composition only. Link building, parsing, and server validation stay independently testable.

## Data Model and Compatibility

The `inquiry` table keeps all existing columns so old records remain intact. The migration:

- Makes `email` nullable.
- Adds nullable `contact_type`.
- Adds nullable `contact_value`.
- Adds non-null `source` with default `private_note`.
- Preserves `company`, legacy project metadata, status, timestamps, IDs, and the created-at index.

Because SQLite cannot directly remove a `NOT NULL` constraint, the migration creates a replacement table, copies all rows, recreates indexes, then swaps table names inside a transaction-compatible migration sequence.

The shared inquiry declaration is updated in both `sv_project` and `sv_manager`. Authentication tables remain manager-only; the projects do not pretend their complete schema modules are identical.

## Validation and Abuse Protection

- Name and message are required and trimmed server-side.
- Name, company, message, contact type, and contact value receive explicit maximum lengths.
- Contact type is allowlisted.
- Contact values are treated as plain text and escaped on display.
- The existing honeypot remains.
- Turnstile is required only for `Private note` submission and is rendered lazily when that path is selected.
- WhatsApp and email links are generated locally without storing visitor content.
- Repeated submit clicks are disabled while a private note is pending.

## Error and Success States

Client handoffs keep the sheet visible until navigation begins. Private-note failures retain all fields and show an inline error inside the sheet. Turnstile resets only after a failed verification or submission.

After a successful private note, the sheet morphs into a compact confirmation state: `Message received`. The composer can then reset through `Send another`.

If D1 is unavailable, the server returns 503 and the UI preserves the draft. Validation errors return 400 with a concise field-independent summary and accessible live-region announcement.

## Testing

- Unit tests for name/company parsing and contact-link encoding.
- Server-action tests for required fields, allowlists, nullable contact, honeypot, Turnstile failure, D1 failure, and successful insert.
- Svelte checks and autofixer review for every changed Svelte component.
- Keyboard checks for tab order, focus return, Escape, disabled live chat, and submission states.
- Responsive visual checks at narrow mobile, tablet, and desktop widths.
- Reduced-motion verification.
- Regression check that legacy inquiry rows still render in `sv_manager`.
- Build and type checks in both projects with Bun 1.4.

## Deployment

1. Back up or export the current production `inquiry` schema definition and verify row count.
2. Apply the D1 migration remotely and verify old rows plus new columns.
3. Deploy `sv_manager` so nullable/new contact fields render safely.
4. Deploy `sv_project` with the new composer.
5. Submit one private note, test WhatsApp and email handoffs, and confirm the manager displays the stored message.
6. Verify the public `/colabo` page at desktop and mobile widths.

Rollback deploys the previous Workers. The additive contact columns are harmless to the old code, but the nullable email change means rollback code must tolerate rows without email. Therefore the manager compatibility change is deployed before any nullable-email records can be created.
