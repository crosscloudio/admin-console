import ConfirmDialog from '../ConfirmDialog';
import { confirmable, createConfirmation } from 'react-confirm';

// exporting confirmation dialog as confirmable so it can be used in one line as util
export default createConfirmation(confirmable(ConfirmDialog));
