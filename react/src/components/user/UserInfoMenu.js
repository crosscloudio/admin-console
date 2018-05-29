import React from 'react';

import UserInfoLink from './UserInfoLink';
import UserPasswordReset from './UserPasswordReset';
import { userPageUrl } from 'utils/urls';

/**
 * tab menu for switching between different types of user information
 */
export default class UserInfoMenu extends React.Component {
  render() {
    const { user } = this.props;

    return (
      <div className="list-group list-group-alternate mb-n nav nav-tabs">
        <UserInfoLink iconClassName="fa fa-user" to={userPageUrl(user)}>
          About
        </UserInfoLink>
        <UserInfoLink
          iconClassName="ti ti-harddrive"
          to={userPageUrl(user, 'storages')}
        >
          Storages
        </UserInfoLink>
        <UserInfoLink
          iconClassName="fa fa-bar-chart-o"
          to={`/analytics/${this.props.user.id}`}
        >
          Activity
        </UserInfoLink>
        <UserInfoLink
          iconClassName="fa fa-shield"
          to={userPageUrl(user, 'keys')}
        >
          Keys
        </UserInfoLink>
        <UserInfoLink
          iconClassName="fa fa-share-alt"
          to={`/shares/${this.props.user.id}`}
        >
          Shares
        </UserInfoLink>
        <UserPasswordReset user={user} />
      </div>
    );
  }
}
