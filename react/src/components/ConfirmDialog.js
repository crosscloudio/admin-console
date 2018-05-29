import Button from 'react-bootstrap/lib/Button';
import Modal from 'react-bootstrap/lib/Modal';
import PropTypes from 'prop-types';
import React from 'react';
import { confirmable } from 'react-confirm';

/**
 * confirm dialog to ask user for confirmation
 * NOTE: please use ./utils/confirm and getConfirmation
 * so you don't need to handle code for any of this
 */
class Confirmation extends React.Component {
  render() {
    const {
      okLabel = 'OK',
      cancelLabel = 'Cancel',
      title,
      confirmation,
      show,
      proceed,
      dismiss,
      cancel,
      enableEscape = true,
    } = this.props;
    return (
      <div className="static-modal">
        <Modal
          show={show}
          onHide={dismiss}
          backdrop={enableEscape ? true : 'static'}
          keyboard={enableEscape}
        >
          <Modal.Header>
            <Modal.Title>
              {title}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {confirmation}
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={cancel}>
              {cancelLabel}
            </Button>
            <Button className="button-l" bsStyle="primary" onClick={proceed}>
              {okLabel}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

Confirmation.propTypes = {
  okLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  title: PropTypes.string,
  confirmation: PropTypes.string,
  show: PropTypes.bool,
  proceed: PropTypes.func, // called when ok button is clicked.
  cancel: PropTypes.func, // called when cancel button is clicked.
  dismiss: PropTypes.func, // called when backdrop is clicked or escaped.
  enableEscape: PropTypes.bool,
};

export default confirmable(Confirmation);
