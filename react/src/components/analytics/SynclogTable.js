import { Link } from 'react-router';
import React from 'react';
import { Table } from 'react-bootstrap';
import cx from 'classnames';

import FormattedDateTime from '../FormattedDateTime';

/**
 * Table displaying sync events by managed users
 */
export default class SynclogTable extends React.Component {
  render() {
    return (
      <Table striped hover responsive>
        <thead>
          <tr>
            <th>Time</th>
            <th>User</th>
            <th>Operation</th>
            <th>Item</th>
            <th>Storages</th>
            <th>Security</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {this.props.activityLogs.map(activity => {
            // getting badge styling dependent on activity
            const securityLabelStyle = cx(
              'label',
              activity.encrypted ? 'label-success' : 'label-danger'
            );

            // getting badge styling dependent on result
            const statusLabelStyle = cx(
              'label',
              activity.status === 'success' ? 'label-success' : 'label-danger'
            );
            // getting storage value to display
            let storageValue = '';
            if (activity.storage_id) {
              storageValue = activity.storage_id.split('_', 1)[0];
            }

            const userInfo = activity.user
              ? <Link to={`/user/${activity.user.id}`}>
                  {activity.user.email}
                </Link>
              : '<Deleted>';
            const storageLink = activity.user
              ? `/user/${activity.user.id}/storages/${activity.storage_id}`
              : null;

            return (
              <tr key={activity.id} className="gradeX">
                <td>
                  <FormattedDateTime date={activity.timestamp} />
                </td>
                <td>
                  {userInfo}
                </td>
                <td>
                  <span className="label label-primary">
                    {activity.type}
                  </span>
                </td>
                <td>
                  {activity.path.join('\\')}
                </td>
                <td>
                  <Link to={storageLink}>
                    <span className="badge badge-primary">
                      {storageValue}
                    </span>
                  </Link>
                </td>
                <td>
                  <span className={securityLabelStyle}>
                    {activity.encrypted ? 'Encrypted' : 'Not Encrypted'}
                  </span>
                </td>
                <td>
                  <span className={statusLabelStyle}>
                    {activity.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    );
  }
}
