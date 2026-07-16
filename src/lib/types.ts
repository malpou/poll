// The types the Playwright specs import. They mirror the app's own definitions:
// Locale is the set of messages/{da,en,fr}.json bundles, Preference the values
// the responses.preference CHECK constraint allows. Both are fixed by the data
// model; internal/domain and the schema are authoritative.

export type Locale = 'da' | 'en' | 'fr';

export type Preference = 'preferred' | 'available' | 'unavailable';
