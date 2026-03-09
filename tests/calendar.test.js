import { beforeAll, expect, jest, test } from "@jest/globals";
import { GET } from "../api/v1/calendar";
import { load as loadYaml} from "js-yaml";
import { readFile } from "node:fs/promises";

const mockedFetches = loadYaml(
  await readFile("tests/calendar-mocked-fetches.yaml")
);

const mockedFetch = jest.fn(url =>
  Promise.resolve({
    text: () => Promise.resolve(mockedFetches[url]),
  })
);

beforeAll(() => {
  globalThis.fetch = mockedFetch;
});

// Factor out common checking pattern
async function checkOutput(url) {
  const response = await GET(new Request(url));
  let generated = await response.text();
  const mime = response.headers.get("Content-Type")
    .match(/^[^;]*/u)[0];
  if(mime === "text/calendar") {
    generated = generated.replace(/^DTSTAMP:.+$/mgu,"DTSTAMP:20000101T000001Z");
  }

  expect(generated).toMatchSnapshot();
}

test("Generate iCal for all events", async () => await checkOutput(
  "https://test.case",
));

test("Apply basic filter", async () => await checkOutput(
  "https://test.case?format=icalendar&parentTopic=decade",
));

test("Apply filter - multple values", async () => await checkOutput(
  "https://test.case?format=icalendar&topic=start-decade&topic=end-decade&topic=mid-decade",
));

test("Apply filter - multiple fields", async () => await checkOutput(
  "https://test.case?format=icalendar&topic=start-decade&referencePeriod=Dec%202025",
));

test("JSON output", async () => await checkOutput(
  "https://test.case?format=json",
));

test("Use release time as well as date", async () => await checkOutput(
  "https://test.case?format=icalendar&allday=false",
));

test("Default timezone conversion to Melbourne time", async () => await checkOutput(
  "https://test.case?format=icalendar&topic=timezone",
));

test("Timezone conversion of event dates", async () => await checkOutput(
  "https://test.case?format=icalendar&allday=Australia/Perth&topic=timezone",
));

