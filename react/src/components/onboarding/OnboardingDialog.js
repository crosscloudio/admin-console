import React from 'react';
import {
  DropdownButton,
  Modal,
  MenuItem,
  Button,
  Carousel,
  Glyphicon,
} from 'react-bootstrap';
import ReactPlayer from 'react-player';
import { observable, action } from 'mobx';
import { observer } from 'mobx-react';

import { MAC, WINDOWS } from '../../constants/DownloadUrls';
import './OnboardingDialog.css';
import Step from './Step.js';
import Steps from './Steps.js';

/**
 * The onboarding modal dialog shown to get users started with the administrator console
 * It mainly consists of an image at the top, and controls at the bottom. Is shown modal. 
 */
@observer
export default class OnboardingDialog extends React.Component {
  static contextTypes = {
    // get showOnboardingTour provided by OnboardingTour
    showOnboardingTour: React.PropTypes.func,
  };

  // index of the onboarding
  @observable currentIndex = 0;

  /**
   * handles an index change in the 
   * currently viewed onboarding element
   */
  @action
  handleSelect = selectedIndex => {
    this.currentIndex = selectedIndex;
  };

  /**
   * handles the click on a step >> selects index of number that was
   * clicked on. 
   */
  handleStepClick = selectedItem => {
    this.handleSelect(selectedItem - 1);
  };

  /**
   * handles a click on the start user tour button
   */
  handleStartTour = () => {
    // showing tour
    this.context.showOnboardingTour();

    // closing dialog
    this.props.onCloseModal();
  };

  handleClose = () => {
    this.props.onCloseModal();
  };

  render() {
    // elements to display in the onboarding dialog
    const onboardingElements = [
      <Carousel.Item key="overview">
        <img
          alt="Overview"
          style={{ width: '100%' }}
          src={require('../../assets/images/onboarding/onboarding_1.png') // eslint-disable-line global-require
          }
        />
      </Carousel.Item>,
      <Carousel.Item key="client">
        <ReactPlayer
          url="https://youtu.be/1ELLNS4KV2E"
          playing={this.currentIndex === 1}
          muted
          loop
          width="100%"
          height="720px"
        />
      </Carousel.Item>,
      <Carousel.Item key="admin console">
        <ReactPlayer
          url="https://youtu.be/NMCsyLq6lzY"
          playing={this.currentIndex === 2}
          muted
          loop
          width="100%"
          height="720px"
        />
      </Carousel.Item>,
    ];

    // call to action button
    const onboardingButtons = [
      <DropdownButton
        bsStyle="primary"
        bsSize="large"
        title="Download Client App"
        noCaret
        id="dropdown-no-caret"
      >
        <MenuItem href={MAC}>macOS</MenuItem>
        <MenuItem href={WINDOWS}>Windows</MenuItem>
        <MenuItem disabled>iOS (soon)</MenuItem>
        <MenuItem disabled>Android (soon)</MenuItem>
      </DropdownButton>,
      <DropdownButton
        bsStyle="primary"
        bsSize="large"
        title="Download Client App"
        noCaret
        id="dropdown-no-caret"
      >
        <MenuItem href={MAC}>macOS</MenuItem>
        <MenuItem href={WINDOWS}>Windows</MenuItem>
        <MenuItem disabled>iOS (soon)</MenuItem>
        <MenuItem disabled>Android (soon)</MenuItem>
      </DropdownButton>,
      <Button bsStyle="primary" bsSize="large" onClick={this.handleStartTour}>
        Admin Console Tour
      </Button>,
    ];

    // defining headings of steps
    const onboardingHeadings = [
      'Crosscloud has two components.',
      'All your storages in one application.',
      'Fully manage and control in the background.',
    ];

    // the step indicators
    const onboardingSteps = [
      'Overview',
      'Client Applications',
      'Admin Console',
    ];

    // defining next icon dependent on if there are more than one item
    const nextIcon =
      onboardingElements.length > 1
        ? <Glyphicon glyph="chevron-right" />
        : null;

    // defining previous icon depentend on if there are more than one item
    const prevIcon =
      onboardingElements.length > 1 ? <Glyphicon glyph="chevron-left" /> : null;

    return (
      <Modal bsSize="large" show dialogClassName="OnboardingDialog__modal">
        <Modal.Body className="OnboardingDialog__modalBody">
          <Carousel
            interval={null}
            indicators={false}
            nextIcon={nextIcon}
            prevIcon={prevIcon}
            onSelect={this.handleSelect}
            slide={false}
            activeIndex={this.currentIndex}
          >
            {onboardingElements}
          </Carousel>
        </Modal.Body>
        <div className="OnboardingDialog--heading">
          <h1>
            {onboardingHeadings[this.currentIndex]}
          </h1>
        </div>
        <Steps>
          {onboardingSteps.map((name, index) => {
            return (
              <Step
                selected={this.currentIndex >= index}
                stepNumber={index + 1}
                stepName={name}
                key={name}
                onClickStep={this.handleStepClick}
              />
            );
          })}
        </Steps>
        <Modal.Footer>
          <div className="OnboardingDialog__modalFooter">
            <div className="OnboardingDialog__footerLeft">
              {onboardingButtons[this.currentIndex]}
            </div>
            <div className="OnboardingDialog__footerRight">
              <Button
                bsStyle="primary"
                bsSize="large"
                onClick={this.handleClose}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>
    );
  }
}
