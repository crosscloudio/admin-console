/**
 * Created by Christoph on 25/05/17.
 */
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import DataPlaceholder from './DataPlaceholder';
import { getChartColors } from '../utils/ColorUtils';

/**
 * widget displaying currently active users and trend
 */
export default class SyncTaskResultChart extends React.Component {
  render() {
    // extracting labels and percentage of usage
    const resultLabels = [];
    const resultValue = [];

    // only displaying if any data
    let sufficientDataToDisplay = false;

    // iterating over data and extracting label and value
    for (const stat of this.props.syncTaskResultData) {
      // extracting label and value
      resultLabels.push(stat.type);
      resultValue.push(stat.count);

      // if any data is here, it can be displayed
      if (stat.count > 0) {
        sufficientDataToDisplay = true;
      }
    }

    // body of panel
    let panelbody = null;

    // if there is at least one csp info -> display chart
    if (sufficientDataToDisplay) {
      // defining ci array for color
      const taskResultColors = getChartColors(resultLabels.length);

      // configuring data for chart
      const doughnutData = {
        labels: resultLabels,
        datasets: [
          {
            data: resultValue,
            backgroundColor: taskResultColors,
            hoverBackgroundColor: taskResultColors,
          },
        ],
      };

      // configuring chart options (legend)
      const doughnutOptions = {
        responsive: true,
        cutoutPercentage: 20,
        legend: {
          display: true,
          position: 'right',
        },
      };

      // render chart
      panelbody = <Doughnut data={doughnutData} options={doughnutOptions} />;
    } else {
      panelbody = <DataPlaceholder />;
    }

    return (
      <div className="panel">
        <div className="panel-heading">
          <h2>Operation Execution Status</h2>
        </div>
        <div className="panel-body">
          {panelbody}
        </div>
      </div>
    );
  }
}
