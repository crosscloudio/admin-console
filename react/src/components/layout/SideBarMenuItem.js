import React from 'react';
import { Link } from 'react-router';
import cx from 'classnames';

/**
 * menu item in the sidebar with name icon and link using react-router
 */
export default class SideBarMenuItem extends React.Component {
  render() {
    // defining style for seperator of nav bar
    const itemIconClassName = cx('fa', this.props.iconID);

    // determining link component based on type of link passed
    // 3 options: external link, react-router link or handler function
    let body;
    if (this.props.externalLink) {
      body = (
        <a href={this.props.externalLink} target="_blank">
          <i className={itemIconClassName} />
          <span>
            {this.props.title}
          </span>
        </a>
      );
    } else if (this.props.toLinkPath) {
      body = (
        <Link to={this.props.toLinkPath}>
          <i className={itemIconClassName} />
          <span>
            {this.props.title}
          </span>
        </Link>
      );
    } else if (this.props.clickHandler) {
      body = (
        <a onClick={this.props.clickHandler}>
          <i className={itemIconClassName} />
          <span>
            {this.props.title}
          </span>
        </a>
      );
    }

    return (
      <li data-tour-step={this.props.tourSelector}>
        {body}
      </li>
    );
  }
}
