// Choose Vercel edge runtime
export const config = {
  runtime: "edge",
};

import ICAL from "ical.js";
import { parse } from "node-html-parser";

const ABS_ROOT = "https://www.abs.gov.au/";
const ABS_CALENDAR = ABS_ROOT + "release-calendar/future-releases-calendar";
const PRODID = "//github:duyjpr//abs-calendar-scraper-nodejs//EN";
const CALENDAR_NAME = "ABS releases";

export async function GET(request) {
  // Copy out of URLSearchParams into a plain object that works with
  // destructuring assignment. JS doesn't have a standard way of handling
  // repeated searchParams so we have to do things manually.
  const query = {};
  for(const [k, v] of new URL(request.url).searchParams) {
    const testValue = query[k];
    if(testValue === undefined) {
      query[k] = v;
    } else if(Array.isArray(testValue)) {
      testValue.push(v);
    } else {
      query[k] = [query[k], v];
    }
  }

  const {
    format = "icalendar",
    allday = "Australia/Melbourne",
    ...filterInputs
  } = query;
  const filters = Object.entries(filterInputs); // {name, value | [values]}

  let releases = await scrapeAbsCalendar();
  if(filters.length > 0) {
    releases = releases.filter(rls => {
      for(const [name, values] of filters) {
        const target = rls[name];
        const found = (values === target) ||
          (values.find && values.find(x => x === target));
        // Early exit if match found
        if(found) return true;
      }
      return false;
    });
  }

  if(format === "icalendar") {
    return new Response(
      releasesToIcal(releases, allday === "false" ? undefined : allday),
      {
        headers: {
          "Content-Type": "text/calendar;charset=utf-8",
          "Content-Disposition": 'attachment; filename="abs-calendar.ics"',
        },
      },
    );
  }

  return Response.json(releases);
}

async function parseFromUrl(url) {
  const doc = await fetch(url);
  const raw = await doc.text();
  return parse(raw);
}

async function scrapeAbsCalendar() {
  const monthlyUrls = (await parseFromUrl(ABS_CALENDAR))
    .querySelector(".date-pager")
    .querySelectorAll("a[href]")
    .map(a => new URL(a.attributes.href, ABS_CALENDAR).href);
  const monthlyReleases = await Promise.all(
    monthlyUrls.map(scrapeReleasesOnPage)
  );
  return monthlyReleases.flat();
}

function text(x) {
  return x.textContent.trim();
}

async function scrapeReleasesOnPage(u) {
  const page = await parseFromUrl(u);
  const entries = page.querySelectorAll(".calendar");
  return entries.map(e => ({
    time: e.querySelector("time").attributes.datetime,
    title: text(e.querySelector(".event-name")),
    referencePeriod: text(e.querySelector(".reference-period-value")),

    ...scrapeLatestUrlAndTopics(
      e.querySelector(".rs-product-link-latest a[href]")?.attributes.href
    )
  }));
}

function scrapeLatestUrlAndTopics(href) {
  if(href) {
    const latestUrl = new URL(
      href.replace(new RegExp("/[^/]+$", "u"), "/latest-release"),
      ABS_CALENDAR
    ).href;
    const parts = latestUrl.split("/");
    // Terminology comes from ABS website.
    // Format: abs.gov.au/statistics/theme/parent-topic/topic/latest-release 
    // https://www.abs.gov.au/welcome-new-abs-website
    const topics = {
      theme: parts.at(-4),
      parentTopic: parts.at(-3),
      topic: parts.at(-2)
    };

    return {latestUrl, ...topics};
  }
  return null;
}

function releasesToIcal(releases, allDay) {
  const now = ICAL.Time.fromJSDate(new Date(), true);
  const calendar = new ICAL.Component("vcalendar");
  calendar.addPropertyWithValue("version", "2.0");
  calendar.addPropertyWithValue("prodid", PRODID);
  calendar.addPropertyWithValue("x-wr-calname", CALENDAR_NAME);
  // Proposed standardisation, not widely supported
  calendar.addPropertyWithValue("name", CALENDAR_NAME);
  
  for(const rls of releases) {
    const vevent = new ICAL.Component("vevent", calendar);
    const event = new ICAL.Event(vevent);
    event.uid = [
      rls.title, rls.referencePeriod, rls.time
    ].join(" ").replace(/[^A-Za-z0-9]+/gu, "-");
    vevent.addPropertyWithValue("dtstamp", now);
    
    if(allDay) {
      // Convert day to local timezone in case ABS ever releases something
      // before 11am
      const parts = new Date(rls.time)
        .toLocaleDateString("en-AU", {
          timeZone: allDay
        }) // dd/mm/yyyy
        .split("/");

      const time = ICAL.Time.fromData({
        day: Number(parts[0]),
        month: Number(parts[1]),
        year: Number(parts[2]),
        isDate: true,
      });
      event.startDate = time;
    } else {
      const time = ICAL.Time.fromString(rls.time);
      event.startDate = time;
      event.endDate = time;
    }

    event.summary = rls.title + " for " + rls.referencePeriod;
    if(rls.latestUrl) event.description = rls.latestUrl;
    calendar.addSubcomponent(vevent);
  }

  return calendar.toString();
}