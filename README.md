# k6 Performance Testing Demo

This repository contains a hands-on performance testing project built with Grafana k6.

The project demonstrates protocol-level load testing, authenticated REST API testing, browser-based user journeys, GraphQL validation, custom metrics, performance thresholds, HTML reporting, and CI execution with GitHub Actions.

The goal is to demonstrate how functional validation and performance acceptance criteria can be combined in realistic k6 scenarios.

---

## Technologies and Concepts

- Grafana k6
- JavaScript
- REST API testing
- GraphQL testing
- Authentication and bearer tokens
- CRUD API flows
- Dynamic test data
- Ramping virtual users
- Custom `Trend` and `Rate` metrics
- Performance thresholds
- Browser testing
- Web Vitals
- HTML dashboard reports
- GitHub Actions / CI

---

## Test Scenarios

### 1. Smoke Test

File:

`tests/smoke-test.js`

A basic protocol-level HTTP performance test used as a fast validation of availability and performance criteria.

Configuration:

- 5 virtual users
- 30-second duration
- HTTP GET requests
- HTTP status validation
- Response-time validation
- Performance thresholds

Thresholds:

- HTTP request failure rate < 1%
- p95 response time < 500 ms
- More than 99% of checks must pass

Run:

```bash
k6 run tests/smoke-test.js
```

---

### 2. Browser Flight Search Performance Test

File:

`tests/flight-search-browser.js`

Browser-based performance test using BlazeDemo to simulate a realistic user journey.

Each virtual user:

1. Opens the BlazeDemo website
2. Selects Paris as the departure city
3. Selects Rome as the destination
4. Searches for available flights
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

Run:

```bash
k6 run tests/flight-search-browser.js
```

---

### 3. REST API Login Load Test

File:

`tests/tests-api-load-test.js`

Load test against the Grafana QuickPizza demo API login endpoint.

The workload gradually increases through 5, 10, and 20 virtual users.

The scenario includes:

- POST login requests
- Authentication token validation
- Ramping virtual users
- Custom `login_duration` metric
- Custom `login_failures` metric
- Functional checks
- Performance thresholds

Workload model:

- Ramp to 5 VUs and hold
- Ramp to 10 VUs and hold
- Ramp to 20 VUs and hold
- Ramp back down to 0

Thresholds:

- HTTP failure rate < 1%
- Overall HTTP p95 < 800 ms
- Login p95 < 800 ms
- More than 99% of checks must pass
- Login failure rate < 1%

During the tested workload, the API remained stable and response-time percentiles remained below the configured performance threshold.

Run:

```bash
k6 run tests/tests-api-load-test.js
```

---

### 4. Authenticated REST API CRUD Flow

File:

`tests/api-authenticated-flow.js`

This scenario demonstrates a complete authenticated API journey against the Grafana QuickPizza demo API.

The `setup()` function:

1. Creates a temporary test user
2. Logs in with the generated user
3. Retrieves an authentication token
4. Passes the token to the main test scenario

The main scenario performs a complete CRUD flow:

1. Create a rating
2. Retrieve ratings
3. Update the rating
4. Retrieve the updated rating
5. Verify that the update was successful
6. Delete the rating

The scenario demonstrates:

- Dynamic test-data creation
- Authentication token handling
- Bearer authentication
- POST requests
- GET requests
- PUT requests
- DELETE requests
- Response-body validation
- Resource ID correlation between requests
- Custom endpoint timing metrics
- Test-data cleanup

This scenario is intentionally executed as a small authenticated functional API journey rather than a load test.

Run:

```bash
k6 run tests/api-authenticated-flow.js
```

---

### 5. Authenticated API Load Test

File:

`tests/api-auth-load-test.js`

Authenticated load test against the Grafana QuickPizza ratings endpoint.

A temporary user is created and authenticated once in `setup()`.

The returned bearer token is then reused by the virtual users during the load scenario.

Workload model:

- Ramp to 5 VUs and hold
- Ramp to 10 VUs and hold
- Ramp to 20 VUs and hold
- Ramp back down to 0

The scenario demonstrates:

- Authenticated API requests
- Bearer token reuse
- `ramping-vus` executor
- Custom `ratings_duration` timing metric
- Custom `ratings_failures` metric
- Functional response validation
- Performance thresholds

Thresholds:

- HTTP failure rate < 1%
- HTTP p95 < 800 ms
- Ratings endpoint p95 < 800 ms
- More than 99% of checks must pass
- Ratings functional failure rate < 1%

Functional validation and performance acceptance are intentionally evaluated separately.

A response can therefore be functionally successful while still failing a performance threshold if its response time is too high.

Example successful execution:

- 100% functional checks passed
- 0% HTTP failures
- 0% custom ratings failures
- Ratings endpoint p95 remained below the configured 800 ms threshold

Run:

```bash
k6 run tests/api-auth-load-test.js
```

---

### 6. GraphQL Diagnostic Performance Test

File:

`tests/graphql-load-test.js`

GraphQL test against the public Countries GraphQL API.

The request uses a parameterized GraphQL query with a randomly selected country code.

The response is validated at both HTTP and GraphQL level.

