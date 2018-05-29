import React from 'react';
import { NotificationContainer } from 'react-notifications';
import { graphql } from 'react-apollo';
import { inject, observer } from 'mobx-react';
import { observable, action } from 'mobx';
import { updateIntercomSession } from 'utils/tracking';

import CURRENT_USER_QUERY from 'queries/CurrentUserQuery.graphql';
import FINISH_ONBOARDING_MUTATION from 'queries/FinishOnboardingMutation.graphql';
import NavigationBar from './NavigationBar';
import Footer from '../layout/Footer';
import Sidebar from './Sidebar';
import OnboardingDialog from '../onboarding/OnboardingDialog.js';
import OnboardingTour from '../onboarding/OnboardingTour.js';

const ADMINISTRATOR_ROLE = 'administrator';

/**
 * base layout class of the application giving it it's basic structure such as sidebar, topbar, footer etc.
 */
@inject('authStore')
@graphql(CURRENT_USER_QUERY, {
  props: ({ data: { currentUser }, ownProps: { authStore } }) => {
    // Check if the logged in user has the `administrator` role and logout
    // he/she otherwise.
    // TODO: it should be probably done in afterware of apollo's network
    // interface (by checking if there were 'admin rights required' errors)
    // but it seems not easy at the moment
    if (currentUser && !currentUser.roles.includes(ADMINISTRATOR_ROLE)) {
      authStore.logout();
      window.location.reload();
      return null;
    }
    return { user: currentUser };
  },
})
@graphql(FINISH_ONBOARDING_MUTATION, {
  props: ({ mutate, ownProps: { user } }) => ({
    finishOnboarding: () => {
      return mutate({
        optimisticResponse: {
          __typename: 'Mutation',
          finishAcOnboarding: {
            __typename: 'User',
            id: user.id,
            ac_onboarding_finished: true,
          },
        },
      });
    },
  }),
})
@observer
export default class Layout extends React.Component {
  componentDidUpdate = () => {
    // booting up intercom user and updating props
    if (this.props.user) {
      updateIntercomSession({
        email: this.props.user.email,
        name: this.props.user.name,
        team: this.props.user.organization.display_name,
        ac_onboarding_completed: this.props.user.ac_onboarding_finished,
      });
    }
  };

  // flag indicating if onboarding dialog should be shown
  @observable onboardingShown = false;

  // flag indicating if sidebar is collapsed or not
  @observable sideBarCollapsed = false;

  /**
   * handler toggling sidebar collapse status
   */
  @action
  toggleSidebar = () => {
    this.sideBarCollapsed = !this.sideBarCollapsed;
  };

  /**
   * closes getting started modal dialog
   */
  @action
  closeOnboarding = () => {
    // Close the onboarding dialog and send data to the server, so it won't
    // be shown on the next time. The dialog will be closed immediately
    // thanks to the optimistic response.
    this.props.finishOnboarding();
    this.onboardingShown = false;
  };

  /**
   * opens getting started modal dialog
  */
  @action
  showOnboarding = () => {
    // opens the onboarding dialog
    this.onboardingShown = true;
  };

  render() {
    // toggling body tag, this is required in plain old javascriptm as react runs inside
    // the body tag and cannot modify it but theme requires body tag for styling
    document.body.classList.toggle('sidebar-collapsed', this.sideBarCollapsed);

    // the onboarding dialog should be shown if either:
    // a) the user has not yet seen onboarding
    // b) the flag is explicitely set -> user opened onboarding manually
    const { user } = this.props;
    const showOnboardingDialog =
      this.onboardingShown || (user && !user.ac_onboarding_finished);

    return (
      <div>
        <OnboardingTour>
          {showOnboardingDialog &&
            <OnboardingDialog onCloseModal={this.closeOnboarding} />}
          <NavigationBar onToggleSidebar={this.toggleSidebar} user={user} />
          <div id="wrapper">
            <div id="layout-static">
              <Sidebar user={user} onShowOnboarding={this.showOnboarding} />
              <div className="static-content-wrapper">
                <div className="static-content">
                  <div className="page-content">
                    <div className="container-fluid">
                      {this.props.children &&
                        React.cloneElement(this.props.children, {
                          currentUser: user,
                        })}
                    </div>
                  </div>
                </div>
                <Footer />
              </div>
            </div>
          </div>
          <NotificationContainer />
        </OnboardingTour>
      </div>
    );
  }
}
