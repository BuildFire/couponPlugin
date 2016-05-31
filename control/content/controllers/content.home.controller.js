'use strict';

(function (angular, buildfire) {
  angular
    .module('couponPluginContent')
    .controller('ContentHomeCtrl', ['$scope', 'TAG_NAMES', 'STATUS_CODE', 'DataStore', 'LAYOUTS','Buildfire','Modals',
      function ($scope, TAG_NAMES, STATUS_CODE, DataStore, LAYOUTS,Buildfire,Modals) {

        var ContentHome = this;

        var _data = {
          "content": {
            "carouselImages": [],
            "description":'',
            "filters": []
          },
          "design": {
            "itemListLayout": LAYOUTS.itemListLayout[0].name
          }
        };

        /*
         * create an artificial delay so api isnt called on every character entered
         * */
        var tmrDelay = null;

        var updateMasterItem = function (data) {
          ContentHome.masterData = angular.copy(data);
        };


        var isUnchanged = function (data) {
          return angular.equals(data, ContentHome.masterData);
        };


        ContentHome.descriptionWYSIWYGOptions = {
          plugins: 'advlist autolink link image lists charmap print preview',
          skin: 'lightgray',
          trusted: true,
          theme: 'modern'
        };

        // create a new instance of the buildfire carousel editor
        var editor = new Buildfire.components.carousel.editor("#carousel");

        // this method will be called when a new item added to the list
        editor.onAddItems = function (items) {
          if (!ContentHome.data.content.carouselImages)
            ContentHome.data.content.carouselImages = [];
          ContentHome.data.content.carouselImages.push.apply(ContentHome.data.content.carouselImages, items);
          $scope.$digest();
        };
        // this method will be called when an item deleted from the list
        editor.onDeleteItem = function (item, index) {
          ContentHome.data.content.carouselImages.splice(index, 1);
          $scope.$digest();
        };
        // this method will be called when you edit item details
        editor.onItemChange = function (item, index) {
          ContentHome.data.content.carouselImages.splice(index, 1, item);
          $scope.$digest();
        };
        // this method will be called when you change the order of items
        editor.onOrderChange = function (item, oldIndex, newIndex) {
          var items = ContentHome.data.content.carouselImages;

          var tmp = items[oldIndex];

          if (oldIndex < newIndex) {
            for (var i = oldIndex + 1; i <= newIndex; i++) {
              items[i - 1] = items[i];
            }
          } else {
            for (var i = oldIndex - 1; i >= newIndex; i--) {
              items[i + 1] = items[i];
            }
          }
          items[newIndex] = tmp;

          ContentHome.data.content.carouselImages = items;
          $scope.$digest();
        };

        ContentHome.addEditFilter=function(filter, editFlag , index){
          var tempTitle='';
          if(filter)
            tempTitle=filter.title;
          Modals.addFilterModal({
            title: tempTitle,
            isEdit:editFlag
          }).then(function (response) {
            if (!(response.title === null || response.title.match(/^ *$/) !== null)) {

              //if index is there it means filter update operation is performed
              if(Number.isInteger(index)){
                ContentHome.data.content.filters[index].title= response.title;
              }else{
                if(! ContentHome.data.content.filters)
                  ContentHome.data.content={filters:[]};
                ContentHome.data.content.filters.unshift({
                  title: response.title
                });
              }
            }
            if(!$scope.$apply)
                $scope.$digest();
          }, function (err) {

          });
        }


        ContentHome.deleteFilter=function(index){
          ContentHome.data.content.filters.splice(index, 1);
        }
        /*
         * Call the datastore to save the data object
         */
        var saveData = function (newObj, tag) {
          if (typeof newObj === 'undefined') {
            return;
          }
          var success = function (result) {
              console.info('Saved data result: ', result);
              RankOfLastItem.setRank(result.data.content.rankOfLastItem);
              updateMasterItem(newObj);
            }
            , error = function (err) {
              console.error('Error while saving data : ', err);
            };
          newObj.content.rankOfLastItem = newObj.content.rankOfLastItem || 0;
          DataStore.save(newObj, tag).then(success, error);
        };

        var saveDataWithDelay = function (newObj) {
          if (newObj) {
            if (isUnchanged(newObj)) {
              return;
            }
            if (tmrDelay) {
              clearTimeout(tmrDelay);
            }
            tmrDelay = setTimeout(function () {
              saveData(JSON.parse(angular.toJson(newObj)), TAG_NAMES.COUPON_INFO);
            }, 500);
          }
        };


        /*
         * Go pull any previously saved data
         * */
        var init = function () {
          var success = function (result) {
              console.info('Init success result:', result);
              ContentHome.data = result.data;
              if (!ContentHome.data) {
                ContentHome.data = angular.copy(_data);
              } else {
                if (!ContentHome.data.content)
                  ContentHome.data.content = {};
                if (!ContentHome.data.content.carouselImages)
                  editor.loadItems([]);
                else
                  editor.loadItems(ContentHome.data.content.carouselImages);
              }
              updateMasterItem(ContentHome.data);
              if (tmrDelay)clearTimeout(tmrDelay);
            }
            , error = function (err) {
              if (err && err.code !== STATUS_CODE.NOT_FOUND) {
                console.error('Error while getting data', err);
                if (tmrDelay)clearTimeout(tmrDelay);
              }
              else if (err && err.code === STATUS_CODE.NOT_FOUND) {
                saveData(JSON.parse(angular.toJson(ContentHome.data)), TAG_NAMES.COUPON_INFO);
              }
            };
          DataStore.get(TAG_NAMES.COUPON_INFO).then(success, error);
        };


        init();

        updateMasterItem(_data);

        /*
         * watch for changes in data and trigger the saveDataWithDelay function on change
         * */
        $scope.$watch(function () {
          return ContentHome.data;
        }, saveDataWithDelay, true);


      }]);
})(window.angular, window.buildfire);