Checks include:

- HTTP status is 200
- GraphQL `data` object exists
- Country data is returned
- Returned country code matches the requested variable
- GraphQL response does not contain an `errors` object

Custom metrics:

- `graphql_query_duration`
- `graphql_failures`

The committed scenario intentionally uses a low request rate because the target is a public demo API and is not treated as a dedicated stress-test environment.

Example diagnostic execution:

- 23 requests
- 100% checks passed
- 0% HTTP failures
- 0% GraphQL failures
- GraphQL query p95: approximately 264 ms

A higher-volume exploratory run resulted in a large number of rejected requests, which was consistent with traffic protection or rate limiting on the public endpoint.

For that reason, the committed scenario remains deliberately conservative rather than attempting to stress a third-party public service.

This scenario also demonstrates an important GraphQL testing principle:

**HTTP 200 alone does not guarantee a successful GraphQL request.**

GraphQL-level errors can still be returned inside the response body, so the `errors` field is validated separately.

Run:

```bash
k6 run tests/graphql-load-test.js
```

---

## Performance Thresholds

The project uses k6 thresholds as measurable performance acceptance criteria.

Examples include:

```javascript
http_req_failed: ['rate<0.01']
http_req_duration: ['p(95)<800']
checks: ['rate>0.99']
```

Custom metrics are also used for specific endpoints and scenarios.

Example:

```javascript
ratings_duration: ['p(95)<800']
ratings_failures: ['rate<0.01']
```

This allows each test to evaluate both:

- Functional correctness
- Performance behaviour

---

## Custom Metrics

The project uses custom k6 metrics such as:

### Trend

Used to record response-time distributions for specific operations.

Example:

```javascript
const ratingsDuration =
  new Trend('ratings_duration', true);
```

### Rate

Used to calculate the percentage of failed business or functional operations.

Example:

```javascript
const ratingsFailures =
  new Rate('ratings_failures');
```

Custom metrics make it possible to evaluate individual business operations independently from global HTTP metrics.

---

## HTML Performance Report

The repository contains an exported k6 web dashboard report:

`Reports/authenticated-api-load-report.html`

The report contains visual information about the authenticated API load test, including:

- Request throughput
- Response-time percentiles
- Checks
- HTTP failures
- Custom metrics
- Virtual users
- Request duration distribution

The report was generated using the built-in k6 web dashboard.

Example PowerShell execution:

```powershell
$env:K6_WEB_DASHBOARD="true"
$env:K6_WEB_DASHBOARD_OPEN="true"
$env:K6_WEB_DASHBOARD_EXPORT="Reports/authenticated-api-load-report.html"

k6 run tests/api-auth-load-test.js
```

---

## GitHub Actions

The project includes a GitHub Actions workflow:

`.github/workflows/k6.yml`

The workflow automatically runs the k6 smoke test when changes are pushed to the `main` branch or when a pull request targets `main`.

The workflow:

1. Checks out the repository
2. Installs Grafana k6
3. Executes the smoke test
4. Evaluates the configured thresholds
5. Fails the workflow if the performance criteria are not met

This demonstrates how performance tests can be integrated into a CI/CD pipeline.

---

## Running the Tests

Clone the repository and make sure Grafana k6 is installed.

Run the tests from the repository root.

Smoke test:

```bash
k6 run tests/smoke-test.js
```

REST API login load test:

```bash
k6 run tests/tests-api-load-test.js
```

Authenticated CRUD flow:

```bash
k6 run tests/api-authenticated-flow.js
```

Authenticated API load test:

```bash
k6 run tests/api-auth-load-test.js
```

GraphQL diagnostic test:

```bash
k6 run tests/graphql-load-test.js
```

Browser test:

```bash
k6 run tests/flight-search-browser.js
```

---

## Project Structure

```text
k6-performance-demo/
│
├── .github/
│   └── workflows/
│       └── k6.yml
│
├── Reports/
│   └── authenticated-api-load-report.html
│
├── tests/
│   ├── api-auth-load-test.js
│   ├── api-authenticated-flow.js
│   ├── flight-search-browser.js
│   ├── graphql-load-test.js
│   ├── smoke-test.js
│   └── tests-api-load-test.js
│
└── README.md
```

---

## Key Learning Areas Demonstrated

This project currently demonstrates practical experience with:

- Designing k6 performance scenarios
- Building realistic workload models
- Using virtual-user ramp-up and ramp-down stages
- Testing REST APIs
- Testing authenticated endpoints
- Managing bearer tokens
- Correlating dynamic resource IDs
- Testing CRUD operations
- Testing GraphQL APIs
- Validating GraphQL-level errors
- Creating custom k6 metrics
- Defining measurable performance thresholds
- Separating functional validation from performance criteria
- Testing browser user journeys
- Monitoring Web Vitals
- Exporting HTML performance reports
- Running performance tests in CI

---

## Next Steps

Planned extensions include:

- Running performance tests against locally controlled services
- Docker-based test environments
- Grafana and Prometheus observability
- Additional CI/CD performance-test execution
- More advanced workload models
- Additional API protocols and scenarios