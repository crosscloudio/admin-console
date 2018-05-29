import 'babel-polyfill';

import 'normalize.css/normalize.css';
import 'react-notifications/lib/notifications.css';
import 'react-select/dist/react-select.css';

import { ApolloProvider } from 'react-apollo';
import { Provider } from 'mobx-react';
import React from 'react';
import ReactDOM from 'react-dom';
import {
  IndexRedirect,
  IndexRoute,
  Router,
  Route,
  browserHistory,
} from 'react-router';
import { useStrict } from 'mobx';

import './styles/fonts/font-awesome/css/font-awesome.min.css';
import './styles/fonts/themify-icons/themify-icons.css';
import './styles/less/styles.less';
import './styles/app/form-fix.css';

import AuthStore from './stores/AuthStore';
import AuthenticationPage from './components/login/AuthenticationPage';
import Dashboard from './components/dashboard/Dashboard';
import Download from './components/download/Download';
import ForgotPasswordPage from './components/login/ForgotPasswordPage';
import Layout from './components/layout/Layout';
import RegistrationPage from './components/login/RegistrationPage';
import Security from './components/security/Security';
import SetPasswordPage from './components/login/SetPasswordPage';
import Settings from './settings/Settings';
import Shares from './components/shares/Shares';
import StorageTypes from './components/storageTypes/StorageTypes';
import Synclogs from './components/analytics/Synclogs';
import Team from './components/team/Team';
import User from './components/user/User';
import UserInfoAbout from './components/user/UserInfoAbout';
import UserInfoStorages from './components/user/UserInfoStorages';
import UserInfoSyncRules from './components/user/UserInfoSyncRules';
import UserInfoKeys from './components/user/UserInfoKeys';
import Users from './components/users/Users';
import Control from './components/control/Control';
import createApolloClient from './utils/createApolloClient';
import loginRequired from './utils/LoginRequired';
import { setupPageViewsTracking } from './utils/tracking';

// enable mobx strict mode
useStrict(true);

// Mobx stores
const authStore = new AuthStore();
const stores = {
  authStore,
};

// apollo client
const client = createApolloClient();

const routes = (
  <Route>
    <Route path="forgot-password" component={ForgotPasswordPage} />
    <Route path="login" component={AuthenticationPage} />
    <Route path="register" component={RegistrationPage} />
    <Route path="reset-password/:token" component={SetPasswordPage} />
    <Route
      component={Layout}
      onEnter={loginRequired.bind(null, authStore) // eslint-disable-line react/jsx-no-bind
      }
      path="/"
    >
      <IndexRedirect to="dashboard" />
      <Route path="dashboard" component={Dashboard} />
      <Route path="analytics" component={Synclogs} />
      <Route path="analytics/:userid" component={Synclogs} />
      <Route path="download" component={Download} />
      <Route path="security" component={Security} />
      <Route path="settings" component={Settings} />
      <Route path="shares" component={Shares} />
      <Route path="shares/:userid" component={Shares} />
      <Route path="storage-types" component={StorageTypes} />
      <Route path="team" component={Team} />
      <Route path="user/:userid" component={User}>
        <IndexRoute component={UserInfoAbout} />
        <Route path="storages" component={UserInfoStorages} />
        <Route path="syncrules" component={UserInfoSyncRules} />
        <Route path="keys" component={UserInfoKeys} />
      </Route>
      <Route path="users" component={Users} />
      <Route path="control" component={Control} />
    </Route>
  </Route>
);

const appTag = document.getElementById('app');

// setup page views tracking (e.g. Google Analytics)
setupPageViewsTracking(browserHistory);

const render = () => {
  ReactDOM.render(
    <ApolloProvider client={client}>
      <Provider {...stores}>
        <Router history={browserHistory} routes={routes} />
      </Provider>
    </ApolloProvider>,
    appTag
  );
};

render();
