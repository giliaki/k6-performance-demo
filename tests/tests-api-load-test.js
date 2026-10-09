import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// --------------------------------------------------
// Custom Metrics
// --------------------------------------------------

const loginDuration = new Trend('login_duration');
const loginFailures = new Rate('login_failures');

const BASE_URL = 'https://quickpizza.grafana.com';


// --------------------------------------------------
// Test Configuration
// --------------------------------------------------
export const options = {
  scenarios: {
    api_load_test: {
      executor: 'ramping-vus',

      stages: [
        { duration: '10s', target: 5 },   // ramp up
        { duration: '20s', target: 5 },   // steady at 5

        { duration: '10s', target: 10 },  // increase to 10
        { duration: '20s', target: 10 },  // steady at 10

        { duration: '10s', target: 20 },  // increase to 20
        { duration: '30s', target: 20 },  // steady at 20

        { duration: '10s', target: 0 },   // ramp down
      ],
    },
  },

  thresholds: {
    // Less than 1% HTTP errors
    http_req_failed: ['rate<0.01'],

    // 95% of requests below 800 ms
    http_req_duration: ['p(95)<800'],

    // All functional checks should pass
    checks: ['rate>0.99'],

    // Custom metric
    login_duration: ['p(95)<800'],

    login_failures: ['rate<0.01'],
  },
};

// --------------------------------------------------
// Test Scenario
// --------------------------------------------------

export default function () {

  const url =
    `${BASE_URL}/api/users/token/login`;


  const payload = JSON.stringify({

    username: 'default',
    password: '1234',

  });


  const params = {

    headers: {

      'Content-Type': 'application/json',

    },

    tags: {

      endpoint: 'login',

    },

  };


  // --------------------------------------------------
  // Send Login Request
  // --------------------------------------------------

  const response =
    http.post(url, payload, params);


  // Store custom response time metric
  loginDuration.add(response.timings.duration);


  // --------------------------------------------------
  // Functional Checks
  // --------------------------------------------------

  const success = check(response, {

    'login status is 200':
      (r) => r.status === 200,

    'response contains token':
      (r) =>
        r.json('token') !== undefined,

    'response time below 800ms':
      (r) =>
        r.timings.duration < 800,

  });


  // Record failed checks
  loginFailures.add(!success);


  // Simulate user think time
  sleep(1);

}