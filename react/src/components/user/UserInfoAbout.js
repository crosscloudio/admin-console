import React from 'react';
import { Table, Button } from 'react-bootstrap';
import crypto from 'crypto';
import cx from 'classnames';
import { graphql } from 'react-apollo';

import FormattedDateTime from '../FormattedDateTime';
import SET_USER_ROLES_MUTATION from 'queries/SetUserRolesMutation.graphql';
import UserRoles from './UserRoles';
import setUserEnabledMutation from 'mutations/setUserEnabledMutation';

/**
 * about info component within the user profile page
 */
@setUserEnabledMutation
@graphql(SET_USER_ROLES_MUTATION, {
  props: ({ mutate }) => ({
    setUserRoles: (id, roles) =>
      mutate({
        variables: { id, roles },
        optimisticResponse: {
          __typename: 'Mutation',
          setUserRoles: {
            __typename: 'User',
            id,
            roles,
          },
        },
      }),
  }),
})
export default class UserInfoAbout extends React.Component {
  handleToggleStatus = () => {
    const { setUserEnabled, user } = this.props;
    const enable = !user.is_enabled;
    setUserEnabled(user.id, enable);
  };

  render() {
    const { setUserRoles, user } = this.props;
    // determining style of status
    const statusStyle = cx(
      'label',
      user.is_enabled ? 'label-success' : 'label-primary'
    );
    const statusText = user.is_enabled ? 'enabled' : 'disabled';

    // edit status button attributes
    const editStatusText = user.is_enabled ? 'disable' : 'enable';

    // getting sha512 hash object and calculating hash value of user public key if set
    // todo: calculate hash when storing in database
    let keyHash = null;
    if (this.props.user.public_key) {
      const hasher = crypto.createHash('sha512');
      hasher.update(this.props.user.public_key);
      keyHash = hasher.digest('hex');
    }

    return (
      <div className="panel panel-default">
        <div className="panel-heading">
          <h2>About</h2>
        </div>
        <div className="panel-body">
          <div className="about-area">
            <h4>Basic Information</h4>
            <Table responsive striped>
              <tbody>
                <tr>
                  <th>ID</th>
                  <td>
                    {this.props.user.id}
                  </td>
                  <td />
                </tr>
                <tr>
                  <th>Email</th>
                  <td>
                    {this.props.user.email}
                  </td>
                  <td />
                </tr>
                <UserRoles setUserRoles={setUserRoles} user={this.props.user} />
                <tr>
                  <th>Status</th>
                  <td>
                    <span className={statusStyle}>
                      {statusText}
                    </span>
                  </td>
                  <td>
                    <Button
                      bsSize="small"
                      bsStyle="default"
                      onClick={this.handleToggleStatus}
                    >
                      {editStatusText}
                    </Button>
                  </td>
                </tr>
                <tr>
                  <th>Last Activity</th>
                  <td>
                    <FormattedDateTime
                      date={this.props.user.last_request_time}
                    />
                  </td>
                  <td />
                </tr>
                <tr>
                  <th>Last Activity IP</th>
                  <td>
                    {this.props.user.last_request_ip}
                  </td>
                  <td />
                </tr>
                {this.props.user.public_key &&
                  <tr>
                    <th>Public Encryption Key</th>
                    <td>
                      {keyHash || '-'}
                    </td>
                    <td />
                  </tr>}
              </tbody>
            </Table>
          </div>
        </div>
      </div>
    );
  }
}
