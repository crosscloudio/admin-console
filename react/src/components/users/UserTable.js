import React from 'react';
import { Table } from 'react-bootstrap';
import { observer } from 'mobx-react';

import UserRow from './UserRow';

/**
 * table displaying users and some additional information
 */
@observer
export default class UserTable extends React.Component {
  renderUser = user => {
    const { currentUser, onDelete, onResetUser, onSetEnabled } = this.props;
    return (
      <UserRow
        currentUser={currentUser}
        key={user.id}
        onDelete={onDelete}
        onResetUser={onResetUser}
        onSetEnabled={onSetEnabled}
        user={user}
      />
    );
  };

  render() {
    return (
      <Table striped hover responsive>
        <thead>
          <tr>
            <th>User</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {this.props.users.map(this.renderUser)}
        </tbody>
      </Table>
    );
  }
}
