import React from 'react';
import TimeAgo from 'react-timeago';

const ONE_MONTH_IN_MS = 30 * 24 * 60 * 60 * 1000;

export default function FormattedDateTime({ date }) {
  const dateObject = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const title = dateObject.toLocaleDateString('ISO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  // display relative time string (... ago) for dates no earlier than 30 days
  if (today - dateObject < ONE_MONTH_IN_MS) {
    return (
      <TimeAgo component={TimeWithNowIgnored} date={dateObject} title={title} />
    );
  }

  const formattedDate = dateObject.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const isoDate = dateObject.toISOString();
  return (
    <time dateTime={isoDate} title={title}>
      {formattedDate}
    </time>
  );
}

// A temporary workaround until https://github.com/nmn/react-timeago/issues/85
// is fixed
function TimeWithNowIgnored({ now, ...rest }) {
  // eslint-disable-line no-unused-vars
  return <time {...rest} />;
}
