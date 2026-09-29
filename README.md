# k6 Performance Testing Demo

This repository contains a small performance testing project created with Grafana k6.

The purpose of this project is to demonstrate protocol-level performance testing, browser-based user journeys, performance thresholds, Web Vitals monitoring, and CI execution using GitHub Actions.

## Test Scenarios

### 1. Smoke Test

File:

`tests/smoke-test.js`

This test performs a basic HTTP performance test against the official k6 test website.

Configuration:

- 5 virtual users
- 30-second duration
- HTTP GET requests
- HTTP status validation
- Response time validation
- Performance thresholds

Thresholds:

- HTTP request failure rate < 1%
- p95 response time < 500 ms
- More than 99% of checks must pass

Example successful execution:

- 100% checks passed
- 0% failed HTTP requests
- Performance thresholds successfully met

---

### 2. Browser Flight Search Performance Test

File:

`tests/flight-search-browser.js`

This browser-based test uses BlazeDemo to simulate a realistic user journey.

Each virtual user:

1. Opens the BlazeDemo website
2. Selects Paris as the departure city
3. Selects Rome as the destination
4. Clicks "Find Flights"
5. Validates that the flight results page is displayed
6. Selects the first available flight
7. Validates that the purchase page is displayed

Configuration:

- 5 concurrent browser virtual users
- 1 complete journey per virtual user
- Maximum duration: 1 minute

Performance thresholds:

- More than 99% of checks must pass
- Browser HTTP request failure rate < 1%
- FCP p95 < 2.5 seconds
- LCP p95 < 2.5 seconds
- TTFB p95 < 800 ms

Example successful execution:

- 5/5 browser journeys completed
- 10/10 checks passed
- 0% failed browser HTTP requests
- FCP p95: approximately 1.53 seconds
- LCP p95: approximately 1.53 seconds
- TTFB p95: approximately 490 ms
- Browser HTTP request p95: approximately 425 ms

---

## GitHub Actions

The project includes a GitHub Actions workflow located at:

`.github/workflows/k6.yml`

The workflow automatically executes the k6 smoke test when changes are pushed to the main branch.

The workflow:

1. Checks out the repository
2. Sets up Grafana k6
3. Executes the smoke test
4. Evaluates the defined performance thresholds
5. Fails if the performance criteria are not met

This demonstrates a simple integration of performance testing into a CI/CD pipeline.

---

## Project Structure

```text
k6-performance-demo/
│
├── .github/
│   └── workflows/
│       └── k6.yml
│
├── tests/
│   ├── smoke-test.js
│   └── flight-search-browser.js
│
└── README.md