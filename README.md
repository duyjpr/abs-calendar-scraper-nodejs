# ABS Calendar Scraper

Exports upcoming statistical releases from the [Australian Bureau of Statistics release calendar](https://www.abs.gov.au/release-calendar/future-releases). Provides an iCalendar feed which can be added to calendar programs (Outlook, Google Calendar, etc).

**Motivation**: The ABS website currently lets you save an iCalendar file for specific months or specific releases. However, there is no feed which always has the latest release schedule for select topics of interest.

This service provides a feed you can add to always have upcoming releases of interest in your calendar app.

## Examples

Add these URLs to you calendar app.

- All releases for the next 6 months:

  https://abs-calendar-scraper.vercel.app/api/v1/calendar?format=icalendar

- Labour force and detailed labour force:

  https://abs-calendar-scraper.vercel.app/api/v1/calendar?format=icalendar&topic=labour-force-australia&topic=labour-force-australia-detailed


## General use

`https://abs-calendar-scraper.vercel.app/api/v1/calendar?format=`**{format}**`&`**{field1}={value1}**`&`**{field1}={value2}**`...`

Supported formats:
- `icalendar`: iCalendar/iCal/ICS format used by many calendar apps.
- `json`: (default) raw entries, useful for finding fields to filter on.

Filters can be provided as `field=value` pairs, separated by `&`.
- No filters will return all releases.
- Multiple fields/filters are joined with OR. 
- Values must match the entire value; no partial matches. This prevents, e.g. *Labour Force* from spuriously matching *Labour Force, Detailed*.
- Match multiple values by repeating query parameters, e.g. `&topic=`**{labour-force-australia}**`&topic=`**{retail-trade-australia}**
- Values may need to be [percent-encoded](https://en.wikipedia.org/wiki/Percent-encoding) since they appear in URLs.

Recognised fields:
- `theme`/`parentTopic`/`topic`: follows [ABS terminology](https://www.abs.gov.au/welcome-new-abs-website#navigating-our-web-address-structure):
  > Format: abs.gov.au/statistics/theme/parent-topic/topic/latest-release 
  > 
  > Example: https://www.abs.gov.au/statistics/economy/national-accounts/australian-national-accounts-national-income-expenditure-and-product/latest-release

- `title`: name in large text at the top of a release page, e.g. `Labour Force, Australia`. Needs to be [percent-encoded](https://en.wikipedia.org/wiki/Percent-encoding), e.g. `Labour%20Force,%20Australia`.

- Other fields can be found in the JSON export.

## Development

This uses NodeJS serverless functions to generate the iCalendar file on request. The current file layout under `/api` works with [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions). Other providers may have their own file layout requirements.