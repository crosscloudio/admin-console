import {
  Button,
  ButtonToolbar,
  Label,
  Modal,
  Panel,
  Table,
  Well,
} from 'react-bootstrap';
import {
  Checkbox,
  CheckboxGroup,
  Form,
  Row,
  Textarea,
} from 'formsy-react-components';
import { NotificationManager } from 'react-notifications';
import React from 'react';
import { graphql } from 'react-apollo';
import { observable, runInAction } from 'mobx';
import { observer } from 'mobx-react';
import noop from 'lodash/noop';

import LoadingIndicator from '../LoadingIndicator';
import StorageLabels from 'constants/StorageLabels';
import getConfirmation from '../utils/getConfirmation';

import DISABLE_ENCRYPTION_MUTATION from 'queries/DisableEncryptionMutation.graphql';
import ENABLE_ENCRYPTION_MUTATION from 'queries/EnableEncryptionMutation.graphql';
import ENCRYPTION_PREFERENCES_QUERY from 'queries/EncryptionPreferencesQuery.graphql';
import UPDATE_ENCRYPTION_MUTATION from 'queries/UpdateEncryptionMutation.graphql';
import withTourSteps from '../onboarding/withTourSteps.js';

@graphql(ENCRYPTION_PREFERENCES_QUERY, {
  props: ({ data: { currentUser } }) => {
    // return encryption if the organization is already loaded
    if (
      currentUser &&
      currentUser.organization &&
      currentUser.organization.encryption
    ) {
      return {
        encryption: currentUser.organization.encryption,
      };
    }

    return {};
  },
})
@graphql(ENABLE_ENCRYPTION_MUTATION, {
  props: ({ mutate }) => ({
    enableEncryption: args => {
      return mutate({ variables: args });
    },
  }),
})
@graphql(UPDATE_ENCRYPTION_MUTATION, {
  props: ({ mutate }) => ({
    updateEncryption: args => {
      return mutate({ variables: args });
    },
  }),
})
@graphql(DISABLE_ENCRYPTION_MUTATION, {
  props: ({ mutate }) => ({
    disableEncryption: () => mutate(),
  }),
})
@withTourSteps(
  [
    {
      title: 'Activate Encryption',
      text: '...as you can configure encryption in a few easy steps. 🔐',
      selector: '[data-tour-step="activateEncryption"]',
      position: 'bottom',
      type: 'hover',
    },
  ],
  'Data Encryption'
)
@observer
export default class Security extends React.Component {
  // determines if the modal add dialog is shown
  @observable modalVisible = false;

  /**
   * shows the modal dialog to create a user
   */
  showModal = () => {
    runInAction(() => {
      this.modalVisible = true;
    });
  };

  /**
   * closes the modal dialog to create a user
   */
  closeModal = () => {
    runInAction(() => {
      this.modalVisible = false;
    });
  };

  handleDisableEncryption = () => {
    // defining confirm paramters
    const confirmParameters = {
      title: 'Disable Encryption',
      confirmation: 'Are you sure that you want to disable encryption?',
      okLabel: 'Disable',
    };

    // showing confirm dialog
    getConfirmation(confirmParameters).then(() => {
      this.props.disableEncryption().then(
        () => {
          // showing notification
          NotificationManager.success('Encryption has been disabled');
        },
        // error
        () => {
          NotificationManager.error('Cannot disable encryption');
        }
      );
    }, noop);
  };

  /**
   * handler for activation and changing of encryption
   */
  handleEncryptionChange = formData => {
    const cspsWithEnabledEncryption = new Set(formData.storageTypes);
    // convert from ['dropbox'] to [{type: 'dropbox': enabled: true}, ...]
    // for all csps types
    const cspsSettingsInput = Object.keys(StorageLabels).map(type => ({
      type,
      enabled: cspsWithEnabledEncryption.has(type),
    }));
    const mutationData = {
      encrypt_external_shares: formData.encrypt_external_shares,
      encrypt_public_shares: formData.encrypt_public_shares,
      csps_settings: cspsSettingsInput,
    };

    // `updateEncryption` if the encryption is already enabled,
    // `enableEncryption` otherwise
    let mutationFunction;

    if (this.props.encryption.enabled) {
      mutationFunction = this.props.updateEncryption;
    } else {
      mutationFunction = this.props.enableEncryption;
      // add the master key to the mutation data
      mutationData.master_key = formData.master_key;
    }

    mutationFunction(mutationData).then(
      () => {
        // showing notification
        NotificationManager.success('Encryption settings has been updated');
      },
      // error
      () => {
        NotificationManager.error('Cannot update encryption settings');
      }
    );
    // closing modal as we are done here
    this.closeModal();
  };

