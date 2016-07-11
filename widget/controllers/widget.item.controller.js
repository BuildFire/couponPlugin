'use strict';

(function (angular, buildfire, window) {
  angular.module('couponPluginWidget')
    .controller('WidgetItemCtrl', ['$scope', 'DataStore', 'TAG_NAMES', 'LAYOUTS', '$sce', '$rootScope', 'Buildfire', 'ViewStack', 'UserData', 'PAGINATION', '$modal', '$timeout', '$location',
      function ($scope, DataStore, TAG_NAMES, LAYOUTS, $sce, $rootScope, Buildfire, ViewStack, UserData, PAGINATION, $modal, $timeout, $location) {
        var WidgetItem = this;
        WidgetItem.listeners = {};

        var currentView = ViewStack.getCurrentView();

        if (currentView.params && currentView.params.itemId && !currentView.params.stopSwitch) {
          buildfire.messaging.sendMessageToControl({
            id: currentView.params.itemId,
            type: 'OpenItem'
          });
        }

        buildfire.datastore.onRefresh(function () {
          // Do nothing
        });

        WidgetItem.getItemDetails = function () {
          Buildfire.spinner.show();
          var success = function (result) {
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
        WidgetItem.listeners["CarouselLoaded"] = $rootScope.$on("Carousel2:LOADED", function () {
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

        /**
         * Check for current logged in user, if not show ogin screen
         */
        buildfire.auth.getCurrentUser(function (err, user) {
          console.log("===========LoggedInUser", user);
          if (user) {
            WidgetItem.currentLoggedInUser = user;
          }
        });

        $scope.$on("$destroy", function () {
          for (var i in WidgetItem.listeners) {
            if (WidgetItem.listeners.hasOwnProperty(i)) {
              WidgetItem.listeners[i]();
            }
          }
          DataStore.clearListener();
        });

        WidgetItem.setSavedItem = function () {
          if (WidgetItem.item) {
            for (var save in WidgetItem.saved) {
              if (WidgetItem.saved[save].data.itemId == WidgetItem.item.id) {
                WidgetItem.item.isSaved = true;
                WidgetItem.item.savedId = WidgetItem.saved[save].id;
              }
            }
          }
        };

        WidgetItem.setRedeemedItem = function () {
          if (WidgetItem.item) {
            for (var redeem in WidgetItem.redeemed) {
              if (WidgetItem.redeemed[redeem].data.itemId == WidgetItem.item.id) {
                WidgetItem.item.isRedeemed = true;
                WidgetItem.item.redeemedOn = WidgetItem.redeemed[redeem].data.redeemedOn;
              }
            }
          }
        };

        WidgetItem.getSavedItems = function () {
          Buildfire.spinner.show();
          var err = function (error) {
            Buildfire.spinner.hide();
            console.log("============ There is an error in getting saved items data", error);
          }, result = function (result) {
            Buildfire.spinner.hide();
            WidgetItem.saved = result;
            WidgetItem.setSavedItem();
          };
          UserData.search({}, TAG_NAMES.COUPON_SAVED).then(result, err);
        };

        WidgetItem.getRedeemedCoupons = function () {
          Buildfire.spinner.show();
          var err = function (error) {
            Buildfire.spinner.hide();
            console.log("============ There is an error in getting redeemed coupons data", error);
          }, result = function (result) {
            Buildfire.spinner.hide();
            WidgetItem.redeemed = result;
            WidgetItem.setRedeemedItem();
          };
          UserData.search({}, TAG_NAMES.COUPON_REDEEMED).then(result, err);
        };

        WidgetItem.addToSaved = function (item, isSaved, onlyAdd) {
          Buildfire.spinner.show();
          if (isSaved && item.savedId && !onlyAdd) {
            var successRemove = function (result) {
              Buildfire.spinner.hide();
              WidgetItem.item.isSaved = false;
              WidgetItem.item.savedId = null;
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
            UserData.delete(item.savedId, TAG_NAMES.COUPON_SAVED, WidgetItem.currentLoggedInUser._id).then(successRemove, errorRemove)
          } else {
            WidgetItem.savedItem = {
              data: {
                itemId: item.id
              }
            };
            var successItem = function (result) {
              Buildfire.spinner.hide();
              WidgetItem.item.isSaved = true;
              WidgetItem.item.savedId = result.id;
              console.log("Inserted", result);
              var addedSavedModal = $modal.open({
                templateUrl: 'templates/Saved_Confirmation.html',
                size: 'sm',
                backdropClass: "ng-hide"
              });
              $timeout(function () {
                addedSavedModal.close();
              }, 3000);
              $rootScope.$broadcast("ITEM_SAVED_UPDATED");
            }, errorItem = function () {
              Buildfire.spinner.hide();
              return console.error('There was a problem saving your data');
            };
            UserData.insert(WidgetItem.savedItem.data, TAG_NAMES.COUPON_SAVED).then(successItem, errorItem);
          }
        };

        var loginCallback = function () {
          buildfire.auth.getCurrentUser(function (err, user) {
            if (user) {
              WidgetItem.currentLoggedInUser = user;
              $scope.$apply();
              WidgetItem.getSavedItems();
              WidgetItem.getRedeemedCoupons();
            }
          });
        };

        buildfire.auth.onLogin(loginCallback);

        WidgetItem.redeemCoupon = function(item){
          if(WidgetItem.currentLoggedInUser){
            WidgetItem.redeemedItem = {
              data: {
                itemId: item.id,
                redeemedOn: +new Date()
              }
            };
            var successItem = function (result) {
              Buildfire.spinner.hide();
              WidgetItem.item.isRedeemed = true;
              WidgetItem.item.redeemedOn = result.data.redeemedOn;
              var redeemedModal = $modal.open({
                templateUrl: 'templates/Redeem_Confirmation.html',
                size: 'sm',
                backdropClass: "ng-hide"
              });
              WidgetItem.addToSaved(WidgetItem.item, WidgetItem.item.isSaved, true);
              $timeout(function () {
                redeemedModal.close();
              }, 2000);
            }, errorItem = function () {
              Buildfire.spinner.hide();
              return console.error('There was a problem redeeming the coupon');
            };
            UserData.insert(WidgetItem.redeemedItem.data, TAG_NAMES.COUPON_REDEEMED).then(successItem, errorItem);

          }else{
            buildfire.auth.login({}, function () {

            });
          }
        };

        var onUpdateCallback = function (event) {
          setTimeout(function () {
            $scope.$digest();
            if (event && event.tag) {
              console.log("_____________________________", event);
              switch (event.tag) {
                case TAG_NAMES.COUPON_INFO:
                  WidgetItem.data = event.data;
                  if (!WidgetItem.data.design)
                    WidgetItem.data.design = {};
                  if (!WidgetItem.data.settings)
                    WidgetItem.data.settings = {};
                  break;
                case TAG_NAMES.COUPON_ITEMS:
                  if (event.data) {
                    WidgetItem.item.data = event.data;
                    if (WidgetItem.view) {
                      WidgetItem.view.loadItems(WidgetItem.item.data.carouselImages);
                    }
                  }
                  break;
              }
              $scope.$digest();
            }
          }, 500);
        };

        DataStore.onUpdate("item").then(null, null, onUpdateCallback);

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
              if(WidgetItem.currentLoggedInUser){
                WidgetItem.getSavedItems();
                WidgetItem.getRedeemedCoupons();
              }
            }
            , error = function (err) {
              Buildfire.spinner.hide();
              console.error('Error while getting data', err);
            };
          DataStore.get(TAG_NAMES.COUPON_INFO).then(success, error);
        };

        $scope.$on("$destroy", function() {

          for(var i in WidgetItem.listeners) {
            if(WidgetItem.listeners.hasOwnProperty(i)) {
              WidgetItem.listeners[i]();
            }
          }
          DataStore.clearListener("item");

        });

        init();
      }]);
})(window.angular, window.buildfire, window);
