import React from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';

// minimum time between calls used for debouncing
const DEBOUNCE_TIME = 100;
/**
 * Scrolling trigger allowing to handle scroll events in components. Used to implement infinity scroll on components
 */
export default class ScrollingTrigger extends React.Component {
  static propTypes = {
    offset: PropTypes.number.isRequired,
    onSawBottom: PropTypes.func.isRequired,
  };

  static defaultProps = {
    offset: 0,
    onSawBottom: () => {},
  };

  /**
   * setting up trigger once mounted
   */
  componentDidMount() {
    // checking where we are and calling bottom handler if required
    this.checkPosition();

    // defining debounced method for check position
    this.checkPositionDebounced = debounce(this.checkPosition, DEBOUNCE_TIME);

    // adding debounced checkposition as listener to window events -> is called every debounce cycle if event appear
    window.addEventListener('scroll', this.checkPositionDebounced, false);
    window.addEventListener('resize', this.checkPositionDebounced, false);
  }

  /**
   * called when the component changes
   */
  componentDidUpdate() {
    // on change -> checking position debounced
    this.checkPositionDebounced();
  }

  /**
   * called when component becomes unavailable
   */
  componentWillUnmount() {
    // cancelling calls in debounce queue
    this.checkPositionDebounced.cancel();

    // removing event listeners for window
    window.removeEventListener('scroll', this.checkPositionDebounced, false);
    window.removeEventListener('resize', this.checkPositionDebounced, false);
  }

  /**
   * Ths method checks if the current scrolling position is at the bottom of the component/window and calls the
   * onSawBottom handler method configured
   */
  checkPosition = () => {
    const { offset, onSawBottom } = this.props;

    // top position of the marker DOM node
    const currentTopPosition = this.marker.getBoundingClientRect().top;

    // calling callback if the marker element is in a visible part of the screen
    if (currentTopPosition - offset <= window.innerHeight) {
      onSawBottom();
    }
  };

  /**
   * render method returns a maker element used for positioning calculations
   * @returns {React$Element}
   */
  render() {
    return (
      <div
        ref={marker => {
          this.marker = marker;
        }}
      />
    );
  }
}
