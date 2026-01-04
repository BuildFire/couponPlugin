const stringKey = [
  'general.enterKeywordsOrPhrase',
  'general.clear',
  'general.distance',
  'general.sortingOptions',
  'general.default',
  'general.closestToMe',
  'general.enableLocationSharing',
  'general.categories',
  'general.allItems',
  'general.cancel',
  'general.apply',
  'general.reset',
  'general.searchItemNameOrSummary',
  'general.noCouponsSaved',
  'general.expires',
  'general.redeemed',
  'general.list',
  'general.map',
  'general.category',
  'general.saved',
  'general.openMoreOptions',
  'general.itemRedeemedTimeago',
  'general.redeemThisItem',
  'general.expAbbreviation',
  'general.close',
  'general.filterApplied',
  'general.noExpirationDate',
  'general.filter',
  'general.itemSavedConfirmation',
  'general.itemRedeemedConfirmation',
  'general.itemRemovedFromSaved',
  'general.at',
  'general.errorTitle',
  'general.failedToLoadGoogleMapsApi',
  'general.itemNoLongerExists',
  'general.away'
];

const stringsKeys = stringKey.reduce((acc, key) => {
  acc[key] = null;
  return acc;
}, {});
