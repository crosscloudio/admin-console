import BaseEmails from './BaseEmails';

/**
 * A helper version which dumps the emails to the terminal. It's designed
 * to use in the development mode.
 */
export default class DebugEmails extends BaseEmails {
  async sendImpl(props) {
    console.log(JSON.stringify(props, null, 2)); // eslint-disable-line no-console
  }
}
