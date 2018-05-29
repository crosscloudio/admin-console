import ApolloClient, {
  addTypename,
  createNetworkInterface,
} from 'apollo-client';

import { AUTH_TOKEN_STORAGE_FIELD } from '../constants/AuthConstants';

export default function createApolloClient() {
  // configure network interface to use with apollo
  // http://dev.apollodata.com/react/auth.html
  // TODO: use batching middleware. Currently it doesn't support
  // afterware for checking if 401 response was sent
  // http://dev.apollodata.com/core/network.html#query-batching
  // https://github.com/apollostack/apollo-client/issues/889
  const networkInterface = createNetworkInterface({
    uri: '/graphql',
  });

  networkInterface.use([
    {
      applyMiddleware(request, next) {
        if (!request.options.headers) {
          request.options.headers = {}; // Create the header object if needed.
        }

        // get the authentication token from local storage if it exists
        const token = localStorage.getItem(AUTH_TOKEN_STORAGE_FIELD);
        request.options.headers.authorization = token
          ? `Bearer ${token}`
          : null;
        next();
      },
    },
  ]);

  // If the service responds with 401 error the token is probably expired.
  // Remove it and reload the page.
  networkInterface.useAfter([
    {
      applyAfterware({ response }, next) {
        if (response.status === 401) {
          localStorage.removeItem(AUTH_TOKEN_STORAGE_FIELD);
          window.location.reload();
        }
        next();
      },
    },
  ]);

  const client = new ApolloClient({
    // automatically append `__typename` to all objects
    queryTransformer: addTypename,

    // Set object id for normalization
    // http://dev.apollodata.com/react/cache-updates.html
    dataIdFromObject: result => {
      /* eslint-disable no-underscore-dangle */
      if (result.id && result.__typename) {
        return result.__typename + result.id;
      }
      /* eslint-enable no-underscore-dangle */

      return null;
    },

    networkInterface,
  });

  return client;
}
