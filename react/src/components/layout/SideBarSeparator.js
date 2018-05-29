import React from 'react';

/**
 * separator component for the sidebar (hor. line)
 */
export default class SideBarSeparator extends React.Component {
  render() {
    // defining style for seperator of nav bar
    const sideBarSeperatorStyle = { paddingLeft: '15px' };
    return (
      <li className="nav-separator" style={sideBarSeperatorStyle}>
        <span>
          {this.props.title}
        </span>
      </li>
    );
  }
}
