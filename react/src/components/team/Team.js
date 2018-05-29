import { Panel } from 'react-bootstrap';
import React from 'react';
import { graphql } from 'react-apollo';

import ContactInfoForm from './ContactInfoForm';
import UPDATE_ORGANIZATION_CONTACT_DATA_MUTATION from 'queries/UpdateOrganizationContactDataMutation.graphql';

@graphql(UPDATE_ORGANIZATION_CONTACT_DATA_MUTATION, {
  props: ({ mutate }) => ({
    updateOrganizationContactData: input => {
      return mutate({ variables: { input } });
    },
  }),
})
export default class Team extends React.Component {
  render() {
    const { currentUser, updateOrganizationContactData } = this.props;
    // data is not loaded yet
    if (!currentUser) {
      return null;
    }

    const { organization } = currentUser;

    return (
      <div>
        <h1>Team</h1>
        <Panel header="Licenses">
          <h3>
            Users: {organization.users_count}/{organization.users_limit}.
          </h3>
          {!organization.is_resold &&
            <div style={{ marginBottom: 16 }}>
              <a
                href="https://crosscloud.typeform.com/to/Mnycz9"
                rel="noopener"
                target="_blank"
              >
                Get more licenses.
              </a>
            </div>}
        </Panel>
        <Panel header="Contact info">
          <ContactInfoForm
            organization={organization}
            updateOrganizationContactData={updateOrganizationContactData}
          />
        </Panel>
      </div>
    );
  }
}
