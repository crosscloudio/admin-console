import React from 'react';
import { observer } from 'mobx-react';
import { Button } from 'react-bootstrap';
import './Step.css';

@observer
export default class Step extends React.Component {
  /**
   * handes the click on a step item -> passes the stepNumber to the props callback
   */
  handleClick = () => {
    this.props.onClickStep(this.props.stepNumber);
  };

  render() {
    return (
      <div className="Step">
        <Button
          bsStyle={this.props.selected ? 'primary' : 'default'}
          className="Step__btn-circle"
          onClick={this.handleClick}
        >
          {this.props.stepNumber}
        </Button>
        <p>
          {this.props.stepName}
        </p>
      </div>
    );
  }
}
