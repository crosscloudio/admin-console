import ExtendableError from 'es6-error';

/**
 * A base class for all errors which messages should be visible to end users.
 * Instances of this class don't have a message filtered in the GraphQL
 * responses.
 */
export default class UserError extends ExtendableError {}
