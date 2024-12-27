# ABS Calendar Scraper

Exports upcoming statistical releases from the [Australian Bureau of Statistics release calendar](https://www.abs.gov.au/release-calendar/future-releases). Provides an iCalendar feed which can be added to calendar programs (Outlook, Google Calendar, etc).

**Motivation**: The ABS website currently lets you save an iCalendar file for specific months or specific releases. However, there is no feed which always has the latest release schedule for select topics of interest.

This service provides a feed you can add to always have upcoming releases of interest in your calendar app.

## Examples

Add these URLs to you calendar app to see what the service provides.

- All releases for the next 6 months:

  https://abs-calendar-scraper.vercel.app/api/v1/calendar?format=icalendar

- Labour force and detailed labour force:

  https://abs-calendar-scraper.vercel.app/api/v1/calendar?format=icalendar&topic=labour-force-australia&topic=labour-force-australia-detailed


## General use

This service uses standard HTTP REST (GET):

```
GET {host}/api/v1/calendar?{option1}={value1}&{filter1}={exact1}...
```
The public **host** is `https://abs-calendar-scraper.vercel.app`

All arguments are optional and case-sensitive. The following sections describe supported options/filters.

### format

- `icalendar` (default): understood by many calendar apps.
- `json`: array of dictionaries holding the fields for each release. Useful for finding fields to filter on.

### allday

- `Australia/Melbourne` (default) or another [IANA timezone](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones): events are all-day according to this timezone. This will display at the top of the day in most calendar apps, which prevents them getting lost on busy days.
- `false`: events happen at 11:30 Canberra time.

## Filters: `theme`, `parentTopic`, `topic`, `title`, etc.

All other parameters are interpreted as filters for selecting which releases to show.

- No filters: returns all releases.
- Multiple filters are joined with **OR**. 
- Repeat filters to find multiple values, e.g. labour force and retail trade: `&topic=labour-force-australia&topic=retail-trade-australia`
- Filters must match the entire value; no partial matches. This prevents, e.g. *Labour Force* from spuriously picking up *Labour Force, Detailed*.
- Values may need to be [percent-encoded](https://en.wikipedia.org/wiki/Percent-encoding) since they appear in URLs. Using the `topic` rather than the `title` usually gets around this.

Recognised fields:
- `theme`/`parentTopic`/`topic`: follows [ABS terminology](https://www.abs.gov.au/welcome-new-abs-website#navigating-our-web-address-structure):
  > Format: abs.gov.au/statistics/theme/parent-topic/topic/latest-release 
  > 
  > Example: https://www.abs.gov.au/statistics/economy/national-accounts/australian-national-accounts-national-income-expenditure-and-product/latest-release

- `title`: name in large text at the top of a release page, e.g. `Labour Force, Australia`. Needs to be [percent-encoded](https://en.wikipedia.org/wiki/Percent-encoding), e.g. `Labour%20Force,%20Australia`.

- Other fields can be found in the JSON export.

⚠️ Unrecognised fields currently result in no releases being returned.

## Development

This uses NodeJS serverless functions to generate the iCalendar file on request. The current file layout under `/api` works with [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions). Other providers may have their own file layout requirements.

To run a dev instance:
```sh
npx vercel dev
```

Tests and code coverage rely on `jest`:
```sh
npm run test
npm run coverage
```
