import { GraphQLObjectType } from 'graphql';

import UserError from '../UserError';

// a field used as a flag if authorization for a field was set up
const HAS_AUTHORIZATION_SETUP = Symbol('HAS_AUTHORIZATION_SETUP');
// a field for which authorization set up is not checked
// (it is checked in different ways for query, mutation and stats fields,
// also more concrete returned fields are checked)
const IGNORED_TYPE_NAMES = new Set([
  'Query',
  'Mutation',
  'ActivityLogCollection',
  'PageInfo',
  'Stats',
  'DailyUsageStats',
  'EncryptionStats',
  'TrafficStats',
  'UsageStats',
  'UsedStorageStats',
]);

// `adminOnly`, `allFieldsPublic` and `authorized` are functions which
// setup authorization for GraphQL types. All of these functions accepts
// an object as a parameter with at least two required fields:
// - `schemaObject` - a GraphQL schema object
// - `typeName` - a name of the type in the schema
// These methods returns a function which takes a resolver map
// in a graphql-tools format: https://github.com/apollographql/graphql-tools
// Please use empty object if the type doesn't require specific resolvers.

// all fields in the type are available only for admin users
export function adminOnly({ schemaObject, typeName }) {
  return setupTypeAuthorization({
    schemaObject,
    typeName,
    setupFunction({ fieldName, originalResolver }) {
      return (item, args, ctx, info) => {
        const { user } = ctx;
        if (!ctx.users.isAdministrator(user)) {
          throw new UserError('Access denied');
        }
        if (typeof originalResolver === 'function') {
          return originalResolver(item, args, ctx, info);
        }
        return item[fieldName];
      };
    },
  });
}

// all fields in the type are public
export function allFieldsPublic({ schemaObject, typeName }) {
  return setupTypeAuthorization({
    schemaObject,
    typeName,
    setupFunction({ fieldName, originalResolver }) {
      if (typeof originalResolver === 'function') {
        return originalResolver;
      }
      return item => item[fieldName];
    },
  });
}

// Setup authorization rules. By default all fields of the type are visible
// to the owner (the check is done by the function provided as the `isOwner`
// - be default it checks if the `user_id` field of the item is equal to
// user's id) and none of them is visible to other users.
// It can be customized by providing `adminVisibleFields` - fields
// which should be also visible for admins, and `publicFields`.
// `schemaObject` is a GraphQL schema object and `typeName` is the name of the
// type in the schema.
export function authorized({
  isOwner = isOwnerDefault,
  publicFields = [],
  adminVisibleFields = [],
  adminOnlyFields = [],
  schemaObject,
  typeName,
}) {
  const adminVisibleFieldsSet = new Set(adminVisibleFields);
  const adminOnlyFieldsSet = new Set(adminOnlyFields);
  const publicFieldsSet = new Set(publicFields);
  return setupTypeAuthorization({
    schemaObject,
    typeName,
    setupFunction({ fieldName, originalResolver }) {
      if (adminOnlyFieldsSet.has(fieldName)) {
        return (item, args, ctx, info) => {
          const { user } = ctx;
          if (!ctx.users.isAdministrator(user)) {
            throw new UserError('Access denied');
          }
          if (typeof originalResolver === 'function') {
            return originalResolver(item, args, ctx, info);
          }
          return item[fieldName];
        };
      }
      if (publicFieldsSet.has(fieldName)) {
        if (typeof originalResolver === 'function') {
          return originalResolver;
        }
        return item => item[fieldName];
      }

      return (item, args, ctx, info) => {
        const { user } = ctx;
        if (
          isOwner(user, item) ||
          (ctx.users.isAdministrator(user) &&
            adminVisibleFieldsSet.has(fieldName))
        ) {
          if (typeof originalResolver === 'function') {
            return originalResolver(item, args, ctx, info);
          }
          return item[fieldName];
        }
        throw new UserError('Access denied');
      };
    },
  });
}

// A default implementation of the `isOwner` check. A user is considered
// an owner if `user_id` field of the item is equal to his `id` value.
function isOwnerDefault(user, item) {
  return item.user_id === user.id;
}

// A helper function for the authorization setup. Used by higher-level helpers
// (`adminOnly`, `allFieldsPublic` and `authorized`). Accepts
// an object as a parameter with three required fields:
// - `schemaObject` - a GraphQL schema object
// - `typeName` - a name of the type in the schema
// - `setupFunction` - a function invoked for each field in the type
//   which should return a resolver for the field with authorization set up.
//   The function is invoked with an object as an argument which has
//   the following format: { fieldName, originalResolver }
function setupTypeAuthorization({ schemaObject, typeName, setupFunction }) {
  const typeFields = schemaObject.getType(typeName).getFields();
  return resolvers => {
    return Object.keys(typeFields).reduce((result, fieldName) => {
      const originalResolver = resolvers[fieldName];
      const resolver = setupFunction({
        fieldName,
        originalResolver,
      });
      resolver[HAS_AUTHORIZATION_SETUP] = true;
      result[fieldName] = resolver;
      return result;
    }, {});
  };
}

// Check if all types and fields in the schema (except the ones explicitly
// ignored) have access control rules defined or throws otherwise.
export function ensureAuthorizationSetup(schema) {
  const typeMap = schema.getTypeMap();
  Object.keys(typeMap).forEach(typeName => {
    if (typeName[0] === '_' || IGNORED_TYPE_NAMES.has(typeName)) {
      return;
    }
    const type = typeMap[typeName];
    if (!(type instanceof GraphQLObjectType)) {
      return;
    }
    const fieldMap = type.getFields();
    Object.keys(fieldMap).forEach(fieldName => {
      const field = fieldMap[fieldName];
      if (!(field.resolve && field.resolve[HAS_AUTHORIZATION_SETUP])) {
        throw new Error(
          `Authorization not set up for ${typeName}.${fieldName}`
        );
      }
    });
  });
}
