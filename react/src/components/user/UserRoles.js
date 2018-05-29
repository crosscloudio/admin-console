import React from 'react';
import { Button, Label } from 'react-bootstrap';
import { action, observable, runInAction } from 'mobx';
import { observer } from 'mobx-react';

const AVAILABLE_ROLES = ['administrator', 'user'];

@observer
export default class UserRoles extends React.Component {
  @observable currentRoles = null;
  @observable isEditing = false;

  handleCancel = () => {
    this.stopEditing();
  };

  handleSave = () => {
    const { setUserRoles, user } = this.props;
    // this.currentRoles is an observable array (similar to ES6 map)
    // apollo needs a list of selected roles
    const newRoles = this.currentRoles
      .keys()
      .filter(role => this.currentRoles.get(role));
    setUserRoles(user.id, newRoles).then(this.stopEditing, this.stopEditing);
  };

  handleEdit = () => {
    runInAction(() => {
      // use an observable map for statuses
      const currentRoles = observable.map({});
      this.props.user.roles.forEach(role => {
        currentRoles.set(role, true);
      });
      this.currentRoles = currentRoles;
      this.isEditing = true;
    });
  };

  @action
  handleRoleChange = event => {
    const { currentRoles } = this;
    currentRoles.set(event.target.name, event.target.checked);
  };

  @action
  stopEditing = () => {
    this.currentRoles = null;
    this.isEditing = false;
  };

  renderButtons() {
    const { isEditing } = this;
    if (isEditing) {
      return (
        <span>
          <Button bsSize="small" bsStyle="default" onClick={this.handleCancel}>
            Cancel
          </Button>
          &nbsp;
          <Button bsSize="small" bsStyle="default" onClick={this.handleSave}>
            Save
          </Button>
        </span>
      );
    }

    return (
      <Button bsSize="small" bsStyle="default" onClick={this.handleEdit}>
        Edit
      </Button>
    );
  }

  renderEditMode() {
    const { currentRoles } = this;
    return AVAILABLE_ROLES.map(role =>
      <div className="checkbox block" key={role}>
        <label>
          <input
            checked={
              // use `false` instead `undefined` because `undefined`
              // would make the input uncontrolled
              currentRoles.get(role) || false
            }
            onChange={this.handleRoleChange}
            name={role}
            type="checkbox"
          />
          &nbsp;
          {role}
        </label>
      </div>
    );
  }

  renderPreviewMode() {
    const { roles } = this.props.user;
    return roles.map(role =>
      <div key={role}>
        <Label bsStyle="primary">{role}</Label>&nbsp;
      </div>
    );
  }

  render() {
    const { isEditing } = this;
    return (
      <tr>
        <th>Roles</th>
        <td>
          {isEditing ? this.renderEditMode() : this.renderPreviewMode()}
        </td>
        <td>
          {this.renderButtons()}
        </td>
      </tr>
    );
  }
}
