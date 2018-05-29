import { Checkbox, Panel, Radio } from 'react-bootstrap';
import { NotificationManager } from 'react-notifications';
import React from 'react';
import { action, observable, runInAction } from 'mobx';
import { graphql } from 'react-apollo';
import { observer } from 'mobx-react';

import StorageLabels from 'constants/StorageLabels';
import UPDATE_ENABLED_STORAGE_TYPES_MUTATION from 'queries/UpdateEnabledStorageTypesMutation.graphql';

import './StorageTypesEditor.css';

const AVAILABLE_STORAGE_TYPES = Object.keys(StorageLabels);

@graphql(UPDATE_ENABLED_STORAGE_TYPES_MUTATION, {
  props: ({ mutate }) => ({
    updateEnabledStorageTypes: enabled => {
      return mutate({ variables: { enabled } });
    },
  }),
})
@observer
export default class StorageTypesEditor extends React.Component {
  constructor(...args) {
    super(...args);
    const { organization } = this.props.currentUser;
    // allow all storage types if `enabled_storage_types` is null
    // (not explicitly defined)
    this.selectAll = organization.enabled_storage_types === null;
    const enabledTypeList = this.selectAll
      ? AVAILABLE_STORAGE_TYPES
      : organization.enabled_storage_types;
    const enabledTypeSet = new Set(enabledTypeList);
    // update a map with storage types with actual values
    // (is the storage type enabled or not)
    AVAILABLE_STORAGE_TYPES.forEach(type => {
      this.enabledTypes.set(type, enabledTypeSet.has(type));
    });
  }

  // a map where keys are storage types and values are booleans
  // if the type is enabled or not
  @observable enabledTypes = observable.map();
  @observable isSubmitting = false;
  // Is the "Select all" radio checked
  @observable selectAll = true;

  @action
  handleSelectAllRadioChanged = event => {
    const selectAll = event.target.value === 'all';
    this.selectAll = selectAll;
  };

  @action
  handleStorageTypeChanged = event => {
    const { target } = event;
    this.enabledTypes.set(target.name, target.checked);
  };

  @action
  handleSubmit = event => {
    event.preventDefault();
    let enabled;
    if (this.selectAll) {
      // if "select all" is checked sent `enabled` as `null` to the server
      enabled = null;
    } else {
      // if the types are explicitly defined create a list with enabled ones
      enabled = [];
      // forEach from https://mobx.js.org/refguide/map.html
      this.enabledTypes.forEach((typeEnabled, type) => {
        if (typeEnabled) {
          enabled.push(type);
        }
      });
    }

    this.isSubmitting = true;
    this.props.updateEnabledStorageTypes(enabled).then(
      // success
      () => {
        NotificationManager.success('Available storage types has been updated');
        runInAction(() => {
          this.isSubmitting = false;
        });
      },
      // failure
      () => {
        NotificationManager.success('Cannot update available storage types');
        runInAction(() => {
          this.isSubmitting = false;
        });
      }
    );
  };

  renderStorageChecks() {
    if (this.selectAll) {
      return null;
    }

    return (
      <div className="form-group">
        {AVAILABLE_STORAGE_TYPES.map(this.renderStorageCheck)}
      </div>
    );
  }

  renderStorageCheck = type => {
    const label = StorageLabels[type];

    return (
      <Checkbox
        checked={this.enabledTypes.get(type)}
        key={type}
        name={type}
        onChange={this.handleStorageTypeChanged}
      >
        {label}
      </Checkbox>
    );
  };

  render() {
    const submitButtonText = this.isSubmitting ? 'Saving' : 'Save';
    return (
      <div>
        <h1>Storage Types</h1>
        <Panel header="Choose available storage types">
          <p>
            This setting defines which types of storages your team members can
            add. You can allow any supported storage or only allow selected ones
            (e.g. only Dropbox and Google Drive).
          </p>
          <form onSubmit={this.handleSubmit}>
            <Radio
              checked={this.selectAll}
              name="selectAll"
              onChange={this.handleSelectAllRadioChanged}
              value="all"
            >
              <span className="StorageTypesEditor__radioTitle">
                Allow all available storage types
              </span>
            </Radio>
            <Radio
              checked={!this.selectAll}
              name="selectAll"
              onChange={this.handleSelectAllRadioChanged}
              value="selected"
            >
              <span className="StorageTypesEditor__radioTitle">
                Select allowed storage types
              </span>
            </Radio>
            {this.renderStorageChecks()}
            <div>
              <button
                className="btn btn-primary pull-right"
                disabled={this.isSubmitting}
              >
                {submitButtonText}
              </button>
            </div>
          </form>
        </Panel>
      </div>
    );
  }
}
