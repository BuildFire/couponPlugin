"use strict";

(function (buildfire, angular) {
  angular.module("couponPluginContent").controller("ContentItemCtrl", [
    "$scope",
    "$routeParams",
    "$timeout",
    "$location",
    "$anchorScroll",
    "DEFAULT_DATA",
    "DataStore",
    "TAG_NAMES",
    "Location",
    "Utils",
    "Modals",
    "RankOfLastFilter",
    "Buildfire",
    "RankOfLastItem",
    "PluginEvents",
    function (
      $scope,
      $routeParams,
      $timeout,
      $location,
      $anchorScroll,
      DEFAULT_DATA,
      DataStore,
      TAG_NAMES,
      Location,
      Utils,
      Modals,
      RankOfLastFilter,
      Buildfire,
      RankOfLastItem,
      PluginEvents
    ) {
      $scope.pluginReady = false;
      var ContentItem = this;
      var tmrDelayForItem = null,
        isNewItemInserted = false,
        updating = false;
      ContentItem.filters = [];
      ContentItem.validCoordinatesFailure = false;

      // Hide the top plugin info part when inside item detail view
      // Buildfire.appearance.setHeaderVisibility(false);

      // the element you wish to scroll to.
      $location.hash("top");

      // call $anchorScroll()
      $anchorScroll();
      $timeout(function () {
        Buildfire.navigation.scrollTop();
      }, 0);
      $scope.getReuseText = function (periodInMinuts) {
        switch (periodInMinuts) {
          case -1:
            return "Single Use";
          case 10:
            return "10 minutes";
          case 30:
            return "30 minutes";
          case 60:
            return "60 minutes";
          case 1440:
            return "1 Day";
          case 4320:
            return "3 Days";
          case 1080:
            return "7 Days";
          case 43200:
            return "30 Days";
        }
      };

      /**
       * This updateMasterItem will update the ContentMedia.masterItem with passed item
       * @param item
       */
      function updateMasterItem(item) {
        ContentItem.masterItem = angular.copy(item);
      }

      /**
       * This resetItem will reset the ContentMedia.item with ContentMedia.masterItem
       */
      function resetItem() {
        ContentItem.item = angular.copy(ContentItem.masterItem);
      }

      var saveData = function (newObj, tag) {
        if (typeof newObj === "undefined") {
          return;
        }
        var success = function (result) {
            console.info("Saved data result: ", result);
            RankOfLastItem.setRank(result.data.content.rankOfLastItem);
          },
          error = function (err) {
            console.error("Error while saving data : ", err);
          };
        newObj.content.rankOfLastItem = newObj.content.rankOfLastItem || 0;
        DataStore.save(newObj, tag).then(success, error);
      };

      /*
       * Go pull any previously saved data
       * */
      var getInfoInitData = function () {
        var success = function (result) {
            ContentItem.data = result.data;
            console.log("+++++++++++++++SSSSSSS", ContentItem.data);
            if (!ContentItem.data.content) {
              ContentItem.data.content = {
                rankOfLastItem: "",
              };
            }
            if (!ContentItem.data.settings) {
              ContentItem.data.settings = {
                defaultView: "list",
                distanceIn: "mi",
                mapView: "show",
                filterPage: "show",
                toggleEmployeeCode: "off",
                employeeCode: "12345",
              };
            }
            if (!ContentItem.data.design) {
            }
          },
          error = function (err) {
            console.error("Error while getting data", err);
          };
        DataStore.get(TAG_NAMES.COUPON_INFO).then(success, error);
      };

      getInfoInitData();
      /**
       * isUnChanged to check whether there is change in controller media item or not
       * @param item
       * @returns {*|boolean}
       */

      ContentItem.selection = [];

      ContentItem.toggleCategoriesSelection = function toggleCategoriesSelection(
        category
      ) {
        var idx = ContentItem.selection.indexOf(category.id);
        // is currently selected
        if (idx > -1) {
          ContentItem.selection.splice(idx, 1);
          category.noOfItems = category.noOfItems - 1;
        }

        // is newly selected
        else {
          ContentItem.selection.push(category.id);
          category.noOfItems = category.noOfItems + 1;
        }
        Buildfire.datastore.update(
          category.id,
          category,
          TAG_NAMES.COUPON_CATEGORIES,
          function (err) {
            ContentItem.isUpdating = false;
            init();
            if (err)
              return console.error("There was a problem saving your data");
          }
        );
        ContentItem.item.data.SelectedCategories = ContentItem.selection;
        //insertAndUpdate(ContentItem.item)
      };

      function isUnChanged(item) {
        return angular.equals(item, ContentItem.masterItem);
      }

      function isValidItem(item) {
        if (item) {
          if (item.startOn && item.expiresOn) {
            if (item.expiresOn - item.startOn > 0) return item.title && true;
            else return false;
          } else return item.title;
        } else {
          return false;
        }
      }

      ContentItem.checkItemValid = function () {
        if ($scope.pluginReady && ContentItem.item) {
          if (
            ContentItem.item.data.startOn &&
            ContentItem.item.data.expiresOn
          ) {
            if (
              ContentItem.item.data.expiresOn - ContentItem.item.data.startOn >
              0
            )
              return ContentItem.item.data.title && true;
            else return false;
          } else return ContentItem.item.data.title;
        } else {
          return false;
        }
      };

      function isValidFilter(item) {
        if (item) {
          return item.title;
        } else {
          return false;
        }
      }

      function createDeepLink(data, update) {
         new Deeplink({
          deeplinkId: data.id,
          name: data.data.title,
          imageUrl: data.data.listImage ? data.data.listImage : null,
          deeplinkData: {
            id: data.id,
          }
        }).save(function(err, deepLinkData) {
          if(update) {
            data.data.deepLinkId = deepLinkData.deeplinkId;
            DataStore.update(data.id, data.data, TAG_NAMES.COUPON_ITEMS)
          }
        });
      }

      function insertAndUpdate(_item) {
        updating = true;
        if (_item.id) {
          DataStore.update(_item.id, _item.data, TAG_NAMES.COUPON_ITEMS).then(
            function (data) {
              console.log("Item updated successfully-----", data);
              createDeepLink(data, false);
              updateMasterItem(data);
              // updateFilterData(data.data.SelectedCategories,data.data.Categories);
              updating = false;
            },
            function (err) {
              console.error("Error: while updating item--:", err);
              resetItem();
              updating = false;
            }
          );
        } else if (!isNewItemInserted) {
          isNewItemInserted = true;
          _item.data.dateCreated = +new Date();
          _item.data.rank = RankOfLastItem.getRank() + 10;
          DataStore.insert(_item.data, TAG_NAMES.COUPON_ITEMS).then(
            function (data) {
              updating = false;
              if (data && data.id) {
                ContentItem.item.data.deepLinkUrl = buildfire.deeplink.createLink({ id: data.id });
                data.data.deepLinkUrl = buildfire.deeplink.createLink({ id: data.id });
                createDeepLink(data, true);
                ContentItem.item.id = data.id;
                ContentItem.data.content.rankOfLastItem =
                  RankOfLastItem.getRank() + 10;
                saveData(ContentItem.data, TAG_NAMES.COUPON_INFO);
                updateMasterItem(ContentItem.item);
                if (ContentItem.item.id)
                  buildfire.messaging.sendMessageToWidget({
                    id: ContentItem.item.id,
                    type: "AddNewItem",
                  });
              } else {
                isNewItemInserted = false;
              }
            },
            function (err) {
              console.error("Error: while inserting item--:", err);
              resetItem();
              updating = false;
              isNewItemInserted = false;
            }
          );
        }
      }

      /**
       * updateItemsWithDelay called when ever there is some change in current item
       * @param _item
       */
      function updateItemsWithDelay(_item) {
        if (_item) {
          if (tmrDelayForItem) {
            $timeout.cancel(tmrDelayForItem);
          }
          if (ContentItem.item) {
            ContentItem.isItemValid = isValidItem(ContentItem.item.data);
            if (
              !updating &&
              _item &&
              !isUnChanged(_item) &&
              ContentItem.isItemValid
            ) {
              tmrDelayForItem = $timeout(function () {
                insertAndUpdate(_item);
              }, 300);
            }
          }
        }
      }

      function init() {
        var searchOptions = {
          filter: { "$json.title": { $regex: "/*" } },
          sort: { title: 1 },
          skip: "0",
          limit: "50",
        };

        Buildfire.datastore.search(
          searchOptions,
          TAG_NAMES.COUPON_CATEGORIES,
          function (err, result) {
            if (!$routeParams.id) {
              if (!ContentItem.item)
                ContentItem.item = angular.copy(DEFAULT_DATA.ITEM);
            }
            $scope.pluginReady = true;
            if (err) {
              Buildfire.spinner.hide();
              return console.error(
                "-----------err in getting list-------------",
                err
              );
            }
            var tmpArray = [];
            var lastIndex = result.length;
            result.forEach(function (res, index) {
              tmpArray.push({
                title: res.data.title,
                id: res.id,
                noOfItems: res.data.noOfItems,
              });
            });

            ContentItem.item.data.Categories = tmpArray;
            console.log("data categories", ContentItem.item.data.Categories);
            updateMasterItem(ContentItem.item);
            Buildfire.spinner.hide();
            $scope.$digest();
          }
        );
      }
      //}

      ContentItem.getItemData = function (itemId) {
        var success = function (result) {
            console.log("------------->>>>", result, itemId);
            updating = true;
            ContentItem.item = result;
            if (
              ContentItem.item.data.location &&
              ContentItem.item.data.location.addressTitle
            ) {
              ContentItem.currentAddress =
                ContentItem.item.data.location.addressTitle;
              ContentItem.currentCoordinates =
                ContentItem.item.data.location.coordinates;
            }
            if (!ContentItem.item.data.SelectedCategories) {
              ContentItem.selection = [];
            } else {
              ContentItem.selection = ContentItem.item.data.SelectedCategories;
            }
            ContentItem.item.data.expiresOn = Number(
              ContentItem.item.data.expiresOn
            );
            ContentItem.item.data.startOn = Number(
              ContentItem.item.data.startOn
            );
            setTimeout(function () {
              updating = false;
            }, 2000);

            init();
          },
          error = function (err) {
            console.log("There is error in fetching data", err);
          };
        DataStore.getById(itemId, TAG_NAMES.COUPON_ITEMS).then(success, error);
      };

      /*
                  Send message to widget that this page has been opened
                */

      if ($routeParams.id) {
        ContentItem.getItemData($routeParams.id);
        buildfire.messaging.sendMessageToWidget({
          id: $routeParams.id,
          type: "OpenItem",
        });
      } else {
        init();
      }

      //Methods to add and remove list image

      ContentItem.addListImage = function () {
        var options = { showIcons: false, multiSelection: false },
          listImgCB = function (error, result) {
            if (error) {
              console.error("Error:", error);
            } else {
              ContentItem.item.data.listImage =
                (result && result.selectedFiles && result.selectedFiles[0]) ||
                null;
              if (!$scope.$$phase) $scope.$digest();
            }
          };
        buildfire.imageLib.showDialog(options, listImgCB);
      };
      ContentItem.removeListImage = function () {
        ContentItem.item.data.listImage = null;
      };

      //Methods to add and remove pre redemption image

      ContentItem.addPreRedemptionImage = function () {
        var options = { showIcons: false, multiSelection: false },
          listImgCB = function (error, result) {
            if (error) {
              console.error("Error:", error);
            } else {
              ContentItem.item.data.preRedemptionImage =
                (result && result.selectedFiles && result.selectedFiles[0]) ||
                null;
              if (!$scope.$$phase) $scope.$digest();
            }
          };
        buildfire.imageLib.showDialog(options, listImgCB);
      };
      ContentItem.removePreRedemptionImage = function () {
        ContentItem.item.data.preRedemptionImage = null;
      };

      //Methods to add and remove post redemption image

      ContentItem.addPostRedemptionImage = function () {
        var options = { showIcons: false, multiSelection: false },
          listImgCB = function (error, result) {
            if (error) {
              console.error("Error:", error);
            } else {
              ContentItem.item.data.postRedemptionImage =
                (result && result.selectedFiles && result.selectedFiles[0]) ||
                null;
              if (!$scope.$$phase) $scope.$digest();
            }
          };
        buildfire.imageLib.showDialog(options, listImgCB);
      };
      ContentItem.removePostRedemptionImage = function () {
        ContentItem.item.data.postRedemptionImage = null;
      };

      /**
       * done will close the single item view
       */
      ContentItem.done = function () {
        //register coupon in plugin events
        if (ContentItem.item && ContentItem.item.id && ContentItem.item.data) {
          PluginEvents.register(
            {
              title: ContentItem.item.data.title,
              key: ContentItem.item.id,
            },
            !isNewItemInserted
          );
        }
        //#
        buildfire.messaging.sendMessageToWidget({});
        Location.goToHome();
      };
      ContentItem.setLocation = function (data) {
        console.log(
          "setLocation-------------------method called-----------",
          data
        );
        ContentItem.item.data.location = {
          coordinates: {
            lng: data.coordinates.lng,
            lat: data.coordinates.lat,
          },
          addressTitle: data.location,
        };
        $timeout(function () {
          ContentItem.currentAddress = data.location;
          ContentItem.currentCoordinates = data.coordinates;
        }, 0);
      };

      ContentItem.setDraggedLocation = function (data) {
        ContentItem.item.data.address = {
          lng: data.coordinates.lng,
          lat: data.coordinates.lat,
          aName: data.location,
        };
        ContentItem.item.data.location = {
          coordinates: {
            lng: data.coordinates.lng,
            lat: data.coordinates.lat,
          },
          addressTitle: data.location,
        };
        ContentItem.currentAddress = data.location;
        ContentItem.currentCoordinates = data.coordinates;
        $scope.$digest();
      };
      ContentItem.setCoordinates = function () {
        var latlng = "";
        function successCallback(resp) {
          if (resp) {
            ContentItem.item.data.address = {
              lng: ContentItem.currentAddress.split(",")[1].trim(),
              lat: ContentItem.currentAddress.split(",")[0].trim(),
              aName: ContentItem.currentAddress,
            };
            ContentItem.currentCoordinates = [
              ContentItem.currentAddress.split(",")[1].trim(),
              ContentItem.currentAddress.split(",")[0].trim(),
            ];
            console.log(
              "Successfully validated coordinates-----------",
              resp,
              ContentItem.currentCoordinates,
              ContentItem.item.data
            );
            ContentItem.item.data.location = {
              coordinates: {
                lng: Number(ContentItem.currentCoordinates[0]),
                lat: Number(ContentItem.currentCoordinates[1]),
              },
              addressTitle: ContentItem.currentAddress,
            };
            ContentItem.currentAddress =
              ContentItem.item.data.location.addressTitle;
            ContentItem.currentCoordinates =
              ContentItem.item.data.location.coordinates;
          } else {
            errorCallback();
          }
        }

        function errorCallback(err) {
          console.error("Error while validating coordinates------------", err);
          ContentItem.validCoordinatesFailure = true;
          $timeout(function () {
            ContentItem.validCoordinatesFailure = false;
          }, 5000);
        }

        if (ContentItem.currentAddress) {
          latlng =
            ContentItem.currentAddress.split(",")[1] +
            "," +
            ContentItem.currentAddress.split(",")[0];
        }

        Utils.validLongLats(latlng).then(successCallback, errorCallback);
      };
      ContentItem.clearData = function () {
        if (!ContentItem.currentAddress) {
          ContentItem.item.data.address = {
            lng: "",
            lat: "",
            aName: "",
          };
          ContentItem.currentCoordinates = null;
          ContentItem.item.data.location.addressTitle = "";
          ContentItem.item.data.location.coordinates = null;
        }
      };

      ContentItem.validCopyAddressFailure = false;
      ContentItem.locationAutocompletePaste = function () {
        function error() {
          console.error("ERROOR emethpdd called");
          ContentItem.validCopyAddressFailure = true;
          $timeout(function () {
            ContentItem.validCopyAddressFailure = false;
          }, 5000);
        }

        $timeout(function () {
          console.log("val>>>", $("#googleMapAutocomplete").val());
          console.log(
            ".pac-container .pac-item",
            $(".pac-container .pac-item").length
          );
          if ($(".pac-container .pac-item").length) {
            var firstResult = $(".pac-container .pac-item:first")
              .find(".pac-matched")
              .map(function () {
                return $(this).text();
              })
              .get()
              .join(); // + ', ' + $(".pac-container .pac-item:first").find('span:last').text();
            console.log("firstResult", firstResult);
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode(
              { address: firstResult },
              function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                  var lat = results[0].geometry.location.lat(),
                    lng = results[0].geometry.location.lng();
                  ContentItem.setLocation({
                    location: firstResult,
                    coordinates: { lng: lng, lat: lat },
                  });
                  $("#googleMapAutocomplete").blur();
                } else {
                  console.error("" + "Error else parts of google");
                  error();
                }
              }
            );
          } else if (
            ContentItem.currentAddress &&
            ContentItem.currentAddress.split(",").length
          ) {
            console.log(
              "Location found---------------------",
              ContentItem.currentAddress.split(",").length,
              ContentItem.currentAddress.split(",")
            );
            ContentItem.setCoordinates();
          } else {
            error();
          }
        }, 1000);
      };

      ContentItem.addFilter = function () {
        Modals.addFilterModal({
          title: "",
          isEdit: false,
        }).then(
          function (response) {
            console.log(
              "Response of a popup----------------------------",
              response
            );
            if (
              !(
                response.title === null || response.title.match(/^ *$/) !== null
              )
            ) {
              //if index is there it means filter update operation is performed
              ContentItem.filter = {
                title: response.title,
                rank: RankOfLastFilter.getRank() + 10,
                noOfItems: 0,
              };

              ContentItem.filters.unshift(ContentItem.filter);
              Buildfire.datastore.insert(
                ContentItem.filter,
                TAG_NAMES.COUPON_CATEGORIES,
                false,
                function (err, data) {
                  console.log("Saved", data.id);
                  ContentItem.isUpdating = false;
                  ContentItem.filter.id = data.id;
                  if (err) {
                    ContentItem.isNewItemInserted = false;
                    return console.error(
                      "There was a problem saving your data"
                    );
                  }
                  $scope.$digest();
                }
              );
            }
          },
          function (err) {}
        );
      };

      //option for wysiwyg
      ContentItem.bodyWYSIWYGOptions = {
        plugins: "advlist autolink link image lists charmap print preview",
        skin: "lightgray",
        trusted: true,
        theme: "modern",
        plugin_preview_width: "500",
        plugin_preview_height: "500",
      };

      var updateFilterWithDelay = function (item) {
        ContentItem.isUpdating = false;
        ContentItem.isItemValid = isValidFilter(ContentItem.filter);
        if (!ContentItem.isUpdating && ContentItem.isItemValid) {
          setTimeout(function () {
            if (item.id) {
              ContentItem.updateItemData();
              $scope.$digest();
            } /*else if (!ContentHome.isNewItemInserted) {
                             ContentHome.addNewItem();
                             }*/
          }, 300);
        }
      };

      ContentItem.updateItemData = function () {
        Buildfire.datastore.update(
          ContentItem.filter.id,
          ContentItem.filter,
          TAG_NAMES.COUPON_CATEGORIES,
          function (err) {
            ContentItem.isUpdating = false;
            init();
            if (err)
              return console.error("There was a problem saving your data");
          }
        );
      };

      $scope.$watch(
        function () {
          return ContentItem.item;
        },
        updateItemsWithDelay,
        true
      );

      /*
       * watch for changes in filters and trigger the saveDataWithDelay function on change
       * */
      $scope.$watch(
        function () {
          return ContentItem.filter;
        },
        updateFilterWithDelay,
        true
      );
    },
  ]);
})(window.buildfire, window.angular);
