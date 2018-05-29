import { action, observable, runInAction } from 'mobx';

import { AUTH_TOKEN_STORAGE_FIELD } from '../constants/AuthConstants';
import postJsonData from 'utils/postJsonData';

export default class AuthStore {
  @observable authorizing = false;
  @observable error = false;
  @observable loggedIn = false;

  constructor() {
    runInAction(() => {
      this.loggedIn = !!localStorage.getItem(AUTH_TOKEN_STORAGE_FIELD);
    });
  }

  @action
  authenticate(username, password) {
    this.authorizing = true;
    this.error = null;

    return postJsonData('/auth/local', {
      email: username,
      password,
      requireAdmin: true,
    })
      .then(response => {
        localStorage.setItem(AUTH_TOKEN_STORAGE_FIELD, response.token);
        runInAction('Successfull authentication', () => {
          this.authorizing = false;
          this.error = null;
          this.loggedIn = true;
        });
      })
      .catch(error => {
        runInAction('Authentication failed', () => {
          this.authorizing = false;
          this.error = error.message;
        });
      });
  }

  @action
  authenticateWithToken(token) {
    localStorage.setItem(AUTH_TOKEN_STORAGE_FIELD, token);
    this.authorizing = false;
    this.error = null;
    this.loggedIn = true;
  }

  @action
  logout() {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_FIELD);
    this.authorizing = false;
    this.error = null;
  }
}
