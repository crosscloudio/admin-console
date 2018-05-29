import React from 'react';
import { graphql } from 'react-apollo';

import USER_QUERY from 'queries/UserQuery.graphql';
import UserProfileHeader from './UserProfileHeader';
import UserInfoContent from './UserInfoContent';
import UserInfoMenu from './UserInfoMenu';
import LoadingIndicator from '../LoadingIndicator';

/**
 * user profile page containing all relevant information about a user, displays information as a tab menu
 * observes selected tab - TODO: replace it with routing
 */
@graphql(USER_QUERY, {
  options: ({ params }) => ({
    variables: { id: params.userid },
  }),
  props: ({ data: { user } }) => ({ user }),
})
export default class User extends React.Component {
  render() {
    const { user } = this.props;

    // display activity indicator if user not loaded yet -> will be injected as observer
    if (!user) {
      // User is not loaded yet. todo Show loading indicator
      return <LoadingIndicator />;
    }

    return (
      <div>
        <h1>User</h1>
        <div className="row">
          <div className="col-sm-3">
            <UserProfileHeader user={user} />
            <UserInfoMenu user={user} />
          </div>
          <UserInfoContent>
            {React.cloneElement(this.props.children, { user })}
          </UserInfoContent>
        </div>
      </div>
    );
  }
}
