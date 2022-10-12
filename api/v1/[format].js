import { parse } from "node-html-parser";
import fetch from "node-fetch";
import ical from "ical-generator";

const ABS_ROOT = "https://www.abs.gov.au/";
const FUTURE_RELEASES = "https://www.abs.gov.au/release-calendar/future-releases";
const PRODID = "//github:duyjpr//abs-calendar-scraper-nodejs//EN";

async function loadPage(url) {
  const doc = await fetch(url);
  const contents = await doc.text();
  return parse(contents);
}

function absLink(href) {
  if(!href.startsWith(ABS_ROOT)) {
    href = ABS_ROOT + href;
  }
  return href;
}

async function getMonthlyUrls(url) {
  const pg = await loadPage(url);
  const linkNodes = pg.querySelector(".date-pager").querySelectorAll("a[href]");
  return linkNodes.map(a => absLink(a.attributes["href"]));
}

function parentUrl(url) {
  return url.substr(0, url.lastIndexOf("/"));
}

async function getReleases(url) {
  const doc = await loadPage(url);
  const entries = doc.querySelectorAll(".views-row");
  const times = entries.map(e => {
    return e.querySelector(".event-date time").attributes["datetime"];
  });
  const titles = entries.map(e => {
    return e.querySelector(".event-name").textContent.trim();
  });
  const descriptions = entries.map(e => {
    return e.querySelector(".event-description").textContent.trim();
  });
  const referencePeriods = entries.map(e => {
    return e.querySelector(".reference-period-value").textContent.trim();
  });
  const latestUrls = entries.map(e => {
    const a = e.querySelector(".rs-product-link-latest a[href]");
    return !a
      ? null
      : absLink(parentUrl(a.attributes["href"].trim()) + "/latest-release");
  });
  const topics = latestUrls.map(u => {
    if(!u) return null;
    const parts = u.split("/");
    // Terminology comes from ABS website.
    // Format: abs.gov.au/statistics/theme/parent-topic/topic/latest-release 
    // https://www.abs.gov.au/welcome-new-abs-website
    return {
      theme: parts.at(-4),
      parentTopic: parts.at(-3),
      topic: parts.at(-2)
    };
  });

  const entriesOnPage = times.map((t, i) => ({
    time: new Date(times[i]),
    title: titles[i],
    description: descriptions[i],
    referencePeriod: referencePeriods[i],
    latestUrl: latestUrls[i],
    ...topics[i]
  }));
  return entriesOnPage;
}

function matchesFilters(release, filters) {
  for(let [name, values] of filters) {
    const checkValue = release[name];
    // Edge case: single filter value
    if(checkValue === values) return true;

    for(let value of values) {
      if(checkValue === value) return true;
    }
  }
  return false;
}

function toIcal(entries) {
  const calendar = ical({
    prodId: PRODID
  });
  for(let e of entries) {
    calendar.createEvent({
      start: e.time,
      end: e.time,
      summary: e.title + ", " + e.referencePeriod,
      description: [
        e.description,
        "",
        !e.theme ? "" : `${e.theme} / ${e.parentTopic} / ${e.topic}`,
        e.latestUrl
      ].join("\n")
    });
  }
  return calendar;
}

export default async function handler(request, response) {
  const monthlyUrls = await getMonthlyUrls(FUTURE_RELEASES);
  const monthlyEntries = await Promise.all(monthlyUrls.map(getReleases));
  let releases = monthlyEntries.flat();

  const {format = "json", ...filters} = request.query;

  // [field, value | [value1...valueN]]
  const filterEntries = Object.entries(filters);
  if(filterEntries.length > 0) {
    releases = releases.filter(r => matchesFilters(r, filterEntries));
  }

  if(format === "icalendar") {
    return toIcal(releases).serve(response);
  }
  response.status(200).json(releases);
}
