/* Copyright 2016-2017 Daniel Trojanowski

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import DataLoader from 'dataloader';
import { groupBy, keyBy, sortBy } from 'lodash';

const PAGINATION_DEFAULT_LIMIT = 10;
const PAGINATION_MAX_LIMIT = 20;

async function loadItemsByField(knex, table, fieldName, fieldValues) {
  const items = await knex(table).whereIn(fieldName, fieldValues);
  const itemsByFieldValue = keyBy(items, fieldName);
  return fieldValues.map(value => itemsByFieldValue[value]);
}

/**
 * Create an instance of DataLoader which uses knex.js to load data from
 * the provided table by `fieldName` as a key.
 * Example usage:
 * ```
 * async () => {
 *   const myLoader = itemsByValueLoader(knex, 'users_table', 'id');
 *   // `user` will be an object with id = 2 loaded from `users_table`
 *   // (or null if there is no object with such id in this table)
 *   const user = await myLoader.load(2);
 * }
 * ```
 * @param {Object} knex - an instance of the knex.js object
 * @param {string} table - the name of the table to load items from
 * @param {string} fieldName - the name of the field which should be used as
 * a key
 * @returns {DataLoader}
 */
export function itemsByValueLoader(knex, table, fieldName) {
  return new DataLoader(fieldValues => {
    return loadItemsByField(knex, table, fieldName, fieldValues);
  });
}

/**
 * Create an instance of DataLoader which uses knex.js to load data from
 * the provided table by grouping them by `relatedField` (which is also
 * used as a key) and sorting by `extraOrderField`.
 * Example usage:
 * ```
 * async () => {
 *   const myLoader = relatedItemsLoader(
 *     knex, 'todos_table', 'user_id', 'priority'
 *   );
 *   // `todos` will be an array of objects with `user_id` = 5 loaded from
 *   // `todos_table` ordered by `priority`
 *   const todos = await myLoader.load(5);
 * }
 * ```
 * @param {Object} knex -  an instance of the knex.js object
 * @param {string} table - the name of the table to load items from
 * @param {string} fieldName - the name of the field which should be used
 * for grouping items and as a key
 * @param {string} extraOrderField - the name of the field used for sorting
 * items
 * @returns {DataLoader}
 */
export function relatedItemsLoader(knex, table, relatedField, extraOrderField) {
  return new DataLoader(async relatedFieldIds => {
    const query = knex(table)
      .where(relatedField, 'in', relatedFieldIds)
      .orderByRaw('?, ?', [relatedField, extraOrderField]);
    const items = await query;
    const itemsByRelatedFieldId = groupBy(items, relatedField);
    return relatedFieldIds.map(id =>
      sortBy(itemsByRelatedFieldId[id] || [], extraOrderField)
    );
  });
}

/**
 * A simpler version of Relay connections. Used for cursor based pagination.
 * @param {Object} knex -  an instance of the knex.js object
 * @param {string} table - the name of the table to load items from
 * @param {Object} options - consists of the following (optional) params:
 *  - before - load items only with id < `before`
 *  - after - load items only with id > `after`
 *  - first - load n first items
 *  - last - load n last items
 *  - extraFilters - extra WHERE clause to apply (in knex.js format)
 * @returns {Promise<Object>}
 */
export async function loadConnection(
  knex,
  table,
  { before, after, first, last, extraFilters }
) {
  if (first && last) {
    throw new Error('Combining `first` and `last` is not supported');
  }

  const descending = !!last;
  const order = descending ? 'desc' : null;
  let limit = last || first;
  if (!limit) {
    limit = PAGINATION_DEFAULT_LIMIT;
  }
  limit = Math.min(limit, PAGINATION_MAX_LIMIT);

  let query = knex(table).limit(limit + 1);

  if (after) {
    query = query.where('id', '>', after);
  }
  if (before) {
    query = query.where('id', '<', before);
  }
  if (extraFilters) {
    query = query.where(extraFilters);
  }

  query = query.orderBy('id', order);

  let entries = await query;

  const hasNextPage = entries.length > limit;

  if (entries.length > limit) {
    entries = entries.slice(0, limit);
  }

  const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null;
  const endCursor = lastEntry ? lastEntry.id : null;

  return {
    entries,
    pageInfo: {
      endCursor,
      hasNextPage,
    },
  };
}
