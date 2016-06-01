'use strict';

(function (angular, buildfire) {
  angular.module('couponPluginWidget')
    .controller('WidgetHomeCtrl', ['$scope', 'TAG_NAMES', 'LAYOUTS', 'DataStore', 'PAGINATION', 'Buildfire', 'Location', '$rootScope', 'ViewStack', '$sce', 'UserData', '$modal', '$timeout',
      function ($scope, TAG_NAMES, LAYOUTS, DataStore, PAGINATION, Buildfire, Location, $rootScope, ViewStack, $sce, UserData, $modal, $timeout) {
        var WidgetHome = this;

        WidgetHome.data = {
          design: {
            itemListLayout: LAYOUTS.itemListLayout[0].name
          }
        };

        WidgetHome.init = function () {
          Buildfire.spinner.show();
          var success = function (result) {
              Buildfire.spinner.hide();
              if (result && result.data) {
                WidgetHome.data = result.data;
              }
              else {
                WidgetHome.data = {
                  design: {
                    itemListLayout: LAYOUTS.itemListLayout[0].name
                  }
                };
              }
              if (WidgetHome.data && !WidgetHome.data.design) {
                WidgetHome.data.design = {
                  itemListLayout: LAYOUTS.itemListLayout[0].name
                };
              }
              if (!WidgetHome.data.design)
                WidgetHome.data.design = {};
              if (!WidgetHome.data.design.itemListLayout) {
                WidgetHome.data.design.itemListLayout = LAYOUTS.itemListLayout[0].name;
              }
              if (!WidgetHome.data.content)
                WidgetHome.data.content = {};
              console.log("==============", WidgetHome.data.design)
            }
            , error = function (err) {
              Buildfire.spinner.hide();
              WidgetHome.data = {design: {itemListLayout: LAYOUTS.itemListLayout[0].name}};
              console.error('Error while getting data', err);
            };
          DataStore.get(TAG_NAMES.COUPON_INFO).then(success, error);
        };

        WidgetHome.init();

      }])
})(window.angular, window.buildfire);
