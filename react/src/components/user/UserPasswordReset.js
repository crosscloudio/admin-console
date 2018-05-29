import { NotificationManager } from 'react-notifications';
import React from 'react';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react';

import UserInfoLink from './UserInfoLink';
import getConfirmation from '../utils/getConfirmation';
import postJsonData from 'utils/postJsonData';

@observer
export default class UserPasswordReset extends React.Component {
  // eslint-disable-next-line react/sort-comp
  @observable requestInProcess = false;

  handleResetPassword = async event => {
    event.preventDefault();
    if (this.requestInProcess) {
      return;
    }
    const { user } = this.props;
    // showing dialog to confirm the deletion of the user
    const dialogOptions = {
      title: 'Are you sure?',
      okLabel: 'Reset Password',
      confirmation: `Are you sure that you want to send a reset password link to ${user.email}?`,
    };
    try {
      await getConfirmation(dialogOptions);
    } catch (error) {
      return;
    }
    this.setRequestInProcess(true);
    // perform call to reset user email
    try {
      await postJsonData('/auth/remember-password', {
        email: user.email,
      });
    } catch (error) {
      // show notification
      NotificationManager.error(`Failed to send email to ${user.email}`);
      return;
    } finally {
      this.setRequestInProcess(false);
    }
    // show notification
    NotificationManager.success(`An email has been sent to ${user.email}`);
  };

  @action
  setRequestInProcess(enable) {
    this.requestInProcess = enable;
  }

  render() {
    return (
      <UserInfoLink
        containerClassName="text-danger"
        iconClassName="ti ti-email text-danger"
        iconStyle={{ color: 'inherit' }}
        disabled={this.requestInProcess}
        onClick={this.handleResetPassword}
      >
        Reset password
      </UserInfoLink>
    );
  }
}
