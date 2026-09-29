# k6 Performance Testing Demo

This repository contains a small performance testing project created with Grafana k6.

The purpose of this project is to demonstrate basic protocol-level performance testing, browser-based user journeys, performance thresholds, Web Vitals monitoring, and CI execution using GitHub Actions.

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