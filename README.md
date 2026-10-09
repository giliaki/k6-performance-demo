# k6 Performance Testing Demo

This repository contains a hands-on performance testing project built with Grafana k6.

The project demonstrates protocol-level load testing, authenticated API testing, browser-based user journeys, GraphQL validation, custom metrics, performance thresholds, HTML reporting, and CI execution with GitHub Actions.

The goal is to show how functional validation and performance acceptance criteria can be combined in realistic k6 scenarios.

## Technologies and Concepts

- Grafana k6
- JavaScript
- REST API testing
- GraphQL testing
- Authentication and bearer tokens
- CRUD API flows
- Ramping virtual users
- Custom `Trend` and `Rate` metrics
- Performance thresholds
- Browser testing and Web Vitals
- HTML dashboard reports
- GitHub Actions / CI

## Test Scenarios

### 1. Smoke Test

File: `tests/smoke-test.js`

Basic protocol-level HTTP test used as a fast validation of availability and performance criteria.

Configuration includes:

- 5 virtual users
- 30-second duration
- HTTP status validation
- Response-time validation
- Performance thresholds

Thresholds include:

- HTTP request failure rate < 1%
- p95 response time < 500 ms
- More than 99% of checks must pass

---

### 2. Browser Flight Search Performance Test

File: `tests/flight-search-browser.js`

Browser-based test using BlazeDemo to simulate a realistic user journey.

Each virtual user:

1. Opens the BlazeDemo website
2. Selects Paris as the departure city
3. Selects Rome as the destination
4. Searches for available flights
5. Validates that flight results are displayed
6. Selects the first available flight
7. Validates that the purchase page is displayed

Performance criteria include:

- More than 99% of checks must pass
- Browser HTTP request failure rate < 1%
- FCP p95 < 2.5 seconds
- LCP p95 < 2.5 seconds
- TTFB p95 < 800 ms

Example execution:

- 5/5 browser journeys completed
- 10/10 checks passed
- 0% failed browser HTTP requests
- FCP p95: approximately 1.53 seconds
- LCP p95: approximately 1.53 seconds
- TTFB p95: approximately 490 ms

---

### 3. REST API Login Load Test

File: `tests/tests-api-load-test.js`

Load test against the Grafana QuickPizza demo API login endpoint.

The workload ramps through 5, 10, and 20 virtual users while validating both functionality and performance.

The scenario includes:

- POST login requests
- Token validation
- Ramping VU workload
- Custom `login_duration` metric
- Custom `login_failures` rate
- HTTP and custom performance thresholds

Thresholds include:

- HTTP failure rate < 1%
- Overall HTTP p95 < 800 ms
- Login p95 < 800 ms
- More than 99% of checks must pass
- Login failure rate < 1%

During test execution the API remained stable under the tested workload, with no HTTP failures and response-time percentiles remaining below the configured threshold.

---

### 4. Authenticated REST API CRUD Flow

File: `tests/api-authenticated-flow.js`

A functional authenticated API journey against the Grafana QuickPizza demo API.

The `setup()` function creates a temporary test user, performs login, retrieves a bearer token, and passes the token to the main test flow.

The test then performs a complete CRUD journey:

1. Create a rating
2. Retrieve ratings
3. Update the rating
4. Retrieve the updated rating and verify the change
5. Delete the rating

The scenario demonstrates:

- Dynamic test-data creation
- Authentication token handling
- Bearer authentication
- POST, GET, PUT, and DELETE requests
- Response-body validation
- Resource ID correlation between requests
- Custom endpoint timing metrics
- Cleanup of created test data

This test is intentionally executed as a small functional API journey rather than a load scenario.

---

### 5. Authenticated API Load Test

File: `tests/api-auth-load-test.js`

Authenticated load test against the QuickPizza ratings endpoint.

A temporary user is created and authenticated once in `setup()`. The returned bearer token is then reused by the virtual users during the load scenario.

Workload model:

- Ramp to 5 VUs and hold
- Ramp to 10 VUs and hold
- Ramp to 20 VUs and hold
- Ramp back down to 0

The scenario uses:

- Authenticated GET requests
- `ramping-vus` executor
- Custom `ratings_duration` timing metric
- Custom `ratings_failures` rate
- Functional checks separated from performance thresholds

Thresholds include:

- HTTP failure rate < 1%
- HTTP p95 < 800 ms
- Ratings endpoint p95 < 800 ms
- More than 99% of checks must pass
- Ratings functional failure rate < 1%

The separation between functional checks and performance thresholds is intentional: a valid HTTP response is evaluated independently from whether the response time meets the performance target.

---

### 6. GraphQL Diagnostic / Performance Test

File: `tests/graphql-load-test.js`

GraphQL test against the public Countries GraphQL API.

The request uses a parameterized GraphQL query with a randomly selected country code and validates both the HTTP response and the GraphQL response body.

Checks include:

- HTTP status is 200
- GraphQL `data` is returned
- Country data exists
- Returned country code matches the requested variable
- GraphQL response does not contain an `errors` object

Custom metrics:

- `graphql_query_duration`
- `graphql_failures`

The current scenario intentionally uses a low request rate because the target is a public demo API and is not treated as a stress-test environment.

Example diagnostic execution:

- 23 requests
- 100% checks passed
- 0% HTTP failures
- 0% GraphQL failures
- GraphQL query p95: approximately 264 ms

A higher-volume exploratory run resulted in a large number of rejected requests, indicating public-endpoint rate limiting or traffic protection. For that reason, the committed scenario remains deliberately conservative rather than attempting to stress a third-party public service.

This test also demonstrates an important GraphQL validation point: HTTP 200 alone is not sufficient, because GraphQL-level errors can still be returned in the response body.

---

## Reports

An exported k6 web dashboard report is included at:

`Reports/authenticated-api-load-report.html`

The report provides a visual view of the authenticated REST API load test, including throughput, timing percentiles, checks, failures, and custom metrics.

---

## GitHub Actions

The repository includes a GitHub Actions workflow at:

`.github/workflows/k6.yml`

The workflow automatically executes the k6 smoke test when changes are pushed to the main branch.

The workflow:

1. Checks out the repository
2. Sets up Grafana k6
3. Executes the smoke test
4. Evaluates the configured thresholds
5. Fails the workflow if the performance criteria are not met

This demonstrates a basic integration of performance testing into a CI/CD pipeline.

---

## Running the Tests

Install k6 and run a test from the repository root, for example:

```bash
k6 run tests/smoke-test.js