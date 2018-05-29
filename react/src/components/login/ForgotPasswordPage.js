import { Button } from 'react-bootstrap';
import { Form, Input } from 'formsy-react-components';
import React from 'react';
import { action, observable, runInAction } from 'mobx';
import { fromPromise } from 'mobx-utils';
import { observer } from 'mobx-react';

import AuthAlert from './AuthAlert';
import postJsonData from 'utils/postJsonData';

@observer
export default class ForgotPasswordPage extends React.Component {
  @observable formIsValid = false;
  @observable rememberPasswordResult;

  @action
  updateValidationStatus = status => {
    this.formIsValid = status;
  };

  @action
  handleTryAgain = () => {
    this.rememberPasswordResult = null;
  };

  handleInvalid = () => {
    this.updateValidationStatus(false);
  };

  handleSubmit = data => {
    runInAction(() => {
      this.rememberPasswordResult = fromPromise(
        postJsonData('/auth/remember-password', {
          email: data.email,
        })
      );
    });
  };

  handleValid = () => {
    this.updateValidationStatus(true);
  };

  renderContent() {
    if (this.rememberPasswordResult && this.rememberPasswordResult.state) {
      switch (this.rememberPasswordResult.state) {
        case 'pending':
          return <AuthAlert bsStyle="warning">Sending request…</AuthAlert>;

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
              Check your email inbox, and click the link in the email you
              received to reset your password.
            </AuthAlert>
          );

        default:
          return null;
      }
    }
    return this.renderForm();
  }

  renderForm() {
    return (
      <div className="panel panel-default">
        <Form
          className="simple-form"
          layout="vertical"
          onInvalid={this.handleInvalid}
          onSubmit={this.handleSubmit}
          onValid={this.handleValid}
        >
          <div className="panel-heading">
            <h2>Forgot your CrossCloud password?</h2>
          </div>
          <div className="panel-body">
            <Input
              addonBefore={<i className="ti ti-email" />}
              label="Email"
              name="email"
              placeholder="Your email"
              required
              type="email"
              validationErrors={{
                isEmail: 'This doesn’t look like a valid email address.',
              }}
              validations="isEmail"
              value=""
            />
          </div>
          <div className="panel-footer">
            <div className="clearfix">
              <input
                className="btn btn-primary btn-block"
                disabled={!this.formIsValid}
                type="submit"
                value="Reset password"
              />
            </div>
          </div>
        </Form>
      </div>
    );
  }

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
