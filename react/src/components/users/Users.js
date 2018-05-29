import {
  Alert,
  Button,
  Col,
  ControlLabel,
  Form,
  FormControl,
  FormGroup,
  Glyphicon,
  InputGroup,
  Modal,
} from 'react-bootstrap';
import React from 'react';
import { graphql } from 'react-apollo';
import gravatar from 'gravatar';
import { inject, observer } from 'mobx-react';
import { observable, runInAction } from 'mobx';
import filter from 'lodash/filter';
import sortBy from 'lodash/sortBy';
import noop from 'lodash/noop';

import { NotificationManager } from 'react-notifications';
import validator from 'validator';
import LoadingIndicator from '../LoadingIndicator';
import getConfirmation from '../utils/getConfirmation';

import ActionPanel from '../ActionPanel';
import CREATE_USER_MUTATION from 'queries/CreateUserMutation.graphql';
import DELETE_USER_MUTATION from 'queries/DeleteUserMutation.graphql';
import RESET_USER_KEYS_MUTATION from 'queries/ResetUserKeysMutation.graphql';
import USERS_QUERY from 'queries/UsersQuery.graphql';
import UserTable from './UserTable';
import setUserEnabledMutation from 'mutations/setUserEnabledMutation';
import withTourSteps from '../onboarding/withTourSteps.js';

/**
 * page displaying a list of all users with additional information and actions
 * observes users as it updates when they are added etc.
 */
@inject('authStore')
@graphql(USERS_QUERY, {
  props: ({ data: { users } }) => ({ users }),
})
@graphql(CREATE_USER_MUTATION, {
  props: ({ mutate }) => ({
    createUser: args =>
      mutate({
        variables: args,
        updateQueries: {
          UsersQuery: (prev, { mutationResult }) => {
            if (!mutationResult.data) {
              return prev;
            }
            const newUser = mutationResult.data.createUser.user;
            const newUserList = sortBy([...prev.users, newUser], 'email');
            return {
              ...prev,
              users: newUserList,
            };
          },
        },
      }),
  }),
})
@graphql(RESET_USER_KEYS_MUTATION, {
  props: ({ mutate }) => ({
    resetUserKeys: id => {
      return mutate({ variables: { id } });
    },
  }),
})
@graphql(DELETE_USER_MUTATION, {
  props: ({ mutate }) => ({
    deleteUser: id =>
      mutate({
        variables: { id },
        optimisticResponse: {
          __typename: 'Mutation',
          deleteUser: id,
        },
        updateQueries: {
          UsersQuery: (prev, { mutationResult }) => {
            if (!mutationResult.data) {
              return prev;
            }

            const deletedId = mutationResult.data.deleteUser;
            const newUserList = filter(
              prev.users,
              user => user.id !== deletedId
            );
            return {
              ...prev,
              users: newUserList,
            };
          },
        },
      }),
  }),
})
@setUserEnabledMutation
@withTourSteps(
  [
    {
      title: 'Add Users',
      text:
        '...and start by inviting users or taking a look at their profile. 🤝',
      selector: '[data-tour-step="manageUsers"]',
      position: 'bottom',
      type: 'hover',
    },
  ],
  'Your Team'
)
@observer
export default class Users extends React.Component {
  // flag indicating if modal for adding user shall be shown
  @observable addUserModalVisible = false;

  // flags indicating verification status of input fields
  @observable nameVerified = false;
  @observable emailVerified = false;

  // variables for name and email while editing
  editedName;
  editedEmail;

  /**
   * handles the invite user action, displays a mask for email address, sends the invite and creates the user with
   * status deactivated / invited
   */
  handleCreateUser = () => {
    // generating gravatar
    const gravatarUrl = gravatar.url(this.editedEmail);

    // creating new user object
    const newUser = {
      name: this.editedName,
      email: this.editedEmail,
      is_enabled: true,
      image: gravatarUrl,
    };

    // making call to create user
    this.props.createUser(newUser).then(
      // show notifications
      () => {
        // success
        NotificationManager.success(
          `The user ${newUser.email} has been created`
        );
      },
      () => {
        // error
        NotificationManager.error('Cannot create user');
      }
    );

    // closing modal
    this.closeModals();
  };

  /**
   * handler an delete user click
   * @param user the user that was clicked on
   */
  handleDeleteUser = user => {
    // showing dialog to confirm the deletion of the user
    const dialogOptions = {
      title: 'Are you sure?',
      okLabel: 'Delete Now',
      confirmation: `Are you sure that you want to delete ${user.email}?`,
    };

    getConfirmation(dialogOptions).then(() => {
      // deleting the user and showing notification
      this.props.deleteUser(user.id).then(() => {
        // showing notification
        NotificationManager.success(`The user ${user.email} has been deleted.`);
      });
    }, noop);
  };

  /**
   * handler to enable or disable a user
   * @param user the user to enable or disable
   * @param enable should the user be enabled or disabled
   */
  handleSetUserEnabled = (user, enable) => {
    // showing dialog to confirm the deletion of the user
    const dialogOptions = {
      title: 'Are you sure?',
      okLabel: enable ? 'Enable Now' : 'Disable Now',
      confirmation: `Are you sure that you want to ${enable
        ? 'enable'
        : 'disable'} ${user.email}?`,
    };
    getConfirmation(dialogOptions).then(() => {
      this.props.setUserEnabled(user.id, enable).then(() => {
        // showing notification
        NotificationManager.success(
          `The user ${user.email} has been ${enable ? 'enabled' : 'disabled'}.`
        );
      });
    }, noop);
  };

