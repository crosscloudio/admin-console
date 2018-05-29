'use strict';

// A script creating a list of available mime types from the mime-db package

const fs = require('fs');
const path = require('path');

const mimeDb = require('mime-db');

const allTypes = Object.keys(mimeDb);
allTypes.sort();

fs.writeFileSync(
  path.join(__dirname, '..', 'src', 'data', 'mimetypes.json'),
  JSON.stringify(allTypes, null, 2)
);
