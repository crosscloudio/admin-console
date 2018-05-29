import fs from 'fs';
import path from 'path';

import htmlescape from 'htmlescape';
import { once } from 'lodash';

import { version } from '../../package.json';

const {
  APP_ON_PREMISE,
  APP_UPDATE_CHANNEL,
  BING_UET_ID,
  FACEBOOK_PIXEL_ID,
  GOOGLE_ANALYTICS_UA,
  GOOGLE_CONVERSION_ID,
  INTERCOM_APP_ID,
} = process.env;

// GIT commit hash - file generated on CI
let commitHash;

try {
  commitHash = require('../commitHash.json'); // eslint-disable-line global-require
} catch (error) {
  // empty
}

/**
 * Render the html file sent to the clients and set the correct
 * APP_UPDATE_CHANNEL variable.
 * TODO: Probably a better idea will be to use real templates and also
 * to set correct paths to the .js files
 */
function renderIndexPage() {
  let template = fs.readFileSync(
    path.join(__dirname, '..', '..', 'public-build', 'index.html'),
    'utf8'
  );

  // let versionInfo = '';
  const versionInfoParts = [`window.__VERSION__=${htmlescape(version)}`];
  if (commitHash) {
    versionInfoParts.push(`window.__COMMIT_HASH__=${htmlescape(commitHash)}`);
  }
  if (APP_ON_PREMISE) {
    versionInfoParts.push('window.APP_ON_PREMISE=true');
  }
  if (APP_UPDATE_CHANNEL) {
    versionInfoParts.push(
      `window.APP_UPDATE_CHANNEL=${htmlescape(APP_UPDATE_CHANNEL)}`
    );
  }

  const versionInfo = versionInfoParts.join(';');

  let extraHead = '';
  // google analytics tag
  if (GOOGLE_ANALYTICS_UA) {
    extraHead += `<script>(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
ga('create', '${GOOGLE_ANALYTICS_UA}', 'auto');
ga('send', 'pageview');</script>`;
  }

  if (BING_UET_ID) {
    extraHead += `<script>(function(w,d,t,r,u){var f,n,i;w[u]=w[u]||[],f=function(){var o={ti:"${BING_UET_ID}"};o.q=w[u],w[u]=new UET(o),w[u].push("pageLoad")},n=d.createElement(t),n.src=r,n.async=1,n.onload=n.onreadystatechange=function(){var s=this.readyState;s&&s!=="loaded"&&s!=="complete"||(f(),n.onload=n.onreadystatechange=null)},i=d.getElementsByTagName(t)[0],i.parentNode.insertBefore(n,i)})(window,document,"script","//bat.bing.com/bat.js","uetq");</script><noscript><img src="//bat.bing.com/action/0?ti=${BING_UET_ID}&Ver=2" height="0" width="0" style="display:none; visibility: hidden;" /></noscript>`;
  }

  if (FACEBOOK_PIXEL_ID) {
    extraHead += `<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${FACEBOOK_PIXEL_ID}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${FACEBOOK_PIXEL_ID}&ev=PageView&noscript=1"
/></noscript>`;
  }

  // adding intercom widget to header if env variable is set
  if (INTERCOM_APP_ID) {
    extraHead += `  <script>
    (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',intercomSettings);}else{var d=document;var i=function(){i.c(arguments)};i.q=[];i.c=function(args){i.q.push(args)};w.Intercom=i;function l(){var s=d.createElement('script');s.type='text/javascript';s.async=true;
    s.src='https://widget.intercom.io/widget/${INTERCOM_APP_ID}';
    var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);}if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})()
    window.Intercom('boot', {app_id: '${INTERCOM_APP_ID}'});
    </script>`;
  }

  let extraBody = '';
  // AdWords-Remarketing
  // should be at the bottom, below other scripts because it's blocking
  if (GOOGLE_CONVERSION_ID) {
    extraBody += `<script>var google_conversion_id = ${GOOGLE_CONVERSION_ID};
var google_custom_params = window.google_tag_params;
var google_remarketing_only = true;
</script><script src="//www.googleadservices.com/pagead/conversion.js">
<noscript>
<div style="display:inline;">
<img height="1" width="1" style="border-style:none;" alt="" src="//googleads.g.doubleclick.net/pagead/viewthroughconversion/${GOOGLE_CONVERSION_ID}/?guid=ON&script=0"/>
</div>
</noscript>`;
  }

  template = template
    .replace('<!-- version-info -->', `<script>${versionInfo}</script>`)
    .replace('<!-- extra-head -->', extraHead)
    .replace('<!-- extra-body -->', extraBody);
  return template;
}

export default once(renderIndexPage);
