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
          var defaultFilterData= {
              sortOnClosest :false ,
              text : null,
              isApplied : false ,
              categories : []
          }

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

            WidgetFilter.filter=defaultFilterData;
            WidgetFilter.filter.sortOnClosest = false;
            /* WidgetFilter.filter.text = null;
          WidgetFilter.filter.isApplied = false;
          WidgetFilter.filter.categories = [];*/

          WidgetFilter.allSelected = true;
            if(WidgetFilter.categories){
                for (var i = 0; i < WidgetFilter.categories.length; i++) {
                    WidgetFilter.categories[i].isSelected = false;
                }
            }

          if (WidgetFilter.data.settings && WidgetFilter.data.settings.distanceIn && WidgetFilter.data.settings.distanceIn == 'mi')
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
            defaultFilterData.distanceRange = WidgetFilter.distanceSlider;
            saveFilterDataInLocalStorage();
        };

        WidgetFilter.applyFilter = function () {

            if(angular.equals(WidgetFilter.filter, defaultFilterData)){
                WidgetFilter.filter.isApplied = false;
            }else{
                WidgetFilter.filter.isApplied = true;
            }

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
                  defaultFilterData.distanceRange = WidgetFilter.distanceSlider;

               if (typeof(Storage) !== "undefined") {
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
                          if( WidgetFilter.categories &&  WidgetFilter.categories.length){
                              WidgetFilter.categories.forEach(function(category){
                                  if(category.id==f_category){
                                      category.isSelected=true;
                                      WidgetFilter.allSelected = false;
                                      if(!$scope.$$phase) {
                                          $scope.$digest();
                                      }
                                  }
                              })
                          }
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
                }
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
