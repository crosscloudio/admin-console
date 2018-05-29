import { Link, withRouter } from 'react-router';
import React from 'react';
import { inject, observer } from 'mobx-react';

import DownloadUrls from 'constants/DownloadUrls';
import LoadingIndicator from '../LoadingIndicator';

// Don't suggest registration for on-premise installations
const { APP_ON_PREMISE } = window;

// styling for the logo
const logoStyling = {
  width: '25%',
};

/**
 * Form for users to authenticate with the service
 */
@withRouter
@inject('authStore')
@observer
export default class LoginForm extends React.Component {
  componentWillMount() {
    this.redirectIfLoggedIn();

    // setting base class for login form on body tag, this is required due to css structure of template
    document.body.classList.toggle('focused-form', true);
  }

  componentDidUpdate() {
    this.redirectIfLoggedIn();
  }

  componentWillUnmount() {
    // unsetting base class for login form on body tag, this is required due to css structure of template
    document.body.classList.toggle('focused-form', false);
  }

  /**
   * handler for input submit
   * @param event the submit event
   */
  onSubmit = event => {
    event.preventDefault();
    const { authStore } = this.props;
    const { target } = event;

    // trying to authenticate with API
    authStore.authenticate(target.username.value, target.password.value);
  };

  /**
   * redirects user if already logged in -> dashboard
   */
  redirectIfLoggedIn() {
    const { authStore, location, router } = this.props;
    if (authStore.loggedIn) {
      if (location.state && location.state.nextPathname) {
        router.replace(location.state.nextPathname);
      } else {
        router.replace('/');
      }
    }
  }

  /**
   * renders login mask with handlers
   * @returns {XML}
   */
  render() {
    const { authStore } = this.props;

    let loginError = null;
    if (authStore.error) {
      loginError = (
        <div className="pull-left">
          <span className="label label-danger">
            {authStore.error}
          </span>
        </div>
      );
    }

    // setting label of button  dependent on authorization state
    const loginButtonText = authStore.authorizing ? 'Checking...' : 'Login';

    return (
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
          <div className="col-md-4 col-md-offset-4">
            <div className="panel panel-default">
              <form className="form-horizontal" onSubmit={this.onSubmit}>
                <div className="panel-heading">
                  <h2>CrossCloud Admin Console Login</h2> <br />
                </div>
                <div className="panel-body">
                  <div className="form-group mb-md">
                    <div className="col-xs-12">
                      <p>Please provide your credentials to login</p>
                      <div className="input-group">
                        <span className="input-group-addon">
                          <i className="fa fa-user" />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="email address"
                          name="username"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group mb-md">
                    <div className="col-xs-12">
                      <div className="input-group">
                        <span className="input-group-addon">
                          <i className="fa fa-lock" />
                        </span>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="password"
                          name="password"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group mb-n">
                    <div className="col-xs-12">
                      <Link to="/forgot-password" className="pull-left">
                        Forgot password?
                      </Link>
                    </div>
                    {!APP_ON_PREMISE &&
                      <div className="col-xs-12">
                        <div className="pull-left">
                          No account yet?{' '}
                          <Link to="/register">Create one.</Link>
                        </div>
                      </div>}
                  </div>
                </div>
                <div className="panel-footer">
                  <div className="clearfix">
                    {loginError}
                    {authStore.authorizing &&
                      <LoadingIndicator centered={false} />}
                    <button
                      className="btn btn-primary btn-block"
                      disabled={authStore.authorizing}
                    >
                      {loginButtonText}
                    </button>
                  </div>
                </div>
              </form>
            </div>
            <div>
              <a
                className="btn btn-default btn-block"
                href={DownloadUrls.WINDOWS}
                target="_blank"
              >
                <i className="fa fa-windows" />
                &nbsp; Download for Windows
              </a>
              <a
                className="btn btn-default btn-block"
                href={DownloadUrls.MAC}
                target="_blank"
              >
                <i className="fa fa-apple" />
                &nbsp; Download for Mac
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
