'use strict';

(function (angular, buildfire) {
  angular.module('couponPluginWidget')
    .controller('WidgetHomeCtrl', ['$scope', 'TAG_NAMES', 'LAYOUTS', 'DataStore', 'PAGINATION', 'Buildfire', 'Location', '$rootScope', 'ViewStack', '$sce', 'UserData', '$modal', '$timeout', 'SORT', 'GeoDistance',
      function ($scope, TAG_NAMES, LAYOUTS, DataStore, PAGINATION, Buildfire, Location, $rootScope, ViewStack, $sce, UserData, $modal, $timeout, SORT, GeoDistance) {
        var WidgetHome = this;
        WidgetHome.listeners = {};
        $rootScope.deviceHeight = window.innerHeight;
        $rootScope.deviceWidth = window.innerWidth || 320;
        WidgetHome.data = {
          design: {
            itemListLayout: LAYOUTS.itemListLayout[0].name
          }
        };
        var currentListLayout, currentDistanceUnit, currentSortOrder = null;
        WidgetHome.locationData = {};
        WidgetHome.busy = false;
        WidgetHome.items = [];
        $rootScope.$on('FILTER_ITEMS', function (e, view) {
          if (view && view.isFilterApplied) {
            WidgetHome.isFilterApplied = true;
          }
        });

        WidgetHome.currentDate = +new Date();
        var searchOptions = {
          skip: 0,
          limit: PAGINATION.itemCount,
          filter: {
            "$or": [{
              "$json.expiresOn": {$gte: WidgetHome.currentDate}
            }, {"$json.expiresOn": ""}]
          }
        };
        WidgetHome.couponInfo = null;
        $scope.isFetchedAllData = false;


        /**
         * getSearchOptions(value) is used to get searchOptions with one more key sort which decide the order of sorting.
         */
        WidgetHome.getSearchOptions = function (value) {
          switch (value) {
            case SORT.ITEM_TITLE_A_Z:
              searchOptions.sort = {"title": 1};
              break;
            case SORT.ITEM_TITLE_Z_A:
              searchOptions.sort = {"title": -1};
              break;
            case SORT.EXPIRATION_DATE_ASC:
              searchOptions.sort = {"expiresOn": -1};
              break;
            case SORT.EXPIRATION_DATE_DESC:
              searchOptions.sort = {"expiresOn": 1};
              break;
            case SORT.NEWEST_FIRST:
              searchOptions.sort = {"dateCreated": -1};
              break;
            case SORT.OLDEST_FIRST:
              searchOptions.sort = {"dateCreated": 1};
              break;
            default :
              searchOptions.sort = {"rank": 1};
              break;
          }
          return searchOptions;
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
                  },
                  "settings": {
                    defaultView: "list",
                    distanceIn: "mi",
                    mapView: "show",
                    filterPage: "show"
                  }
                };
              }
              if (WidgetHome.data && !WidgetHome.data.design) {
                WidgetHome.data.design = {
                  itemListLayout: LAYOUTS.itemListLayout[0].name
                };
              }
              if (WidgetHome.data && !WidgetHome.data.settings) {
                WidgetHome.data.settings = {
                  defaultView: "list",
                  distanceIn: "mi",
                  mapView: "show",
                  filterPage: "show"
                };
              }
              if (!WidgetHome.data.design.itemListLayout) {
                WidgetHome.data.design.itemListLayout = LAYOUTS.itemListLayout[0].name;
              }
              if (!WidgetHome.data.content)
                WidgetHome.data.content = {};
              if (WidgetHome.data.content.sortBy) {
                currentSortOrder = WidgetHome.data.content.sortItemBy;
              }
              if (WidgetHome.data.settings.distanceIn)
                currentDistanceUnit = WidgetHome.data.settings.distanceIn;
            }
            , error = function (err) {
              Buildfire.spinner.hide();
              WidgetHome.data = {design: {itemListLayout: LAYOUTS.itemListLayout[0].name}};
              console.error('Error while getting data', err);
            };
          DataStore.get(TAG_NAMES.COUPON_INFO).then(success, error);

          // Fecth user location

          if (typeof(Storage) !== "undefined") {
            var userLocation = localStorage.getItem('user_location');
            if (userLocation) {
              WidgetHome.locationData.currentCoordinates = JSON.parse(userLocation);
            }
            else
              getGeoLocation(); // get data if not in cache
          }
          else {
            getGeoLocation(); // get data if localStorage is not supported
          }
        };

        WidgetHome.currentLoggedInUser = null;

        /**
         * Method to open buildfire auth login pop up and allow user to login using credentials.
         */
        WidgetHome.openLogin = function () {
          buildfire.auth.login({}, function () {

          });
        };

        /**
         * This event listener is bound for "Carousel:LOADED" event broadcast
         */
        $rootScope.$on("Carousel:LOADED", function () {
          WidgetHome.view = null;
          console.log("****************", WidgetHome.data.content.carouselImages);
          if (!WidgetHome.view) {
            WidgetHome.view = new Buildfire.components.carousel.view("#carousel", []);
          }
          if (WidgetHome.data.content && WidgetHome.data.content.carouselImages) {
            WidgetHome.view.loadItems(WidgetHome.data.content.carouselImages);
          } else {
            WidgetHome.view.loadItems([]);
          }
        });

        WidgetHome.showDescription = function (description) {
          if (description)
            return !((description == '<p>&nbsp;<br></p>') || (description == '<p><br data-mce-bogus="1"></p>') || (description == ''));
          else return false;
        };

        WidgetHome.safeHtml = function (html) {
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
                  WidgetHome.locationData.currentCoordinates = [position.coords.longitude, position.coords.latitude];
                  localStorage.setItem('user_location', JSON.stringify(WidgetHome.locationData.currentCoordinates));
                });
              }
              else {
                getGeoLocation();
              }
            }
          );
        }

        WidgetHome.init();

        var onUpdateCallback = function (event) {
          console.log(event);
          setTimeout(function () {
            $scope.$digest();
            if (event && event.tag === TAG_NAMES.COUPON_INFO) {
              WidgetHome.data = event.data;
              if (!WidgetHome.data.design)
                WidgetHome.data.design = {};
              if (!WidgetHome.data.content)
                WidgetHome.data.content = {};
              if (!WidgetHome.data.settings)
                WidgetHome.data.settings = {};
              if (event.data.content.sortItemBy && currentSortOrder != event.data.content.sortItemBy) {
                WidgetHome.data.content.sortItemBy = event.data.content.sortItemBy;
                WidgetHome.items = [];
                searchOptions.skip = 0;
                WidgetHome.busy = false;
                WidgetHome.loadMore();
              }
              if (currentDistanceUnit && WidgetHome.data.settings.distanceIn) {
                if (currentDistanceUnit != WidgetHome.data.settings.distanceIn) {
                  getItemsDistance(WidgetHome.items);
                  currentDistanceUnit = WidgetHome.data.settings.distanceIn;
                }
              }
            }
            else if (event && event.tag === TAG_NAMES.COUPON_ITEMS) {
              WidgetHome.items = [];
              searchOptions.skip = 0;
              WidgetHome.busy = false;
              WidgetHome.loadMore();
            }

            if (!WidgetHome.data.design.itemListLayout) {
              WidgetHome.data.design.itemListLayout = LAYOUTS.itemListLayout[0].name;
            }
            if (currentListLayout != WidgetHome.data.design.itemListLayout && WidgetHome.view && WidgetHome.data.content.carouselImages) {
              WidgetHome.view._destroySlider();
              WidgetHome.view = null;
              console.log("==========1")
            }
            else {
              if (WidgetHome.view) {
                WidgetHome.view.loadItems(WidgetHome.data.content.carouselImages);
                console.log("==========2")
              }
            }
            currentListLayout = WidgetHome.data.design.itemListLayout;
            $scope.$digest();
            $rootScope.$digest();
          }, 0);
        };

        DataStore.onUpdate().then(null, null, onUpdateCallback);

        WidgetHome.getItems = function () {
          Buildfire.spinner.show();
          var successAll = function (resultAll) {
              Buildfire.spinner.hide();
              if (resultAll) {
                resultAll.forEach(function (_item) {
                  _item.data.distance = 0; // default distance value
                  _item.data.distanceText = (WidgetHome.locationData.currentCoordinates) ? 'Fetching..' : 'NA';
                });
              }

                  resultAll.forEach(function (_item) {
                    _item.data.distance = 0; // default distance value
                    _item.data.distanceText = (WidgetHome.locationData.currentCoordinates) ? 'Fetching..' : 'NA';
                  });
                }

              WidgetHome.items = WidgetHome.items.length ? WidgetHome.items.concat(resultAll) : resultAll;
              searchOptions.skip = searchOptions.skip + PAGINATION.itemCount;
              if (resultAll.length == PAGINATION.itemCount) {
                WidgetHome.busy = false;
              }
              console.log("----------------------", WidgetHome.items);
              WidgetHome.setSavedItems();
            },
            errorAll = function (error) {
              Buildfire.spinner.hide();
              console.log("error", error)
            };
          console.log("***********", WidgetHome.data.content);
          if (WidgetHome.data && WidgetHome.data.content && WidgetHome.data.content.sortItemBy) {
            searchOptions = WidgetHome.getSearchOptions(WidgetHome.data.content.sortItemBy);
          }
          DataStore.search(searchOptions, TAG_NAMES.COUPON_ITEMS).then(successAll, errorAll);
        };

        WidgetHome.loadMore = function () {
          console.log("===============In loadmore");
          if (WidgetHome.busy) return;
          WidgetHome.busy = true;
          WidgetHome.getItems();
        };

        WidgetHome.showMapView = function () {
          ViewStack.push({
            template: 'Map',
            params: {
              controller: "WidgetMapCtrl as WidgetMap"
            }
          });
        };

        WidgetHome.showFilter = function () {
          ViewStack.push({
            template: 'Filter',
            params: {
              controller: "WidgetFilterCtrl as WidgetFilter"
            }
          });
        };

        WidgetHome.showSavedItems = function () {
          if (WidgetHome.currentLoggedInUser) {
            ViewStack.push({
              template: 'Saved',
              params: {
                controller: "WidgetSavedCtrl as WidgetSaved"
              }
            });
          } else {
            WidgetHome.openLogin();
          }
        };

        WidgetHome.getSavedData = function (setSaved) {
          Buildfire.spinner.show();
          var err = function (error) {
            Buildfire.spinner.hide();
            console.log("============ There is an error in getting data", error);
          }, result = function (result) {
            Buildfire.spinner.hide();
            console.log("===========Saved Coupons", result);
            WidgetHome.saved = result;
            if (setSaved)
              WidgetHome.setSavedItems();
          };

          UserData.search({}, TAG_NAMES.COUPON_SAVED).then(result, err);
        };

        WidgetHome.setSavedItems = function () {
          for (var item = 0; item < WidgetHome.items.length; item++) {
            WidgetHome.items[item].isSaved = false;
            for (var save in WidgetHome.saved) {
              if (WidgetHome.items[item].id == WidgetHome.saved[save].data.itemId) {
                WidgetHome.items[item].isSaved = true;
                WidgetHome.items[item].savedId = WidgetHome.saved[save].id;
              }
            }
          }
          $scope.isFetchedAllData = true;
        };

        WidgetHome.addToSavedItems = function (item, index) {
          Buildfire.spinner.show();
          WidgetHome.savedItem = {
            data: {
              itemId: item.id
            }
          };
          var successItem = function (result) {
            Buildfire.spinner.hide();
            console.log("Inserted", result);
            WidgetHome.items[index].isSaved = true;
            WidgetHome.items[index].savedId = result.id;
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
          UserData.insert(WidgetHome.savedItem.data, TAG_NAMES.COUPON_SAVED).then(successItem, errorItem);
        };

        WidgetHome.removeFromSavedItems = function (item, index) {
          if (item.isSaved && item.savedId) {
            Buildfire.spinner.show();
            var successRemove = function (result) {
              Buildfire.spinner.hide();
              WidgetHome.items[index].isSaved = false;
              WidgetHome.items[index].savedId = null;
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
            UserData.delete(item.savedId, TAG_NAMES.COUPON_SAVED, WidgetHome.currentLoggedInUser._id).then(successRemove, errorRemove)
          }
        };

        var loginCallback = function () {
          buildfire.auth.getCurrentUser(function (err, user) {
            console.log("=========User", user);
            if (user) {
              WidgetHome.currentLoggedInUser = user;
              $scope.$apply();
              WidgetHome.getSavedData(true);
            }
          });
        };

        buildfire.auth.onLogin(loginCallback);

        var logoutCallback = function () {
          WidgetHome.currentLoggedInUser = null;
          $scope.$apply();
        };

        buildfire.auth.onLogout(logoutCallback);

        /**
         * Check for current logged in user, if not show login screen
         */
        buildfire.auth.getCurrentUser(function (err, user) {
          console.log("===========LoggedInUser", user);
          if (user) {
            WidgetHome.currentLoggedInUser = user;
            $scope.$apply();
            WidgetHome.getSavedData(true);
          }
        });

        WidgetHome.openDetails = function (itemId) {
          ViewStack.push({
            template: 'Item',
            params: {
              controller: "WidgetItemCtrl as WidgetItem",
              itemId: itemId
            }
          });
        };

        function getItemsDistance(_items) {
          console.log('WidgetHome.items', _items);
          if (WidgetHome.locationData.currentCoordinates == null) {
            return;
          }
          if (_items && _items.length) {
            GeoDistance.getDistance(WidgetHome.locationData.currentCoordinates, _items, WidgetHome.data.settings.distanceIn).then(function (result) {
              console.log('WidgetHome.locationData.currentCoordinates', WidgetHome.locationData.currentCoordinates);
              console.log('distance result', result);
              for (var _ind = 0; _ind < WidgetHome.items.length; _ind++) {
                if (_items && _items[_ind]) {
                  _items[_ind].data.distanceText = (result.rows[0].elements[_ind].status != 'OK') ? 'NA' : result.rows[0].elements[_ind].distance.text;
                  _items[_ind].data.distance = (result.rows[0].elements[_ind].status != 'OK') ? -1 : result.rows[0].elements[_ind].distance.value;
                }
              }

            }, function (err) {
              console.error('distance err', err);
            });
          }
        }

        $scope.$watch(function () {
          return WidgetHome.items;
        }, getItemsDistance);

        WidgetHome.listeners['ITEM_SAVED_UPDATED'] = $rootScope.$on('ITEM_SAVED_UPDATED', function (e) {
          WidgetHome.getSavedData(true);
        });

      }])
})(window.angular, window.buildfire);
