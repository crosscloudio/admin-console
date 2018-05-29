import React from 'react';
import cx from 'classnames';

/**
 * simply button with image and handler
 */
export default class ImageButton extends React.Component {
  render() {
    // getting style for wrapper
    const className = cx('btn', this.props.className);

    // getting style for button
    const buttonImageStyleClass = cx('fa', this.props.imageId);

    return (
      <div>
        <a
          className={className}
          onClick={this.props.onClick}
          style={{ marginTop: '7.5px' }}
        >
          {this.props.imageId ? <i className={buttonImageStyleClass} /> : null}
        </a>
      </div>
    );
  }
}