  renderModal = () => {
    const { encryption } = this.props;
    const storageTypeOptions = Object.keys(StorageLabels).map(type => {
      const label = StorageLabels[type];
      return { label, value: type };
    });

    const submitButtonText = encryption.enabled
      ? 'Update encryption settings'
      : 'Enable Encryption';

    let defaultSettings;
    if (encryption.enabled) {
      defaultSettings = {
        encrypt_external_shares: encryption.encrypt_external_shares,
        encrypt_public_shares: encryption.encrypt_public_shares,
        // convert from [{type: 'dropbox': enabled: true}, ...] to  ['dropbox']
        // for enabled csps types
        storageTypes: encryption.csps_settings
          .filter(({ enabled }) => enabled)
          .map(({ type }) => type),
      };
    } else {
      defaultSettings = {
        encrypt_external_shares: false,
        encrypt_public_shares: true,
        storageTypes: Object.keys(StorageLabels),
      };
    }

    return (
      <Modal show={this.modalVisible} onHide={this.closeModal}>
        <Modal.Body style={{ padding: '20px 32px' }}>
          <h2>Enable Encryption</h2>

          <Form layout="vertical" onSubmit={this.handleEncryptionChange}>
            {encryption.enabled
              ? null
              : <fieldset>
                  <legend>Public key</legend>
                  <Textarea
                    label="Paste the contents of the public key file in the PEM format"
                    name="master_key"
                    placeholder="Don't paste your private key. The public key contents begin with '-----BEGIN PUBLIC KEY-----'"
                    required
                    validationErrors={{
                      // seems to be an eslint error
                      /* eslint-disable quotes */
                      matchRegexp:
                        "The public key contents should begin with '-----BEGIN PUBLIC KEY-----' and end with '-----END PUBLIC KEY-----'",
                      /* eslint-enable quotes */
                    }}
                    validations={{
                      matchRegexp: /^-+BEGIN PUBLIC KEY-+(\n|\r\n)(.|\n|\r\n)*(\n|\r\n)-+END PUBLIC KEY-+$/,
                    }}
                    value=""
                  />
                  <p>Generate key pair: </p>
                  <pre>
                    <code>openssl genrsa -out private.pem 4096</code>
                  </pre>
                  <pre>
                    <code>
                      openssl rsa -in private.pem -outform PEM -pubout -out
                      public.pem
                    </code>
                  </pre>
                </fieldset>}
            <fieldset>
              <legend>Storage types</legend>
              <CheckboxGroup
                label="Which storage types should be encrypted"
                name="storageTypes"
                options={storageTypeOptions}
                value={defaultSettings.storageTypes}
              />
            </fieldset>
            <fieldset>
              <legend>External users</legend>
              <Checkbox
                label="Keep shares encrypted on shares with external users"
                layout="elementOnly"
                name="encrypt_external_shares"
                value={defaultSettings.encrypt_external_shares}
              />
              {/* <Checkbox
                label="Encrypt data on public sharing links"
                layout="elementOnly"
                name="encrypt_public_shares"
                value={defaultSettings.encrypt_public_shares}
              /> */}
            </fieldset>
            <fieldset style={{ marginTop: 20 }}>
              <Row layout="vertical">
                <Button onClick={this.closeModal} type="button">
                  Close
                </Button>{' '}
                <Button bsStyle="primary" type="submit">
                  {submitButtonText}
                </Button>
              </Row>
            </fieldset>
          </Form>
        </Modal.Body>
      </Modal>
    );
  };

