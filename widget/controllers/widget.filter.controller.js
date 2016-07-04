'use strict';

(function (angular, buildfire, window) {
  angular.module('couponPluginWidget')
    .controller('WidgetFilterCtrl', ['$scope', 'DataStore', 'TAG_NAMES', 'LAYOUTS', '$sce', '$rootScope', 'Buildfire', 'ViewStack', 'UserData', '$modal', '$timeout',
      function ($scope, DataStore, TAG_NAMES, LAYOUTS, $sce, $rootScope, Buildfire, ViewStack, UserData, $modal, $timeout) {
        var WidgetFilter = this;

        WidgetFilter.filter = {};

        WidgetFilter.locationData = {};

        WidgetFilter.sortOnClosest = false; // default value

        WidgetFilter.allSelected = true;

        function getGeoLocation() {
          Buildfire.geo.getCurrentPosition(
            null,
            function (err, position) {
              if (err) {
                console.error(err);
              }
              else if (position && position.coords) {
                $scope.$apply(function () {
                  WidgetFilter.locationData.currentCoordinates = [position.coords.longitude, position.coords.latitude];
                  localStorage.setItem('user_location', JSON.stringify(WidgetFilter.locationData.currentCoordinates));
                  WidgetFilter.refreshData += 1;
                });
              }
              else {
                getGeoLocation();
              }
            }
          );
        }

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

        WidgetFilter.setFilter = function () {
          WidgetFilter.filter.isApplied = true;
        };

        WidgetFilter.setCategories = function (category, selectAll, index) {
          if (!WidgetFilter.filter.categories)
            WidgetFilter.filter.categories = [];
          if (selectAll) {
            WidgetFilter.filter.categories = [];
            WidgetFilter.allSelected = true;
            for (var i = 0; i < WidgetFilter.categories.length; i++) {
              WidgetFilter.categories[i].isSelected = false;
            }
          }
          else {
            if (category.isSelected) {
              var idx = WidgetFilter.filter.categories.indexOf(category.id);
              if (idx != -1) {
                WidgetFilter.filter.categories.splice(idx);
                WidgetFilter.categories[index].isSelected = false;
              }
              if (WidgetFilter.filter.categories.length < 1)
                WidgetFilter.allSelected = true;
            } else {
              WidgetFilter.allSelected = false;
              WidgetFilter.filter.categories.push(category.id);
              WidgetFilter.categories[index].isSelected = true;
            }
          }
        };

        WidgetFilter.resetFilters = function () {
          WidgetFilter.sortOnClosest = false;
          WidgetFilter.allSelected = true;
          WidgetFilter.filter.text = null;
          WidgetFilter.filter.isApplied = false;
          WidgetFilter.filter.categories = [];
          WidgetFilter.allSelected = true;
          for (var i = 0; i < WidgetFilter.categories.length; i++) {
            WidgetFilter.categories[i].isSelected = false;
          }
          if (WidgetFilter.data.settings && WidgetFilter.data.settings.distanceIn == 'mi')
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
              if (WidgetFilter.data.settings && WidgetFilter.data.settings.distanceIn == 'mi')
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
          // Fetch user location

          if (typeof(Storage) !== "undefined") {
            var userLocation = localStorage.getItem('user_location');
            if (userLocation) {
              WidgetFilter.locationData.currentCoordinates = JSON.parse(userLocation);
            }
            else
              getGeoLocation(); // get data if not in cache
          }
          else {
            getGeoLocation(); // get data if localStorage is not supported
          }
        };

        init();

      }]);
})(window.angular, window.buildfire, window);
