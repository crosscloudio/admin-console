/**
 * Created by Christoph on 19/09/16.
 */
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import DataPlaceholder from './DataPlaceholder';
import { getChartColors } from '../utils/ColorUtils';

/**
 * widget displaying currently active users and trend
 */
export default class StorageUsageChart extends React.Component {
  render() {
    // extracting labels and percentage of usage
    const cspShareLabels = [];
    const cspShareValues = [];
    for (const key of Object.keys(this.props.storageUsageData)) {
      cspShareLabels.push(key);
      cspShareValues.push(this.props.storageUsageData[key].percentage);
    }

    // body of panel
    let panelbody = null;

    // if there is at least one csp info -> display chart
    if (cspShareLabels.length > 0) {
      // defining ci array for color
      const storageTypeColors = getChartColors(cspShareLabels.length);

      // configuring data for chart
      const doughnutData = {
        labels: cspShareLabels,
        datasets: [
          {
            data: cspShareValues,
            backgroundColor: storageTypeColors,
            hoverBackgroundColor: storageTypeColors,
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
      <div className="panel" data-tour-step={this.props.tourSelector}>
        <div className="panel-heading">
          <h2>Used Storages</h2>
        </div>
        <div className="panel-body">
          {panelbody}
        </div>
      </div>
    );
  }
}
