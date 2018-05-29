import 'styles/app/simple-form.css';
import { Button, Checkbox } from 'react-bootstrap';
import { Form, Input } from 'formsy-react-components';
import { Link } from 'react-router';
import React from 'react';
import { fromPromise } from 'mobx-utils';
import { action, extendObservable, observable, runInAction } from 'mobx';
import { observer } from 'mobx-react';

import AuthAlert from './AuthAlert';
import { ZXCVBN_USER_INPUTS } from 'constants/ZxcvbnInputs';
import postJsonData from 'utils/postJsonData';

/**
 * page for (re)setting user password
 */
@observer
export default class SetPasswordPage extends React.Component {
  // result of checking the set password token with the api
  @observable tokenStatusResult; // eslint-disable-line react/sort-comp
  // content of the new password and new password confirm field
  @observable newPassword = '';
  @observable newPasswordConfirm = '';
  // flag indicating if validation of current value set was successfull
  @observable formIsValid = false;
  // result from the submit
  @observable changePasswordResult;
  // lib for checking password complexity
  @observable zxcvbn;
  // flag indicating if terms were accepted
  @observable termsAccepted = false;

  /**
   * default constructor
   */
  constructor(props, context) {
    // calling super constructor
    super(props, context);

    // extending observable to perform password quality check using zxcvbn
    extendObservable(this, {
      get newPasswordInputClass() {
        if (!this.zxcvbnResult) {
          return null;
        }
        if (this.zxcvbnResult.score < 3 || this.newPassword.length < 8) {
          return 'has-error';
        }
        return 'has-success';
      },

      get zxcvbnErrors() {
        if (!this.zxcvbnResult) {
          return {};
        }

        if (this.zxcvbnResult.score < 3) {
          if (this.zxcvbnResult.feedback.warning) {
            return {
              newPassword: this.zxcvbnResult.feedback.warning,
            };
          }

          return {
            newPassword: 'This password is too easy to guess',
          };
        }

        return {};
      },

      get zxcvbnResult() {
        if (!this.zxcvbn || !this.newPassword) {
          return null;
        }
        return this.zxcvbn(
          this.newPassword,
          // don't allow to provide `crosscloud` or similar strings and also
          // the email address of the user
          [...ZXCVBN_USER_INPUTS, this.tokenStatusResult.value.email]
        );
      },

      get zxcvbnResultError() {
        if (!this.zxcvbnResult) {
          return false;
        }

        return this.zxcvbnResult.score < 3 || this.newPassword.length < 8;
      },

      get zxcvbnSuggestions() {
        if (!this.zxcvbnResult) {
          return null;
        }

        return this.zxcvbnResult.feedback.suggestions;
      },

      get zxcvbnTextClass() {
        if (!this.zxcvbnResult) {
          return null;
        }

        if (this.zxcvbnResultError) {
          return 'text-danger';
        }

        return null;
      },

      get zxcvbnWarning() {
        if (!this.zxcvbnResult) {
          return null;
        }

        // error is returned in this case
        if (this.zxcvbnResultError) {
          return null;
        }

        return this.zxcvbnResult.feedback.warning;
      },
    });
  }

  /**
   * component did mount
   */
  componentDidMount() {
    // checking the passed user password (re) set token with the api
    runInAction(() => {
      this.tokenStatusResult = fromPromise(
        postJsonData('/auth/check-set-password-token', {
          token: this.props.params.token,
        })
      );
    });

    // asynchronously load zxcvbn
    require.ensure([], require => {
      const zxcvbn = require('zxcvbn');
      runInAction(() => {
        this.zxcvbn = zxcvbn;
      });
    });
  }

  /**
   * change handler for the password input field
   */
  @action
  handleChange = (field, value) => {
    this[field] = value;
  };

  /**
   * change handler for invalid password retry attempt
   */
  @action
  handleTryAgain = () => {
    this.changePasswordResult = null;
    this.newPassword = '';
    this.newPasswordConfirm = '';
  };

  /**
   * handler for invalid passwords
   */
  handleInvalid = () => {
    this.updateValidationStatus(false);
  };

  /**
   * handler for valid password
   */
  handleValid = () => {
    this.updateValidationStatus(true);
  };

  /**
   * handler for submitting the password
   */
  handleSubmit = data => {
    runInAction(() => {
      this.changePasswordResult = fromPromise(
        postJsonData('/auth/change-password', {
          password: data.newPassword,
          token: this.props.params.token,
        })
      );
    });
  };

