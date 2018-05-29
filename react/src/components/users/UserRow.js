import { Button, Label } from 'react-bootstrap';
import { Link } from 'react-router';
import React from 'react';
import { observer } from 'mobx-react';

import { userPageUrl } from 'utils/urls';

import './UserRow.css';

@observer
export default class UserRow extends React.Component {
  handleDelete = () => {
    const { onDelete, user } = this.props;
    onDelete(user);
  };

  handleResetUser = () => {
    const { onResetUser, user } = this.props;
    onResetUser(user);
  };

  handleToggleEnabled = () => {
    const { onSetEnabled, user } = this.props;
    const enable = !user.is_enabled;
    onSetEnabled(user, enable);
  };

  /**
 * renders the button to change the user status (enable/disable)
 */
  renderChangeUserStatusButton() {
    const { currentUser, user } = this.props;
    // setting text of enable/disable button
    const changeStatusButtonText = user.is_enabled ? 'Disable' : 'Enable';

    // returning button
    return (
      <Button
        bsSize="small"
        disabled={
          !currentUser || currentUser.id === user.id || user.is_resellers_admin
        }
        onClick={this.handleToggleEnabled}
      >
        {changeStatusButtonText}
      </Button>
    );
  }

  /**
 * renders the button to delete the user
 */
  renderDeleteUserButton() {
    const { currentUser, user } = this.props;
    return (
      <Button
        bsSize="small"
        bsStyle="danger"
        disabled={
          !currentUser || currentUser.id === user.id || user.is_resellers_admin
        }
        onClick={this.handleDelete}
      >
        Delete
      </Button>
    );
  }

  /**
 * renders the button to delete the user
 */
  renderResetUserButton() {
    // returning button
    return (
      <Button bsSize="small" bsStyle="danger" onClick={this.handleResetUser}>
        Reset User
      </Button>
    );
  }

  renderButtons() {
    return (
      <span>
        {this.renderChangeUserStatusButton()}&nbsp;
        {this.renderDeleteUserButton()}&nbsp;
        {this.renderResetUserButton()}&nbsp;
      </span>
    );
  }

  render() {
    const { user } = this.props;

    // getting status level
    const labelStyle = user.is_enabled ? 'primary' : 'danger';
    const statusText = user.is_enabled ? 'enabled' : 'disabled';

    // defining link to navigate to upon click on email address
    const userLinkTo = userPageUrl(user);

    // Don't render a link for the resellers super-admin
    const linkColumn = user.is_resellers_admin
      ? user.email
      : <Link to={userLinkTo}>
          {user.email}
        </Link>;

    const className = user.is_resellers_admin ? 'UserRow--greyed-out' : null;
    return (
      <tr className={className} key={user.id}>
        <td>
          {linkColumn}
        </td>
        <td>
          <Label bsStyle={labelStyle}>{statusText}</Label>&nbsp;
        </td>
        <td>
          {this.renderButtons(user)}
        </td>
      </tr>
    );
  }
}
