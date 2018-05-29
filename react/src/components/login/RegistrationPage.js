import { withRouter } from 'react-router';
import React from 'react';
import { action, observable } from 'mobx';
import { inject, observer } from 'mobx-react';
import { trackEvent, trackFbEvent } from 'utils/tracking';

import RegistrationForm from './RegistrationForm';

// Don't show the registration page on on-premise installations
const { APP_ON_PREMISE } = window;

// styling for logo
const logoStyling = {
  width: '25%',
};

@withRouter
@inject('authStore')
@observer
export default class RegistrationPage extends React.Component {
  @observable hadNetworkError = false; // eslint-disable-line react/sort-comp

  componentWillMount() {
    // redirect to the default page if the user is already logged in
    const { authStore, router } = this.props;
    if (authStore.loggedIn) {
      router.replace('/');
    }

    // don't show this page on-premise
    if (APP_ON_PREMISE) {
      router.replace('/login');
    }
  }

  componentDidMount() {
    // track analytics events
    trackEvent('Signup-Funnel', 'Signup page opened');
    trackFbEvent('CompleteRegistration');
  }

  @action
  setNetworkError = hadNetworkError => {
    this.hadNetworkError = hadNetworkError;
  };

  render() {
    const userData = {
      user_name: '',
      company_name: '',
      email: '',
      password: '',
      accept_terms: false,
    };

    return (
      <div className="focused-form">
        <div className="container">
          <div className="login-logo">
            <img
              alt="crosscloud logo"
              src={require('../../assets/images/logo-font.png') // eslint-disable-line global-require
              }
              style={logoStyling}
            />
          </div>
          <div className="row">
            <div className="col-md-6 col-md-offset-3">
              <div className="panel panel-default">
                <RegistrationForm
                  authStore={this.props.authStore}
                  hadNetworkError={this.hadNetworkError}
                  router={this.props.router}
                  setNetworkError={this.setNetworkError}
                  userData={userData}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
