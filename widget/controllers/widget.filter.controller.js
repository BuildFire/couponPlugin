'use strict';

(function (angular, buildfire, window) {
  angular.module('couponPluginWidget')
    .controller('WidgetFilterCtrl', ['$scope', 'DataStore', 'TAG_NAMES', 'LAYOUTS', '$sce', '$rootScope', 'Buildfire', 'ViewStack', 'UserData', '$modal', '$timeout',
      function ($scope, DataStore, TAG_NAMES, LAYOUTS, $sce, $rootScope, Buildfire, ViewStack, UserData, $modal, $timeout) {
        var WidgetFilter = this;

        WidgetFilter.filter = {};

        WidgetFilter.back = function () {
          ViewStack.pop();
        };

        WidgetFilter.getAllCategories = function () {
          Buildfire.spinner.show();
          var success = function (result) {
              Buildfire.spinner.hide();
              if (result && result.length)
                WidgetFilter.categories = result;
              else
                WidgetFilter.categories = [];
            }
            , error = function (err) {
              Buildfire.spinner.hide();
              console.error('Error while getting data', err);
            };
          DataStore.search({}, TAG_NAMES.COUPON_CATEGORIES).then(success, error);
        };
        /*
         * Fetch user's data from datastore
         */
        var init = function () {
          Buildfire.spinner.show();
          var success = function (result) {
              Buildfire.spinner.hide();
              WidgetFilter.data = result.data;
              if (!WidgetFilter.data.design)
                WidgetFilter.data.design = {};
              if (!WidgetFilter.data.settings)
                WidgetFilter.data.settings = {};
              WidgetFilter.getAllCategories();
              if (WidgetFilter.data.settings && WidgetFilter.data.settings.showDistanceIn == 'mi')
                WidgetFilter.distanceSlider = {
                  min: 0,
                  max: 300,
                  ceil: 310, //upper limit
                  floor: 0
                };
              else
                WidgetFilter.distanceSlider = {
                  min: 0,
                  max: 483,
                  ceil: 499, //upper limit
                  floor: 0
                };
            }
            , error = function (err) {
              Buildfire.spinner.hide();
              console.error('Error while getting data', err);
            };
          DataStore.get(TAG_NAMES.COUPON_INFO).then(success, error);
        };

        init();

      }]);
})(window.angular, window.buildfire, window);
