import React from 'react';

/**
 * container class for user information displayed in a tab
 */
export default class UserInfoContent extends React.Component {
  render() {
    return (
      <div className="col-sm-9">
        <div className="tab-content">
          <div className="tab-pane active">
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}
