import React from 'react';
import Toggle from 'react-bootstrap-toggle';
import { graphql } from 'react-apollo';

import 'react-bootstrap-toggle/dist/bootstrap2-toggle.css';

import ACTIVITY_LOGS_QUERY from 'queries/ActivityLogsQuery.graphql';
import ActionPanel from '../ActionPanel';
import ScrollingTrigger from '../ScrollingTrigger';
import SET_LOGGING_ENABLED from 'queries/SetLoggingEnabled.graphql';
import SynclogTable from './SynclogTable';
import LoadingIndicator from '../LoadingIndicator';
import withTourSteps from '../onboarding/withTourSteps.js';

/**
 * component representing the analytics page showing actions by managed users
 * observes synclogstore to update table when new events come in from the server side
 */

@graphql(ACTIVITY_LOGS_QUERY, {
  options: ({ params }) => ({
    variables: {
      before: undefined,
      user_id: params.userid,
    },
  }),
  props: ({ data: { activityLogs, fetchMore }, ownProps }) => {
    // return activityLogs if they are already loaded
    if (activityLogs && activityLogs.entries) {
      const { endCursor, hasNextPage } = activityLogs.pageInfo;
      return {
        // `.entries` because of using cursor based pagination
        activityLogs: activityLogs.entries,
        loadMore: () => {
          if (!hasNextPage) {
            return null;
          }
          return fetchMore({
            query: ACTIVITY_LOGS_QUERY,
            variables: {
              before: endCursor,
              user_id: ownProps.params.userid,
            },
            updateQuery: (previousResult, { fetchMoreResult }) => {
              const newResult = fetchMoreResult.activityLogs;
              return {
                activityLogs: {
                  entries: [
                    ...previousResult.activityLogs.entries,
                    ...newResult.entries,
                  ],
                  pageInfo: newResult.pageInfo,
                },
              };
            },
          });
        },
      };
    }

    return {};
  },
})
@graphql(SET_LOGGING_ENABLED, {
  props: ({ mutate }) => ({
    setLoggingEnabled: enable => {
      return mutate({ variables: { enable } });
    },
  }),
})
@withTourSteps(
  [
    {
      title: 'Disable Tracking',
      text:
        'If you would like to disable tracking in your team, simply toggle this switch.',
      selector: '[data-tour-step="togglTrack"]',
      position: 'left',
      type: 'hover',
    },
  ],
  'Analytics'
)
export default class Synclogs extends React.Component {
  onLoggingEnabledChange = enable => {
    this.props.setLoggingEnabled(enable);
  };

  /**
   * renders table for sync activity
   * note: this passed fetchMore on to the trigger component
   */
  render() {
    const { activityLogs, currentUser } = this.props;

    // data is not loaded yet
    if (!(activityLogs && currentUser)) {
      return <LoadingIndicator />;
    }

    return (
      <div>
        <div className="clearfix">
          <div className="pull-left">
            <h1>Analytics</h1>
          </div>
          <div className="pull-right" data-tour-step="togglTrack">
            <h3
              style={{
                display: 'flex',
                // vertically align children
                alignItems: 'center',
                // make it vertically aligned to the title
                lineHeight: 1.8,
              }}
            >
              <span
                style={{
                  paddingRight: 12,
                }}
              >
                Track
              </span>
              <Toggle
                active={currentUser.organization.logging_enabled}
                onClick={this.onLoggingEnabledChange}
              />
            </h3>
          </div>
        </div>
        <ActionPanel title="Activity">
          <SynclogTable activityLogs={activityLogs} />
        </ActionPanel>
        {/*
         Don't render Waypoints if there is no synclogs fetched
         (in order to not calling synclogStore.fetchMore before the initial
         request is finished). TODO: Find a better way.
         */}
        {activityLogs.length
          ? <div
              style={{
                // these styles are required for corrected position calculations
                // because element above also uses float property
                float: 'left',
                width: '100%',
              }}
            >
              <ScrollingTrigger
                lastItemId={
                  // used to force position checking
                  activityLogs[activityLogs.length - 1].id
                }
                offset={200}
                onSawBottom={this.props.loadMore}
              />
            </div>
          : null}
      </div>
    );
  }
}
