import Joyride from 'react-joyride';
import React from 'react';
import { observer } from 'mobx-react';
import { observable, action } from 'mobx';

import 'react-joyride/lib/react-joyride-compiled.css';

@observer
export default class OnboardingTour extends React.Component {
  // types of context passed down to children
  static childContextTypes = {
    addTourSteps: React.PropTypes.func,
    showOnboardingTour: React.PropTypes.func,
  };

  /**
   * returns the context for child elements
   */
  getChildContext() {
    return {
      addTourSteps: this.addTourStepHandler,
      showOnboardingTour: this.showTour,
    };
  }

  // flag defining if admin console tour is running
  // eslint-disable-next-line react/sort-comp
  @observable isTourRunning = false;

  // the steps of the onboarding tour that are dynamically added by the sub-components
  tourSteps = [];

  // keeps track of the added steps and where they are stored in tourSteps
  tourStepIds = new Set();

  // the object to control the tour
  tourObject = null;

  // eslint-disable-next-line react/sort-comp
  constructor(...args) {
    super(...args);

    /**
     * displays the getting started tour with beacons
     */
    // defined in constructor because of problems with decorators and class
    // properties used together
    this.showTour = action(() => {
      // setting the tour to running
      this.isTourRunning = true;

      // resetting and restarting tour
      this.tourObject.reset(true);
    });
  }

  /**
   * handler for adding a new step to the tour
   * by child components
   */
  addTourStepHandler = (newSteps, parentStepTitle) => {
    let stepsToAdd = newSteps;

    // turning into array if not already array
    if (!Array.isArray(stepsToAdd)) {
      stepsToAdd = [stepsToAdd];
    }

    // adapting the main color of all steps
    stepsToAdd = stepsToAdd.map(step => {
      step.style = { mainColor: '#1174ff' };
      return step;
    });

    // filtering duplicates already in tourSteps
    stepsToAdd = stepsToAdd.filter(step => {
      return !this.tourStepIds.has(step.title);
    });

    // if parentStepTitle is set -> this indicates a position
    if (parentStepTitle && this.tourStepIds.has(parentStepTitle)) {
      // finding out parent index
      const parentIndex = this.tourSteps.findIndex(step => {
        return step.title === parentStepTitle;
      });

      // adding new steps at position after parent
      this.tourSteps.splice(parentIndex + 1, 0, ...stepsToAdd);
    } else {
      // adding new steps at the end
      this.tourSteps = this.tourSteps.concat(stepsToAdd);
    }

    // updating ids
    this.tourStepIds = new Set(this.tourSteps.map(step => step.title));
  };

  setJoyrideRef = tourObject => {
    this.tourObject = tourObject;
  };

  /**
   * the event callback for when the tour is running
   */
  tourCallback = tourEvent => {
    // executing before actions of step
    if (
      tourEvent.type === 'step:before' &&
      this.tourSteps[tourEvent.index].beforeAction
    ) {
      // executing action set in step
      this.tourSteps[tourEvent.index].beforeAction();
    } else if (
      tourEvent.type === 'step:after' &&
      this.tourSteps[tourEvent.index].afterAction
    ) {
      // executing action set in step
      this.tourSteps[tourEvent.index].afterAction();
    }
  };

  /**
     * renders tour element
     */
  render() {
    // rendering tour component
    return (
      <div>
        <Joyride
          ref={this.setJoyrideRef}
          callback={this.tourCallback}
          debug={false}
          run={this.isTourRunning}
          showOverlay
          showSkipButton
          steps={this.tourSteps}
          type={'continuous'}
          scrollToSteps={false}
          scrollToFirstStep
          autoStart
          locale={{
            back: 'Back',
            close: 'Close',
            last: 'Next',
            next: 'Next',
            skip: 'Skip',
          }}
        />
        {this.props.children}
      </div>
    );
  }
}
