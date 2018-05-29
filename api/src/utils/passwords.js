import bcryptCallbacks from 'bcryptjs';
import thenify from 'thenify';

// Bcrypt iteration count
const ITERATIONS = 10;

// Make bcrypt methods thenable
const bcrypt = {
  compare: thenify(bcryptCallbacks.compare),
  genSalt: thenify(bcryptCallbacks.genSalt),
  hash: thenify(bcryptCallbacks.hash),
};

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(ITERATIONS);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

export async function checkPassword(password, hash) {
  // return false if one of arguments is falsy
  if (!(password && hash)) {
    return false;
  }
  return bcrypt.compare(password, hash);
}
