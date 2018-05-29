import React from 'react';
import cx from 'classnames';
import { observable, runInAction } from 'mobx';
import { observer } from 'mobx-react';

/**
 * dropdown container for navigationbar
 */
@observer
export default class DropdownItem extends React.Component {
  // flag indicating if the dropdown is open
  @observable isDropdownOpen = false;

  /**
   * toggles the current dropdown status
   */
  toggleDropdown = () => {
    runInAction(() => {
      this.isDropdownOpen = !this.isDropdownOpen;
    });
  };

  render() {
    // determining style dependent on open
    const className = cx(
      'dropdown',
      'toolbar-icon-bg',
      this.isDropdownOpen ? 'open' : ''
    );

    return (
      <li className={className} onClick={this.toggleDropdown}>
        {this.props.children}
      </li>
    );
  }
}
