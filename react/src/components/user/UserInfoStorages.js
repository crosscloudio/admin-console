import {
  Button,
  Col,
  ControlLabel,
  Form,
  FormControl,
  FormGroup,
  Glyphicon,
  InputGroup,
  Modal,
  Table,
} from 'react-bootstrap';
import { NotificationManager } from 'react-notifications';
import React from 'react';
import filter from 'lodash/filter';
import { graphql } from 'react-apollo';
import { observable, runInAction } from 'mobx';
import { observer } from 'mobx-react';
import update from 'immutability-helper';

import ActionPanel from '../ActionPanel';
import ADD_CSP_FOR_USER_MUTATION from 'queries/AddCspForUserMutation.graphql';
import DELETE_CSP_FOR_USER_MUTATION from 'queries/DeleteCspForUserMutation.graphql';

const initialFormData = {
  display_name: '',
  unc_path: '',
  username: '',
  password: '',
};

// used as graphql field names
/* eslint-disable camelcase */

/**
 * component displaying user storage information (which storage are added)
 */
@graphql(ADD_CSP_FOR_USER_MUTATION, {
  props: ({ mutate }) => ({
    addCloudStorageProviderForUser: (user_id, input) =>
      mutate({
        variables: { user_id, input },
        updateQueries: {
          UserQuery: (prev, { mutationResult }) => {
            if (!mutationResult.data) {
              return prev;
            }
            const newCsp = mutationResult.data.addCloudStorageProviderForUser;
            return update(prev, {
              user: {
                csps: {
                  $push: [newCsp],
                },
              },
            });
          },
        },
      }),
  }),
})
@graphql(DELETE_CSP_FOR_USER_MUTATION, {
  props: ({ mutate }) => ({
    deleteCloudStorageProviderForUser: (user_id, csp_id) =>
      mutate({
        variables: { user_id, csp_id },
        updateQueries: {
          UserQuery: (prev, { mutationResult }) => {
            if (!mutationResult.data) {
              return prev;
            }
            const deletedCspId =
              mutationResult.data.deleteCloudStorageProviderForUser;
            const newCspList = filter(
              prev.user.csps,
              csp => csp.csp_id !== deletedCspId
            );

            return update(prev, {
              user: {
                csps: {
                  $set: newCspList,
                },
              },
            });
          },
        },
      }),
  }),
})
@observer
export default class UserInfoStorages extends React.Component {
  // flag indicating if modal shall be shown or not
  @observable modalVisible = false; // eslint-disable-line react/sort-comp
  // an object with current values of fields in the modal form
  @observable editedFields = { ...initialFormData };

  /**
   * closes the modal dialog to create a cifs storage
   */
  closeModal = () => {
    runInAction(() => {
      this.modalVisible = false;
    });
  };

  /**
   * shows the modal dialog to create a cifs storage
   */
  showModal = () => {
    runInAction(() => {
      this.modalVisible = true;
      // reset edited field to the initial state
      this.editedFields = { ...initialFormData };
    });
  };

  getFieldValidationState(field) {
    if (this.editedFields[field]) {
      return 'success';
    }

    return null;
  }

  handleCreateStorage = () => {
    const { editedFields } = this;
    const { user } = this.props;
    this.props
      .addCloudStorageProviderForUser(user.id, {
        csp_id: `cifs_${new Date().getTime()}`,
        display_name: editedFields.display_name,
        type: 'cifs',
        unique_id: editedFields.unc_path,
        // it's important to stringify authentication data, because otherwise
        // the server convert it to `[object Object]`
        authentication_data: JSON.stringify({
          unc_path: editedFields.unc_path,
          // don't save fields if they have an empty string
          username: editedFields.username || undefined,
          password: editedFields.password || undefined,
        }),
      })
      .then(() => {
        NotificationManager.success(
          `The storage ${editedFields.display_name} has been created`
        );
      });
    this.closeModal();
  };

  handleDeleteStorage(storage) {
    this.props
      .deleteCloudStorageProviderForUser(this.props.user.id, storage.csp_id)
      .then(() => {
        NotificationManager.success(
          `The storage ${storage.display_name} has been deleted`
        );
      });
  }

  handleFormFieldChange = event => {
    const { name, value } = event.target;
    runInAction(() => {
      this.editedFields[name] = value;
    });
  };

