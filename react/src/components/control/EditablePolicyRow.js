import React from 'react';
import Select from 'react-select';
import { Button } from 'react-bootstrap';
import cx from 'classnames';
import { extendObservable, runInAction } from 'mobx';
import identity from 'lodash/identity';
import noop from 'lodash/noop';
import { observer } from 'mobx-react';

/**
 * class representing a row in an editable table
 */
@observer
export default class EditablePolicyRow extends React.Component {
  static defaultProps = {
    criteriaRenderer: identity,
    onCancel: noop,
  };

  constructor(props, context) {
    super(props, context);

    // don't use annotation here -> seems to be a bug in mobx and update all instances of this component then!!!
    // this holds the values the user enters upon editing. Cancel -> discarded, Save -> new policy stored
    extendObservable(this, {
      isEditing: false,
      editedName: '',
      editedCriteria: '',
      editedEnabled: true,
    });
  }

  getCriteriaValidationError() {
    return this.props.validateCriteria(
      this.props.sanitizeCriteria(this.editedCriteria)
    );
  }

  /**
   * starts editing mode of the cell
   */
  startEdit = () => {
    runInAction(() => {
      // setting values indicating editing
      this.isEditing = true;

      // setting edit default values
      this.editedName = this.props.policy.name || '';
      this.editedCriteria = this.props.policy.criteria || '';
      this.editedEnabled = this.props.policy.is_enabled;
    });
  };

  /**
   * callback for saving a policy when edited
   */
  savePolicy = () => {
    // only performing actions if all fields are there
    if (this.checkRowComplete() === false) {
      return;
    }

    // don't try to save if the criteria field doesn't validate
    if (this.getCriteriaValidationError()) {
      return;
    }

    // all fields are completed -> saving if the values actually changed
    runInAction(() => {
      // setting values indicating editing
      this.isEditing = false;

      // only saving when something has changed
      if (this.checkRowChange() === true) {
        // calling callback handler passed
        this.props.onSave(
          this.props.policy,
          this.editedName,
          this.editedCriteria,
          this.editedEnabled
        );
      }
    });
  };

  /**
   * callback for deleting policies when editing
   */
  deletePolicy = () => {
    // calling callback handler passed
    this.props.onDelete(this.props.policy);
  };

  /**
   * checks if the values for a row have actually changed -> if not: saving is not required
   * @returns {boolean} true if values of row have changed while editing, false else
   */
  checkRowChange() {
    // simply checking all values of the row
    return (
      this.editedName !== this.props.policy.name ||
      this.editedCriteria !== this.props.policy.criteria ||
      this.editedEnabled !== this.props.policy.is_enabled
    );
  }

  /**
   * checks if all fields of a row are filled out while editing
   * @returns {boolean} true if all fields are filled out, false else
   */
  checkRowComplete() {
    return this.editedName.length > 0 && this.editedCriteria.length > 0;
  }

  /**
   * handler for cancel event on row editing
   */
  cancelEditing = () => {
    runInAction(() => {
      // setting values indicating editing
      this.isEditing = false;
    });
    this.props.onCancel();
  };

  /**
   * change handler for name property of row (only active in editing mode)
   * @param event the change event on the input form
   */
  handleNameChange = event => {
    runInAction(() => {
      this.editedName = event.target.value;
    });
  };

  /**
   * change handler for criteria property of row (only active in editing mode)
   * @param event the change event on the input form
   */
  handleCriteriaChange = event => {
    runInAction(() => {
      this.editedCriteria = event.target.value;
    });
  };

  /**
   * change handler for activated property of row (only active in editing mode)
   * @param event the change event on the checkbox
   */
  handleEnabledChange = event => {
    runInAction(() => {
      this.editedEnabled = event.target.checked;
    });
  };

  handleSelectCriteriaChange = option => {
    runInAction(() => {
      this.editedCriteria = option;
    });
  };

  /**
   * renders the row of the table considering whether it is currently edited or not
   * @returns {XML}
   */
  render() {
    // getting policy
    const { allowedValues, criteriaRenderer, policy } = this.props;

    // style of the label badge
    const labelStyle = cx(
      'label',
      policy.is_enabled ? 'label-success' : 'label-danger'
    );

    // forceEditMode is used for adding new policies
    if (this.isEditing || this.props.forceEditMode) {
      const criteriaValidationError = this.getCriteriaValidationError();
      const criteriaContainerClassName = criteriaValidationError
        ? 'has-error'
        : '';

      return (
        <tr>
          <td>
            <input
              className="form-control"
              defaultValue={policy.name}
              onChange={this.handleNameChange}
              type="text"
            />
          </td>
          <td>
            <div className={criteriaContainerClassName}>
              {allowedValues
                ? <Select
                    multi
                    onChange={this.handleSelectCriteriaChange}
                    options={allowedValues}
                    simpleValue
                    value={this.editedCriteria}
                  />
                : <input
                    className="form-control"
                    defaultValue={policy.criteria}
                    onChange={this.handleCriteriaChange}
                    type="text"
                  />}
              {criteriaValidationError &&
                <span className="help-block">
                  {criteriaValidationError}
                </span>}
            </div>
          </td>
          <td>
            <input
              className="checkbox-inline"
              defaultChecked={policy.is_enabled}
              onChange={this.handleEnabledChange}
              type="checkbox"
            />
          </td>
          <td>
            <Button bsStyle="primary" bsSize="small" onClick={this.savePolicy}>
              Save
            </Button>&nbsp;
            <Button
              bsStyle="danger"
              bsSize="small"
              onClick={this.cancelEditing}
            >
              Cancel
            </Button>&nbsp;
          </td>
        </tr>
      );
    }
    // returning html for the row key is required by react
    return (
      <tr>
        <td>
          {policy.name}
        </td>
        <td>
          {criteriaRenderer(policy.criteria)}
        </td>
        <td>
          <span className={labelStyle}>
            {policy.is_enabled ? 'Yes' : 'No'}
          </span>
        </td>
        <td>
          <Button bsSize="small" onClick={this.startEdit}>
            Edit
          </Button>&nbsp;
          <Button bsStyle="danger" bsSize="small" onClick={this.deletePolicy}>
            Delete
          </Button>&nbsp;
        </td>
      </tr>
    );
  }
}
