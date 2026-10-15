# HTMX and UI conventions

Server-rendered Hono JSX, Bootstrap 5 with `data-bs-theme="dark"`, HTMX 2 with the idiomorph and SSE
extensions. No client-side framework; the handful of scripts in `static/` handle what HTMX can't.

## Pages and panels

`components/Layout.tsx` wraps every page (navbar, flash messages, scripts); routes call
`c.render(<Page />, { title })`. The character sheet (`components/Character.tsx`) is `CharacterInfo`
(name, HP, AC, …) plus the cards in `components/panels/`: Abilities, Skills, Proficiencies, Traits,
Spells, WildShape (druids), Inventory, and the `ChatBox`. Each panel renders from a
`ComputedCharacter` and takes `isReadOnly` for DM views.

Every panel has a root element with a stable `id` and accepts `swapOob`; with it, the panel renders
with `hx-swap-oob="true"` so a response can replace it wherever it is on the page.

## The detail modal

One Bootstrap modal, `#detailModal` with content `#detailModalContent` (`components/ui/DetailModal.tsx`),
hosts every edit form, history view, and detail view. Panel buttons do
`hx-get="/characters/:id/edit/<field>"` (or `/history/<field>`, `/items/:itemId`, …) with
`hx-target="#detailModalContent"` and `data-bs-toggle="modal"`, so Bootstrap opens the modal while
HTMX fills it. `static/detail-modal.js` closes it on the `closeDetailModal` event the server sends
after a successful write.

Edit forms use `ModalForm` + `ModalFormSubmit` (`components/ui/ModalForm.tsx`):

- `ModalForm` posts the form to its endpoint on every `change` with `is_check=true`, swapping the
  modal content with `morph:innerHTML` so focus and scroll survive the re-render.
- `ModalFormSubmit` posts with `is_check=false` and `hx-sync="closest form:replace"`, which cancels
  an in-flight check so a submit can't race it.
- The form receives `values` and `errors` from the route (empty on first render) and renders
  Bootstrap `is-invalid` / `invalid-feedback` from them, after `ignoreCheckEmptyErrors`.

A successful write responds with the updated panels as OOB swaps and `c.header("HX-Trigger",
"closeDetailModal")`. Today each route decides which panels to include; always re-rendering all of
them is the planned rule ([plans/2026-10-architecture-cleanup.md](plans/2026-10-architecture-cleanup.md#4-re-render-every-panel-after-a-write)). Until
then, include every panel the write could have changed, and remember HP changes can end a Wild
Shape, which touches most of them.

Detail views that should be linkable (a spell, a beast) are opened from URL params handled by
`detail-modal.js` (`?openSpell=`, `?openBeast=`).

## History modals

`GET /characters/:id/history/:field` renders a `*History` component from the table's rows, most
recent first. Several merge more than one table into a timeline (HP merges HP deltas, level-ups and
wild shape); some group rows by identical timestamp+note to show one action's rows together. Once
events exist that grouping becomes exact ([plans/2026-10-architecture-cleanup.md](plans/2026-10-architecture-cleanup.md#1-events)).

## Chat

`ChatBox` posts a message, then opens an SSE stream (`htmx-ext-sse`) to
`/characters/:id/chat/:chatId/stream` for the reply. Tool calls that need approval render as cards
with approve/reject buttons posting to `/tool/:toolCallId/approve|reject`. `static/character.js`
scrolls the chat and focuses the input after swaps.

## Static scripts

`static/` has vendored libraries copied by `bun install`'s postinstall (htmx, sse, idiomorph,
cropper, altcha) plus small hand-written files: `detail-modal.js` (modal open/close/URL params),
`character.js` (chat scroll, spell picker scroll, avatar upload), `flash.js`, `htmx-auth.js`
(lets a 401/403/404 with an `HX-Redirect` header redirect instead of being treated as an error),
`htmx-history.js` (copies live input/select state
into the DOM before htmx snapshots history, so Back restores search boxes), `rules.js`,
`avatar-cropper.js`. Prefer an HTMX attribute to new JS; when JS is needed, one small file per
concern, loaded from `Layout.tsx`.

## Hygiene checklist

Check these before calling a component done; they are the recurring review findings:

- **Swap mode.** If `hx-target` is `#x` and the response is `<div id="x">…`, use
  `hx-swap="outerHTML"`, or you nest a duplicate id.
- **OOB elements belong in routes, not components.** A component that renders an OOB element will
  also render it on initial page load, duplicating ids.
- **Valid HTML.** Text only inside `<option>`; no block elements inside `<p>` or `<button>`.
- **Stable, unique ids** for everything targeted by HTMX; panels' root ids are a contract.
- **Consistent defaults across routes** for shared parameters (ruleset, class).
- **Double submit**: forms that write use `ModalFormSubmit` (`hx-sync`), or `hx-disabled-elt="this"`
  on standalone buttons.
- **Read-only views** render no edit buttons (`isReadOnly`), not disabled ones.
