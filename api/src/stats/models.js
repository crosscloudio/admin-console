import { keyBy, range, sumBy } from 'lodash';

/* eslint-disable camelcase */
// snake_case is used for compatibility with database

// mapping of storage identifiers to names to display in the admin console
const CSP_ID_NAME_MAPPING = {
  one: 'OneDrive',
  odb: 'onedrivebusiness',
  o365: 'office365groups',
  box: 'Box',
  dro: 'Dropbox',
  own: 'OwnCloud',
  gdr: 'Google Drive',
  nex: 'NextCloud',
  cif: 'Windows Share',
};

// Possible sync operation statuses
const SYNC_OPERATION_STATUSES = ['success', 'blocked', 'failed'];

// Sunday is 0 according to the result of Postgresql `extract(dow from column)`
// https://www.postgresql.org/docs/current/static/functions-datetime.html#FUNCTIONS-DATETIME-EXTRACT
const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * A class which instances are created as resolvers for the `Stats` type.
 * All methods return promises which resolves to the actual stats data.
 */
export class StatsHelper {
  /**
   * Create a StatsHelper
   * @param {Object} knex - an instance of the knex.js object
   * @param {Object} -  an object with models / DAO objects returned
   * by the `createModels` function
   * @param {number|string} - the id of the current organization (used for
   * filtering)
   */
  constructor(knex, models, organization_id) {
    this.knex = knex;
    this.models = models;
    this.organization_id = organization_id;
  }

  async active_users_today() {
    const { knex } = this;
    // getting start date of today
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);

    // getting stop date of today
    const stopToday = new Date();
    stopToday.setHours(23, 59, 59, 999);

    const result = await knex.raw(
      `
      SELECT COUNT(*) FROM (
        SELECT DISTINCT user_id FROM activity_logs WHERE
        organization_id = ? AND
        timestamp >= ? AND
        timestamp <= ?
      ) AS count;
    `,
      [this.organization_id, startToday, stopToday]
    );
    return result.rows[0].count;
  }

  async encryption_status() {
    const { knex } = this;
    const result = await this.getFilteredActivityLogs()
      .select('encrypted', knex.raw('count(*) AS count'))
      .groupBy('encrypted');
    const resultByEncryptionStatus = keyBy(result, 'encrypted');
    const getCount = encryped =>
      resultByEncryptionStatus[encryped]
        ? resultByEncryptionStatus[encryped].count
        : 0;
    return {
      encrypted_files: getCount(true),
      not_encrypted_files: getCount(false),
    };
  }

  file_type_usage() {
    const { knex } = this;
    return this.getFilteredActivityLogs()
      .select(knex.raw('mime_type AS type'), knex.raw('count(*) AS count'))
      .groupBy('mime_type')
      .orderBy('count', 'desc')
      .limit(10); // only 10 items are displayed in the dashboard
  }

  policy_usage() {
    const { knex } = this;
    return this.models.policies
      .getTable()
      .where({
        organization_id: this.organization_id,
      })
      .select('type', knex.raw('count(*) AS count'))
      .groupBy('type');
  }

  async sync_operations_status() {
    const { knex } = this;
    const result = await this.getFilteredActivityLogs()
      .select(knex.raw('status AS type'), knex.raw('count(*) AS count'))
      .groupBy('status');

    // statuses returned from database
    const returnedStatuses = new Set(result.map(stats => stats.type));

    // ensure all default operation statuses are in the returned data
    SYNC_OPERATION_STATUSES.forEach(status => {
      if (!returnedStatuses.has(status)) {
        result.push({
          type: status,
          count: 0,
        });
      }
    });
    return result;
  }

  traffic_stats() {
    const { knex } = this;
    return this.getFilteredActivityLogs()
      .select(
        'type',
        knex.raw('count(*) AS count'),
        knex.raw('sum(bytes_transferred) AS traffic')
      )
      .groupBy('type');
  }

  async usage_last_week() {
    const { knex } = this;

    // getting last 7 days usage
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);
    oneWeekAgo.setHours(0, 0, 0, 0);

    const result = await this.getFilteredActivityLogs()
      .where('timestamp', '>=', oneWeekAgo)
      .select(
        knex.raw('extract(dow from timestamp) AS day_of_week'),
        knex.raw('count(*) AS count'),
        knex.raw('sum(bytes_transferred) AS traffic')
      )
      .groupByRaw('extract(dow from timestamp)');

    const resultByDateOfWeek = keyBy(result, 'day_of_week');
    // we need all days of week, even if there was no activity for that day
    const resultForAllWeekdays = range(7).map(day => {
      return resultByDateOfWeek[day] || { day_of_week: day };
    });

    // which day was one week ago
    const firstDay = oneWeekAgo.getDay();
    const resultWithCorrectOrder = [
      ...resultForAllWeekdays.slice(firstDay),
      ...resultForAllWeekdays.slice(0, firstDay),
    ];

    return resultWithCorrectOrder.map(usage => ({
      day: WEEKDAYS[usage.day_of_week],
      count: usage.count || 0,
      traffic: usage.traffic || 0,
    }));
  }

  async used_storages() {
    const { knex } = this;
    const result = await this.getFilteredActivityLogs()
      .select(
        // TODO: add a functional index or store csp_id in a separate column
        knex.raw('substr(storage_id, 0, 4) AS csp_id'),
        knex.raw('count(*) AS count')
      )
      .groupByRaw('substr(storage_id, 0, 4)');

    // summing up the logs to calculate percentages
    // warning: `count` is returned from the database as a string
    const totalTasks = sumBy(result, storage => parseFloat(storage.count));
    return result
      .filter(
        // only return data for csps with name mapping
        storage => CSP_ID_NAME_MAPPING[storage.csp_id]
      )
      .map(storage => ({
        name: CSP_ID_NAME_MAPPING[storage.csp_id],
        count: storage.count,
        // percentage of total usage rounded to two decimals
        percentage:
          Math.round(
            storage.count / totalTasks * 100 * 100 // eslint-disable-line no-mixed-operators
          ) / 100,
      }));
  }

  getFilteredActivityLogs() {
    return this.models.activityLogs.getTable().where({
      organization_id: this.organization_id,
    });
  }
}
