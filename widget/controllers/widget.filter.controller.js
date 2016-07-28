'use strict';

(function (angular, buildfire, window) {
  angular.module('couponPluginWidget')
    .controller('WidgetFilterCtrl', ['$scope', 'DataStore', 'TAG_NAMES', 'LAYOUTS', '$sce', '$rootScope', 'Buildfire', 'ViewStack', 'UserData', '$modal', '$timeout','SORT_FILTER',
      function ($scope, DataStore, TAG_NAMES, LAYOUTS, $sce, $rootScope, Buildfire, ViewStack, UserData, $modal, $timeout,SORT_FILTER) {
        var WidgetFilter = this;

        // default value
        WidgetFilter.filter={};
        WidgetFilter.filter.text = '';
        var searchOptions = {};

        WidgetFilter.getSearchOptions = function (value) {
          switch (value) {
            case SORT_FILTER.CATEGORY_NAME_A_Z:
              searchOptions.sort = {"title": 1};
              break;
            case SORT_FILTER.CATEGORY_NAME_Z_A:
              searchOptions.sort = {"title": -1};
              break;
            default :
              searchOptions.sort = {"rank": 1};
              break;
          }
          return searchOptions;
        };

        WidgetFilter.locationData = {};

        WidgetFilter.allSelected = true;

        buildfire.datastore.onRefresh(function () {
          // Do nothing
        });

     //   var tmrDelay = null;

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


       function saveFilterDataInLocalStorage(){
         if (typeof(Storage) !== "undefined") {
           localStorage.setItem("filter" , JSON.stringify(WidgetFilter.filter));
         } else {
          console.error("LOCAL STORAGE NOT SUPPORTED TO SAVE FILTERED DATA");
         }
       }


        WidgetFilter.back = function () {
            WidgetFilter.filter.isApplied = false;
            $rootScope.$broadcast('FILTER_ITEMS', {
                isFilterApplied: WidgetFilter.filter.isApplied
            });
          ViewStack.pop();
          saveFilterDataInLocalStorage();
        };

        WidgetFilter.getAllCategories = function () {
          Buildfire.spinner.show();
          var success = function (result) {
              Buildfire.spinner.hide();
              if (result && result.length){
                WidgetFilter.categories = result;
              }
              else
                WidgetFilter.categories = [];
            }
            , error = function (err) {
              Buildfire.spinner.hide();
              console.error('Error while getting data', err);
            };
          if(WidgetFilter.data.content && WidgetFilter.data.content.sortFilterBy)
            WidgetFilter.getSearchOptions(WidgetFilter.data.content.sortFilterBy);
          DataStore.search(searchOptions, TAG_NAMES.COUPON_CATEGORIES).then(success, error);
        };

        WidgetFilter.setFilter = function () {
          console.log("==============", WidgetFilter.distanceSlider);
          WidgetFilter.filter.isApplied = true;
          WidgetFilter.filter.distanceRange = {
            min: WidgetFilter.distanceSlider.min,
            max: WidgetFilter.distanceSlider.max
          }
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
                WidgetFilter.filter.categories.splice(idx,1);
                WidgetFilter.categories[index].isSelected = false;
              }
              if (WidgetFilter.filter.categories.length < 1)
                WidgetFilter.allSelected = true;
            } else {
              WidgetFilter.allSelected = false;
              WidgetFilter.filter.categories.push(category.id);
              WidgetFilter.categories[index].isSelected = true;
            }
            WidgetFilter.filter.isApplied = true;
          }
        };

        WidgetFilter.resetFilters = function () {
          WidgetFilter.filter.sortOnClosest = false;
          WidgetFilter.allSelected = true;
          WidgetFilter.filter.text = null;
          WidgetFilter.filter.isApplied = false;
          WidgetFilter.filter.categories = [];
          WidgetFilter.allSelected = true;
            if(WidgetFilter.categories){
                for (var i = 0; i < WidgetFilter.categories.length; i++) {
                    WidgetFilter.categories[i].isSelected = false;
                }
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
            WidgetFilter.filter.distanceRange=WidgetFilter.distanceSlider;
            saveFilterDataInLocalStorage();
        };

        WidgetFilter.applyFilter = function () {
          if (WidgetFilter.filter.sortOnClosest || WidgetFilter.filter.categories.length || WidgetFilter.filter.text || WidgetFilter.filter.distanceRange )
            WidgetFilter.filter.isApplied = true;
          else
            WidgetFilter.filter.isApplied = false;
          $rootScope.$broadcast('FILTER_ITEMS', {
            isFilterApplied: WidgetFilter.filter.isApplied,
            filter: WidgetFilter.filter
          });
          ViewStack.pop();
          saveFilterDataInLocalStorage();
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

               /* if (typeof(Storage) !== "undefined") {
                  var obj =localStorage.getItem("filter")
                  if(obj){
                    WidgetFilter.filter =JSON.parse(localStorage.getItem("filter"));
                    WidgetFilter.filter.categories = WidgetFilter.filter.categories.filter(function(item, i, ar){ return ar.indexOf(item) === i; });
                      if(WidgetFilter.filter.distanceRange){
                          WidgetFilter.distanceSlider.min=WidgetFilter.filter.distanceRange.min;
                          WidgetFilter.distanceSlider.max=WidgetFilter.filter.distanceRange.max;

                      }

                    setTimeout(function(){
                      WidgetFilter.filter.categories.forEach(function(f_category){
                        WidgetFilter.categories.forEach(function(category){
                          if(category.id==f_category){
                            category.isSelected=true;
                            WidgetFilter.allSelected = false;
                            if(!$scope.$$phase) {
                              $scope.$digest();
                            }
                          }
                        })
                      })
                    },1000);
                  }
                  else{
                    WidgetFilter.filter = {
                      sortOnClosest: false,
                      categories: []
                    };
                  }
                } else {
                  WidgetFilter.filter = {
                    sortOnClosest: false,
                    categories: []
                  };
                  console.error("LOCAL STORAGE NOT SUPPORTED TO SAVE FILTERED DATA");
                }*/
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

/*

         * Call the datastore to save the data object

        var searchData = function (newValue, tag) {
          Buildfire.spinner.show();
          var searchTerm = '';
          if (typeof newValue === 'undefined') {
            return;
          }
          var success = function (result) {
                Buildfire.spinner.hide();
                console.info('Searched data result:=================== ', result);
                WidgetFilter.categories = result;
               // WidgetFilter.getBookmarks();
              }
              , error = function (err) {
                Buildfire.spinner.hide();
                console.error('Error while searching data : ', err);
              };
          if (newValue) {
            newValue = newValue.trim();
            if (newValue.indexOf(' ') !== -1) {
              searchTerm = newValue.split(' ');
              WidgetFilter.searchOptions.filter = {
                "$or": [{
                  "$json.title": {
                    "$regex": searchTerm[0],
                    "$options": "i"
                  }
                }, {
                  "$json.summary": {
                    "$regex": searchTerm[0],
                    "$options": "i"
                  }
                }, {
                  "$json.title": {
                    "$regex": searchTerm[1],
                    "$options": "i"
                  }
                }, {
                  "$json.summary": {
                    "$regex": searchTerm[1],
                    "$options": "i"
                  }
                }
                ]
              };
            } else {
              searchTerm = newValue;
              WidgetFilter.searchOptions.filter = {
                "$or": [{
                  "$json.title": {
                    "$regex": searchTerm,
                    "$options": "i"
                  }
                }, {"$json.summary": {"$regex": searchTerm, "$options": "i"}}]
              };
            }
          }
          DataStore.search(WidgetFilter.searchOptions, tag).then(success, error);

        };
*/

   /*     function getFilteredCategoryData(newObj){
          console.log("******************", newObj);
          if (newObj) {
            if (tmrDelay) {
              clearTimeout(tmrDelay);
            }
            tmrDelay = setTimeout(function () {
              if (newObj)
                searchData(newObj, TAG_NAMES.COUPON_CATEGORIES);
            }, 500);
          }
          else {
            var success = function (result) {
                  Buildfire.spinner.hide();
                  console.info('Searched data result:=================== ', result);
                  WidgetFilter.categories = result;
                  // WidgetFilter.getBookmarks();
                }
                , error = function (err) {
                  WidgetFilter.categories = [];
                  Buildfire.spinner.hide();
                  console.error('Error while searching data : ', err);
                };

            DataStore.search({},TAG_NAMES.COUPON_CATEGORIES).then(success, error);
          }
        }*/

      /*  $scope.$watch(function () {
          return WidgetFilter.filter.text;
        }, getFilteredCategoryData, true);*/

      }]);
})(window.angular, window.buildfire, window);
