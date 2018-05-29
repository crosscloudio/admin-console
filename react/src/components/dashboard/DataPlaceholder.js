import React from 'react';

import './DataPlaceholder.css';

/**
 * component shown as a placeholder if not enough data to display
 * (e.g. a graph) is present
 */
export default class DataPlaceholder extends React.Component {
  /**
   * renders the data placeholder
   * @returns {XML}
   */
  render() {
    return (
      <div className="DataPlaceholder">
        <div className="DataPlaceholder__icon">
          <i className={'ti ti-bar-chart'} />
        </div>
        <h4>No data to show right now</h4>
      </div>
    );
  }
}
