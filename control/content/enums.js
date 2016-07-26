'use strict';

(function (angular) {
    angular.module('couponPluginContent')
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
        .constant('GOOGLE_KEYS', {
            API_KEY: 'AIzaSyCRWyvs4UfQ9qjen_smzLFmpVqsjqTYdFI'
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
        .constant('PAGINATION', {
            itemCount: 10
        })
        .constant('SORT', {
            MANUALLY: 'Manually',
            ITEM_TITLE_A_Z: 'Item Title A-Z',
            ITEM_TITLE_Z_A: 'Item Title Z-A',
            NEWEST_FIRST: 'Newest Entry First',
            OLDEST_FIRST: 'Oldest Entry First',
            EXPIRATION_DATE_ASC: 'Expiration Date Ascending',
            EXPIRATION_DATE_DESC: 'Expiration Date Descending',
            _limit: 10,
            _maxLimit: 19,
            _skip: 0
        })
        .constant('PAGINATION', {
            itemCount: 10
        })
        .constant('SORT_FILTER', {
            MANUALLY: 'Manually',
            CATEGORY_NAME_A_Z: 'Category Name A-Z',
            CATEGORY_NAME_Z_A: 'Category Name Z-A',
            _limit: 6,
            _maxLimit: 19,
            _skip: 0
        })
        .constant('DEFAULT_DATA', {
            ITEM: {
                data: {
                    title: '',
                    summary: '',
                    listImage: '',
                    startOn: '',
                    expiresOn: '',
                    links: [],
                    preRedemptionText: '',
                    postRedemptionText: '',
                    carouselImages: [],
                    rank: '',
                    addressTitle:'',
                    location: {
                        addressTitle: '',
                        coordinates: {lat: '', lng: ''}
                    },
                    Categories: []
                }
            }
        });
})(window.angular);