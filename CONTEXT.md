# MMS Content Archive

A public, browsable, searchable archive that summarizes and categorizes the session content of past MMS (Midwest Management Summit) editions.

## Language

**MMS**:
The Midwest Management Summit, a community IT conference. The conference brand, not any single occurrence of it.
_Avoid_: the summit, the conference (when a specific edition is meant)

**Edition**:
One occurrence of MMS, with its own schedule of sessions and its own Sched subdomain (e.g. "MMS 2026 Midway Edition" at `mmsmidway.sched.com`). The top-level entity: everything else hangs off an edition. MMS runs two per year — a main "at MOA" edition and a themed fall edition — so an edition is identified by its full name, not by year alone.
_Avoid_: event, instance, conference, year

**Session**:
One scheduled item in an edition's catalog — a talk, workshop, or similar — with a title, abstract, speakers, time, and source track. The unit we summarize and categorize.
_Avoid_: talk, event, item, entry

**Speaker**:
A person who presents a session. A speaker may appear across multiple sessions and editions.

**Source Track**:
A track, session type, or tag as it comes from the upstream schedule (Sched). Raw, per-edition, and liable to drift between editions.
_Avoid_: track (unqualified), tag, type

**Category**:
Our own normalized, curated classification, mapped from one or more Source Tracks, kept consistent across every edition. What "categorize all content" is measured against.
_Avoid_: track, tag, topic

**Summary**:
A generated condensation of a session's abstract, produced once and stored as data (not regenerated per page view). May later roll up to category- and cross-edition levels.
_Avoid_: description, abstract (those are the source, not the summary)

**Material**:
A speaker-uploaded artifact for a session — primarily a presentation deck. The archive links to its download on the source schedule (Sched) rather than re-hosting it; distinct from the Session's text content.
_Avoid_: attachment, file, slides (unqualified), resource
