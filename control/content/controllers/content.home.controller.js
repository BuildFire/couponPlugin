'use strict';

(function (angular, buildfire) {
  angular
    .module('couponPluginContent')
    .controller('ContentHomeCtrl', ['$scope', '$timeout', 'TAG_NAMES', 'SORT', 'SORT_FILTER', 'STATUS_CODE', 'DataStore', 'LAYOUTS', 'Buildfire', 'Modals', 'RankOfLastFilter', 'RankOfLastItem', '$csv', 'Utils', '$rootScope', 'PluginEvents', 'StateSeeder', 'defaultInfo',
      function ($scope, $timeout, TAG_NAMES, SORT, SORT_FILTER, STATUS_CODE, DataStore, LAYOUTS, Buildfire, Modals, RankOfLastFilter, RankOfLastItem, $csv, Utils, $rootScope, PluginEvents, StateSeeder, defaultInfo ) {
        var ContentHome = this;
        let stateSeeder;
        $rootScope.$watch('showEmptyState', function(newValue, oldValue) {
          if ((typeof newValue === 'undefined' || newValue == true) && !stateSeeder) {
            stateSeeder = StateSeeder.initStateSeeder();
          }
        })
        ContentHome.searchValue = "";
        ContentHome.filter = null;
        ContentHome.isBusy = true;
        var _data = defaultInfo;

        // Show the top plugin info part when on home view
        Buildfire.appearance.setHeaderVisibility(true);

        var header = {
          title: 'Item Title',
          summary: "Item Summary",
          SelectedCategories: "Selected Categories",
          Categories: "Categories",
          listImage: 'List Image',
          carouselImages: 'Carousel images',
          preRedemptionText: 'Pre-Redemption Body Content',
          postRedemptionText: 'Post-Redemption Body Content',
          startOn: 'Start Date',
          expiresOn: 'Expiration Date',
          addressTitle: 'Address Title',
          location: 'Coupon Location',
          webURL: 'Web URL',
          sendToEmail: 'Send to Email',
          smsTextNumber: 'SMS Text Number',
          phoneNumber: 'Phone Number',
          facebookURL: 'Facebook URL',
          twitterURL: 'Twitter URL',
          instagramURL: 'Instagram URL',
          googlePlusURL: 'Google+ URL',
          linkedinURL: 'Linkedin URL'
        }
          , headerRow = ["title", "summary", "SelectedCategories", "Categories", "listImage", "carouselImages", "preRedemptionText", "postRedemptionText", "startOn", "expiresOn", "addressTitle", "location", "webURL", "sendToEmail", "smsTextNumber", "phoneNumber", "facebookURL", "twitterURL", "instagramURL", "googlePlusURL", "linkedinURL"];


        /*  var today = new Date();
          var month = new Date().getMonth() + 1;
          ContentHome.currentDate = +new Date("'" + month + "/" + today.getDate() + "/" + today.getFullYear() + "'");
  */
        ContentHome.currentDate = new Date();
        ContentHome.yesterdayDate = +ContentHome.currentDate.setDate(ContentHome.currentDate.getDate() - 1);
        ContentHome.tommorowDate = +ContentHome.currentDate.setDate(ContentHome.currentDate.getDate() + 1);

        ContentHome.currentDateTimestamp = +new Date();

        ContentHome.filters = [];

        ContentHome.items = [];

        ContentHome.importingCSV = false;
        ContentHome.csvItems = 0;
        ContentHome.csvImportedItems = 0;

        $rootScope.$on('ITEMS_UPDATED', function (e) {
          ContentHome.filters = [];
          ContentHome.items = [];
          ContentHome.loadMore('js');
          ContentHome.loadMoreItems('js');

        })

        ContentHome.sortFilterOptions = [
          SORT_FILTER.CATEGORY_NAME_A_Z,
          SORT_FILTER.CATEGORY_NAME_Z_A,
          SORT_FILTER.MANUALLY,
        ];

        ContentHome.sortItemOptions = [
          SORT.ITEM_TITLE_A_Z,
          SORT.ITEM_TITLE_Z_A,
          SORT.EXPIRATION_DATE_ASC,
          SORT.EXPIRATION_DATE_DESC,
          SORT.MANUALLY,
          SORT.NEWEST_FIRST,
          SORT.OLDEST_FIRST,
        ];

        ContentHome.searchOptions = {
          filter: { "$json.title": { "$regex": '/*' } },
          skip: SORT_FILTER._skip,
          limit: SORT_FILTER._limit + 1 // the plus one is to check if there are any more
        };

        ContentHome.searchOptionsForItems = {
          filter: { "$json.title": { "$regex": '/*' } },
          skip: SORT._skip,
          limit: SORT._limit + 1, // the plus one is to check if there are any more
          sort: { "rank": 1 }
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
                  draggedItem.data.rank = Number((prev.data.rank || 0) + (next.data.rank || 0)) / 2;
                  isRankChanged = true;
                } else {
                  draggedItem.data.rank = Number(next.data.rank || 0) / 2;
                  isRankChanged = true;
                }
              } else {
                if (prev) {
                  draggedItem.data.rank = Number(((prev.data.rank || 0) * 2) + 10) / 2;
                  maxRank = Number(draggedItem.data.rank);
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

        //Polyfill for isInterger support for IE
        Number.isInteger = Number.isInteger || function (value) {
          return typeof value === "number" &&
            isFinite(value) &&
            Math.floor(value) === value;
        };


        ContentHome.addEditFilter = function (filter, editFlag, index) {
          var tempTitle = '';
          if (Number.isInteger(index))
            var filterIndex = index;
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
                var filterResponse = response;
                var notFound = true;
                // if (ContentHome.filters && ContentHome.filters.length) {
                  // for (var index = 0; index < ContentHome.filters.length; index++) {
                    // if (ContentHome.filters[index].data.title == response.title) {
                    //   notFound = false;
                    //   confirmFilterAdd(filterResponse);
                    //   break;
                    // }
                    // if (ContentHome.filters.length - 1 == index) {
                    //   if (notFound)
                        // insertFilter(filterResponse);
                    //   break;
                    // }
                  // }
                // } else {
                  insertFilter(filterResponse);
                // }
              }
            }
            if (!$scope.$apply)
              $scope.$digest();
          }, function (err) {

          });
        };

        function confirmFilterAdd(filterResponse) {
          Modals.removePopupFilterModal({}).then(function (response) {
            if (response) {
              insertFilter(filterResponse);
            }
          });
        }

        function insertFilter(response, cb = null) {
          ContentHome.filter = {
            data: {
              title: response.title,
              rank: RankOfLastFilter.getRank() + 10,
              noOfItems: response.number ? response.number : 0
            }
          };
          ContentHome.data.content.rankOfLastFilter = RankOfLastFilter.getRank() + 10;
          RankOfLastFilter.setRank(ContentHome.data.content.rankOfLastFilter);
          ContentHome.filters.unshift(ContentHome.filter);
          Buildfire.datastore.insert(ContentHome.filter.data, TAG_NAMES.COUPON_CATEGORIES, false, function (err, data) {
            ContentHome.isUpdating = false;
            ContentHome.filter.id = data.id;
            ContentHome.filter.data.title = data.data.title;
            if (err) {
              ContentHome.isNewItemInserted = false;
              if(cb) cb(err, null)
              return console.error('There was a problem saving your data');
            }
            if(cb) cb(null, data);
            $scope.$digest();
          });
        }

        ContentHome.deleteFilter = function (index) {
          buildfire.dialog.confirm(
            {
              title: "Delete Category",
              message: 'Are you sure you want to delete this category?',
              confirmButton: {
                type: "danger",
                text: "Delete"
              }
            },
            (err, isConfirmed) => {
              if (isConfirmed) {
                Buildfire.datastore.delete(ContentHome.filters[index].id, TAG_NAMES.COUPON_CATEGORIES, function (err, result) {
                  if (err) return;
                  //ContentHome.items.splice(_index, 1);
                  ContentHome.filters.splice(index, 1);
                  var tmpArray = [];
                  ContentHome.filters.forEach(function (res, index) {
                    tmpArray.push(res.id);
                  });
                  ContentHome.items.forEach(function (resItem, index) {
                    // tmpArray.push(res.data.SelectedCategories);
                    var intersectedCategories = tmpArray.filter(function (value) {
                      if (resItem.SelectedCategories) {
                        return resItem.SelectedCategories.indexOf(value) > -1;
                      }
                    });
                    ContentHome.items[index].SelectedCommonCategories = intersectedCategories;
                  });
                  $scope.$digest();
                });
              }
            }
          );
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

        /* for future use if it comes to supporting older data */
        // ContentHome.createDeepLinksForItems = function () {
        //   let pageSize = 50, page = 0, allItems = [];
        //   function get() {
        //     Buildfire.datastore.search({
        //       filter: { '$json.deepLinkId': { $exists: false } },
        //       pageSize, page, recordCount: true
        //     }, TAG_NAMES.COUPON_ITEMS, function (err, data) {
        //       if (err) return console.error(err);
        //       allItems = allItems.concat(data.result);
        //       if (data.totalRecord > allItems.length) {
        //         page++;
        //         get();
        //       } else {
        //         allItems.map(item => {
        //           new Deeplink({
        //             deeplinkId: item.id,
        //             name: item.data.title,
        //             deeplinkData: {
        //               id: item.id,
        //             }
        //           }).save((err, deepLinkData) => {
        //             item.data.deepLinkId = deepLinkData.deeplinkId;
        //             Buildfire.datastore.update(item.id, item.data, TAG_NAMES.COUPON_ITEMS)
        //           });
        //         })
        //       }
        //     });
        //   }
        //   get();
        // }
        // ContentHome.createDeepLinksForItems();

        ContentHome.deleteItem = function (index) {
          buildfire.dialog.confirm(
            {
              title: "Delete Coupon",
              message: 'Are you sure you want to delete this item? This action is not reversible.',
              confirmButton: {
                type: "danger",
                text: "Delete"
              }
            },
            (err, isConfirmed) => {
              if (isConfirmed) {
                if (ContentHome.items[index].data && ContentHome.items[index].data.SelectedCategories && ContentHome.items[index].data.SelectedCategories.length) {
                  ContentHome.items[index].data.SelectedCategories.forEach(function (category) {
                    for (var index = 0; index < ContentHome.filters.length; index++) {
                      if (ContentHome.filters[index].id == category) {
                        ContentHome.filter = ContentHome.filters[index].data;
                        ContentHome.filter.noOfItems -= 1;
                        ContentHome.isItemValid = true;
                      }
                    }
                  });
                }

                Deeplink.deleteById(ContentHome.items[index].id);
                Buildfire.datastore.delete(ContentHome.items[index].id, TAG_NAMES.COUPON_ITEMS, function (err, result) {
                  if (err)
                    return;

                  PluginEvents.unregister(ContentHome.items[index].id);
                  //ContentHome.items.splice(_index, 1);
                  ContentHome.items.splice(index, 1);
                  $scope.$digest();
                });
              }
            }
          );
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

        ContentHome.clearFilters = (type) => {
          if (type === 'status') {
            // ContentHome.data.content.selectedStatus = null;
            ContentHome.chooseStatus('All Statuses')
          } else if (type === 'filter') {
            // ContentHome.data.content.selectedFilter = null;
            ContentHome.chooseFilter('All Categories');
          } else {
            ContentHome.data.content.selectedStatus = 'All Statuses';
            ContentHome.data.content.selectedFilter = {title: undefined, id: "All Categories"};

            ContentHome.searchOptionsForItems.filter = { "$json.title": { "$regex": '/*' } };
            ContentHome.items = [];
            ContentHome.searchOptionsForItems.skip = 0;

            ContentHome.loadMoreItems('items');
          }
        }

        ContentHome.chooseFilter = function (value, title) {
          ContentHome.data.content.selectedFilter = { "title": title, "id": value };

          // ContentHome.data.content.selectedStatus = "All Statuses";
          ContentHome.searchValue = "";
          ContentHome.items = [];
          ContentHome.searchOptionsForItems.skip = 0;
          if (ContentHome.data.content.selectedFilter && ContentHome.data.content.selectedFilter.id !== 'All Categories') {
            ContentHome.searchOptionsForItems.filter = {
              "$and": [{
                "$json.SelectedCategories": { $eq: ContentHome.data.content.selectedFilter.id }
              }, { "$json.title": { "$regex": '/*' } }]
            };
          } else {
            ContentHome.searchOptionsForItems.filter = { "$json.title": { "$regex": '/*' } };
          };
          ContentHome.loadMoreItems('items');//, {"$json.title": {"$regex": '/*'}}
        };

        ContentHome.chooseStatus = function (status) {
          ContentHome.searchValue = "";
          ContentHome.data.content.selectedStatus = status;
          // ContentHome.couponActiveDate = ContentHome.currentDate;
          if (ContentHome.data.content.selectedFilter && ContentHome.data.content.selectedFilter.id !== 'All Categories') {
            if (ContentHome.data.content.selectedStatus == 'Active') {
              ContentHome.searchOptionsForItems.filter =
              {
                "$and": [{
                  "$and": [{
                    "$json.SelectedCategories": { $eq: ContentHome.data.content.selectedFilter.id }
                  }, { "$json.title": { "$regex": '/*' } }]
                }, { "$or": [{ "$json.expiresOn": { "$gte": ContentHome.tommorowDate } }, { "$json.expiresOn": { "$eq": "" } }, { "$json.expiresOn": { "$eq": 0 } }] }]
              }
            } else if (ContentHome.data.content.selectedStatus == 'Expired') {
              ContentHome.searchOptionsForItems.filter =
              {
                "$and": [{
                  "$and": [{
                    "$json.SelectedCategories": { $eq: ContentHome.data.content.selectedFilter.id }
                  }, { "$json.title": { "$regex": '/*' } }]
                }, { "$and": [{ "$json.expiresOn": { "$lte": ContentHome.tommorowDate } }, { "$json.expiresOn": { "$ne": "" } }, { "$json.expiresOn": { "$eq": 0 } }] }]
              }
            } else if (ContentHome.data.content.selectedStatus == 'All Statuses') {
              ContentHome.searchOptionsForItems.filter =
              {
                "$and": [{
                  "$json.SelectedCategories": { $eq: ContentHome.data.content.selectedFilter.id }
                }, { "$json.title": { "$regex": '/*' } }]
              }
            }
          } else {
            if (ContentHome.data.content.selectedStatus == 'Active') {
              ContentHome.searchOptionsForItems.filter =
              {
                "$and": [{
                  "$and": [{ "$json.title": { "$regex": '/*' } }]
                }, { "$or": [{ "$json.expiresOn": { "$gte": ContentHome.tommorowDate } }, { "$json.expiresOn": { "$eq": "" } }, { "$json.expiresOn": { "$eq": 0 } }] }]
              }
            } else if (ContentHome.data.content.selectedStatus == 'Expired') {
              ContentHome.searchOptionsForItems.filter =
              {
                "$and": [
                  { "$json.title": { "$regex": '/*' } },
                  { "$json.expiresOn": { "$lte": ContentHome.tommorowDate } },
                  { "$json.expiresOn": { "$ne": 0 } },
                  { "$json.expiresOn": { "$ne": "" } },
                ]
              }
            }
            else if (ContentHome.data.content.selectedStatus == 'All Statuses') {
              ContentHome.searchOptionsForItems.filter = { "$json.title": { "$regex": '/*' } };
            }
          }


          ContentHome.items = [];
          ContentHome.searchOptionsForItems.skip = 0;

          ContentHome.loadMoreItems('items');//, {"$json.title": {"$regex": '/*'}}
        };

        ContentHome.searchItem = function () {
          ContentHome.couponActiveDate = ContentHome.currentDate;
          if (ContentHome.data.content.selectedFilter && ContentHome.data.content.selectedFilter.id != 'All Categories' && ContentHome.data.content.selectedStatus && ContentHome.data.content.selectedStatus !== 'All Statuses') {

            if (ContentHome.data.content.selectedStatus == 'Active') {
              ContentHome.searchOptionsForItems.filter =
              {
                "$and": [{
                  "$and": [{
                    "$json.SelectedCategories": { $eq: ContentHome.data.content.selectedFilter.id }
                  }, { "$or": [{ "$json.title": { "$regex": ContentHome.searchValue, "$options": "i" } }, { "$json.summary": { "$regex": ContentHome.searchValue, "$options": "i" } }] }]
                }, { "$or": [{ "$json.expiresOn": { "$gte": ContentHome.tommorowDate } }, { "$json.expiresOn": { "$eq": "" } }, { "$json.expiresOn": { "$eq": 0 } }] }]
              }
            } else if (ContentHome.data.content.selectedStatus == 'Expired') {

              ContentHome.searchOptionsForItems.filter =
              {
                "$and": [{
                  "$and": [{
                    "$json.SelectedCategories": { $eq: ContentHome.data.content.selectedFilter.id }
                  }, { "$or": [{ "$json.title": { "$regex": ContentHome.searchValue, "$options": "i" } }, { "$json.summary": { "$regex": ContentHome.searchValue, "$options": "i" } }] }]
                }, { "$and": [{ "$json.expiresOn": { "$lte": ContentHome.tommorowDate } }, { "$json.expiresOn": { "$ne": 0 } }, { "$json.expiresOn": { "$ne": "" } }] }]
              }
            }
          } else if (ContentHome.data.content.selectedStatus && ContentHome.data.content.selectedStatus !== "All Statuses") {
            if (ContentHome.data.content.selectedStatus == 'Active') {
              ContentHome.searchOptionsForItems.filter =
              {
                "$and": [{
                  "$and": [{ "$or": [{ "$json.title": { "$regex": ContentHome.searchValue, "$options": "i" } }, { "$json.summary": { "$regex": ContentHome.searchValue, "$options": "i" } }] }]
                }, { "$or": [{ "$json.expiresOn": { "$gte": ContentHome.tommorowDate } }, { "$json.expiresOn": { "$eq": "" } }, { "$json.expiresOn": { "$eq": 0 } }] }]
              }
            } else if (ContentHome.data.content.selectedStatus == 'Expired') {
              ContentHome.searchOptionsForItems.filter =
              {
                "$and": [{
                  "$and": [{ "$or": [{ "$json.title": { "$regex": ContentHome.searchValue, "$options": "i" } }, { "$json.summary": { "$regex": ContentHome.searchValue, "$options": "i" } }] }]
                }, { "$and": [{ "$json.expiresOn": { "$lte": ContentHome.tommorowDate } }, { "$json.expiresOn": { "$ne": 0 } }, { "$json.expiresOn": { "$ne": "" } }] }]
              }
            }
          } else if (ContentHome.data.content.selectedFilter && ContentHome.data.content.selectedFilter.id !== 'All Categories') {
            ContentHome.searchOptionsForItems.filter = {
              "$and": [{
                "$json.SelectedCategories": { $eq: ContentHome.data.content.selectedFilter.id }
              }, { "$or": [{ "$json.title": { "$regex": ContentHome.searchValue, "$options": "i" } }, { "$json.summary": { "$regex": ContentHome.searchValue, "$options": "i" } }] }]
            }
          } else {

            ContentHome.searchOptionsForItems.filter = {
              "$or": [{
                "$json.title": {
                  "$regex": ContentHome.searchValue,
                  "$options": "i"
                }
              }, {
                "$json.summary": {
                  "$regex": ContentHome.searchValue,
                  "$options": "i"
                }
              }]
            }
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
              ContentHome.searchOptions.sort = { "title": 1 };
              break;
            case SORT_FILTER.CATEGORY_NAME_Z_A:
              ContentHome.searchOptions.sort = { "title": -1 };
              break;
            default:
              ContentHome.filterSortableOptions.disabled = false;
              ContentHome.searchOptions.sort = { "rank": 1 };
              break;
          }
          return ContentHome.searchOptions;
        };

        var getItemSearchOptions = function (value) {
          ContentHome.itemSortableOptions.disabled = true;
          switch (value) {
            case SORT.ITEM_TITLE_A_Z:
              ContentHome.searchOptionsForItems.sort = { "title": 1 };
              break;
            case SORT.ITEM_TITLE_Z_A:
              ContentHome.searchOptionsForItems.sort = { "title": -1 };
              break;
            case SORT.NEWEST_FIRST:
              ContentHome.searchOptionsForItems.sort = { "dateCreated": -1 };
              break;
            case SORT.OLDEST_FIRST:
              ContentHome.searchOptionsForItems.sort = { "dateCreated": 1 };
              break;
            case SORT.EXPIRATION_DATE_ASC:
              ContentHome.searchOptionsForItems.sort = { "expiresOn": 1 };
              break;
            case SORT.EXPIRATION_DATE_DESC:
              ContentHome.searchOptionsForItems.sort = { "expiresOn": -1 };
              break;
            default:
              ContentHome.itemSortableOptions.disabled = false;
              ContentHome.searchOptionsForItems.sort = { "rank": 1 };
              break;
          }
          return ContentHome.searchOptionsForItems;
        };

        ContentHome.loadMore = function (str) {

          Buildfire.spinner.show();
          if (ContentHome.busyFilter) {
            return;
          }

          ContentHome.busyFilter = true;
          if (ContentHome.data && ContentHome.data.content.sortFilterBy) {
            ContentHome.searchOptions = getSearchOptions(ContentHome.data.content.sortFilterBy);
          } else {
            return;
          }
          if (str !== 'items')
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
              var tmpArray = [];
              var lastIndex = result.length;
              result.forEach(function (res, index) {
                tmpArray.push({
                  'title': res.data.title,
                  rank: index + 1,
                  id: res.data.id
                });
              });

              ContentHome.filters = ContentHome.filters ? ContentHome.filters.concat(result) : result;
              ContentHome.busyFilter = false;
              Buildfire.spinner.hide();
              $scope.$digest();
            });
        };


        var searchOptionsFilterForItemList = {
          "filter": { "$json.title": { "$regex": '/*' } },
          "sort": { "title": 1 },
          "skip": "0",
          "limit": "50"
        };

        ContentHome.reloadCoupons = function () {
          ContentHome.isBusy = true;
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
            ContentHome.items = result;
            ContentHome.isBusy = false;
            $rootScope.reloadCoupons = false;
            $scope.$digest();
            if (!ContentHome.items.length) {
              $rootScope.showEmptyState = true;
            } else {
              $rootScope.showEmptyState = false;
            }
          })
        }

        ContentHome.loadMoreItems = function (str) {
          Buildfire.spinner.show();
          if (ContentHome.busy) {
            return;
          }
          if (ContentHome.data && ContentHome.data.content.sortItemBy) {
            ContentHome.searchOptionsForItems = getItemSearchOptions(ContentHome.data.content.sortItemBy);
          } else {
            return;
          }
          ContentHome.busy = true;
          ContentHome.isBusy = true;

          if (str !== 'filter')
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
              var tmpArray = [];
              var lastIndex = result.length;
              result.forEach(function (res, index) {

                tmpArray.push({
                  'title': res.data.title,
                  rank: index + 1,
                  summary: res.data.summary,
                  categories: res.data.Categories ? res.data.Categories.length : 0,
                  expiresOn: res.data.expiresOn,
                  listImage: res.data.listImage,
                  id: res.id
                });
              });

              ContentHome.items = ContentHome.items ? ContentHome.items.concat(result) : result;
              Buildfire.datastore.search(searchOptionsFilterForItemList, TAG_NAMES.COUPON_CATEGORIES, function (err, resultFilter) {
              if (!ContentHome.items.length) {
                $rootScope.showEmptyState = true;
              } else {
                $rootScope.showEmptyState = false;
              }
                if (err) {
                  Buildfire.spinner.hide();
                  return console.error('-----------err in getting list-------------', err);
                }
                var tmpArray = [];
                var lastIndex = result.length;
                resultFilter.forEach(function (res, index) {
                  tmpArray.push(res.id);
                });
                ContentHome.items.forEach(function (resItem, index) {
                  // tmpArray.push(res.data.SelectedCategories);
                  var intersectedCategories = tmpArray.filter(function (value) {
                    if (resItem.data.SelectedCategories && resItem.data.SelectedCategories.length)
                      return resItem.data.SelectedCategories.indexOf(value) > -1;
                  });
                  ContentHome.items[index].SelectedCommonCategories = intersectedCategories;
                });
                $scope.$digest();
              });
              ContentHome.busy = false;
              ContentHome.isBusy = false;
              Buildfire.spinner.hide();
              $scope.$digest();
            });
        };


        function validateCsv(items) {
          if (!Array.isArray(items) || !items.length) {
            return false;
          }
          return items.every(isValidItem);
        }

        function asyncProcess(index, cb) {
          cb(index);
        }

        var codeAddress = (function() {
          var index = 0;
          var delay = 500;
          var geocoder = new google.maps.Geocoder();

          return function (address, callback) {
            if (geocoder) setTimeout(geocoder.geocode.bind(geocoder, { 'address': "'" + address + "'" },
              function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                  var obj = {
                    lat: results[0].geometry.location.lat(),
                    lng: results[0].geometry.location.lng()
                  }
                  callback(obj);
                }
                else if(status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                  codeAddress(address, callback);
                }
                else {
                  console.error("Geocode was not successful for the following reason: " + status);
                  callback(null);
                }
              }), index * delay);
            index++;
          };
      })();

        ContentHome.openImport = function () {
          function getUnixFromDate(date) {
            var isUnix = !date.includes('/');
            if (isUnix) {
              return date;
            } else {
              date = date.split('/');
              var formattedDate = date[0] + '.' + date[1] + '.' + date[2];
              return new Date(formattedDate).getTime();
            }
          }
          $csv.import(headerRow).then(function (rows) {
            rows = rows.filter(function (row) { return row.title; });

            if (rows && rows.length > 1) {
              var categoriesList = [], columns = rows.shift();

              if(JSON.stringify(Object.values(headerRow)) !== JSON.stringify(Object.keys(columns))) {
                ContentHome.loading = false;
                ContentHome.csvDataInvalid = true;
                return;
              }

              rows.map(el => categoriesList = categoriesList.concat(el.Categories.split(",")));
              categoriesList = [... new Set(categoriesList)];

              var sortedCategories = [];
              categoriesList.map(category => {
                var exists = rows.filter(row =>
                  row.SelectedCategories.toLowerCase().includes(category.toLowerCase()));

                exists ? sortedCategories.push({ title: category, number: exists.length})
                : null;
              });

              buildfire.messaging.sendMessageToWidget({ type: "ImportCSV", importing: true });
              buildfire.messaging.sendMessageToWidget({ importCSV: 'started' });
              ContentHome.importingCSV = true;

              const insertCategories = (callback) => {
                buildfire.datastore.search({ recordCount: true }, TAG_NAMES.COUPON_CATEGORIES, (err, categories) => {
                  if (err) return console.error(err);

                  let updatedAll = sortedCategories.length;
                  if (categories && categories.result) {
                    sortedCategories.map(cat => {
                      let categoryExists = categories.result.find(el =>
                        cat.title.toLowerCase() === el.data.title.toLowerCase());

                      if (categoryExists) {
                        cat.id = categoryExists.id;
                        categoryExists.data.noOfItems += cat.number;
                        buildfire.datastore.update(categoryExists.id, categoryExists.data, TAG_NAMES.COUPON_CATEGORIES, () => {
                          let toUpdate = ContentHome.filters.find(el => el.id === categoryExists.id);
                          if(toUpdate) {
                            let toUpdateIndex = ContentHome.filters.indexOf(toUpdate);
                            ContentHome.filters[toUpdateIndex].data.noOfItems = categoryExists.data.noOfItems;
                          }

                          updatedAll--;
                          if (updatedAll === 0) callback();
                        });
                      }
                      else {
                        insertFilter(cat, () => { updatedAll--; if (updatedAll === 0) callback(); });
                      }
                    });
                  } else {
                    sortedCategories.map(cat => {
                      insertFilter(cat, () => { updatedAll--; if (updatedAll === 0) callback(); });
                    });
                  }
                });
              }

              var savedCount = rows.length;
              ContentHome.csvItems = savedCount;

              const saveRow = (row) => {
                buildfire.datastore.insert(row, TAG_NAMES.COUPON_ITEMS, (err, result) => {
                  if (err) console.error("Failed saving row data", row);
                  if (result && result.id) {
                    PluginEvents.register({ key: result.id, title: result.data.title }, true);
                    if (!row.deepLinkId) {
                      new Deeplink({
                        deeplinkId: result.id,
                        name: result.data.title,
                        imageUrl: result.data.listImage ? result.data.listImage : null,
                        deeplinkData: { id: result.id }
                      }).save((err, deepLinkData) => {
                        result.data.deepLinkId = deepLinkData.deeplinkId;
                        buildfire.datastore.update(result.id, result.data, TAG_NAMES.COUPON_ITEMS, () => {
                          savedCount--;
                          ContentHome.csvImportedItems++;
                          $scope.$digest();
                          if(savedCount == 0) {
                            buildfire.messaging.sendMessageToWidget({ type: "ImportCSV", importing: false });
                            ContentHome.importingCSV = false;
                            window.location.reload();
                          }
                        });
                      });
                    }
                  }
                });
              }

              const proccessRows = (data) => {
                data.map(row => {
                  rank += 10;
                  row.dateCreated = +new Date();
                  row.links = [];
                  row.rank = rank;
                  row.body = "";
                  let temp = [];
                  row.SelectedCategories.length ? sortedCategories.map(cat =>
                    row.SelectedCategories.split(",").map(el => {
                      if (cat.title.toLowerCase() === el.toLowerCase())
                        temp.push(cat.id);
                    })) : null;
                  row.SelectedCategories = temp;
                  if (row.startOn) row.startOn = getUnixFromDate(row.startOn);
                  if (row.expiresOn) row.expiresOn = getUnixFromDate(row.expiresOn);
                  if (row.carouselImages) {
                    row.carouselImages = row.carouselImages.split(',').map(url => {
                      return {
                        action: "noAction",
                        iconUrl: url,
                        title: "image"
                      }
                    });
                  }

                  if (row.location) {
                    codeAddress(row.location, (googleLocation) => {
                      if(googleLocation) {
                        row.location = {
                          coordinates: { ...googleLocation },
                          addressTitle: row.location
                        };
                      } else row.location = "";
                      saveRow(row);
                    });
                  }
                  else {
                    row.location = "";
                    saveRow(row);
                  }
                });
              }


              var rank = ContentHome.data.content.rankOfLastItem || 0;
              RankOfLastItem.setRank(rank);

              insertCategories(() => {
                let pageSize = 10;
                let pages = Math.ceil(rows.length / pageSize), currentPage = 1;

                const paginate = () => {
                  let array = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
                  proccessRows(array);
                  if(currentPage != pages) currentPage++;
                  else clearInterval(interval);
                }

                let interval = setInterval(paginate, 1000);
              });
            }
          });
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


        function returnCommaSepratedListOfEntity(entities, param) {
          if (entities.length && Array.isArray(entities)) {
            var tmpURLstr = "";
            entities.forEach(function (entity) {
              if (tmpURLstr)
                tmpURLstr = tmpURLstr + ',' + entity[param];
              else
                tmpURLstr = entity[param];
            });
            return tmpURLstr;
          } else {
            return entities;
          }
        }

        function returnCommaSepratedListOfCategories(Categories, selectedCategories) {
          if (typeof Categories === 'string' || Categories instanceof String) return Categories;
          else if (selectedCategories.length && Array.isArray(selectedCategories)) {
            var tmpList = "";
            selectedCategories.forEach(function (selCategory) {
              Categories.forEach(function (category) {
                if (selCategory == category.id) {
                  if (!tmpList)
                    tmpList = category.title;
                  else
                    tmpList = tmpList + "," + category.title;
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
          search.limit = SORT._maxLimit + 1;
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
                  if (typeof value.data.carouselImages === 'string' || value.data.carouselImages instanceof String) {
                    if (value.data.carouselImages.length == 0) {
                      value.data.carouselImages = [];
                    } else {
                      var oldUrl = value.data.carouselImages;
                      value.data.carouselImages = [{ action: "noAction", iconUrl: oldUrl, title: "image" }];
                    }
                  } else if (typeof value.data.carouselImages == "undefined")
                    value.data.carouselImages = [];

                  value.data.carouselImages = returnCommaSepratedListOfEntity(value.data.carouselImages, 'iconUrl')
                  if (value.data.SelectedCategories)
                    value.data.SelectedCategories = returnCommaSepratedListOfCategories(value.data.Categories, value.data.SelectedCategories);
                  value.data.Categories = returnCommaSepratedListOfEntity(value.data.Categories, 'title');
                  value.data.location = value.data.location.addressTitle;

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
            title: '',
            summary: "",
            Categories: "",
            listImage: '',
            carouselImages: '',
            preRedemptionText: '',
            postRedemptionText: '',
            startOn: '',
            expiresOn: '',
            addressTitle: '',
            location: '',
            webURL: '',
            sendToEmail: '',
            smsTextNumber: '',
            phoneNumber: '',
            facebookURL: '',
            twitterURL: '',
            instagramURL: '',
            googlePlusURL: '',
            linkedinURL: ''
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
          if (item) {
            return item.title;
          }
          else {
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
            if (!Object.keys(ContentHome.data).length) {
              ContentHome.data = angular.copy(_data);
            } else {
              if (!ContentHome.data.content)
                ContentHome.data.content = {};
              if (!ContentHome.data.settings)
                ContentHome.data.settings = defaultInfo.settings;
              if (!ContentHome.data.content.carouselImages)
                editor.loadItems([]);
              else
                editor.loadItems(ContentHome.data.content.carouselImages);
              if (!ContentHome.data.content.sortFilterBy)
                ContentHome.data.content.sortFilterBy = ContentHome.sortFilterOptions[0];
              if (!ContentHome.data.content.sortItemBy)
                ContentHome.data.content.sortItemBy = ContentHome.sortItemOptions[4];
              ContentHome.filters = [];
              ContentHome.searchOptions.skip = 0;
              ContentHome.busyFilter = false;
              ContentHome.busy = false;
              ContentHome.data.content.selectedFilter = null;
              ContentHome.data.content.selectedStatus = null;
              RankOfLastFilter.setRank(ContentHome.data.content.rankOfLastFilter || 0);
              RankOfLastItem.setRank(ContentHome.data.content.rankOfLastItem || 0);
            }
            updateMasterItem(ContentHome.data);
            if (tmrDelay) clearTimeout(tmrDelay);
            ContentHome.loadMore('js');
            ContentHome.loadMoreItems('js');
          }
            , error = function (err) {
              if (err && err.code !== STATUS_CODE.NOT_FOUND) {
                console.error('Error while getting data', err);
                if (tmrDelay) clearTimeout(tmrDelay);
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

        $rootScope.$watch('reloadCoupons', function(newValue, oldValue) {
          if (newValue) {
            ContentHome.reloadCoupons();
          }
        })
      }]);

})(window.angular, window.buildfire);
