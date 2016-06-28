'use strict';

(function (angular, buildfire, window) {
  angular.module('couponPluginWidget')
    .controller('WidgetMapCtrl', ['$scope', 'DataStore', 'TAG_NAMES', 'LAYOUTS', '$sce', '$rootScope', 'Buildfire', 'ViewStack', 'UserData', 'GeoDistance', '$timeout','$modal',
      function ($scope, DataStore, TAG_NAMES, LAYOUTS, $sce, $rootScope, Buildfire, ViewStack, UserData, GeoDistance, $timeout,$modal) {
        var WidgetMap = this;
        WidgetMap.locationData = {};
        WidgetMap.currentDate = +new Date();
        WidgetMap.refreshData = 1;
        var searchOptions = {
          skip: 0,
          filter: {
            "$and": [{
              "$json.expiresOn": {$gte: WidgetMap.currentDate}
            }, {"$json.location.coordinates": {$exists: true}}]
          }
        };

        function getGeoLocation() {
          Buildfire.geo.getCurrentPosition(
            null,
            function (err, position) {
              if (err) {
                console.error(err);
              }
              else if (position && position.coords) {
                $scope.$apply(function () {
                  console.log('position>>>>>.', position);
                  WidgetMap.locationData.currentCoordinates = [position.coords.longitude, position.coords.latitude];
                  localStorage.setItem('user_location', JSON.stringify(WidgetMap.locationData.currentCoordinates));
                });
              }
              else {
                getGeoLocation();
              }
            }
          );
        }

        /**
         * Method to open buildfire auth login pop up and allow user to login using credentials.
         */
        WidgetMap.openLogin = function () {
          buildfire.auth.login({}, function () {

          });
        };

        WidgetMap.getAllItems = function () {
          Buildfire.spinner.show();
          var successAll = function (resultAll) {
              Buildfire.spinner.hide();
              if (resultAll) {
                resultAll.forEach(function (_item) {
                  _item.data.distance = 0; // default distance value
                });
              }
              WidgetMap.locationData.items = resultAll;
              if (WidgetMap.currentLoggedInUser)
                WidgetMap.getSavedItems();
            },
            errorAll = function (error) {
              Buildfire.spinner.hide();
              console.log("error getting items", error)
            };
          console.log("***********", WidgetMap.data.content);
          DataStore.search(searchOptions, TAG_NAMES.COUPON_ITEMS).then(successAll, errorAll);
        };

        WidgetMap.showSavedItems = function () {
          if (WidgetMap.currentLoggedInUser) {
            ViewStack.push({
              template: 'Saved',
              params: {
                controller: "WidgetSavedCtrl as WidgetSaved"
              }
            });
          } else {
            WidgetMap.openLogin();
          }
        };

        WidgetMap.showFilter = function () {
          ViewStack.push({
            template: 'Filter',
            params: {
              controller: "WidgetFilterCtrl as WidgetFilter"
            }
          });
        };

        WidgetMap.showListItems = function () {
          ViewStack.popAllViews()
        };

        WidgetMap.setSavedItem = function () {
          var isChanged = false;
          for (var item = 0; item < WidgetMap.locationData.items.length; item++) {
            console.log("...................bbbb", WidgetMap.locationData.items[item]);
            WidgetMap.locationData.items[item].isSaved = false;
            for (var save in WidgetMap.saved) {
              if (WidgetMap.locationData.items[item].id == WidgetMap.saved[save].data.itemId) {
                isChanged = true;
                WidgetMap.locationData.items[item].isSaved = true;
                WidgetMap.locationData.items[item].savedId = WidgetMap.saved[save].id;
              }
            }
          }
          if (isChanged)
            WidgetMap.refreshData = 2;
        };

        WidgetMap.getSavedItems = function () {
          Buildfire.spinner.show();
          var err = function (error) {
            Buildfire.spinner.hide();
            console.log("============ There is an error in getting saved items data", error);
          }, result = function (result) {
            Buildfire.spinner.hide();
            WidgetMap.saved = result;
            console.log("...................", WidgetMap.saved);
            WidgetMap.setSavedItem();
          };
          UserData.search({}, TAG_NAMES.COUPON_SAVED).then(result, err);
        };

        WidgetMap.init = function () {
          Buildfire.spinner.show();
          var success = function (result) {
              Buildfire.spinner.hide();
              if (result && result.data) {
                WidgetMap.data = result.data;
              }
              else {
                WidgetMap.data = {
                  design: {
                    itemListLayout: LAYOUTS.itemListLayout[0].name
                  },
                  "settings": {
                    defaultView: "list",
                    distanceIn: "mi",
                    mapView: "show",
                    filterPage: "show"
                  }
                };
              }
              if (WidgetMap.data && !WidgetMap.data.design) {
                WidgetMap.data.design = {
                  itemListLayout: LAYOUTS.itemListLayout[0].name
                };
              }
              if (WidgetMap.data && !WidgetMap.data.settings) {
                WidgetMap.data.settings = {
                  defaultView: "list",
                  distanceIn: "mi",
                  mapView: "show",
                  filterPage: "show"
                };
              }
              if (!WidgetMap.data.design.itemListLayout) {
                WidgetMap.data.design.itemListLayout = LAYOUTS.itemListLayout[0].name;
              }
              if (!WidgetMap.data.content)
                WidgetMap.data.content = {};
              WidgetMap.getAllItems();
            }
            , error = function (err) {
              Buildfire.spinner.hide();
              WidgetMap.data = {design: {itemListLayout: LAYOUTS.itemListLayout[0].name}};
              console.error('Error while getting data', err);
            };
          DataStore.get(TAG_NAMES.COUPON_INFO).then(success, error);

          // Fetch user location

          if (typeof(Storage) !== "undefined") {
            var userLocation = localStorage.getItem('user_location');
            if (userLocation) {
              WidgetMap.locationData.currentCoordinates = JSON.parse(userLocation);
            }
            else
              getGeoLocation(); // get data if not in cache
          }
          else {
            getGeoLocation(); // get data if localStorage is not supported
          }
        };

        /* Onclick event of items on the map view*/
        WidgetMap.selectedMarker = function (itemIndex) {
          if (itemIndex === null) {
            WidgetMap.selectedItem = null;
            $scope.$digest();
            return;
          }
          WidgetMap.selectedItem = WidgetMap.locationData.items[itemIndex];
          console.log("...................", WidgetMap.selectedItem);

          GeoDistance.getDistance(WidgetMap.locationData.currentCoordinates, [WidgetMap.selectedItem], '').then(function (result) {
            console.log('Distance---------------------', result);
            if (result.rows.length && result.rows[0].elements.length && result.rows[0].elements[0].distance && result.rows[0].elements[0].distance.text) {
              WidgetMap.selectedItemDistance = result.rows[0].elements[0].distance.text;
            } else {
              WidgetMap.selectedItemDistance = null;
            }
          }, function (err) {
            WidgetMap.selectedItemDistance = null;
          });
        };

        WidgetMap.addRemoveSavedItem = function (item) {
          if (item.isSaved && item.savedId) {
            Buildfire.spinner.show();
            var successRemove = function (result) {
              Buildfire.spinner.hide();
              WidgetMap.selectedItem.isSaved = false;
              WidgetMap.selectedItem.savedId = null;
              if (!$scope.$$phase)
                $scope.$digest();
              var removeSavedModal = $modal.open({
                templateUrl: 'templates/Saved_Removed.html',
                size: 'sm',
                backdropClass: "ng-hide"
              });
              $timeout(function () {
                removeSavedModal.close();
              }, 3000);

            }, errorRemove = function () {
              Buildfire.spinner.hide();
              return console.error('There was a problem removing your data');
            };
            UserData.delete(item.savedId, TAG_NAMES.COUPON_SAVED, WidgetMap.currentLoggedInUser._id).then(successRemove, errorRemove)
          }
          else {
            Buildfire.spinner.show();
            WidgetMap.savedItem = {
              data: {
                itemId: item.id
              }
            };
            var successItem = function (result) {
              Buildfire.spinner.hide();
              console.log("Inserted", result);
              WidgetMap.selectedItem.isSaved = true;
              WidgetMap.selectedItem.savedId = result.id;
              if (!$scope.$$phase)
                $scope.$digest();

              var addedCouponModal = $modal.open({
                templateUrl: 'templates/Saved_Confirmation.html',
                size: 'sm',
                backdropClass: "ng-hide"
              });
              $timeout(function () {
                addedCouponModal.close();
              }, 3000);

            }, errorItem = function () {
              Buildfire.spinner.hide();
              return console.error('There was a problem saving your data');
            };
            UserData.insert(WidgetMap.savedItem.data, TAG_NAMES.COUPON_SAVED).then(successItem, errorItem);
          }
        };

        WidgetMap.init();

        /**
         * Check for current logged in user, if not show login screen
         */
        buildfire.auth.getCurrentUser(function (err, user) {
          if (user) {
            WidgetMap.currentLoggedInUser = user;
            $scope.$apply();
          }
        });

        function getItemsDistance(_items) {
          console.log('-------------================', _items);
          if (WidgetMap.locationData.currentCoordinates == null) {
            return;
          }
          if (_items && _items.length) {
            GeoDistance.getDistance(WidgetMap.locationData.currentCoordinates, _items, WidgetMap.data.settings.distanceIn).then(function (result) {
              console.log('WidgetMap.locationData.currentCoordinates', WidgetMap.locationData.currentCoordinates);
              for (var _ind = 0; _ind < WidgetMap.locationData.items.length; _ind++) {
                if (_items && _items[_ind]) {
                  _items[_ind].data.distance = (result.rows[0].elements[_ind].status != 'OK') ? -1 : result.rows[0].elements[_ind].distance.value;
                }
              }

            }, function (err) {
              console.error('distance err', err);
            });
          }
        }

        $scope.$watch(function () {
          return WidgetMap.locationData.items;
        }, getItemsDistance);

      }]);
})(window.angular, window.buildfire, window);
