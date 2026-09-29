import { browser } from 'k6/browser';
import { check } from 'k6';

export const options = {
  scenarios: {
    flight_booking_journey: {
      executor: 'per-vu-iterations',
      vus: 5,
      iterations: 1,
      maxDuration: '1m',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },

  thresholds: {
    checks: ['rate>0.99'],
    browser_http_req_failed: ['rate<0.01'],
    browser_web_vital_fcp: ['p(95)<2500'],
    browser_web_vital_lcp: ['p(95)<2500'],
    browser_web_vital_ttfb: ['p(95)<800'],
  },
};
export default async function () {
  const page = await browser.newPage();

  try {
    await page.goto('https://blazedemo.com/');

    await page.locator('select[name="fromPort"]').selectOption('Paris');
    await page.locator('select[name="toPort"]').selectOption('Rome');

    await Promise.all([
      page.waitForNavigation(),
      page.locator('input[value="Find Flights"]').click(),
    ]);

    check(page, {
      'flight results page loaded': (p) =>
        p.url().includes('reserve.php'),
    });

    const firstFlight = page.locator('input[value="Choose This Flight"]').first();

    await Promise.all([
      page.waitForNavigation(),
      firstFlight.click(),
    ]);

    check(page, {
      'purchase page loaded': (p) =>
        p.url().includes('purchase.php'),
    });

  } finally {
    await page.close();
  }
}