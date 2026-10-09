import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const BASE_URL = 'https://quickpizza.grafana.com';

// --------------------------------------------------
// Custom Metrics
// --------------------------------------------------

const createRatingDuration = new Trend('create_rating_duration');
const getRatingsDuration = new Trend('get_ratings_duration');
const updateRatingDuration = new Trend('update_rating_duration');
const deleteRatingDuration = new Trend('delete_rating_duration');

// --------------------------------------------------
// Test Configuration
// --------------------------------------------------

export const options = {
  vus: 1,
  iterations: 1,

  thresholds: {
    checks: ['rate>0.99'],
    http_req_failed: ['rate<0.01'],

    create_rating_duration: ['p(95)<800'],
    get_ratings_duration: ['p(95)<800'],
    update_rating_duration: ['p(95)<800'],
    delete_rating_duration: ['p(95)<800'],
  },
};

// --------------------------------------------------
// Generate Random User
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

const USERNAME =
  `${randomString(10)}@example.com`;

const PASSWORD = 'secret';

// --------------------------------------------------
// SETUP
// Create user + Login + Get Token
// --------------------------------------------------

export function setup() {

  const createUserResponse = http.post(
    `${BASE_URL}/api/users`,
    JSON.stringify({
      username: USERNAME,
      password: PASSWORD,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  check(createUserResponse, {
    'test user created':
      (r) => r.status === 201,
  });


  const loginResponse = http.post(
    `${BASE_URL}/api/users/token/login`,
    JSON.stringify({
      username: USERNAME,
      password: PASSWORD,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );


  check(loginResponse, {
    'login successful':
      (r) => r.status === 200,

    'auth token returned':
      (r) =>
        r.json('token') !== undefined,
  });


  const token =
    loginResponse.json('token');

  return {
    token: token,
  };
}


// --------------------------------------------------
// MAIN TEST
// --------------------------------------------------

export default function (data) {

  const headers = {
    headers: {
      Authorization: `Bearer ${data.token}`,
      'Content-Type': 'application/json',
    },
  };


  let ratingId;


  // ==================================================
  // STEP 1 - CREATE RATING
  // ==================================================

  group('Create rating', () => {

    const payload = JSON.stringify({
      stars: 2,
      pizza_id: 1,
    });

    const response = http.post(
      `${BASE_URL}/api/ratings`,
      payload,
      headers
    );

    createRatingDuration.add(
      response.timings.duration
    );

    const success = check(response, {
      'rating created - status 201':
        (r) => r.status === 201,

      'rating id returned':
        (r) =>
          r.json('id') !== undefined,
    });

    if (success) {
      ratingId = response.json('id');
    }

  });


  sleep(1);


  // ==================================================
  // STEP 2 - READ RATINGS
  // ==================================================

  group('Read ratings', () => {

    const response = http.get(
      `${BASE_URL}/api/ratings`,
      headers
    );

    getRatingsDuration.add(
      response.timings.duration
    );

    check(response, {
      'ratings retrieved - status 200':
        (r) => r.status === 200,

      'ratings list exists':
        (r) =>
          r.json('ratings') !== undefined,
    });

  });


  sleep(1);


  // ==================================================
  // STEP 3 - UPDATE RATING
  // ==================================================

  group('Update rating', () => {

    const payload = JSON.stringify({
      stars: 5,
    });

    const response = http.put(
      `${BASE_URL}/api/ratings/${ratingId}`,
      payload,
      headers
    );

    updateRatingDuration.add(
      response.timings.duration
    );

    check(response, {
      'rating updated - status 200':
        (r) => r.status === 200,

      'rating updated to 5 stars':
        (r) =>
          r.json('stars') === 5,
    });

  });


  sleep(1);


  // ==================================================
  // STEP 4 - VERIFY UPDATED RATING
  // ==================================================

  group('Verify updated rating', () => {

    const response = http.get(
      `${BASE_URL}/api/ratings/${ratingId}`,
      headers
    );

    check(response, {
      'updated rating retrieved':
        (r) => r.status === 200,

      'updated value confirmed':
        (r) =>
          r.json('stars') === 5,
    });

  });


  sleep(1);


  // ==================================================
  // STEP 5 - DELETE RATING
  // ==================================================

  group('Delete rating', () => {

    const response = http.del(
      `${BASE_URL}/api/ratings/${ratingId}`,
      null,
      headers
    );

    deleteRatingDuration.add(
      response.timings.duration
    );

    check(response, {
      'rating deleted - status 204':
        (r) => r.status === 204,
    });

  });

}