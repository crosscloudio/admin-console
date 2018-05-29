import Avatar from 'react-avatar';
import React from 'react';

import UserNameEditor from './UserNameEditor';

/**
 * component displaying user profile pic, username and basic user information as header of the user page
 */
export default class UserProfileHeader extends React.Component {
  render() {
    const { user } = this.props;

    return (
      <div className="panel panel-profile">
        <div className="panel-body">
          <Avatar
            name={user.name}
            email={user.email}
            size={90}
            round
            className="img-circle"
            style={{ margin: 10 }}
          />
          <div className="name">
            <UserNameEditor user={user} />
          </div>
          <div className="info">
            {user.roles.map(role => `${role} `)}
          </div>
        </div>
      </div>
    );
  }
}
