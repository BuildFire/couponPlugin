'use strict';

(function (angular, buildfire, window) {
  angular.module('couponPluginWidget')
    .controller('WidgetSavedCtrl', ['$scope', 'DataStore', 'TAG_NAMES', 'LAYOUTS', '$sce', '$rootScope', 'Buildfire', 'ViewStack', 'UserData', 'PAGINATION', '$modal', '$timeout',
      function ($scope, DataStore, TAG_NAMES, LAYOUTS, $sce, $rootScope, Buildfire, ViewStack, UserData, PAGINATION, $modal, $timeout) {
        var WidgetSaved = this;
        WidgetSaved.busy = false;
        WidgetSaved.items = [];
        WidgetSaved.savedItems = {};
        var searchOptions = {
          skip: 0,
          limit: PAGINATION.itemCount
        };
        WidgetSaved.init = function () {
          Buildfire.spinner.show();
          var success = function (result) {
              Buildfire.spinner.hide();
              if (result && result.data) {
                WidgetSaved.data = result.data;
              }
            }
            , error = function (err) {
              Buildfire.spinner.hide();
              console.error('Error while getting data', err);
            };
          DataStore.get(TAG_NAMES.COUPON_INFO).then(success, error);
        };

        WidgetSaved.getSavedItems = function () {
          for (var item = 0; item < WidgetSaved.items.length; item++) {
            WidgetSaved.items[item].isSaved = false;
            for (var saved in WidgetSaved.savedItems) {
              if (WidgetSaved.items[item].id == WidgetSaved.savedItems[saved].data.itemId) {
                WidgetSaved.hasAtleastOneSaved = true;
                WidgetSaved.items[item].isSaved = true;
                WidgetSaved.items[item].savedId = WidgetSaved.savedItems[saved].id;
              }
            }
          }
          $scope.isFetchedAllData = true;
        };

        WidgetSaved.getItems = function () {
          Buildfire.spinner.show();
          var successAll = function (resultAll) {
              Buildfire.spinner.hide();
              WidgetSaved.items = WidgetSaved.items.length ? WidgetSaved.items.concat(resultAll) : resultAll;
              console.log("==============", WidgetSaved.items);
              searchOptions.skip = searchOptions.skip + PAGINATION.itemCount;
              if (resultAll.length == PAGINATION.itemCount) {
                WidgetSaved.busy = false;
              }
              var err = function (error) {
                Buildfire.spinner.hide();
                console.log("============ There is an error in getting data", error);
              }, result = function (result) {
                Buildfire.spinner.hide();
                console.log("===========search", result);
                WidgetSaved.savedItems = result;
                WidgetSaved.getSavedItems();
              };
              UserData.search({}, TAG_NAMES.COUPON_SAVED).then(result, err);


            },
            errorAll = function (error) {
              Buildfire.spinner.hide();
              console.log("error", error)
            };
          DataStore.search(searchOptions, TAG_NAMES.COUPON_ITEMS).then(successAll, errorAll);
        };

        WidgetSaved.loadMore = function () {
          console.log("===============In loadmore");
          if (WidgetSaved.busy) return;
          WidgetSaved.busy = true;
          WidgetSaved.getItems();
        };

        WidgetSaved.init();

      }]);
})(window.angular, window.buildfire, window);
