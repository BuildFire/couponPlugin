'use strict';

var couponFilters = angular.module('couponFilters', []);

couponFilters.filter('timeago', function() {
  return function(input) {
    if (!input) return '';

    const lang = buildfire.getContext().localization.appDateTimeLanguage || 'en';
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });

    const date = new Date(input);
    const now = new Date();

    const diffInSeconds = (date - now) / 1000;
    const absSeconds = Math.abs(diffInSeconds);

    const units = [
      { limit: 60, name: 'second', divisor: 1 },
      { limit: 3600, name: 'minute', divisor: 60 },
      { limit: 86400, name: 'hour', divisor: 3600 },
      { limit: 604800, name: 'day', divisor: 86400 },
      { limit: 2629746, name: 'week', divisor: 604800 },
      { limit: 31556952, name: 'month', divisor: 2629746 },
      { limit: Infinity, name: 'year', divisor: 31556952 }
    ];

    for (const u of units) {
      if (absSeconds < u.limit) {
        const value = Math.round(absSeconds / u.divisor);
        return rtf.format(-value, u.name);
      }
    }
  };
});
