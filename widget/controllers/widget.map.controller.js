'use strict';

(function (angular, buildfire, window) {
  angular.module('couponPluginWidget')
    .controller('WidgetMapCtrl', ['$scope', 'DataStore', 'TAG_NAMES', 'LAYOUTS', '$sce', '$rootScope', 'Buildfire', 'ViewStack', 'UserData', 'GeoDistance', '$timeout', '$modal',
      function ($scope, DataStore, TAG_NAMES, LAYOUTS, $sce, $rootScope, Buildfire, ViewStack, UserData, GeoDistance, $timeout, $modal) {
        var WidgetMap = this;
        WidgetMap.locationData = {};
        WidgetMap.listeners = {};
        WidgetMap.currentDate = new Date();
        WidgetMap.yesterdayDate = +WidgetMap.currentDate.setDate(WidgetMap.currentDate.getDate() - 1);
        WidgetMap.refreshData = 1;
        WidgetMap.filter = {};
        var searchOptions = {
          skip: 0,
          filter: {
            "$and": [{
              "$or": [{
                "$json.expiresOn": {$gte: WidgetMap.yesterdayDate}
              }, {"$json.expiresOn": ""}]
            }, {"$json.location.coordinates": {$exists: true}}]
          }
        };
        var currentDistanceUnit = null;
        $rootScope.$on('FILTER_ITEMS', function (e, view) {
          WidgetMap.isFilterApplied = view.isFilterApplied;
          if (view && view.isFilterApplied) {

            WidgetMap.filter = view.filter;
            WidgetMap.getAllItems(view.filter);
          } else {
            WidgetMap.getAllItems(view.filter);
          }
        });
        function getGeoLocation() {
          Buildfire.geo.getCurrentPosition(
            null,
            function (err, position) {
              if (err) {
                console.error(err);
              }
              else if (position && position.coords) {
                $scope.$apply(function () {
                  WidgetMap.locationData.currentCoordinates = [position.coords.longitude, position.coords.latitude];
                  localStorage.setItem('user_location', JSON.stringify(WidgetMap.locationData.currentCoordinates));
                  WidgetMap.refreshData += 1;
                });
              }
              else {
                getGeoLocation();
              }
            }
          );
        }

        //Refresh items on pulling the tile bar

        buildfire.datastore.onRefresh(function () {
          WidgetMap.init(function(err){
              console.log(">>>>>>Refreshed map");
          });
        });

        /**
         * Method to open buildfire auth login pop up and allow user to login using credentials.
         */
        WidgetMap.openLogin = function () {
          buildfire.auth.login({}, function () {

          });
        };

        WidgetMap.getAllItems = function (filter) {
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
              else
                WidgetMap.formatItems();
            },
            errorAll = function (error) {
              Buildfire.spinner.hide();
              console.log("error getting items", error)
            };
          console.log("***********", WidgetMap.data.content);

          if (WidgetMap.isFilterApplied) {
            var itemFilter;
            if (filter.categories && filter.categories.length) {
              searchOptions = {
                skip: 0,
                filter: {
                  "$and": [{
                    "$or": [{
                      "$json.expiresOn": {$gte: WidgetMap.yesterdayDate}
                    }, {"$json.expiresOn": ""}]
                  }, {"$json.location.coordinates": {$exists: true}}]
                }
              };
              itemFilter = {'$json.SelectedCategories': {'$in': filter.categories}};
              searchOptions.filter.$and.push(itemFilter);
            } else {
              searchOptions = {
                skip: 0,
                filter: {
                  "$and": [{
                    "$or": [{
                      "$json.expiresOn": {$gte: WidgetMap.yesterdayDate}
                    }, {"$json.expiresOn": ""}]
                  }, {"$json.location.coordinates": {$exists: true}}]
                }
              }
            }
            DataStore.search(searchOptions, TAG_NAMES.COUPON_ITEMS).then(successAll, errorAll);
          } else {
            DataStore.search(searchOptions, TAG_NAMES.COUPON_ITEMS).then(successAll, errorAll);
          }

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
          WidgetMap.isFilterApplied = false;
          console.log("============", WidgetMap.data.design.itemListLayout);
          if (WidgetMap.data.settings.defaultView == 'list')
            ViewStack.popAllViews();
          else
            ViewStack.push({
              template: WidgetMap.data.design.itemListLayout,
              params: {
                controller: "WidgetHomeCtrl as WidgetHome"
              }
            });
        };

        WidgetMap.formatItems = function () {
          var isChanged = false;
          for (var i = 0; i < WidgetMap.locationData.items.length; i++) {
            for (var j = i + 1; j < WidgetMap.locationData.items.length; j++) {
              if (!WidgetMap.locationData.items[i].alreadySet && !WidgetMap.locationData.items[j].alreadySet && (angular.equals(WidgetMap.locationData.items[i].data.location, WidgetMap.locationData.items[j].data.location))) {
                isChanged = true;
                WidgetMap.locationData.items[j].alreadySet = true;
                WidgetMap.locationData.items[i].multiCoupons = true;
                if (!WidgetMap.locationData.items[i].couponContained)
                  WidgetMap.locationData.items[i].couponContained = [];

                if (WidgetMap.locationData.items[i].couponContained.length == 0)
                  WidgetMap.locationData.items[i].couponContained.push(angular.copy(WidgetMap.locationData.items[i]));
                WidgetMap.locationData.items[i].couponContained.push(angular.copy(WidgetMap.locationData.items[j]));
              }
            }
          }
          console.log("IIIIIII", WidgetMap.locationData.items);
          if (isChanged)
            WidgetMap.refreshData += 1;
          WidgetMap.allItemsFormatted = true;
        };

        WidgetMap.setSavedItem = function () {
          var isChanged = false;
          for (var item = 0; item < WidgetMap.locationData.items.length; item++) {
            WidgetMap.locationData.items[item].isSaved = false;
            for (var save in WidgetMap.saved) {
              if (WidgetMap.locationData.items[item].id == WidgetMap.saved[save].data.itemId) {
                isChanged = true;
                WidgetMap.locationData.items[item].isSaved = true;
                WidgetMap.locationData.items[item].savedId = WidgetMap.saved[save].id;
              }
            }
          }
          WidgetMap.formatItems();
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

        WidgetMap.init = function (cb) {
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
            if (WidgetMap.data.settings.distanceIn)
              currentDistanceUnit = WidgetMap.data.settings.distanceIn;
            WidgetMap.getAllItems();
            cb();
          }
            , error = function (err) {
            Buildfire.spinner.hide();
            WidgetMap.data = {design: {itemListLayout: LAYOUTS.itemListLayout[0].name}};
            console.error('Error while getting data', err);
            cb();
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
          GeoDistance.getDistance(WidgetMap.locationData.currentCoordinates, [WidgetMap.selectedItem], WidgetMap.data.settings.distanceIn).then(function (result) {
            if (result.rows.length && result.rows[0].elements.length && result.rows[0].elements[0].distance && result.rows[0].elements[0].distance.text) {
              WidgetMap.selectedItemDistance = result.rows[0].elements[0].distance.text;
            } else {
              WidgetMap.selectedItemDistance = null;
            }
          }, function (err) {
            WidgetMap.selectedItemDistance = null;
          });
        };

        WidgetMap.addRemoveSavedItem = function (item, multipleCoupons, index) {
          if (item.isSaved && item.savedId) {
            Buildfire.spinner.show();
            var successRemove = function (result) {
              Buildfire.spinner.hide();
              if (multipleCoupons) {
                WidgetMap.selectedItem.couponContained[index].isSaved = false;
                WidgetMap.selectedItem.couponContained[index].savedId = null;
              } else {
                WidgetMap.selectedItem.isSaved = false;
                WidgetMap.selectedItem.savedId = null;
              }
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
              $rootScope.$broadcast("ITEM_SAVED_UPDATED");

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
              if (multipleCoupons) {
                WidgetMap.selectedItem.couponContained[index].isSaved = true;
                WidgetMap.selectedItem.couponContained[index].savedId = result.id;
              }
              else {
                WidgetMap.selectedItem.isSaved = true;
                WidgetMap.selectedItem.savedId = result.id;
              }
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
              $rootScope.$broadcast("ITEM_SAVED_UPDATED");

            }, errorItem = function () {
              Buildfire.spinner.hide();
              return console.error('There was a problem saving your data');
            };
            UserData.insert(WidgetMap.savedItem.data, TAG_NAMES.COUPON_SAVED).then(successItem, errorItem);
          }
        };

        WidgetMap.refreshLocation = function () {
          getGeoLocation();
        };

        WidgetMap.init(function(){});

        var onUpdateCallback = function (event) {
          setTimeout(function () {
            $scope.$digest();
            if (event && event.tag === TAG_NAMES.COUPON_INFO) {
              WidgetMap.data = event.data;
              if (!WidgetMap.data.design)
                WidgetMap.data.design = {};
              if (!WidgetMap.data.content)
                WidgetMap.data.content = {};
              if (!WidgetMap.data.settings)
                WidgetMap.data.settings = {};
              if (currentDistanceUnit && WidgetMap.data.settings.distanceIn) {
                if (currentDistanceUnit != WidgetMap.data.settings.distanceIn) {
                  getItemsDistance(WidgetMap.locationData.items);
                  currentDistanceUnit = WidgetMap.data.settings.distanceIn;
                }
              }
            }
            else if (event && event.tag === TAG_NAMES.COUPON_ITEMS) {
              WidgetMap.getAllItems();
            }
            $scope.$digest();
          }, 0);
        };

        DataStore.onUpdate("map").then(null, null, onUpdateCallback);

        /**
         * Check for current logged in user, if not show login screen
         */
        buildfire.auth.getCurrentUser(function (err, user) {
          if (user) {
            WidgetMap.currentLoggedInUser = user;
            $scope.$apply();
          }
        });


        function getItemsSortOnDistance(_items) {
          if (WidgetMap.locationData.currentCoordinates == null) {
            return;
          }
          if (_items && _items.length) {
            GeoDistance.getDistance(WidgetMap.locationData.currentCoordinates, _items, WidgetMap.data.settings.distanceIn).then(function (result) {
              console.log('WidgetMap.locationData.currentCoordinates', WidgetMap.locationData.currentCoordinates);
              var tmpItemArray = [];
              for (var _ind = 0; _ind < WidgetMap.locationData.items.length; _ind++) {
                if (_items && _items[_ind]) {
                  _items[_ind].data.distance = (result.rows[0].elements[_ind].status != 'OK') ? -1 : result.rows[0].elements[_ind].distance.value;

                  if (WidgetMap.isFilterApplied) {

                    var sortFilterCond = (Number(_items[_ind].data.distance) >= WidgetMap.filter.distanceRange.min && Number(_items[_ind].data.distance) <= WidgetMap.filter.distanceRange.max);
                    if (sortFilterCond) {
                      tmpItemArray.push(_items[_ind]);
                      if (_ind == WidgetMap.locationData.items.length - 1)
                        return tmpItemArray;
                    }
                  }

                }
              }

            }, function (err) {
              console.error('distance err', err);
            });
          }
        }

        function getItemsDistance(_items) {
          if (WidgetMap.locationData.currentCoordinates == null) {
            return;
          }
          if (_items && _items.length) {
            GeoDistance.getDistance(WidgetMap.locationData.currentCoordinates, _items, WidgetMap.data.settings.distanceIn).then(function (result) {
              console.log('WidgetMap.locationData.currentCoordinates', WidgetMap.locationData.currentCoordinates);
              for (var _ind = 0; _ind < WidgetMap.locationData.items.length; _ind++) {
                if (_items && _items[_ind]) {
                  _items[_ind].data.distance = (result.rows[0].elements[_ind].status != 'OK') ? -1 : result.rows[0].elements[_ind].distance.value;

                  if (WidgetMap.isFilterApplied && WidgetMap.filter.distanceRange) {

                    var sortFilterCond = (Number(_items[_ind].data.distance) >= WidgetMap.filter.distanceRange.min && Number(_items[_ind].data.distance) <= WidgetMap.filter.distanceRange.max);
                    if (!sortFilterCond) {
                      _items.splice(_ind, 1);
                      WidgetMap.refreshData += 1
                    }
                  }

                }
              }
              //  WidgetMap.isFilterApplied=false;
            }, function (err) {
              console.error('distance err', err);
            });
          }
        }

        WidgetMap.closeCouponList = function () {
          WidgetMap.selectedItem = null;
        };

        WidgetMap.openDetailsPage = function (coupon) {
          if(coupon && coupon.id){
            ViewStack.push({
              template: 'Item',
              params: {
                controller: "WidgetItemCtrl as WidgetItem",
                itemId: coupon.id
              }
            });
          }
        };

        $scope.$watch(function () {
          return WidgetMap.locationData.items;
        }, getItemsDistance);

        $scope.$on("$destroy", function () {

          for (var i in WidgetMap.listeners) {
            if (WidgetMap.listeners.hasOwnProperty(i)) {
              WidgetMap.listeners[i]();
            }
          }
          DataStore.clearListener("map");

        });

        WidgetMap.listeners['CHANGED'] = $rootScope.$on('VIEW_CHANGED', function (e, type, view) {

          if (ViewStack.getCurrentView().template == 'Map') {
            //bind on refresh again

            buildfire.datastore.onRefresh(function () {
              WidgetMap.init(function(err){
                console.log(">>>>>>Refreshed map");
              });
            });
          }
        });

      }]);
})(window.angular, window.buildfire, window);
