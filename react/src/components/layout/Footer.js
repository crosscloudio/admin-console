import React from 'react';

import { Tooltip, OverlayTrigger } from 'react-bootstrap';

// because of `__GLOBALS__`
/* eslint-disable no-underscore-dangle */

/**
 * footer component displayed at bottom of layout
 */
export default class Footer extends React.Component {
  render() {
    // defining tooltip for commit id
    const versionTooltip = (
      <Tooltip id="tooltip">
        {(window.__COMMIT_HASH__ || 'development').substring(0, 40)}
      </Tooltip>
    );

    const style = { margin: 0 };

    return (
      <footer role="contentinfo">
        <div className="clearfix">
          <ul className="list-unstyled list-inline pull-left">
            <OverlayTrigger placement="top" overlay={versionTooltip}>
              <li>
                <h6 style={style}>
                  &copy; {new Date().getFullYear()} CrossCloud GmbH - Version:{' '}
                  {window.__VERSION__ || 'development'} - Made with{' '}
                  <i className="fa fa-heart" /> in Graz
                </h6>
              </li>
            </OverlayTrigger>
          </ul>
          <button
            className="pull-right btn btn-link btn-xs hidden-print"
            id="back-to-top"
          >
            <i className="ti ti-arrow-up" />
          </button>
        </div>
      </footer>
    );
  }
}
