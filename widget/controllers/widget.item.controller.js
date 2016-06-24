'use strict';

(function (angular, buildfire, window) {
  angular.module('couponPluginWidget')
    .controller('WidgetItemCtrl', ['$scope', 'DataStore', 'TAG_NAMES', 'LAYOUTS', '$sce', '$rootScope', 'Buildfire', 'ViewStack', 'UserData', 'PAGINATION', '$modal', '$timeout', '$location',
      function ($scope, DataStore, TAG_NAMES, LAYOUTS, $sce, $rootScope, Buildfire, ViewStack, UserData, PAGINATION, $modal, $timeout, $location) {
        var WidgetItem = this;

        var currentView = ViewStack.getCurrentView();

        WidgetItem.getItemDetails = function () {
          Buildfire.spinner.show();
          var success = function (result) {
              console.log(">>>>>>>>>>", result);
              Buildfire.spinner.hide();
              WidgetItem.item = result;
            }
            , error = function (err) {
              Buildfire.spinner.hide();
              console.error('Error In Fetching Event', err);
            };

          if (currentView.params && currentView.params.itemId) {
            DataStore.getById(currentView.params.itemId, TAG_NAMES.COUPON_ITEMS).then(success, error);
          }
        };

        WidgetItem.safeHtml = function (html) {
          if (html) {
            var $html = $('<div />', {html: html});
            $html.find('iframe').each(function (index, element) {
              var src = element.src;
              console.log('element is: ', src, src.indexOf('http'));
              src = src && src.indexOf('file://') != -1 ? src.replace('file://', 'http://') : src;
              element.src = src && src.indexOf('http') != -1 ? src : 'http:' + src;
            });
            return $sce.trustAsHtml($html.html());
          }
        };

        WidgetItem.openLinks = function (actionItems) {
          if (actionItems && actionItems.length) {
            var options = {};
            var callback = function (error, result) {
              if (error) {
                console.error('Error:', error);
              }
            };
            buildfire.actionItems.list(actionItems, options, callback);
          }
        };

        WidgetItem.onAddressClick = function (long, lat) {
          if (WidgetItem.device && WidgetItem.device.platform == 'ios')
            buildfire.navigation.openWindow("maps://maps.google.com/maps?daddr=" + lat + "," + long, '_system');
          else
            buildfire.navigation.openWindow("http://maps.google.com/maps?daddr=" + lat + "," + long, '_system');
        };

        /**
         * This event listener is bound for "Carousel:LOADED" event broadcast
         */
        $rootScope.$on("Carousel2:LOADED", function () {
          //  WidgetItem.view = null;
          if (WidgetItem.view)
            WidgetItem.view._destroySlider();
          if (!WidgetItem.view) {
            WidgetItem.view = new Buildfire.components.carousel.view("#carousel2", []);
          }
          if (WidgetItem.item.data && WidgetItem.item.data.carouselImages) {
            WidgetItem.view.loadItems(WidgetItem.item.data.carouselImages);
          } else {
            WidgetItem.view.loadItems([]);
          }
        });

        /*
         * Fetch user's data from datastore
         */
        var init = function () {
          Buildfire.spinner.show();
          var success = function (result) {
              Buildfire.spinner.hide();
              WidgetItem.data = result.data;
              if (!WidgetItem.data.design)
                WidgetItem.data.design = {};
              WidgetItem.getItemDetails();
              var getDevice = function (error, data) {
                if (data)
                  WidgetItem.device = data.device;
                else
                  console.log("Error while getting the device context data", error)
              };
              buildfire.getContext(getDevice);
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
