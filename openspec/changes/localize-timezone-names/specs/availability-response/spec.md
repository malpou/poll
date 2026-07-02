## MODIFIED Requirements

### Requirement: Times shown in the event's timezone

The system SHALL show date option times in the event's timezone and SHALL tell
respondents which timezone that is whenever any option has a time, naming the
timezone with a zone name localized to the poll's language alongside its
identifier.

#### Scenario: Respondent in another timezone

- GIVEN an event in the America/New_York timezone with an option starting at
  08:00 UTC
- WHEN a respondent opens their link
- THEN the option's time renders as 04:00
- AND the page names the event's timezone with a zone name in the poll's
  language

#### Scenario: No times, no timezone note

- GIVEN an event whose options are date-only
- WHEN a respondent opens their link
- THEN no timezone note is shown