  // TODO: move to a separate component and use in other components
  // with forms in modal
  renderFormColumn({ icon, label, name, placeholder, type, validationState }) {
    return (
      <FormGroup validationState={validationState}>
        <Col componentClass={ControlLabel} sm={3}>
          {label}
        </Col>
        <Col sm={8}>
          <InputGroup>
            <InputGroup.Addon>
              <Glyphicon glyph={icon} />
            </InputGroup.Addon>
            <FormControl
              name={name}
              onChange={this.handleFormFieldChange}
              placeholder={placeholder}
              type={type || 'text'}
              value={this.editedFields[name]}
            />
            <FormControl.Feedback />
          </InputGroup>
        </Col>
      </FormGroup>
    );
  }

  renderModal() {
    // enable 'Create storage' button if all required fields are provided
    const enableCreateButton =
      this.getFieldValidationState('display_name') &&
      this.getFieldValidationState('unc_path');
    return (
      <Modal show={this.modalVisible} onHide={this.closeModal}>
        <Modal.Body>
          <h4>Create a CIFS storage</h4>
          <p>Plase enter the following information to create a CIFS storage.</p>
          <Form horizontal>
            {this.renderFormColumn({
              icon: 'cloud',
              label: 'Storage name',
              name: 'display_name',
              placeholder: 'Enter storage name',
              validationState: this.getFieldValidationState('display_name'),
            })}
            {this.renderFormColumn({
              icon: 'folder-open',
              label: 'Network path',
              name: 'unc_path',
              placeholder: 'Enter network path',
              validationState: this.getFieldValidationState('unc_path'),
            })}
            {this.renderFormColumn({
              icon: 'user',
              label: 'Username',
              name: 'username',
              placeholder: 'Enter username',
            })}
            {this.renderFormColumn({
              icon: 'lock',
              label: 'Password',
              name: 'password',
              placeholder: 'Enter password',
              type: 'password',
            })}
          </Form>
          <Modal.Footer>
            <Button onClick={this.closeModal}>Close</Button>
            <Button
              bsStyle="primary"
              className={enableCreateButton ? '' : 'disabled'}
              disabled={!enableCreateButton}
              onClick={this.handleCreateStorage}
            >
              Create storage
            </Button>
          </Modal.Footer>
        </Modal.Body>
      </Modal>
    );
  }

  render() {
    // cancel the default className of ActionPanel
    return (
      <div>
        <ActionPanel
          action={this.showModal}
          className=" "
          imageId="fa-plus"
          title="Storages"
        >
          <div className="about-area">
            <div className="table-responsive">
              <Table striped responsive>
                <thead>
                  <tr>
                    <th>Storage Name</th>
                    <th>User ID</th>
                    <th />
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {this.props.user.csps.map(storage => {
                    let storageTypeForIcon = storage.type;
                    // use the same icon for onedrive for business and onedrive
                    if (storageTypeForIcon === 'onedrivebusiness') {
                      storageTypeForIcon = 'onedrive';
                    }
                    // determining logo for storage
                    let logoPath;
                    // try catch here because the app would crash otherwise
                    // if the storage icon wouldn't be available
                    try {
                      /* eslint-disable global-require, import/no-dynamic-require */
                      logoPath = require(`../../assets/images/csps/${storageTypeForIcon}.png`);
                      /* eslint-enable global-require, import/no-dynamic-require */
                    } catch (error) {
                      // empty
                    }

                    // TODO: move the row to a separate component
                    /* eslint-disable react/jsx-no-bind */
                    return (
                      <tr key={storage.id}>
                        <td>
                          {storage.display_name}
                        </td>
                        <td>
                          {storage.unique_id}
                        </td>
                        <td>
                          <img
                            alt={`${storage.type} logo`}
                            className="img-responsive"
                            height="30"
                            src={logoPath}
                            width="30"
                          />
                        </td>
                        <td>
                          &nbsp;
                          <Button
                            bsSize="small"
                            bsStyle="danger"
                            onClick={this.handleDeleteStorage.bind(
                              this,
                              storage
                            )}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    );
                    /* eslint-enable react/jsx-no-bind */
                  })}
                </tbody>
              </Table>
            </div>
          </div>
        </ActionPanel>
        {this.renderModal()}
      </div>
    );
  }
}
