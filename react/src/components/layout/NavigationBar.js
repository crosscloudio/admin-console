import React from 'react';

import UserNavigationItem from './UserNavigationItem';

const logoStyle = {
  width: 'auto',
};

/**
 * navigation bar at the top of the layout, acts as a container for elements and displays current user picture and
 * dropdown menu at the upper right as well as item to collapse sidebar
 */
export default class NavigationBar extends React.Component {
  render() {
    const { user } = this.props;
    return (
      <header id="topnav" className="navbar navbar-default navbar-fixed-top">
        <div className="logo-area">
          <span className="toolbar-trigger toolbar-icon-bg">
            <a data-placement="right" title="Toggle Sidebar">
              <span onClick={this.props.onToggleSidebar} className="icon-bg">
                <i className="ti ti-menu" />
              </span>
            </a>
          </span>
          <img
            alt="crosscloud logo"
            className="navbar-brand"
            src={require('../../assets/images/logo-font.png') // eslint-disable-line global-require
            }
            style={logoStyle}
          />
        </div>

        <ul className="nav navbar-nav toolbar pull-right">
          <UserNavigationItem user={user} />
        </ul>
      </header>
    );
  }
}
