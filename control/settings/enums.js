'use strict';

(function (angular) {
  angular.module('couponPluginSettingsEnums', [])
    .constant('TAG_NAMES', {
      COUPON_INFO: 'couponInfo',
      COUPON_CATEGORIES: 'couponCategories',
      COUPON_ITEMS: "couponItems"
    })
    .constant('STATUS_CODE', {
      INSERTED: 'inserted',
      UPDATED: 'updated',
      NOT_FOUND: 'NOTFOUND',
      UNDEFINED_DATA: 'UNDEFINED_DATA',
      UNDEFINED_OPTIONS: 'UNDEFINED_OPTIONS',
      UNDEFINED_ID: 'UNDEFINED_ID',
      ITEM_ARRAY_FOUND: 'ITEM_ARRAY_FOUND',
      NOT_ITEM_ARRAY: 'NOT_ITEM_ARRAY'
    })
    .constant('STATUS_MESSAGES', {
      UNDEFINED_DATA: 'Undefined data provided',
      UNDEFINED_OPTIONS: 'Undefined options provided',
      UNDEFINED_ID: 'Undefined id provided',
      NOT_ITEM_ARRAY: 'Array of Items not provided',
      ITEM_ARRAY_FOUND: 'Array of Items provided'
    })
    .constant('LAYOUTS', {
      itemListLayout: [
        {name: "List-Layout-1"},
        {name: "List-Layout-2"},
        {name: "List-Layout-3"},
        {name: "List-Layout-4"}
      ]
    })
    .constant('DEFAULT_INFO', {
      COUPON_INFO: {
        data: {
          "content": {
            "carouselImages": [],
            "description": '',
            "filters": []
          },
          "design": {
            "itemListLayout": "List-Layout-1"
          },
          "settings": {
            defaultView: "list",
            distanceIn: "mi",
            mapView: "show",
            filterPage: "show"
          }
        }
      }
    });
})(window.angular);