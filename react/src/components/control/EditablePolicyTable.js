import './EditablePolicyTable.css';

import { NotificationManager } from 'react-notifications';
import React from 'react';
import { Table } from 'react-bootstrap';
import { extendObservable, runInAction } from 'mobx';
import filter from 'lodash/filter';
import { graphql } from 'react-apollo';
import identity from 'lodash/identity';
import noop from 'lodash/noop';
import { observer } from 'mobx-react';
import update from 'immutability-helper';

import ActionPanel from '../ActionPanel';
import ADD_POLICY_MUTATION from 'queries/AddPolicyMutation.graphql';
import DELETE_POLICY_MUTATION from 'queries/DeletePolicyMutation.graphql';
import EditablePolicyRow from './EditablePolicyRow';
import UPDATE_POLICY_MUTATION from 'queries/UpdatePolicyMutation.graphql';

/**
 * Table displaying policies that supports adding and changing rows
 * observes internal values (isAdding) to preserve right state
 */
@graphql(ADD_POLICY_MUTATION, {
  props: ({ mutate }) => ({
    addPolicy: input =>
      mutate({
        variables: { input },
        optimisticResponse: {
          __typename: 'Mutation',
          addPolicy: {
            __typename: 'Policy',
            ...input,
          },
        },
        updateQueries: {
          PoliciesQuery: (prev, { mutationResult }) => {
            if (!mutationResult.data) {
              return prev;
            }
            const newPolicy = mutationResult.data.addPolicy;
            return update(prev, {
              currentUser: {
                organization: {
                  policies: {
                    $push: [newPolicy],
                  },
                },
              },
            });
          },
        },
      }),
  }),
})
@graphql(UPDATE_POLICY_MUTATION, {
  props: ({ mutate }) => ({
    updatePolicy: (id, input) =>
      mutate({
        variables: { id, input },
        optimisticResponse: {
          __typename: 'Mutation',
          updatePolicy: {
            __typename: 'Policy',
            id,
            ...input,
          },
        },
      }),
  }),
})
@graphql(DELETE_POLICY_MUTATION, {
  props: ({ mutate }) => ({
    deletePolicy: id =>
      mutate({
        variables: { id },
        optimisticResponse: {
          __typename: 'Mutation',
          deletePolicy: id,
        },
        updateQueries: {
          PoliciesQuery: (prev, { mutationResult }) => {
            if (!mutationResult.data) {
              return prev;
            }
            const deletedId = mutationResult.data.deletePolicy;
            const newPolicyList = filter(
              prev.currentUser.organization.policies,
              organization => organization.id !== deletedId
            );
            return update(prev, {
              currentUser: {
                organization: {
                  $merge: {
                    policies: newPolicyList,
                  },
                },
              },
            });
          },
        },
      }),
  }),
})
@observer
export default class EditablePolicyTable extends React.Component {
  // default props sanizite to identity function doing nothing
  static defaultProps = {
    criteriaRenderer: identity,
    sanitizeCriteria: identity,
    validateCriteria: noop,
  };

  constructor(props, context) {
    super(props, context);

    // don't use annotation here -> seems to be a bug in mobx and update all instances of this component then!!!
    extendObservable(this, {
      // variables keeping track of the change and add state of the table
      isAdding: false,
    });
  }

  /**
   * starts adding mode -> row will be displayed below with default values and save and cancel buttons are shown
   */
  startAddingPolicy = () => {
    if (this.props.commingSoon) {
      return;
    }
    // toggl flag in action (is observable)
    runInAction(() => {
      this.isAdding = true;
    });
  };

  /**
   * ends adding mode -> remove row for adding policy
   */
  cancelAddingPolicy = () => {
    // toggle flag in action (is observable)
    runInAction(() => {
      this.isAdding = false;
    });
  };

