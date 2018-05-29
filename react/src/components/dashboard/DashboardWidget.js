import React from 'react';
import cx from 'classnames';

/**
 * widget displaying number in dashboard
 */
export default class DashboardWidget extends React.Component {
  render() {
    // building icon class
    const iconClass = cx('ti', this.props.iconId);

    // building footer icon class
    const footerIconClass = cx('ti', this.props.footerIconId);

    // building widget type class
    let widgetTypeClass = 'info-tile ';
    if (this.props.type == null) {
      widgetTypeClass += 'tile-black';
    } else {
      widgetTypeClass += this.props.type;
    }

    return (
      <div className={widgetTypeClass} data-tour-step={this.props.tourSelector}>
        <div className="tile-icon">
          <i className={iconClass} />
        </div>
        <div className="tile-heading">
          <span>
            {this.props.title}
          </span>
        </div>
        <div className="tile-body">
          <span>
            {this.props.value}
          </span>
        </div>
        <div className="tile-footer">
          <span className="text-danger">
            {this.props.footer}
            <i className={footerIconClass} />
          </span>
        </div>
      </div>
    );
  }
}
