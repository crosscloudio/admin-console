import Avatar from 'react-avatar';
import { Link } from 'react-router';
import React from 'react';

import { userPageUrl } from 'utils/urls';

/**
 * user widget sidebar element, displays username and icon at the top of sidebar
 */
export default class SideBarUserWidget extends React.Component {
  render() {
    // getting current user -> image + name
    const { user } = this.props;
    if (!user) {
      return null;
    }
    return (
      <div className="widget">
        <div className="widget-body">
          <div className="userinfo">
            <div className="avatar">
              <Avatar email={user.email} name={user.name} round size={65} />
            </div>
            <div className="info">
              <div>
                <Link to={userPageUrl(user)}>
                  <span className="username">
                    {user.name}
                  </span>
                </Link>
              </div>
              <div>
                <span className="useremail">
                  {user.organization.display_name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
