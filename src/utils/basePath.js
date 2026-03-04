const BASE_PATH = window.location.hostname === 'localhost'
  ? process.env.PUBLIC_URL || ''
  : '/wp-content/plugins/ddh-live-tracker';

export default BASE_PATH;