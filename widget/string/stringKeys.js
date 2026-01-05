const stringKey = [
  // General strings
  'general.clear',
  'general.expires',
  'general.redeemed',
  'general.at',
  'general.away',
  'general.noExpirationDate',

  // Errors
  'errors.errorTitle',
  'errors.failedToLoadGoogleMapsApi',
  
  // Navigation strings
  'navigation.list',
  'navigation.map',
  'navigation.category',
  'navigation.saved',
  'navigation.filterApplied',
  
  // Item Details screen
  'itemDetails.openMoreOptions',
  'itemDetails.itemRedeemedTimeago',
  'itemDetails.redeemThisItem',
  
  // Map screen
  'mapScreen.expAbbreviation',
  'mapScreen.close',
  
  // Saved screen
  'savedScreen.searchItemNameOrSummary',
  'savedScreen.noCouponsSaved',
  
  // Categories Filter
  'categories.enterKeywordsOrPhrase',
  'categories.distance',
  'categories.sortingOptions',
  'categories.default',
  'categories.closestToMe',
  'categories.categories',
  'categories.allItems',
  'categories.cancel',
  'categories.apply',
  'categories.reset',
  'categories.enableLocationSharing',
  
  // Confirmations
  'confirmations.itemSavedConfirmation',
  'confirmations.itemRedeemedConfirmation',
  'confirmations.itemRemovedFromSaved',
  'confirmations.itemNoLongerExists'
];

const stringsKeys = stringKey.reduce((acc, key) => {
  acc[key] = null;
  return acc;
}, {});

const defaultValues = {
  // General strings
  'general.clear': 'Clear',
  'general.expires': 'Expires',
  'general.redeemed': 'Redeemed',
  'general.at': 'at',
  'general.away': 'away',
  'general.noExpirationDate': 'No expiration date',

  // Errors
  'errors.errorTitle': 'Error',
  'errors.failedToLoadGoogleMapsApi': 'Failed to load Google Maps API.',
  
  // Navigation strings
  'navigation.list': 'List',
  'navigation.map': 'Map',
  'navigation.category': 'Category',
  'navigation.saved': 'Saved',
  'navigation.filterApplied': 'Filter Applied',
  
  // Item Details screen
  'itemDetails.openMoreOptions': 'Open More Options',
  'itemDetails.itemRedeemedTimeago': 'Item redeemed',
  'itemDetails.redeemThisItem': 'Redeem this Item',
  
  // Map screen
  'mapScreen.expAbbreviation': 'Exp.',
  'mapScreen.close': 'Close',
  
  // Saved screen
  'savedScreen.searchItemNameOrSummary': 'Search item name or summary...',
  'savedScreen.noCouponsSaved': 'No coupons saved.',
  
  // Categories Filter
  'categories.enterKeywordsOrPhrase': 'Enter keywords or phrase',
  'categories.distance': 'Distance',
  'categories.sortingOptions': 'Sorting Options',
  'categories.default': 'Default',
  'categories.closestToMe': 'Closest to Me',
  'categories.categories': 'Categories',
  'categories.allItems': 'All Items',
  'categories.cancel': 'Cancel',
  'categories.apply': 'Apply',
  'categories.reset': 'Reset',
  'categories.enableLocationSharing': 'Enable Location sharing to activate Closest to Me.',
  
  // Confirmations
  'confirmations.itemSavedConfirmation': 'Item Saved!',
  'confirmations.itemRedeemedConfirmation': 'Item Redeemed',
  'confirmations.itemRemovedFromSaved': 'Item removed from saved list',
  'confirmations.itemNoLongerExists': 'This item no longer exists!'
};
