import React from 'react';
import { graphql } from 'react-apollo';
import groupBy from 'lodash/groupBy';

import EditablePolicyTable from './EditablePolicyTable';
import LoadingIndicator from '../LoadingIndicator';
import POLICIES_QUERY from 'queries/PoliciesQuery.graphql';
import {
  POLICY_TYPE_EXTENSION,
  POLICY_TYPE_MIME,
} from '../../constants/PolicyTypes';
import mimetypes from '../../data/mimetypes.json';
import withTourSteps from '../onboarding/withTourSteps.js';

const mimetypeOptions = mimetypes.map(type => ({ label: type, value: type }));

// `.` and also `" * / : < > ? \ |` which are invalid characters in NTFS
// filesystem (according to
// https://en.wikipedia.org/wiki/Filename#Reserved_characters_and_words )
// NOTE: should be in sync with api/src/utils/validators.js
/* eslint-disable no-useless-escape */
const INVALID_EXTENSION_CHARS_RE = /[\.\"\*\/\:\<\>\?\\\|]/;
/* eslint-enable no-useless-escape */

/**
 * page for the control section allowing the definition of policies on the usage of data
 * primarily displays different editable tables to see, change and define policies
 */
@graphql(POLICIES_QUERY, {
  props: ({ data: { currentUser } }) => {
    // return policies if they are already loaded
    if (
      currentUser &&
      currentUser.organization &&
      currentUser.organization.policies
    ) {
      return {
        policies: currentUser.organization.policies,
      };
    }

    return {};
  },
})
@withTourSteps(
  [
    {
      title: 'Define Rules',
      text:
        '...for example by not allowing certain types of files to be used on storages. Users will not be able to sync these files.👆',
      selector: '[data-tour-step="defineRules"]',
      position: 'bottom',
      type: 'hover',
    },
  ],
  'The Rules'
)
export default class Control extends React.Component {
  /**
   * Makes sure that extension policy criteria do not start with a dot
   * as users tend to enter e.g. .cad but our format is without the dot
   */
  sanitizeExtensionPolicy = criteria => {
    if (criteria[0] === '.') {
      return criteria.substr(1);
    }
    return criteria;
  };

  /**
   * Check if the extension doesn't contain invalid characters
   */
  validateFileExtension(extension) {
    const match = extension.match(INVALID_EXTENSION_CHARS_RE);
    if (match) {
      return `Extension contains invalid character: ${match[0]}`;
    }

    return null;
  }

  /**
   * Render mimetypes string as an unordered list
   */
  renderSelectedMimetypes(mimetypesString) {
    const mimetypeList = mimetypesString.split(',');

    return (
      <ul style={{ minWidth: 360, paddingLeft: 16 }}>
        {mimetypeList.map(mimetype =>
          <li key={mimetype}>
            {mimetype}
          </li>
        )}
      </ul>
    );
  }

  render() {
    // all available policies
    const { policies } = this.props;

    // policies are not loaded yet
    if (!policies) {
      return <LoadingIndicator />;
    }

    // group policies by its type
    // if it would cause performance problems try to use selectors library
    // like https://github.com/reactjs/reselect
    const policiesByType = groupBy(policies, 'type');

    // rendering out the different policies in different tables
    // `... || []` is used in `policies` field because entries
    // in policiesByType may be nullable
    return (
      <div>
        <h1>Rules</h1>
        <div className="row">
          <div className="col-md-12">
            <EditablePolicyTable
              policies={policiesByType[POLICY_TYPE_EXTENSION] || []}
              policyCriteria="Extension"
              policyType={POLICY_TYPE_EXTENSION}
              sanitizeCriteria={this.sanitizeExtensionPolicy}
              title="Prohibited Extensions"
              validateCriteria={this.validateFileExtension}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <EditablePolicyTable
              allowedValues={mimetypeOptions}
              criteriaRenderer={this.renderSelectedMimetypes}
              policies={policiesByType[POLICY_TYPE_MIME] || []}
              policyCriteria="MIME Types"
              policyType={POLICY_TYPE_MIME}
              title="Prohibited MIME Types"
              tourSelector="defineRules"
            />
          </div>
        </div>
      </div>
    );
  }
}
