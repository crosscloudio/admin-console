import React from 'react';

import './LoadingIndicator.css';

/**
 * a loading indicator that is displayed while data is loaded
 */
export default class LoadingIndicator extends React.Component {
  // default props
  static defaultProps = {
    centered: true,
  };

  /**
 * renders the loading indicator
 * @returns {XML}
 */
  render() {
    let additionalStyle = '';
    if (this.props.centered) {
      additionalStyle = 'LoadingIndicator--centered';
    }
    return <div className={`LoadingIndicator ${additionalStyle}`} />;
  }
}
