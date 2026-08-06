# Testing — events module

Covers `lib/services/events.service.js`, `hooks/useEvents.js`, and `components/features/events/` (EventList, EventForm, EventsPage).

---

## TC-EV-01 — Events page loads and shows list

**Setup:** Navigate to the Events page.  
**Expected:** Page renders without errors. If events exist they appear in the list; if none, the empty state "No events yet" is shown.

---

## TC-EV-02 — Events are sorted most-recent first

**Setup:** At least two events with different dates exist.  
**Steps:** Open Events page.  
**Expected:** Events appear with the latest date at the top.

---

## TC-EV-03 — Today badge appears for today's event

**Setup:** An event exists with today's date (MYT local date).  
**Steps:** Open Events page.  
**Expected:** The event card shows a green **Today** badge and a green border.

---

## TC-EV-04 — Upcoming badge for future events

**Setup:** An event exists with a future date.  
**Steps:** Open Events page.  
**Expected:** Card shows an amber/orange **Upcoming** badge.

---

## TC-EV-05 — Past badge for past events

**Setup:** An event exists with a past date.  
**Steps:** Open Events page.  
**Expected:** Card shows a muted **Past** badge.

---

## TC-EV-06 — Branch chips show short name

**Setup:** An event exists with branches covering multiple locations.  
**Steps:** Open Events page and inspect the branch chips on each event card.  
**Expected:** Chips show short form (e.g. `'Sentul'`), not `'Caterpillar Playtime Sentul'` and not `'Caterpillar_Sentul'`.

---

## TC-EV-07 — Age group chips show labels

**Setup:** An event exists with age groups `['1year', '2year']`.  
**Steps:** Open Events page.  
**Expected:** Chips show `'1 Year'`, `'2 Years'` (human-readable labels, not raw keys).

---

## TC-EV-08 — Add event — validation: at least one branch required

**Setup:** Click + Add. Fill in a name and date. Do not select any branch.  
**Steps:** Submit the form.  
**Expected:** Alert: "Select at least one branch". Event is not saved.

---

## TC-EV-09 — Add event — validation: at least one age group required

**Setup:** Click + Add. Fill in name, date, and branch but no age group.  
**Steps:** Submit.  
**Expected:** Alert: "Select at least one age group". Event is not saved.

---

## TC-EV-10 — Add event — success

**Setup:** Click + Add. Fill in name, date, select ≥1 branch and ≥1 age group.  
**Steps:** Submit.  
**Expected:** Modal closes, new event appears at the top of the list with correct branches and age group chips.

---

## TC-EV-11 — Branch toggle in EventForm selects/deselects correctly

**Setup:** Open the Add Event modal.  
**Steps:** Click a branch chip once (selects), click again (deselects).  
**Expected:** Chip turns green when selected, reverts to default when deselected. State is reflected in the submitted payload.

---

## TC-EV-12 — Delete event — confirmation required

**Setup:** Open Actions menu on any event.  
**Steps:** Click Delete, then dismiss the confirmation dialog.  
**Expected:** Event remains in the list; no Supabase delete call was made.

---

## TC-EV-13 — Delete event — confirmed

**Setup:** Open Actions menu on any event.  
**Steps:** Click Delete, then confirm.  
**Expected:** Event is removed from the list immediately.

---

## TC-EV-14 — Actions menu is exclusive (one open at a time)

**Setup:** Two or more event cards are visible.  
**Steps:** Click Actions on card 1 (opens), then click Actions on card 2.  
**Expected:** Card 1's menu closes and card 2's opens. Clicking outside any card closes all menus.

---

## TC-EV-15 — Events.jsx is a re-export shim

**Setup:** Inspect `src/components/Events.jsx`.  
**Expected:** File contains only `export { default } from './features/events/EventsPage'`. All logic lives in the `features/events/` directory.
