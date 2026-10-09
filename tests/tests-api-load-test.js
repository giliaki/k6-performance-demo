import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// --------------------------------------------------
// Custom Metrics
// --------------------------------------------------

const loginDuration =
  new Trend('login_duration', true);

const loginFailures =
  new Rate('login_failures');

const BASE_URL =
  'https://quickpizza.grafana.com';

// --------------------------------------------------
// Test Configuration
// --------------------------------------------------

export const options = {

  scenarios: {

    api_load_test: {

      executor: 'ramping-vus',

      stages: [

        { duration: '10s', target: 5 },
        { duration: '20s', target: 5 },

        { duration: '10s', target: 10 },
        { duration: '20s', target: 10 },

        { duration: '10s', target: 20 },
        { duration: '30s', target: 20 },

        { duration: '10s', target: 0 },

      ],
    },
  },

  thresholds: {

    // Less than 1% HTTP errors
    http_req_failed: [
      'rate<0.01',
    ],

    // 95% of all HTTP requests below 800 ms
    http_req_duration: [
      'p(95)<800',
    ],

    // More than 99% of functional checks must pass
    checks: [
      'rate>0.99',
    ],

    // Login endpoint performance
    login_duration: [
      'p(95)<800',
    ],

    // Less than 1% functional login failures
    login_failures: [
      'rate<0.01',
    ],
  },
};

// --------------------------------------------------
// Test Scenario
// --------------------------------------------------

export default function () {

  const url =
    `${BASE_URL}/api/users/token/login`;

  // --------------------------------------------------
  // Request Payload
  // --------------------------------------------------

  const payload = JSON.stringify({

    username: 'default',
    password: '1234',

  });

  const params = {

    headers: {

      'Content-Type':
        'application/json',

    },

    tags: {

      endpoint:
        'login',

    },
  };

  // --------------------------------------------------
  // Send Login Request
  // --------------------------------------------------

  const response =
    http.post(
      url,
      payload,
      params
    );

  // --------------------------------------------------
  // Custom Performance Metric
  // --------------------------------------------------

  loginDuration.add(
    response.timings.duration
  );

  // --------------------------------------------------
  // Functional Checks
  // --------------------------------------------------

  const success =
    check(response, {

      'login status is 200':
        (r) =>
          r.status === 200,

      'response contains token':
        (r) =>
          r.json('token') !== undefined,

    });

  // --------------------------------------------------
  // Functional Failure Metric
  // --------------------------------------------------

  loginFailures.add(
    !success
  );

  // Simulated user think time
  sleep(1);
}