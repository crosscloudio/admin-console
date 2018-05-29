import { Alert, Glyphicon } from 'react-bootstrap';
import React from 'react';

export default function AuthAlert({ bsStyle, children, glyph }) {
  return (
    <Alert bsStyle={bsStyle}>
      {glyph ? <Glyphicon glyph={glyph} /> : null}
      &nbsp;
      {children}
    </Alert>
  );
}
