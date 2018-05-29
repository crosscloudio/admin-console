import React from 'react';
import { Label, Table } from 'react-bootstrap';
import { Link } from 'react-router';
import { graphql } from 'react-apollo';

import ActionPanel from '../ActionPanel';
import SHARES_QUERY from 'queries/SharesQuery.graphql';
import { userPageUrl } from 'utils/urls';
import FormattedDateTime from '../FormattedDateTime';
import LoadingIndicator from '../LoadingIndicator';

@graphql(SHARES_QUERY, {
  options: ({ params }) => ({
    variables: {
      user_id: params.userid,
    },
  }),
  props: ({ data: { shares } }) => ({ shares }),
})
export default class Shares extends React.Component {
  renderShare(share) {
    const encryptionText = share.encrypted ? 'Encrypting' : 'Not Encrypting';
    const encryptionLabelStyle = share.encrypted ? 'primary' : 'danger';

    return (
      <tr key={share.id}>
        <td>
          {share.name}
        </td>
        <td>
          {share.storage_type}
        </td>
        <td>
          <FormattedDateTime date={share.created_at} />
        </td>
        <td>
          <FormattedDateTime date={share.updated_at} />
        </td>
        <td>
          {share.users.map(user =>
            <div key={user.id}>
              <Link to={userPageUrl(user, 'storages')}>
                {user.email}
              </Link>
            </div>
          )}
        </td>
        <td>
          <Label bsStyle={encryptionLabelStyle}>{encryptionText}</Label>*
        </td>
      </tr>
    );
  }

  renderTable() {
    return (
      <Table striped hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Storage type</th>
            <th>Date registered</th>
            <th>Date modified</th>
            <th>Users</th>
            <th>Encryption</th>
          </tr>
        </thead>
        <tbody>
          {this.props.shares.map(this.renderShare)}
        </tbody>
      </Table>
    );
  }

  render() {
    // data is loading
    if (!this.props.shares) {
      return <LoadingIndicator />;
    }

    return (
      <div>
        <h1>Shares</h1>
        <ActionPanel title="Shares">
          {this.renderTable()}
        </ActionPanel>
        <p>
          * please note that this states the target status of the share. Files
          might temporarily not be encrypted, until files which existed prior to
          activation have been encrypted.{' '}
          <a href="https://crosscloud.me/support/faq/" target="_blank">
            {' '}Learn more{' '}
          </a>
        </p>
      </div>
    );
  }
}
