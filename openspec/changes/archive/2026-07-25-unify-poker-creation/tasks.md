## 1. Live-session fixes (done ahead of the rest — reported against the running tool)

- [x] 1.1 Add `canReveal` / `pendingVoters` to the snapshot logic: reveal is
      held until every present estimator has voted; observers and absent seats
      never count. Unit-tested.
- [x] 1.2 Disable the reveal control on the controller console while it is held,
      and caption it with who the room is waiting on (`pokerWaitingOn`, five
      languages).
- [x] 1.3 Add `estimateChoices` to the deck logic: the final-estimate numerals
      are the deck slice from the lowest cast numeral to the highest, whole deck
      when no numeral was cast. Unit-tested.
- [x] 1.4 Offer only those numerals on the console's record-estimate row; split
      and skip stay unconditional.
- [x] 1.5 Wrap the three room text entries (join name, controller name, next
      item) in real forms so Enter submits; buttons become `type="submit"`.
- [x] 1.6 Hide the shareable join link on the console once the room is closed.
- [x] 1.7 Room email: additive migration for the stored address, provider
      setter, snapshot reports only that one is set, controller-only command
      that stores it and mails the room link, and a closing summary of every
      decided item. Composers unit-tested, including HTML escaping of
      controller-typed item titles.
- [x] 1.8 Add colocated e2e coverage for the new planning-poker requirements
      (reveal held / freed / observer / dropped seat; estimate range; Enter
      submits; join link hidden on close; email attach + rejection + the
      address never reaching a client).

## 2. Room language

- [x] 2.1 Additive migration: room language column, base-locale default.
- [x] 2.2 Room creation takes a language and stores it; mock provider and the
      e2e room seeding helper carry the new column.
- [x] 2.3 Each poker page load resolves the room's language through the existing
      request-locale hook, so the console, join page, and results log render in
      it regardless of the viewer's browser.
- [x] 2.4 E2E: a room created in Danish renders in Danish for a viewer whose
      browser prefers something else.

## 3. Creation moves onto the create page

- [x] 3.1 Add the "what are you making" choice above the poll form — poll
      preselected — reusing the existing radio-card pattern; reflect the choice
      in the URL alongside the highlighter.
- [x] 3.2 Poker branch renders room name only: no poll type, dates, options,
      mode, participants, or highlighter picker; keep the language picker.
- [x] 3.3 Add the room-creation form action beside the existing poll action;
      empty room name is rejected with a localized explanation.
- [x] 3.4 Delete the standalone room-creation route (never released, so nothing
      to preserve); creation is now the create page, indexable like poll
      creation rather than `noindex`.
- [x] 3.5 Copy for the choice and the poker branch in all five languages.
- [x] 3.6 E2E: create a room from the create page, switching back restores the
      poll form, empty name rejected, indexability.

## 3b. Feature parity

- [x] 3b.1 Rooms take an organizer-picked highlighter like polls (migration,
      provider, create form, every room page) instead of a hardcoded blue.
- [x] 3b.2 Room email moves onto the create form, matching the poll's optional
      organizer email; the console's separate email box is gone along with its
      command and snapshot flag.

## 4. Landing page

- [x] 4.1 Add the planning-poker section after the poll examples, scoped to the
      tool's own fixed accent so the landing highlighter picker stops at its
      boundary; its call-to-action carries the language but not the highlighter.
- [x] 4.2 Build the reveal example: face-down cards that turn face-up together
      on a tap with the agreement read-out, reusing the existing card and signal
      surfaces, persisting nothing.
- [x] 4.3 Section and example copy in all five languages.
- [x] 4.4 E2E: section present, call-to-action keeps the language, tap reveals,
      reload resets, highlighter pick leaves the section alone.

## 5. Documentation and drift

- [x] 5.1 DESIGN.md: rooms now take an organizer-picked highlighter (was
      hardcoded blue), plus the landing section's rules, new badge, and reveal
      example.
- [x] 5.2 PROJECT.md: planning poker was absent entirely — added its purpose,
      token kinds, data model, routes, and the D1-vs-Durable-Object note; create
      route now documents both branches.
- [ ] 5.3 Sync both delta specs into the main specs and archive the change.

## 6. Release (outside the change, but blocking the landing page)

- [ ] 6.1 Merge planning poker to the default branch — production currently
      serves 404 for every poker URL.
- [ ] 6.2 Apply outstanding migrations to the remote database; it has never had
      the planning-poker tables.
- [ ] 6.3 Deploy, then verify a created room's join link resolves in production.
