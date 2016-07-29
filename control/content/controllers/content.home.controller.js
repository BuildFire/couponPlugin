'use strict';

(function (angular, buildfire) {
  angular
    .module('couponPluginContent')
    .controller('ContentHomeCtrl', ['$scope', 'TAG_NAMES','SORT','SORT_FILTER', 'STATUS_CODE', 'DataStore', 'LAYOUTS','Buildfire','Modals','RankOfLastFilter', 'RankOfLastItem', '$csv','Utils',
      function ($scope, TAG_NAMES,SORT, SORT_FILTER, STATUS_CODE, DataStore, LAYOUTS, Buildfire, Modals, RankOfLastFilter, RankOfLastItem , $csv , Utils) {

        var ContentHome = this;
        ContentHome.searchValue = "";
        ContentHome.filter = null;
        var _data = {
          "content": {
            "carouselImages": [],
            "description": '',
            "rankOfLastFilter": '',
            "rankOfLastItem": '',
            "sortItemBy": SORT.MANUALLY,
            "sortFilterBy": SORT_FILTER.MANUALLY
          },
          "design": {
            "itemListLayout": LAYOUTS.itemListLayout[0].name
          },
          "settings": {
            "defaultView": "list",
            "distanceIn": "mi",
            "mapView": "show",
            "filterPage": "show"
          }
        };

        // Show the top plugin info part when on home view
        Buildfire.appearance.setHeaderVisibility(true);
        
        var header = {
              title : 'Item Title',
              summary : "Item Summary",
              SelectedCategories : "Selected Categories",
              Categories : "Categories",
              listImage : 'List Image',
              carouselImages : 'Carousel images',
              preRedemptionText : 'Pre-Redemption Body Content',
              postRedemptionText : 'Post-Redemption Body Content',
              startOn : 'Start Date',
              expiresOn : 'Expiration Date',
              addressTitle : 'Address Title',
              location : 'Coupon Location',
              webURL : 'Web URL',
              sendToEmail : 'Send to Email',
              smsTextNumber : 'SMS Text Number',
              phoneNumber : 'Phone Number',
              facebookURL : 'Facebook URL',
              twitterURL : 'Twitter URL',
              instagramURL : 'Instagram URL',
              googlePlusURL : 'Google+ URL',
              linkedinURL : 'Linkedin URL'
            }
            , headerRow = ["title", "summary" ,"SelectedCategories", "Categories" , "listImage", "carouselImages", "preRedemptionText" , "postRedemptionText" , "startOn" , "expiresOn" , "addressTitle", "location", "webURL", "sendToEmail", "smsTextNumber", "phoneNumber", "facebookURL", "twitterURL", "instagramURL", "googlePlusURL", "linkedinURL"];


        var today = new Date();
        var month = new Date().getMonth() + 1;
        ContentHome.currentDate = +new Date("'" + month + "/" + today.getDate() + "/" + today.getFullYear() + "'");

        ContentHome.currentDateTimestamp = +new Date();

        ContentHome.filters = [];

        ContentHome.items = [];

        ContentHome.sortFilterOptions = [
          SORT_FILTER.MANUALLY,
          SORT_FILTER.CATEGORY_NAME_A_Z,
          SORT_FILTER.CATEGORY_NAME_Z_A
        ];

        ContentHome.sortItemOptions = [
          SORT.MANUALLY,
          SORT.ITEM_TITLE_A_Z,
          SORT.ITEM_TITLE_Z_A,
          SORT.NEWEST_FIRST,
          SORT.OLDEST_FIRST,
          SORT.EXPIRATION_DATE_ASC,
          SORT.EXPIRATION_DATE_DESC
        ];

        ContentHome.searchOptions = {
          filter: {"$json.title": {"$regex": '/*'}},
          skip: SORT_FILTER._skip,
          limit: SORT_FILTER._limit + 1 // the plus one is to check if there are any more
        };

        ContentHome.searchOptionsForItems = {
          filter: {"$json.title": {"$regex": '/*'}},
          skip: SORT._skip,
          limit: SORT._limit + 1 // the plus one is to check if there are any more
        };
        /*
         * create an artificial delay so api isnt called on every character entered
         * */
        var tmrDelay = null;

        ContentHome.busyFilter = false;
        ContentHome.busy = false;
        RankOfLastFilter.setRank(0);
        RankOfLastItem.setRank(0);

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

        /**
         * ContentHome.itemSortableOptions used for ui-sortable directory to sort filter listing Manually.
         * @type object
         */
        ContentHome.filterSortableOptions = {
          handle: '> .cursor-grab',
          disabled: true,
          stop: function (e, ui) {
            var endIndex = ui.item.sortable.dropindex,
              maxRank = 0,
              draggedItem = ContentHome.filters[endIndex];

            if (draggedItem) {
              var prev = ContentHome.filters[endIndex - 1],
                next = ContentHome.filters[endIndex + 1];
              var isRankChanged = false;
              if (next) {
                if (prev) {
                  draggedItem.data.rank = ((prev.data.rank || 0) + (next.data.rank || 0)) / 2;
                  isRankChanged = true;
                } else {
                  draggedItem.data.rank = (next.data.rank || 0) / 2;
                  isRankChanged = true;
                }
              } else {
                if (prev) {
                  draggedItem.data.rank = (((prev.data.rank || 0) * 2) + 10) / 2;
                  maxRank = draggedItem.data.rank;
                  isRankChanged = true;
                }
              }
              if (isRankChanged) {
                DataStore.update(draggedItem.id, draggedItem.data, TAG_NAMES.COUPON_CATEGORIES).then(function (success) {
                  if (ContentHome.data.content.rankOfLastFilter < maxRank) {
                    ContentHome.data.content.rankOfLastFilter = maxRank;
                    RankOfLastFilter.setRank(maxRank);
                  }
                }, function (error) {
                  console.error('Error during updating rank');


                })
              }
            }
          }
        };

        ContentHome.itemSortableOptions = {
          handle: '> .cursor-grab-item',
          disabled: true,
          stop: function (e, ui) {
            var endIndex = ui.item.sortable.dropindex,
              maxRank = 0,
              draggedItem = ContentHome.items[endIndex];

            if (draggedItem) {
              var prev = ContentHome.items[endIndex - 1],
                next = ContentHome.items[endIndex + 1];
              var isRankChanged = false;
              if (next) {
                if (prev) {
                  draggedItem.data.rank = ((prev.data.rank || 0) + (next.data.rank || 0)) / 2;
                  isRankChanged = true;
                } else {
                  draggedItem.data.rank = (next.data.rank || 0) / 2;
                  isRankChanged = true;
                }
              } else {
                if (prev) {
                  draggedItem.data.rank = (((prev.data.rank || 0) * 2) + 10) / 2;
                  maxRank = draggedItem.data.rank;
                  isRankChanged = true;
                }
              }
              if (isRankChanged) {
                DataStore.update(draggedItem.id, draggedItem.data, TAG_NAMES.COUPON_ITEMS).then(function (success) {
                  if (ContentHome.data.content.rankOfLastItem < maxRank) {
                    ContentHome.data.content.rankOfLastItem = maxRank;
                    RankOfLastItem.setRank(maxRank);
                  }
                }, function (error) {
                  console.error('Error during updating rank');


                })
              }
            }
          }
        };
        //ContentHome.itemSortableOptions.disabled = !(ContentHome.data.content.sortFilterBy === SORT_FILTER.MANUALLY);

        ContentHome.addEditFilter = function (filter, editFlag, index) {
          var tempTitle = '';
          if(Number.isInteger(index))
          var filterIndex=index;
          if (filter)
            tempTitle = filter.data.title;
          Modals.addFilterModal({
            title: tempTitle,
            isEdit: editFlag
          }).then(function (response) {
            if (!(response.title === null || response.title.match(/^ *$/) !== null)) {

              //if index is there it means filter update operation is performed
              if (Number.isInteger(filterIndex)) {

                ContentHome.filters[filterIndex].data.title = response.title;
                Buildfire.datastore.update(ContentHome.filters[filterIndex].id, ContentHome.filters[filterIndex].data, TAG_NAMES.COUPON_CATEGORIES, function (err) {
                  ContentHome.isUpdating = false;
                  if (err)
                    return console.error('There was a problem saving your data');
                })

              } else {
                var filterResponse=response;
                var notFound=true;
                if(ContentHome.filters && ContentHome.filters.length){
                  for(var index=0; index<ContentHome.filters.length ;index++){
                    if(ContentHome.filters[index].data.title==response.title){
                      notFound=false;
                      confirmFilterAdd(filterResponse);
                      break;
                    }
                    if(ContentHome.filters.length-1==index){
                      if(notFound)
                      insertFilter(filterResponse);
                      break;
                    }
                  }
                }else{
                  insertFilter(filterResponse);
                }
              }
            }
            if (!$scope.$apply)
              $scope.$digest();
          }, function (err) {

          });
        };

        function confirmFilterAdd(filterResponse){
          Modals.removePopupFilterModal({}).then(function(response){
            console.log(response);
            if(response)
            {
              insertFilter(filterResponse);
            }
          });
        }

        function insertFilter(response){
          ContentHome.filter = {
            data: {
              title: response.title,
              rank: RankOfLastFilter.getRank() + 10,
              noOfItems : 0
            }
          };
          ContentHome.data.content.rankOfLastFilter = RankOfLastFilter.getRank() + 10;
          RankOfLastFilter.setRank(ContentHome.data.content.rankOfLastFilter);
          ContentHome.filters.unshift(ContentHome.filter);
          Buildfire.datastore.insert(ContentHome.filter.data, TAG_NAMES.COUPON_CATEGORIES, false, function (err, data) {
            console.log("Saved", data.id);
            ContentHome.isUpdating = false;
            ContentHome.filter.id = data.id;
            ContentHome.filter.data.title = data.data.title;
            if (err) {
              ContentHome.isNewItemInserted = false;
              return console.error('There was a problem saving your data');
            }
            $scope.$digest();
          });
        }

        ContentHome.deleteFilter = function (index) {
          Modals.removePopupModal({'item': 'filter'}).then(function (result) {
            if (result) {

              Buildfire.datastore.delete(ContentHome.filters[index].id, TAG_NAMES.COUPON_CATEGORIES, function (err, result) {
                if (err)
                  return;
                //ContentHome.items.splice(_index, 1);
                ContentHome.filters.splice(index, 1);
                var tmpArray = [];
                ContentHome.filters.forEach(function(res,index){
                  tmpArray.push(res.id);
                });
                ContentHome.items.forEach(function(resItem,index){
                  // tmpArray.push(res.data.SelectedCategories);
                  var  intersectedCategories =  tmpArray.filter(function(value) {
                    return resItem.data.SelectedCategories.indexOf(value) > -1;
                  });
                  ContentHome.items[index].SelectedCommonCategories = intersectedCategories;
                });
                $scope.$digest();
              });
            }
          });
        };
        ContentHome.showFilter = function (index, itemId, selectedItems, categories, itemData) {

            //categories=ContentHome.filters;

          Modals.showFilterPopupModal({
            index: index,
            itemId: itemId,
            selectedItems: selectedItems,
            categories: categories,
            itemData: itemData
          }).then(function (response) {
            ContentHome.items = [];
            ContentHome.filters = [];
            ContentHome.isBusy = false;
            ContentHome.searchOptionsForItems.skip = 0;

            ContentHome.loadMoreItems('items');//, {"$json.title": {"$regex": '/*'}}
            ContentHome.loadMore('filter');
          //  ContentHome.loadMore()
              if (!$scope.$apply)
              $scope.$digest();


          }, function (err) {

          });
        };

        ContentHome.deleteItem = function (index) {
          Modals.removeItemPopupModal({'item': 'item'}).then(function (result) {
            if (result) {
              Buildfire.datastore.delete(ContentHome.items[index].id, TAG_NAMES.COUPON_ITEMS, function (err, result) {
                if (err)
                  return;
                //ContentHome.items.splice(_index, 1);
                ContentHome.items.splice(index, 1);
                $scope.$digest();
              });
            }
          });
        };

        ContentHome.sortFilterBy = function (value) {
          if (!value) {
            console.info('There was a problem sorting your data');
          } else {
            // ContentHome.data.content.filters=null;
            ContentHome.filters = [];
            ContentHome.searchOptions.skip = 0;
            ContentHome.busyFilter = false;
            ContentHome.data.content.sortFilterBy = value;
            ContentHome.loadMore('filter');
          }
        };

        ContentHome.sortItemBy = function (value) {
          if (!value) {
            console.info('There was a problem sorting your data');
          } else {
            // ContentHome.data.content.filters=null;
            ContentHome.items = [];
            ContentHome.searchOptionsForItems.skip = 0;
            ContentHome.busy = false;
            ContentHome.data.content.sortItemBy = value;
            ContentHome.loadMoreItems('items');
          }
        };


        ContentHome.chooseFilter = function (value, title) {
          ContentHome.data.content.selectedFilter = {"title": title, "id": value};
          ContentHome.data.content.selectedStatus = "All Statuses";
          ContentHome.searchValue="";
          ContentHome.items = [];
          ContentHome.searchOptionsForItems.skip = 0;
          if (ContentHome.data.content.selectedFilter && ContentHome.data.content.selectedFilter.id!=='All Categories') {
            ContentHome.searchOptionsForItems.filter = {
              "$and": [{
                "$json.SelectedCategories": {$eq: ContentHome.data.content.selectedFilter.id}
              }, {"$json.title": {"$regex": '/*'}}]
            };
          }else{
            ContentHome.searchOptionsForItems.filter = {"$json.title": {"$regex": '/*'}};
          };
          ContentHome.loadMoreItems('items');//, {"$json.title": {"$regex": '/*'}}
        };

        ContentHome.chooseStatus = function (status) {
          ContentHome.searchValue ="";
          ContentHome.data.content.selectedStatus = status;
          ContentHome.couponActiveDate = ContentHome.currentDate;
          if (ContentHome.data.content.selectedFilter && ContentHome.data.content.selectedFilter.id!=='All Categories') {
            if (ContentHome.data.content.selectedStatus == 'Active') {
              ContentHome.searchOptionsForItems.filter =
              {
                "$and": [{
                  "$and": [{
                    "$json.SelectedCategories": {$eq: ContentHome.data.content.selectedFilter.id}
                  }, {"$json.title": {"$regex": '/*'}}]
                }, {"$or": [{"$json.expiresOn": {"$gte": ContentHome.couponActiveDate}}, {"$json.expiresOn": {"$eq": ""}}]}]
              }
            } else if (ContentHome.data.content.selectedStatus == 'Expired') {
              ContentHome.searchOptionsForItems.filter =
              {
                "$and": [{
                  "$and": [{
                    "$json.SelectedCategories": {$eq: ContentHome.data.content.selectedFilter.id}
                  }, {"$json.title": {"$regex": '/*'}}]
                }, {"$or": [{"$json.expiresOn": {"$lte": ContentHome.couponActiveDate}}, {"$json.expiresOn": {"$ne": ""}}]}]
              }
            }else if (ContentHome.data.content.selectedStatus == 'All Statuses') {
              ContentHome.searchOptionsForItems.filter =
              {
                "$and": [{
                  "$json.SelectedCategories": {$eq: ContentHome.data.content.selectedFilter.id}
                }, {"$json.title": {"$regex": '/*'}}]
              }
            }
          } else {
            if (ContentHome.data.content.selectedStatus == 'Active') {
              ContentHome.searchOptionsForItems.filter =
              {
                "$and": [{
                  "$and": [{"$json.title": {"$regex": '/*'}}]
                }, {"$or": [{"$json.expiresOn": {"$gte": ContentHome.couponActiveDate}}, {"$json.expiresOn": {"$eq": ""}}]}]
              }
            } else if (ContentHome.data.content.selectedStatus == 'Expired') {
              ContentHome.searchOptionsForItems.filter =
              {
                "$and": [{
                  "$and": [ {"$json.title": {"$regex": '/*'}}]
                }, {"$or": [{"$json.expiresOn": {"$lte": ContentHome.couponActiveDate}}, {"$json.expiresOn": {"$ne": ""}}]}]
              }
            }
            else if (ContentHome.data.content.selectedStatus == 'All Statuses') {
              ContentHome.searchOptionsForItems.filter = {"$json.title": {"$regex": '/*'}};
            }
          }


          ContentHome.items = [];
          ContentHome.searchOptionsForItems.skip = 0;

          ContentHome.loadMoreItems('items');//, {"$json.title": {"$regex": '/*'}}
          console.log("-------------------llll", ContentHome.searchOptionsForItems.filter)
        };

        ContentHome.searchItem = function () {
          ContentHome.couponActiveDate = ContentHome.currentDate;
          if (ContentHome.data.content.selectedFilter && ContentHome.data.content.selectedFilter.id!='All Categories' && ContentHome.data.content.selectedStatus && ContentHome.data.content.selectedStatus !== 'All Statuses') {

            if (ContentHome.data.content.selectedStatus == 'Active') {
              ContentHome.searchOptionsForItems.filter =
              {
                "$and": [{
                  "$and": [{
                    "$json.SelectedCategories": {$eq: ContentHome.data.content.selectedFilter.id}
                  }, {"$json.title": {"$regex": ContentHome.searchValue}}]
                }, {"$or": [{"$json.expiresOn": {"$gte": ContentHome.couponActiveDate}}, {"$json.expiresOn": {"$eq": ""}}]}]
              }
            } else if (ContentHome.data.content.selectedStatus == 'Expired') {

              ContentHome.searchOptionsForItems.filter =
              {
                "$and": [{
                  "$and": [{
                    "$json.SelectedCategories": {$eq: ContentHome.data.content.selectedFilter.id}
                  }, {"$json.title": {"$regex": ContentHome.searchValue}}]
                }, {"$or": [{"$json.expiresOn": {"$lte": ContentHome.couponActiveDate}}, {"$json.expiresOn": {"$ne": ""}}]}]
              }
            }
          } else if(ContentHome.data.content.selectedStatus && ContentHome.data.content.selectedStatus!=="All Statuses"){
            if (ContentHome.data.content.selectedStatus == 'Active') {
              ContentHome.searchOptionsForItems.filter =
              {
                "$and": [{
                  "$and": [{"$json.title": {"$regex": ContentHome.searchValue}}]
                }, {"$or": [{"$json.expiresOn": {"$gte": ContentHome.couponActiveDate}}, {"$json.expiresOn": {"$eq": ""}}]}]
              }
            } else if (ContentHome.data.content.selectedStatus == 'Expired') {
              ContentHome.searchOptionsForItems.filter =
              {
                "$and": [{
                  "$and": [ {"$json.title": {"$regex":ContentHome.searchValue}}]
                }, {"$or": [{"$json.expiresOn": {"$lte": ContentHome.couponActiveDate}}, {"$json.expiresOn": {"$ne": ""}}]}]
              }
            }
          }else if(ContentHome.data.content.selectedFilter && ContentHome.data.content.selectedFilter.id!=='All Categories'){
            ContentHome.searchOptionsForItems.filter = {
              "$and": [{
                "$json.SelectedCategories": {$eq: ContentHome.data.content.selectedFilter.id}
              }, {"$json.title": {"$regex": ContentHome.searchValue}}]
            }
          }else{

            ContentHome.searchOptionsForItems.filter = { "$or": [{
              "$json.title": {
                "$regex": ContentHome.searchValue,
                "$options": "i"
              }
            }]}
          }
          ContentHome.items = [];
          ContentHome.searchOptionsForItems.skip = 0;
          ContentHome.loadMoreItems('items');
        };
        /**
         * getSearchOptions(value) is used to get searchOptions with one more key sort which decide the order of sorting.
         * @param value is used to filter sort option.
         * @returns object
         * SORT_FILTER.CATEGORY_NAME_A_Z,
         * SORT_FILTER.CATEGORY_NAME_Z_A
         */
        var getSearchOptions = function (value) {
          ContentHome.filterSortableOptions.disabled = true;
          switch (value) {
            case SORT_FILTER.CATEGORY_NAME_A_Z:
              ContentHome.searchOptions.sort = {"title": 1};
              break;
            case SORT_FILTER.CATEGORY_NAME_Z_A:
              ContentHome.searchOptions.sort = {"title": -1};
              break;
            default :
              ContentHome.filterSortableOptions.disabled = false;
              ContentHome.searchOptions.sort = {"rank": 1};
              break;
          }
          return ContentHome.searchOptions;
        };

        var getItemSearchOptions = function (value) {
          ContentHome.itemSortableOptions.disabled = true;
          switch (value) {
            case SORT.ITEM_TITLE_A_Z:
              ContentHome.searchOptionsForItems.sort = {"title": 1};
              break;
            case SORT.ITEM_TITLE_Z_A:
              ContentHome.searchOptionsForItems.sort = {"title": -1};
              break;
            case SORT.NEWEST_FIRST:
              ContentHome.searchOptionsForItems.sort = {"dateCreated": -1};
              break;
            case SORT.OLDEST_FIRST:
              ContentHome.searchOptionsForItems.sort = {"dateCreated": 1};
              break;
            case SORT.EXPIRATION_DATE_ASC:
              ContentHome.searchOptionsForItems.sort = {"expiresOn": 1};
              break;
            case SORT.EXPIRATION_DATE_DESC:
              ContentHome.searchOptionsForItems.sort = {"expiresOn": -1};
              break;
            default :
              ContentHome.itemSortableOptions.disabled = false;
              ContentHome.searchOptionsForItems.sort = {"rank": 1};
              break;
          }
          return ContentHome.searchOptionsForItems;
        };

        ContentHome.loadMore = function (str) {
          console.log("------------------>>>>>>>>>>>>>>>>>>>>in",str)

          Buildfire.spinner.show();
          if (ContentHome.busyFilter) {
            return;
          }

          ContentHome.busyFilter = true;
          if (ContentHome.data && ContentHome.data.content.sortFilterBy) {
            ContentHome.searchOptions = getSearchOptions(ContentHome.data.content.sortFilterBy);
          }else{
            return;
          }
          if(str!=='items')
          Buildfire.datastore.search(ContentHome.searchOptions, TAG_NAMES.COUPON_CATEGORIES, function (err, result) {
            if (err) {
              Buildfire.spinner.hide();
              return console.error('-----------err in getting list-------------', err);
            }
            if (result.length <= SORT_FILTER._limit) {// to indicate there are more
              ContentHome.noMoreFilter = true;
              Buildfire.spinner.hide();
            } else {
              result.pop();
              ContentHome.searchOptions.skip = ContentHome.searchOptions.skip + SORT_FILTER._limit;
              ContentHome.noMoreFilter = false;
            }
            var tmpArray=[];
            var lastIndex=result.length;
            result.forEach(function(res,index){
              tmpArray.push({'title' : res.data.title,
              rank:index +1,
                id:res.data.id});
            });

            ContentHome.filters = ContentHome.filters ? ContentHome.filters.concat(result) : result;
            ContentHome.busyFilter = false;
            Buildfire.spinner.hide();
            $scope.$digest();
          });
        };


        var searchOptionsFilterForItemList={
          "filter":{"$json.title": {"$regex": '/*'}},
          "sort": {"title": 1},
          "skip":"0",
          "limit":"50"
        };

        ContentHome.loadMoreItems = function(str){
          console.log("------------------>>>>>>>>>>>>>>>>>>>>",str)

          Buildfire.spinner.show();
          if (ContentHome.busy) {
            return;
          }
          if (ContentHome.data && ContentHome.data.content.sortItemBy) {
            ContentHome.searchOptionsForItems = getItemSearchOptions(ContentHome.data.content.sortItemBy);
          }else{
            return;
          }
          ContentHome.busy = true;
          if(str!=='filter')
            Buildfire.datastore.search(ContentHome.searchOptionsForItems, TAG_NAMES.COUPON_ITEMS, function (err, result) {
              if (err) {
                Buildfire.spinner.hide();
                return console.error('-----------err in getting list-------------', err);
              }
              if (result.length <= SORT._limit) {// to indicate there are more
                ContentHome.noMore = true;
                Buildfire.spinner.hide();
              } else {
                result.pop();
                ContentHome.searchOptionsForItems.skip = ContentHome.searchOptionsForItems.skip + SORT._limit;
                ContentHome.noMore = false;
              }
              var tmpArray=[];
              var lastIndex=result.length;
              result.forEach(function(res,index){
                tmpArray.push({'title' : res.data.title,
                  rank:index +1,
                  summary : res.data.summary,
                  categories : res.data.Categories.length,
                  expiresOn : res.data.expiresOn,
                  listImage  : res.data.listImage,
                  id:res.id});
              });

              ContentHome.items = ContentHome.items ? ContentHome.items.concat(result) : result;
              Buildfire.datastore.search(searchOptionsFilterForItemList, TAG_NAMES.COUPON_CATEGORIES, function (err, resultFilter) {

                if (err) {
                  Buildfire.spinner.hide();
                  return console.error('-----------err in getting list-------------', err);
                }
                var tmpArray=[];
                var lastIndex=result.length;
                resultFilter.forEach(function(res,index){
                  tmpArray.push(res.id);
                });
                ContentHome.items.forEach(function(resItem,index){
                  // tmpArray.push(res.data.SelectedCategories);
                  var  intersectedCategories =  tmpArray.filter(function(value) {
                    if(resItem.data.SelectedCategories && resItem.data.SelectedCategories.length)
                    return resItem.data.SelectedCategories.indexOf(value) > -1;
                  });
                  ContentHome.items[index].SelectedCommonCategories = intersectedCategories;
                });
                $scope.$digest();
              });
              ContentHome.busy = false;
              console.log("-------------------llll",ContentHome.items )
            Buildfire.spinner.hide();
            $scope.$digest();
          });
        };



       /* *//**
         * ContentHome.getMore is used to load the items
         *//*
        ContentHome.getMore = function () {
          if (ContentHome.isBusy && !ContentHome.noMore) {
            return;
          }
         // updateSearchOptions();
          ContentHome.isBusy = true;
          DataStore.search(searchOptions,TAG_NAMES.COUPON_ITEMS).then(function success(result) {
            if (result.length <= _limit) {// to indicate there are more
              ContentHome.noMore = true;
            }
            else {
              result.pop();
              searchOptions.skip = searchOptions.skip + _limit;
              ContentHome.noMore = false;
            }
            ContentHome.items = ContentHome.items ? ContentHome.items.concat(result) : result;
            ContentHome.isBusy = false;
          }, function fail() {
            ContentHome.isBusy = false;
          });
        };*/


        function validateCsv(items) {
          if (!Array.isArray(items) || !items.length) {
            return false;
          }
          return items.every(isValidItem);
        }

        ContentHome.openImportCSVDialog = function () {

          $csv.import(headerRow).then(function (rows) {
            ContentHome.loading = true;
            if (rows && rows.length > 1) {
              var categoryList=rows[1].Categories.split(',');
              categoryList.forEach(function(category){
                var obj={};
                obj.title=category;
                insertFilter(obj);
              });

              var columns = rows.shift();

              for (var _index = 0; _index < headerRow.length; _index++) {
                if (header[headerRow[_index]] != columns[headerRow[_index]]) {
                  ContentHome.loading = false;
                  ContentHome.csvDataInvalid = true;
                  break;
                }
              }

              if (!ContentHome.loading)
                return;

              var rank =  ContentHome.data.content.rankOfLastItem || 0;
              RankOfLastItem.setRank(rank);

              for (var index = 0; index < rows.length; index++) {
                rank += 10;
                rows[index].dateCreated = +new Date();
                rows[index].links = [];
                rows[index].rank = rank;
                rows[index].body = "";

                if(rows[index].carouselImages){
                 var carousalImageUrlArray=rows[index].carouselImages.split(',');
                  rows[index].carouselImages=[];

                  carousalImageUrlArray.forEach(function(url){
                    var obj={
                      action: "noAction",
                      iconUrl: url,
                      title: "image"
                    };
                    rows[index].carouselImages.push(obj);
                  })
                }

                  asycronouseProcess(index, function(index) {

                    if(rows[index].SelectedCategories.length && rows[index].location){

                      var categoryList = rows[index].SelectedCategories.split(',');

                      var searchOptions = {
                        filter: {"$json.title": {"$regex": '/*'}}
                      };
                      Buildfire.datastore.search(searchOptions, TAG_NAMES.COUPON_CATEGORIES, function (err, data) {
                        console.log("Saved", data.id);
                        var tmpCategoryIds=[];
                        data.forEach(function(categoryObj){
                          categoryList.forEach(function(categoryTitle){
                            if(categoryTitle==categoryObj.data.title){
                              tmpCategoryIds.push(categoryObj.id);
                            }
                          })
                        });
                        rows[index].SelectedCategories=tmpCategoryIds;


                        var geocoder = new google.maps.Geocoder();
                        geocoder.geocode({"address": rows[index].location}, function (results, status) {
                          if (status == google.maps.GeocoderStatus.OK) {
                            var lat = results[0].geometry.location.lat(),
                                lng = results[0].geometry.location.lng();
                            // ContentHome.setLocation({location: rows[index].location, coordinates: {lng:lng, lat:lat}});
                            rows[index].location = {
                              coordinates: {
                                lng: lng,
                                lat: lat
                              },
                              addressTitle: rows[index].location
                            };
                            bulkInserItem(rows,rank);
                          }
                          else {
                            console.error('' +
                            'Error else parts of google');
                            error();
                          }
                        });
                        $scope.$digest();

                      });


                    }else if ((!rows[index].SelectedCategories.length) && rows[index].location){


                      var geocoder = new google.maps.Geocoder();
                      geocoder.geocode({"address": rows[index].location}, function (results, status) {
                        if (status == google.maps.GeocoderStatus.OK) {
                          var lat = results[0].geometry.location.lat(),
                              lng = results[0].geometry.location.lng();
                          // ContentHome.setLocation({location: rows[index].location, coordinates: {lng:lng, lat:lat}});
                          rows[index].location = {
                            coordinates: {
                              lng: lng,
                              lat: lat
                            },
                            addressTitle: rows[index].location
                          };
                          bulkInserItem(rows,rank);
                        }
                        else {
                          console.error('' +
                          'Error else parts of google');
                          error();
                        }
                      });
                      $scope.$digest();

                    }else if(rows[index].SelectedCategories.length && (!rows[index].location)){
                      var categoryList = rows[index].SelectedCategories.split(',');

                      var searchOptions = {
                        filter: {"$json.title": {"$regex": '/*'}}
                      };
                      Buildfire.datastore.search(searchOptions, TAG_NAMES.COUPON_CATEGORIES, function (err, data) {
                        console.log("Saved", data.id);
                        var tmpCategoryIds=[];
                        data.forEach(function(categoryObj){
                          categoryList.forEach(function(categoryTitle){
                            if(categoryTitle==categoryObj.data.title){
                              tmpCategoryIds.push(categoryObj.id);
                            }
                          })
                        });
                        rows[index].SelectedCategories=tmpCategoryIds;
                        bulkInserItem(rows,rank);
                        $scope.$digest();

                      });
                    }else{
                      bulkInserItem(rows,rank)
                    }

                   /* if(rows[index].SelectedCategories.length) {
                      var categoryList = rows[index].SelectedCategories.split(',');

                      var searchOptions = {
                        filter: {"$json.title": {"$regex": '*//*'}},
                      }
                      Buildfire.datastore.search(searchOptions, TAG_NAMES.COUPON_CATEGORIES, function (err, data) {
                        console.log("Saved", data.id);
                        var tmpCategoryIds=[];
                        data.forEach(function(categoryObj){
                          categoryList.forEach(function(categoryTitle){
                            if(categoryTitle==categoryObj.data.title){
                              tmpCategoryIds.push(categoryObj.id);
                            }
                          })
                        })
                        rows[index].SelectedCategories=tmpCategoryIds;
                        $scope.$digest();

                      });
                      }*/

                    /*if(rows[index].location) {
                      var geocoder = new google.maps.Geocoder();
                      geocoder.geocode({"address": rows[index].location}, function (results, status) {
                        if (status == google.maps.GeocoderStatus.OK) {
                          var lat = results[0].geometry.location.lat(),
                              lng = results[0].geometry.location.lng();
                          // ContentHome.setLocation({location: rows[index].location, coordinates: {lng:lng, lat:lat}});
                          rows[index].location = {
                            coordinates: {
                              lng: lng,
                              lat: lat
                            },
                            addressTitle: rows[index].location
                          };
                        }
                        else {
                          console.error('' +
                          'Error else parts of google');
                          error();
                        }
                      });
                    }*/
                  });
                    function asycronouseProcess(index, cb){
                    cb(index);
                    console.log('completed');
                  }

              }
            }
            else {
              ContentHome.loading = false;
              ContentHome.csvDataInvalid = true;
              $scope.$apply();
            }
          }, function (error) {
            ContentHome.loading = false;
            $scope.$apply();
            //do something on cancel
          });

        };

        function bulkInserItem(rows,rank){

          if (validateCsv(rows)) {

            buildfire.datastore.bulkInsert(rows, TAG_NAMES.COUPON_ITEMS,function(err,data){
              if(err){
                console.error(error);
                ContentHome.loading = false;
                $scope.$apply();
              }
              else{
                ContentHome.loading = false;
                ContentHome.isBusy = false;
                ContentHome.items = [];
                ContentHome.data.content.rankOfLastItem = rank;
                RankOfLastItem.setRank(rank);
                ContentHome.loadMoreItems('js');
              }

            });

            /*   DataStore.insert(rows,TAG_NAMES.COUPON_ITEMS).then(function (data) {
             }, function errorHandler(error) {

             });*/
          } else {
            ContentHome.loading = false;
            ContentHome.csvDataInvalid = true;
            $timeout(function hideCsvDataError() {
              ContentHome.csvDataInvalid = false;
            }, 2000);
          }
        }

        /**
         * getRecords function get the  all items from DB
         * @param searchOption
         * @param records
         * @param callback
         */
        function getRecords(searchOption, records, callback) {
          Buildfire.datastore.search(searchOption, TAG_NAMES.COUPON_ITEMS, function (err, result) {

            if (result.length <= SORT._maxLimit) {// to indicate there are more
              records = records.concat(result);
              return callback(records);
            }
            else {
              result.pop();
              searchOption.skip = searchOption.skip + SORT._maxLimit;
              records = records.concat(result);
              return getRecords(searchOption, records, callback);
            }
          }, function (error) {
            throw (error);
          });
        }


        function returnCommaSepratedListOfEntity(entities,param){
          if(entities.length && Array.isArray(entities)){
            var tmpURLstr="";
            entities.forEach(function(entity){
              if(tmpURLstr)
                tmpURLstr=tmpURLstr+','+entity[param];
              else
                tmpURLstr=entity[param];
            });
           return tmpURLstr;
          }else{
            return entities;
          }
        }

        function returnCommaSepratedListOfCategories(Categories, selectedCategories){
          if(selectedCategories.length && Array.isArray(selectedCategories)){
            var tmpList="";
            selectedCategories.forEach(function(selCategory){
              Categories.forEach(function(category){
                  if(selCategory==category.id){
                    if(!tmpList)
                    tmpList=category.title;
                    else
                      tmpList=tmpList+","+category.title;
                  }
              });
            });
            return tmpList;
         }

        }

        /**
         * ContentHome.exportCSV() used to export item list data to CSV
         */
        ContentHome.exportCSV = function () {
          var search = angular.copy(ContentHome.searchOptions);
          search.skip = 0;
          search.limit =  SORT._maxLimit + 1;
          getRecords(search,
              []
              , function (data) {
                if (data && data.length) {
                  var items = [];
                  angular.forEach(angular.copy(data), function (value) {
                    delete value.data.dateCreated;
                    delete value.data.links;
                    delete value.data.rank;
                    delete value.data.body;

                    value.data.carouselImages=returnCommaSepratedListOfEntity(value.data.carouselImages,'iconUrl')
                    if(value.data.SelectedCategories)
                    value.data.SelectedCategories=returnCommaSepratedListOfCategories(value.data.Categories,value.data.SelectedCategories);
                    value.data.Categories=returnCommaSepratedListOfEntity(value.data.Categories,'title');
                    value.data.location=value.data.location.addressTitle;

                    items.push(value.data);
                  });
                  var csv = $csv.jsonToCsv(angular.toJson(items), {
                    header: header
                  });
                  $csv.download(csv, "Export.csv");
                }
                else {
                  ContentHome.getTemplate();
                }
               // records = [];
              });
        };

        /**
         * ContentHome.getTemplate() used to download csv template
         */
        ContentHome.getTemplate = function () {
          var templateData = [{
            title : '',
            summary : "",
            Categories : "",
            listImage : '',
            carouselImages : '',
            preRedemptionText : '',
            postRedemptionText : '',
            startOn : '',
            expiresOn : '',
            addressTitle : '',
            location : '',
            webURL : '',
            sendToEmail : '',
            smsTextNumber : '',
            phoneNumber : '',
            facebookURL : '',
            twitterURL : '',
            instagramURL : '',
            googlePlusURL : '',
            linkedinURL : ''
          }];
          var csv = $csv.jsonToCsv(angular.toJson(templateData), {
            header: header
          });
          $csv.download(csv, "Template.csv");
        };

        /*
         * Call the datastore to save the data object
         */
        var saveData = function (newObj, tag) {
          if (typeof newObj === 'undefined') {
            return;
          }
          var success = function (result) {
              console.info('Saved data result: ', result);
              RankOfLastFilter.setRank(result.data.content.rankOfLastFilter);
              RankOfLastItem.setRank(result.data.content.rankOfLastItem);
              updateMasterItem(newObj);
            }
            , error = function (err) {
              console.error('Error while saving data : ', err);
            };
          newObj.content.rankOfLastFilter = newObj.content.rankOfLastFilter || 0;
          DataStore.save(newObj, tag).then(success, error);
        };

        function isValidItem(item) {
          if(item){
            return item.title;
          }
          else{
            return false;
          }

        }

        var updateItemsWithDelay = function (item) {
          ContentHome.isUpdating = false;
          ContentHome.isItemValid = isValidItem(ContentHome.filter);
          if (!ContentHome.isUpdating && !isUnchanged(ContentHome.filter) && ContentHome.isItemValid) {
           setTimeout(function () {
              if (item.id) {
                ContentHome.updateItemData();
                $scope.$digest();
              } /*else if (!ContentHome.isNewItemInserted) {
                ContentHome.addNewItem();
              }*/
            }, 300);
          }
        };

        ContentHome.updateItemData = function () {
          Buildfire.datastore.update(ContentHome.filter.id, ContentHome.filter, TAG_NAMES.COUPON_CATEGORIES, function (err) {
            ContentHome.isUpdating = false;
            if (err)
              return console.error('There was a problem saving your data');
          })
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
              if (!ContentHome.data.content) {
                ContentHome.data = angular.copy(_data);
              } else {
                if (!ContentHome.data.content)
                  ContentHome.data.content = {};
                if (!ContentHome.data.settings)
                  ContentHome.data.settings = {};
                if (!ContentHome.data.content.carouselImages)
                  editor.loadItems([]);
                else
                  editor.loadItems(ContentHome.data.content.carouselImages);
                if(!ContentHome.data.content.sortFilterBy)
                  ContentHome.data.content.sortFilterBy=ContentHome.sortFilterOptions[0];
                if(!ContentHome.data.content.sortItemBy)
                  ContentHome.data.content.sortItemBy=ContentHome.sortItemOptions[0];
                ContentHome.filters = [];
                ContentHome.searchOptions.skip = 0;
                ContentHome.busyFilter = false;
                ContentHome.busy = false;
                ContentHome.data.content.selectedFilter = null;
                ContentHome.data.content.selectedStatus = null;
                console.log("-------------------llll", ContentHome.data.content);
                RankOfLastFilter.setRank(ContentHome.data.content.rankOfLastFilter || 0);
                RankOfLastItem.setRank(ContentHome.data.content.rankOfLastItem || 0);
              }
              updateMasterItem(ContentHome.data);
              if (tmrDelay)clearTimeout(tmrDelay);
                ContentHome.loadMore('js');
                ContentHome.loadMoreItems('js');
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

        /*
         * watch for changes in filters and trigger the saveDataWithDelay function on change
         * */
        $scope.$watch(function () {
          return ContentHome.filter;
        }, updateItemsWithDelay, true);


      }]);
})(window.angular, window.buildfire);
