import semver from 'semver';

import { version } from '../../package.json';

const API_VERSION_HEADER_EXPECTED = 'X-API-Version-Expected';
const API_VERSION_HEADER = 'X-API-Version';

// A simple middleware checking if the server supports the API version
// specified in the `X-API-Version-Expected` request header. The check is omitted
// if there is no such header in the request.
export default function apiVersionCheck(ctx, next) {
  // add a header with the current api version to the response
  ctx.set(API_VERSION_HEADER, version);
  const expectedApiVersion = ctx.get(API_VERSION_HEADER_EXPECTED);
  if (!expectedApiVersion) {
    // api version not specified - accept the request
    return next();
  }
  let satisfies;
  // check if the expected api version is in the valid semver format
  // and is satisfied by the server version
  // Carret ranges are used for testing
  // https://github.com/npm/node-semver#caret-ranges-123-025-004

  // Check if exact version is specified
  if (semver.valid(expectedApiVersion) === expectedApiVersion) {
    const expectedApiVersionRange = `^${expectedApiVersion}`;
    try {
      satisfies = semver.satisfies(version, expectedApiVersionRange);
    } catch (error) {
      satisfies = false;
    }
  } else {
    satisfies = false;
  }
  if (!satisfies) {
    ctx.throw(418, 'Unsupported API Version');
  }
  return next();
}
