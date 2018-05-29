import React from 'react';
import { Link, withRouter } from 'react-router';
import { inject, observer } from 'mobx-react';

import Avatar from 'react-avatar';

import DropdownItem from './DropdownItem';
import { userPageUrl } from 'utils/urls';

/**
 * navigationitem (top) to display user image and offer menu for logout and settings
 */
@withRouter
@inject('authStore')
@observer
export default class UserNavigationItem extends React.Component {
  /**
   * signs out user
   */
  signOut = async () => {
    await this.props.authStore.logout();
    this.props.router.replace('/login');
  };

  render() {
    const { user } = this.props;
    if (!user) {
      return null;
    }

    return (
      <DropdownItem>
        <a className="dropdown-toggle username">
          <Avatar
            className="img-circle"
            email={user.email}
            name={user.name}
            round
            size={40}
            style={{ marginRight: 10 }}
          />
        </a>
        <ul className="dropdown-menu userinfo arrow">
          <li>
            <Link to={userPageUrl(user)}>
              <i className="fa fa-user" />
              <span>Profile</span>
            </Link>
          </li>
          {/* <li>
            <Link to="/settings">
              <i className="ti ti-settings"/>
              <span>Settings</span>
            </Link>
          </li> */}
          <li className="divider" />
          <li>
            <a onClick={this.signOut}>
              <i className="fa fa-sign-out" />
              <span>Sign Out</span>
            </a>
          </li>
        </ul>
      </DropdownItem>
    );
  }
}