  /**
   * renders information about the configured encryption
   * @param orgPreferences: the organisational preferences that apply to the current team
   * @returns {XML}
   */
  renderEncryptionInformation = () => {
    const { encryption } = this.props;

    if (!encryption.enabled) {
      return null;
    }
    return (
      <div>
        <article>
          <Table className="col-md-2" striped responsive bordered>
            <thead>
              <tr>
                <th>Storage type</th>
                <th>Encryption status</th>
              </tr>
            </thead>
            <tbody>
              {encryption.csps_settings.map(settings => {
                const name = StorageLabels[settings.type];
                return (
                  <tr key={settings.type}>
                    <td>
                      {name}
                    </td>
                    <td>
                      {this.renderEncryptionLabel(settings.enabled)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </article>
        <article>
          <Table className="col-md-2" striped responsive bordered>
            <thead>
              <tr>
                <th>Option</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Keep shares encrypted on shares with external users</td>
                <td>
                  {this.renderStatusLabel(encryption.encrypt_external_shares)}
                </td>
              </tr>
              {/* <tr>
                <td>Encrypt data on public sharing links</td>
                <td>{this.renderStatusLabel(encryption.encrypt_public_shares)}</td>
              </tr> */}
            </tbody>
          </Table>
        </article>
      </div>
    );
  };

  renderEncryptionLabel(encrypted) {
    const bsStyle = encrypted ? 'primary' : 'danger';
    const text = encrypted ? 'Encrypted' : 'Not encrypted';
    return (
      <Label bsStyle={bsStyle}>
        {text}
      </Label>
    );
  }

  renderStatusLabel(enabled) {
    const bsStyle = enabled ? 'primary' : 'danger';
    const text = enabled ? 'Enabled' : 'Disabled';
    return (
      <Label bsStyle={bsStyle}>
        {text}
      </Label>
    );
  }

  /**
   * renders the general description for how data is encrypted
   */
  renderGeneralEncryptionInformation = () => {
    return (
      <div>
        <h5>How does encryption work?</h5>
        <p className="col-md-12">
          This setting allows you to enable{' '}
          <strong>client-side encryption</strong> of data for specific types of
          storage service. When activated, data on the activated services will
          be client side encrypted using strongest{' '}
          <strong>AES-256-CFB and RSA-4096</strong> encryption. Users in this
          team will be able to communicate and share data as before using the
          crosscloud client applications. Keys are automatically exchanged in
          the background and each client-application will encrypt/decrypt data
          accordingly. The data will not be directly readable on the storage
          service (e.g. Dropbox Web-Interface) and users must use the crosscloud
          client applications to access the data. This setting allows you to
          enable which types of storages should be encrypted and what happens to
          data that is shared with users outside the organisation and links
          publicly shared.{' '}
        </p>
        <h5>
          {' '}A wizard will guide you through the setup of the encryption
          process. This setting can be changed any time.
          <a href="https://crosscloud.me/support/faq/" target="_blank">
            {' '}Learn more{' '}
          </a>
        </h5>
      </div>
    );
  };

  render() {
    const { encryption } = this.props;
    if (!encryption) {
      // encryption data are not loaded yet
      return <LoadingIndicator />;
    }

    const encryptionActivated = encryption.enabled;

    // determining style for label
    const statusLabelStyle = encryptionActivated ? 'primary' : 'danger';
    const statusLabelText = encryptionActivated ? 'Enabled' : 'Disabled';

    const showModalButtonText = encryptionActivated
      ? 'Update encryption settings'
      : 'Enable encryption';

    return (
      <div>
        <h1>Security</h1>
        <Panel header="Data Encryption" bsStyle="default">
          {this.renderGeneralEncryptionInformation()}
          <Well>
            <h1 className="text-center">
              Encryption is currently: &nbsp;
              <Label bsStyle={statusLabelStyle}>{statusLabelText}</Label>&nbsp;
            </h1>
          </Well>
          {this.renderEncryptionInformation()}
          <ButtonToolbar data-tour-step="activateEncryption">
            <Button bsStyle="primary" onClick={this.showModal}>
              {showModalButtonText}
            </Button>
            &nbsp;
            {encryptionActivated &&
              <Button bsStyle="danger" onClick={this.handleDisableEncryption}>
                Disable Encryption
              </Button>}
          </ButtonToolbar>
        </Panel>
        {this.renderModal()}
      </div>
    );
  }
}
