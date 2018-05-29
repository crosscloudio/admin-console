const APP_UPDATE_CHANNEL = window.APP_UPDATE_CHANNEL || 'crosscloud';

export const MAC = `https://update-2.crosscloud.me/${APP_UPDATE_CHANNEL}/darwin_x64/crosscloud-latest.dmg`;
export const WINDOWS = `https://update-2.crosscloud.me/${APP_UPDATE_CHANNEL}/win32_x64/crosscloud-x64-latest.msi`;

export default {
  MAC,
  WINDOWS,
};
