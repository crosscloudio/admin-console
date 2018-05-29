import { Link } from 'react-router';
import React from 'react';

import './UserInfoLink.css';

export default class UserInfoLink extends React.Component {
  render() {
    const {
      children,
      to,
      iconClassName,
      containerClassName,
      iconStyle,
      ...rest
    } = this.props;
    return (
      <Link to={to} className="list-group-item" {...rest}>
        <span className={`UserInfoLink__container ${containerClassName}`}>
          <span className="UserInfoLink__iconContainer">
            <i className={iconClassName} style={iconStyle} />
          </span>
          {children}
        </span>
      </Link>
    );
  }
}
