import { graphql } from 'react-apollo';

import SET_USER_ENABLED_MUTATION from 'queries/SetUserEnabledMutation.graphql';

export default function setUserEnabledMutation(WrappedComponent) {
  return graphql(SET_USER_ENABLED_MUTATION, {
    props: ({ mutate }) => ({
      setUserEnabled: (id, enable) =>
        mutate({
          variables: { id, enable },
          optimisticResponse: {
            __typename: 'Mutation',
            setUserEnabled: {
              __typename: 'User',
              id,
              is_enabled: enable,
            },
          },
        }),
    }),
  })(WrappedComponent);
}
