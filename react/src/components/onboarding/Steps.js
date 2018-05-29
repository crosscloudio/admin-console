import React from 'react';
import { observer } from 'mobx-react';
import './Steps.css';

@observer
export default class Steps extends React.Component {
  render() {
    return (
      <div className="Steps">
        <div className="Steps__row setup-panel">
          {this.props.children}
        </div>
      </div>
    );
  }
}
