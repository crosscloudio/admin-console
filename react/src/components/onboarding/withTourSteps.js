import React from 'react';
import hoistNonReactStatic from 'hoist-non-react-statics';

/**
 * HOC wrapper passing an array of tour steps
 * @param tourSteps the onboarding tour steps to be added
 * @param parentStep the parent step to insert the steps under
 */
export default function withTourSteps(tourSteps, parentStep) {
  return WrappedComponent => {
    class WithTourStepsHOC extends React.Component {
      // defining types of context passed from heaven
      static contextTypes = {
        addTourSteps: React.PropTypes.func,
      };

      /**
        * Calls the context function to handle tour steps and passes the steps on.
        */
      componentDidMount() {
        // making sure, this references in e.g. the beforeAction handler point to
        // the wrapped object
        const tourStepsOnComponent = tourSteps.map(step => {
          // copy instead of mutating the original object in case of eventual
          // reuse
          const convertedStep = { ...step };
          if (convertedStep.beforeAction) {
            const originalStepBeforeAction = convertedStep.beforeAction;
            // ensure the correct props are passed (e. g. if they changed after
            // the component was mounted)
            convertedStep.beforeAction = () => {
              originalStepBeforeAction(this.props);
            };
          }
          return convertedStep;
        });

        // adding steps
        this.context.addTourSteps(tourStepsOnComponent, parentStep);
      }

      /**
         * render the wrapped component
         */
      render() {
        return <WrappedComponent {...this.props} />;
      }
    }

    // https://reactjs.org/docs/higher-order-components.html#static-methods-must-be-copied-over
    hoistNonReactStatic(WithTourStepsHOC, WrappedComponent);
    return WithTourStepsHOC;
  };
}