  /**
   * handler to reset the user keys
   * @param user the user to rest the keys for
   */
  handleResetUser = user => {
    // showing dialog to confirm the reset of the user keys
    const dialogOptions = {
      title: 'Are you sure? (critical)',
      okLabel: 'Reset user now',
      confirmation: `Are you sure that you want to reset the user ${user.email}? This does delete all the keys and removes the user from all shares. This might mean that 
      data encrypted with the key of this user cannot be decrypted and is LOST. This is critical. Do NOT 
      do this unless you are fully aware of what this implies.`,
    };

    getConfirmation(dialogOptions).then(() => {
      this.props.resetUserKeys(user.id).then(
        () => {
          NotificationManager.success(
            `The keys for user ${user.email} have been reset successfully.`
          );
        },
        () => {
          NotificationManager.success(
            `Cannot reset keys for user ${user.email}.`
          );
        }
      );
    }, noop);
  };

  /**
   * shows the modal dialog to create a user
   */
  showAddUserModal = () => {
    runInAction(() => {
      this.nameVerified = false;
      this.emailVerified = false;
      this.addUserModalVisible = true;
    });
  };

  /**
   * closes all modal dialogs visible
   */
  closeModals = () => {
    // setting flags and closing all modals
    runInAction(() => {
      this.addUserModalVisible = false;
    });
  };

  /**
   * change event handler for name input
   * @param event the change event
   */
  nameChanged = event => {
    // setting intermediate value
    this.editedName = event.target.value;

    // setting validation state
    runInAction(() => {
      this.nameVerified = this.validateName(this.editedName);
    });
  };

  /**
   * change event handler for the email input
   * @param event the change event
   */
  emailChanged = event => {
    // setting intermediate value
    this.editedEmail = event.target.value;

    // setting validation state
    runInAction(() => {
      this.emailVerified = this.validateEmail(this.editedEmail);
    });
  };

  // validation methods for input
  /**
   * validates that the name field
   * @param name the value to be validated
   * @returns {boolean} true if the field is valid, false else
   */
  validateName = name => {
    if (name.length > 0) return true;
    return false;
  };

  /**
   * validates that the email field
   * @param name the value to be validated
   * @returns {boolean} true if the field is valid, false else
   */
  validateEmail = email => {
    return validator.isEmail(email);
  };

  /**
   * validates that the password field
   * @param name the value to be validated
   * @returns {boolean} true if the field is valid, false else
   */
  validatePassword = (password, confirm) => {
    if (password === confirm) return true;
    return false;
  };

  /**
 * renders the modal dialog for adding a user with input fields name and email
 */
  renderAddUserModal = () => {
    // determining verification states for input forms
    const nameVerificationState = this.nameVerified ? 'success' : null;
    const emailVerificationState = this.emailVerified ? 'success' : null;

    return (
      <Modal show onHide={this.closeModals}>
        <Modal.Body>
          <h4>Create User</h4>
          <p>Plase enter the following information to create a new user. </p>

          <Form horizontal>
            <FormGroup validationState={nameVerificationState}>
              <Col componentClass={ControlLabel} sm={2}>
                Name
              </Col>
              <Col sm={9}>
                <InputGroup>
                  <InputGroup.Addon>
                    <Glyphicon glyph="user" />
                  </InputGroup.Addon>
                  <FormControl
                    type="text"
                    placeholder="Enter user name"
                    onChange={this.nameChanged}
                  />
                  <FormControl.Feedback />
                </InputGroup>
              </Col>
            </FormGroup>

            <FormGroup validationState={emailVerificationState}>
              <Col componentClass={ControlLabel} sm={2}>
                Email
              </Col>
              <Col sm={9}>
                <InputGroup>
                  <InputGroup.Addon>@</InputGroup.Addon>
                  <FormControl
                    type="text"
                    placeholder="Enter user email address"
                    onChange={this.emailChanged}
                  />
                  <FormControl.Feedback />
                </InputGroup>
              </Col>
            </FormGroup>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.closeModals}>Close</Button>
          <Button
            bsStyle="primary"
            onClick={this.handleCreateUser}
            className={
              this.nameVerified && this.emailVerified ? '' : 'disabled'
            }
          >
            Create User
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  render() {
    const { currentUser, setUserEnabled, users } = this.props;
    // data is loading
    if (!(currentUser && users)) {
      return <LoadingIndicator />;
    }

    const addAction = currentUser.organization.has_available_licenses
      ? this.showAddUserModal
      : null;

    return (
      <div>
        <h1>Users</h1>
        {!currentUser.organization.has_available_licenses &&
          <Alert bsStyle="danger">
            User limit reached.{' '}
            <a href="https://crosscloud.typeform.com/to/Mnycz9" target="_blank">
              Get more licenses.
            </a>
          </Alert>}
        <ActionPanel
          title="Users"
          action={addAction}
          imageId="fa-plus"
          tourSelector="manageUsers"
        >
          <UserTable
            currentUser={currentUser}
            setUserEnabled={setUserEnabled}
            users={users}
            onDelete={this.handleDeleteUser}
            onSetEnabled={this.handleSetUserEnabled}
            onResetUser={this.handleResetUser}
          />
        </ActionPanel>
        {this.addUserModalVisible && this.renderAddUserModal()}
      </div>
    );
  }
}