  /**
   * callback method called when save is pressed when changing or adding a row
   * @param policy the policy that was edited or null if a new policy was added
   * @param name the new name of the policy
   * @param criteria the new criteria of the policy
   * @param enabled true if the checkbox for enabled was ticked, false else
   */
  savePolicy = (policy, name, criteria, enabled) => {
    // details of the new or changed policy
    const policyData = {
      name,
      criteria: this.props.sanitizeCriteria(criteria),
      type: this.props.policyType,
      is_enabled: enabled,
    };

    // a function invoked to saving the change or adding
    let applyFunction;
    // determining if change or adding a new policy
    if (policy && policy.id) {
      // policy already exists = change -> updating
      applyFunction = this.props.updatePolicy.bind(null, policy.id);
    } else {
      // policy is new -> creating it
      applyFunction = this.props.addPolicy;
    }

    // send a request to the server and apply locally
    applyFunction(policyData).then(
      () => {
        // showing notification when successfully saved on the server
        NotificationManager.success(`The policy ${name} has been saved.`);
      },
      () => {
        NotificationManager.error(`Unable to add policy: ${name}.`);
      }
    );

    // cancelling editing if active one way or the other
    this.cancelAddingPolicy();
  };

  /**
   * callback method when delete is pressed when editing a row
   * @param policy the policy to be deleted
   */
  deletePolicy = policy => {
    // calling store method to delete policy
    this.props.deletePolicy(policy.id).then(() => {
      // showing notification
      NotificationManager.success(
        `The policy ${policy.name} has been deleted.`
      );
    });
  };

  /**
   * sub-render method rendering one row of the editable table
   * @param policy the policy to be rendered in a row
   * @returns {XML} JSX representation of a row
   */
  renderPolicyRow = policy => {
    return (
      <EditablePolicyRow
        allowedValues={this.props.allowedValues}
        criteriaRenderer={this.props.criteriaRenderer}
        key={policy.id}
        onDelete={this.deletePolicy}
        onSave={this.savePolicy}
        policy={policy}
        sanitizeCriteria={this.props.sanitizeCriteria}
        validateCriteria={this.props.validateCriteria}
      />
    );
  };

  /**
   * renders the last row for adding a new policy if required
   * @returns {*}
   */
  renderAddRow() {
    // if currently adding new policy, display the row
    if (this.isAdding) {
      return (
        <EditablePolicyRow
          allowedValues={this.props.allowedValues}
          criteriaRenderer={this.props.criteriaRenderer}
          forceEditMode
          onCancel={this.cancelAddingPolicy}
          onSave={this.savePolicy}
          policy={createEmptyPolicy()}
          sanitizeCriteria={this.props.sanitizeCriteria}
          validateCriteria={this.props.validateCriteria}
        />
      );
    }

    return null;
  }

  renderBackdrop() {
    // remove with "Comming soon" functionality
    if (!this.props.commingSoon) {
      return null;
    }
    return <div className="EditablePolicyTable__backdrop">Coming soon</div>;
  }

  /**
   * renders the table, a row for each policy and the last row for adding a new policy when required
   * @returns {XML}
   */
  render() {
    // div is only required because of 'Coming soon' backdrop functionality
    return (
      <div
        className="EditablePolicyTable"
        data-tour-step={this.props.tourSelector}
      >
        <ActionPanel
          action={this.startAddingPolicy}
          imageId="fa-plus"
          title={this.props.title}
        >
          <Table hover responsive striped>
            <tbody>
              <tr style={{ fontWeight: 'bold' }}>
                <td style={{ width: '35%' }}>Name</td>
                <td style={{ width: '20%' }}>
                  {this.props.policyCriteria}
                </td>
                <td style={{ width: '20%' }}>Enabled</td>
                <td style={{ width: '25%' }}>Edit</td>
              </tr>
              {this.props.policies.map(this.renderPolicyRow)}
              {this.renderAddRow()}
            </tbody>
          </Table>
        </ActionPanel>
      </div>
    );
  }
}

function createEmptyPolicy() {
  return {
    criteria: '',
    is_enabled: true,
    name: '',
  };
}
