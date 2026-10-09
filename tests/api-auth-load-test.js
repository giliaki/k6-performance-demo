import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const BASE_URL = 'https://quickpizza.grafana.com';

// --------------------------------------------------
// Custom Metrics
// --------------------------------------------------

const ratingsDuration = new Trend('ratings_duration', true);
const ratingsFailures = new Rate('ratings_failures');


// --------------------------------------------------
// Test Configuration
// --------------------------------------------------

export const options = {

  scenarios: {

    authenticated_api_load: {

      executor: 'ramping-vus',

      stages: [
        { duration: '10s', target: 5 },   // ramp up to 5
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

    // Less than 1% HTTP request failures
    http_req_failed: ['rate<0.01'],

    // 95% of all HTTP requests below 800ms
    http_req_duration: ['p(95)<800'],

    // More than 99% of checks must pass
    checks: ['rate>0.99'],

    // Authenticated ratings endpoint
    ratings_duration: ['p(95)<800'],

    // Less than 1% failures in our ratings scenario
    ratings_failures: ['rate<0.01'],
  },
};


// --------------------------------------------------
// Random Test User
// --------------------------------------------------

function randomString(length) {

  const chars = 'abcdefghijklmnopqrstuvwxyz';

  let result = '';

  for (let i = 0; i < length; i++) {

    result += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );

  }

  return result;
}


// --------------------------------------------------
// SETUP
// Create User + Login + Get Authentication Token
// --------------------------------------------------

export function setup() {

  const username =
    `${randomString(12)}@example.com`;

  const password = 'secret';


  // --------------------------------------------------
  // Create temporary user
  // --------------------------------------------------

  const createUserResponse = http.post(

    `${BASE_URL}/api/users`,

    JSON.stringify({
      username: username,
      password: password,
    }),

    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );


  check(createUserResponse, {

    'setup - user created':
      (r) => r.status === 201,

  });


  // --------------------------------------------------
  // Login
  // --------------------------------------------------

  const loginResponse = http.post(

    `${BASE_URL}/api/users/token/login`,

    JSON.stringify({
      username: username,
      password: password,
    }),

    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );


  check(loginResponse, {

    'setup - login successful':
      (r) => r.status === 200,

    'setup - token received':
      (r) => r.json('token') !== undefined,

  });

  const token =
    loginResponse.json('token');


  if (!token) {

    throw new Error(
      'Authentication token was not returned.'
    );

  }


  return {
    token: token,
  };
}


// --------------------------------------------------
// MAIN LOAD TEST
// --------------------------------------------------

export default function (data) {

  const params = {

    headers: {

      Authorization:
        `Bearer ${data.token}`,

      'Content-Type':
        'application/json',

    },

    tags: {

      endpoint:
        'authenticated_ratings',

    },
  };


  // --------------------------------------------------
  // Authenticated GET /api/ratings
  // --------------------------------------------------

  const response = http.get(

    `${BASE_URL}/api/ratings`,

    params

  );


  // Record endpoint response time
  ratingsDuration.add(
    response.timings.duration
  );


  // --------------------------------------------------
  // Validate Response
  // --------------------------------------------------
const success = check(response, {

  'ratings status is 200':
    (r) => r.status === 200,

  'ratings response exists':
    (r) => r.body !== null &&
           r.body.length > 0,

});

ratingsFailures.add(!success);


  // Simulated user think time
  sleep(1);
}