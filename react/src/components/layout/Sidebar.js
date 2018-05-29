import React from 'react';
import { withRouter } from 'react-router';

import DownloadUrls from 'constants/DownloadUrls';
import SideBarSeparator from './SideBarSeparator';
import SideBarMenuItem from './SideBarMenuItem';
import SideBarUserWidget from './SideBarUserWidget';
import withTourSteps from '../onboarding/withTourSteps.js';

const sidebarStyle = {
  marginBottom: '-800px',
  paddingBottom: '800px',
  overflow: 'hidden',
};

/**
 * sidebar component for holding menu items
 */
@withRouter
@withTourSteps([
  {
    title: 'Dashboard',
    text: 'See key metrics about the activity of your team at a glance. 🚀',
    selector: '[data-tour-step="sidebarDashboard"]',
    position: 'right',
    type: 'hover',
    beforeAction: props => {
      props.router.push('/dashboard');
    },
  },
  {
    title: 'Analytics',
    text: 'In the background, all team activity is tracked.',
    selector: '[data-tour-step="sidebarAnalytics"]',
    position: 'right',
    type: 'hover',
    beforeAction: props => {
      props.router.push('/analytics');
    },
  },
  {
    title: 'Your Team',
    text: 'Manage the team members and their storages... ',
    selector: '[data-tour-step="sidebarUsers"]',
    position: 'right',
    type: 'hover',
    beforeAction: props => {
      props.router.push('/users');
    },
  },
  {
    title: 'The Rules',
    text: 'You can very easily define rules for how storages can be used...',
    selector: '[data-tour-step="sidebarControl"]',
    position: 'right',
    type: 'hover',
    beforeAction: props => {
      props.router.push('/control');
    },
  },
  {
    title: 'Data Encryption',
    text: 'Seamlessly encrypting your teams data on storages becomes easy ...',
    selector: '[data-tour-step="sidebarProtection"]',
    position: 'right',
    type: 'hover',
    beforeAction: props => {
      props.router.push('/security');
    },
  },
  {
    title: 'You are all set',
    text:
      'If there is anything else we can help you with, please reach out anytime. Happy to have you on board. 😀',
    selector: '[data-tour-step="sidebarSupport"]',
    position: 'right',
    type: 'hover',
  },
])
export default class Sidebar extends React.Component {
  render() {
    // defining style for seperator of nav bar
    return (
      <div
        className="static-sidebar-wrapper sidebar-default"
        style={sidebarStyle}
      >
        <div className="static-sidebar">
          <div className="sidebar">
            <SideBarUserWidget user={this.props.user} />
            <div className="widget stay-on-collapse" id="widget-sidebar">
              <nav className="widget-body">
                <ul className="acc-menu">
                  <SideBarSeparator title="Functionality" />
                  <SideBarMenuItem
                    toLinkPath="/dashboard"
                    title="Dashboard"
                    iconID="fa-dashboard"
                    tourSelector="sidebarDashboard"
                  />
                  <SideBarMenuItem
                    toLinkPath="/analytics"
                    title="Analytics"
                    iconID="fa-bar-chart"
                    tourSelector="sidebarAnalytics"
                  />
                  <SideBarMenuItem
                    toLinkPath="/users"
                    title="Users"
                    iconID="fa-user"
                    tourSelector="sidebarUsers"
                  />
                  <SideBarMenuItem
                    toLinkPath="/control"
                    title="Rules"
                    iconID="fa-sliders"
                    tourSelector="sidebarControl"
                  />
                  <SideBarMenuItem
                    toLinkPath="/shares"
                    title="Shares"
                    iconID="fa-share-alt"
                  />
                  <SideBarMenuItem
                    toLinkPath="/security"
                    title="Data Protection"
                    iconID="fa-shield"
                    tourSelector="sidebarProtection"
                  />
                  <SideBarMenuItem
                    toLinkPath="/team"
                    title="Team"
                    iconID="fa-users"
                  />
                  <SideBarMenuItem
                    toLinkPath="/storage-types"
                    title="Storage Types"
                    iconID="fa-toggle-on"
                  />
                  {/* <SideBarMenuItem title="Backup" iconID="fa-clock-o"/> */}

                  <SideBarSeparator title="Ressources" />
                  <SideBarMenuItem
                    externalLink={DownloadUrls.WINDOWS}
                    title="Download for Windows"
                    iconID="fa-arrow-down"
                  />
                  <SideBarMenuItem
                    externalLink={DownloadUrls.MAC}
                    title="Download for Mac"
                    iconID="fa-arrow-down"
                  />
                  <SideBarMenuItem
                    externalLink="https://crosscloud.me/support"
                    title="Support"
                    iconID="fa-life-ring"
                    tourSelector="sidebarSupport"
                  />
                  <SideBarMenuItem
                    clickHandler={this.props.onShowOnboarding}
                    title="Getting Started"
                    iconID="fa-life-ring"
                  />
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
