let shouldShowBanner = false;
if(document.cookie.indexOf('OptanonAlertBoxClosed') === -1){
  shouldShowBanner = true;
} else {
  const lastOnetrustUpdate = '2022/06/14, 16:51'
  const cookieString = document.cookie;
  let i = document.cookie.indexOf('OptanonAlertBoxClosed') + ('OptanonAlertBoxClosed=').length;
  let dateString = '';
  
  while(cookieString[i] && cookieString[i] !== ';') {
    dateString += cookieString[i];
    i++;  // This was causing the error because i was const
  }
  
  // check if reconsent needed because of onetrust list update
  if(new Date(`${lastOnetrustUpdate}`) > new Date(dateString)) {
    shouldShowBanner = true;
  }
}

// user accepted cookie but left the page before onetrust was called
try {
  if(localStorage.getItem('CustomCookieBannerAcceptIntent')) {
    shouldShowBanner = false;
  }
} catch (err) {
  console.warn('Localstorage was not accessible');
}

if (shouldShowBanner) {
  // change this classname according to webflow elements
  document.documentElement.classList.add('show-cookie-banner');
}