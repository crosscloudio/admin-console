import { FormControl } from 'react-bootstrap';
import React from 'react';
import { action, observable, runInAction } from 'mobx';
import { graphql } from 'react-apollo';
import { observer } from 'mobx-react';

import SET_USER_NAME_MUTATION from 'queries/SetUserNameMutation.graphql';
import './UserNameEditor.css';

/**
 * component wrapper allowing the dynamic change of the user name
 */
// todo: refactor this to be generic to text properties throughout the site (=make stupid component)
@graphql(SET_USER_NAME_MUTATION, {
  props: ({ mutate }) => ({
    setUserName: (id, name) =>
      mutate({
        variables: { id, name },
        optimisticResponse: {
          __typename: 'Mutation',
          setUserName: {
            __typename: 'User',
            id,
            name,
          },
        },
      }),
  }),
})
@observer
export default class UserNameEditor extends React.Component {
  @observable editedName = null;
  @observable isEdited = false;

  @action
  cancelEdition() {
    this.isEdited = false;
  }

  @action
  saveChange() {
    const { setUserName, user } = this.props;
    this.isEdited = false;
    // don't try to set a blank name
    if (!(this.editedName && this.editedName.trim())) {
      return;
    }
    setUserName(user.id, this.editedName);
  }

  /**
   * handle method for key strokes
   * @param event the key down event
   */
  handleKeyDown = event => {
    switch (event.key) {
      // determining which key was pressed
      case 'Enter':
        this.saveChange();
        return;
      case 'Escape':
        this.cancelEdition();
        break;
      default:
    }
  };

  /**
   * handle change on the displayed input field
   * @param event the change event from the input
   */
  handleNameChange = event => {
    // changing ovservable as action
    runInAction(() => {
      this.editedName = event.target.value;
    });
  };

  /**
   * handler for save event on new text
   */
  handleSaveChange = () => {
    this.saveChange();
  };

  /**
   * swap editing state (text/input)
   */
  handleStartEditing = () => {
    runInAction(() => {
      // setting default values for intermidiate values
      this.editedName = this.props.user.name || '';
      this.isEdited = true;
    });
  };

  /**
   * renders the component based on it's editing status
   * @returns {XML}
   */
  render() {
    const { user } = this.props;
    if (this.isEdited) {
      return (
        <span>
          <form>
            <FormControl
              autoFocus
              className="UserNameEditor__form"
              onBlur={this.handleSaveChange}
              onChange={this.handleNameChange}
              onKeyDown={this.handleKeyDown}
              placeholder="Enter text"
              type="text"
              value={this.editedName}
            />
          </form>
        </span>
      );
    }

    return (
      <span onClick={this.handleStartEditing}>
        {user.name}
      </span>
    );
  }
}
