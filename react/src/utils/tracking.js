export function setupPageViewsTracking(history) {
  return history.listen(location => {
    if (window.ga) {
      window.ga('set', 'page', location.pathname + location.search);
      window.ga('send', 'pageview');
    }
  });
}

export function trackEvent(category, action) {
  // Google Analytics
  if (window.ga) {
    window.ga('send', 'event', category, action);
  }

  // Bing Events
  if (window.uetq) {
    window.uetq.push({ ec: category, ea: action });
  }
}

export function trackFbEvent(eventName) {
  window.fbq && window.fbq('track', eventName);
}

/**
 * updates the information in intercom for a specific user
 * @param {*} userData a dict of attributes for the user like email, etc. 
 * see https://docs.intercom.com/install-on-your-product-or-site/other-ways-to-get-started/integrate-intercom-in-a-single-page-app
 */
export function updateIntercomSession(userData) {
  // updating intercom session with new user data
  window.Intercom && window.Intercom('update', userData);
}
