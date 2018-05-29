import React from 'react';
import ImageButton from './ImageButton';

/**
 * wrapper component to display a panel with an optional action at the top right, icon and action can be dynamically
 * configured.
 */
export default class ActionPanel extends React.Component {
  render() {
    // getting container class for this panel
    const className = this.props.className || '';

    // preparing button component
    const buttonIcon = this.props.imageId ? this.props.imageId : 'fa-plus';
    const button = this.props.action
      ? <ImageButton
          className="btn-primary-alt btn-group pull-right"
          imageId={buttonIcon}
          onClick={this.props.action}
        />
      : null;

    return (
      <div className={className}>
        <div
          className={`panel panel-default ${this.props.panelClassName}`}
          data-tour-step={this.props.tourSelector}
        >
          {
            // It is required for "Coming soon" functionality on "Control" page
            // and can be removed with it
            this.props.directPanelChild
          }
          <div className="panel-heading clearfix">
            <h2>
              {this.props.title}
            </h2>
            <div>
              {button}
            </div>
          </div>
          <div className="panel-body">
            <div className="panel-body no-padding">
              {this.props.children}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
