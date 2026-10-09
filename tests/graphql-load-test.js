import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const GRAPHQL_URL = 'https://countries.trevorblades.com/';

// --------------------------------------------------
// Custom Metrics
// --------------------------------------------------

const graphqlQueryDuration =
  new Trend('graphql_query_duration', true);

const graphqlFailures =
  new Rate('graphql_failures');

// --------------------------------------------------
// Test Configuration
// Small diagnostic load
// --------------------------------------------------

export const options = {

  scenarios: {

    graphql_diagnostic_test: {

      executor: 'ramping-vus',

      stages: [
        { duration: '5s', target: 1 },
        { duration: '15s', target: 1 },
        { duration: '5s', target: 0 },
      ],
    },
  },

  thresholds: {

    http_req_failed: ['rate<0.01'],

    http_req_duration: ['p(95)<800'],

    checks: ['rate>0.99'],

    graphql_query_duration: ['p(95)<800'],

    graphql_failures: ['rate<0.01'],
  },
};

// --------------------------------------------------
// GraphQL Query
// --------------------------------------------------

const query = `
  query GetCountry($code: ID!) {

    country(code: $code) {

      code
      name
      capital
      currency

      continent {
        code
        name
      }

      languages {
        code
        name
      }

    }
  }
`;

// --------------------------------------------------
// Test Data
// --------------------------------------------------

const countryCodes = [
  'GR',
  'CY',
  'US',
  'GB',
  'DE',
  'FR',
  'IT',
  'JP',
];

// --------------------------------------------------
// Main Test
// --------------------------------------------------

export default function () {

  // Pick random country
  const countryCode =
    countryCodes[
      Math.floor(
        Math.random() * countryCodes.length
      )
    ];

  // --------------------------------------------------
  // Request Body
  // --------------------------------------------------

  const payload = JSON.stringify({

    query: query,

    variables: {
      code: countryCode,
    },

  });

  const params = {

    headers: {
      'Content-Type': 'application/json',
    },

    tags: {
      endpoint: 'graphql_country_query',
    },

  };

  // --------------------------------------------------
  // Send GraphQL Request
  // --------------------------------------------------

  const response = http.post(
    GRAPHQL_URL,
    payload,
    params
  );

  // --------------------------------------------------
  // Diagnostic Logging
  // --------------------------------------------------

  if (response.status !== 200) {

    console.log(
      `FAILED REQUEST - STATUS: ${response.status}`
    );

    console.log(
      `FAILED REQUEST - BODY: ${response.body}`
    );

  }

  // --------------------------------------------------
  // Custom Performance Metric
  // --------------------------------------------------

  graphqlQueryDuration.add(
    response.timings.duration
  );

  // --------------------------------------------------
  // Parse Response
  // --------------------------------------------------

  let body;

  try {

    body = response.json();

  } catch (error) {

    body = null;

    console.log(
      `JSON PARSE ERROR - STATUS: ${response.status}`
    );

    console.log(
      `RAW BODY: ${response.body}`
    );

  }

  // --------------------------------------------------
  // Functional Checks
  // --------------------------------------------------

  const success = check(response, {

    'HTTP status is 200':
      (r) => r.status === 200,

    'GraphQL response contains data':
      () =>
        body !== null &&
        body.data !== undefined,

    'country data returned':
      () =>
        body?.data?.country !== null &&
        body?.data?.country !== undefined,

    'country code matches request':
      () =>
        body?.data?.country?.code ===
        countryCode,

    'GraphQL response contains no errors':
      () =>
        body?.errors === undefined,

  });

  // --------------------------------------------------
  // Functional Failure Metric
  // --------------------------------------------------

  graphqlFailures.add(!success);

  // Slow down requests intentionally
  sleep(1);
}