  /**
   * update validation field status action
   */
  @action
  updateValidationStatus = status => {
    this.formIsValid = status;
  };

  /**
   * handles changes on the status of the checkbox 
   * triggered by the user
   */
  @action
  handleTermsCheckBoxChange = event => {
    // triggereing change of observable
    this.termsAccepted = event.target.checked;
  };

  /**
   * render method for displaying the status (green, yellow etc.)
   */
  renderContent() {
    if (this.changePasswordResult && this.changePasswordResult.state) {
      switch (this.changePasswordResult.state) {
        case 'pending':
          return <AuthAlert bsStyle="warning">Changing password…</AuthAlert>;

        case 'rejected':
          return (
            <AuthAlert bsStyle="danger" glyph="exclamation-sign">
              <h4>Oh snap! An error ocurred</h4>
              <Button onClick={this.handleTryAgain}>Try again</Button>
            </AuthAlert>
          );

        case 'fulfilled':
          return (
            <AuthAlert bsStyle="success" glyph="exclamation-sign">
              <h4>Success!</h4>
              <Link to="/login">Go to the login page</Link>
            </AuthAlert>
          );

        default:
          return null;
      }
    }

    if (!this.tokenStatusResult || this.tokenStatusResult.state === 'pending') {
      // check token request is not finished
      return null;
    }

    if (this.tokenStatusResult.state === 'fulfilled') {
      if (this.tokenStatusResult.value.ok) {
        return this.renderForm();
      }

      return (
        <AuthAlert bsStyle="danger" glyph="exclamation-sign">
          Token is expired or was already used
        </AuthAlert>
      );
    }

    return (
      <AuthAlert bsStyle="danger" glyph="exclamation-sign">
        Network error. Try again later.
      </AuthAlert>
    );
  }

  /**
   * renders the accept terms checkbox
   */
  renderTermsCheckbox = () => {
    return (
      <Checkbox
        checked={this.termsAccepted}
        onChange={this.handleTermsCheckBoxChange}
      >
        <span>
          {'I accept the crosscloud '}
          <a href="https://crosscloud.io/terms.pdf" target="_blank">
            terms
          </a>
        </span>
      </Checkbox>
    );
  };

  /**
   * render method for the password input form
   */
  renderForm() {
    return (
      <div className="panel panel-default">
        <Form
          className="simple-form"
          layout="vertical"
          onSubmit={this.handleSubmit}
          onValid={this.handleValid}
          onInvalid={this.handleInvalid}
          validationErrors={this.zxcvbnErrors}
        >
          <div className="panel-heading">
            <h2>(Re)set Crosscloud password</h2>
          </div>
          <div className="panel-body">
            <Input
              addonBefore={<i className="fa fa-lock" />}
              label="New password"
              name="newPassword"
              onChange={this.handleChange}
              required
              rowClassName={this.newPasswordInputClass}
              type="password"
              validationError="Your password must be at least 8 characters long."
              validations="minLength:8"
              value={this.newPassword}
            />
            {this.zxcvbnWarning &&
              <p className={this.zxcvbnTextClass}>
                {this.zxcvbnWarning}
              </p>}
            {this.zxcvbnSuggestions &&
              <ul className={this.zxcvbnTextClass}>
                {this.zxcvbnSuggestions.map((suggestion, index) =>
                  <li
                    key={
                      index // eslint-disable-line react/no-array-index-key
                    }
                  >
                    {suggestion}
                  </li>
                )}
              </ul>}
            <Input
              addonBefore={<i className="fa fa-lock" />}
              label="Confirm new password"
              name="newPasswordConfirm"
              onChange={this.handleChange}
              required
              type="password"
              validationError="Password confirmation and password must match."
              validations="equalsField:newPassword"
              value={this.newPasswordConfirm}
            />
            {this.renderTermsCheckbox()}
          </div>
          <div className="panel-footer">
            <div className="clearfix">
              <input
                className="btn btn-primary btn-block"
                disabled={!this.formIsValid || !this.termsAccepted}
                type="submit"
                value="Set password"
              />
            </div>
          </div>
        </Form>
      </div>
    );
  }

  /**
   * main render method
   */
  render() {
    return (
      <div className="container">
        <div className="row" style={{ marginTop: 100 }}>
          <div className="col-md-6 col-md-offset-3">
            {this.renderContent()}
          </div>
        </div>
      </div>
    );
  }
}
