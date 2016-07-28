(function (angular, buildfire) {
    'use strict';
    if (!buildfire) {
        throw ("buildfire not found");
    }
    angular
        .module('couponPluginModal', ['ui.bootstrap'])
        .factory('Modals', ['$modal', '$q', function ($modal, $q) {
            return {
                addFilterModal: function (info) {
                    var addFilterDeferred = $q.defer();
                    var addFilterPopupModal = $modal
                        .open({
                            templateUrl: './templates/modals/add-edit-folder-modal.html',
                            controller: 'AddEditPopupCtrl',
                            controllerAs: 'AddEditPopup',
                            size: 'sm',
                            resolve:{
                                Info:function(){return info;},

                            }
                        });
                    addFilterPopupModal.result.then(function (folderInfo) {
                        addFilterDeferred.resolve(folderInfo);
                    }, function (err) {
                        //do something on cancel
                        addFilterDeferred.reject(err);
                    });
                    return addFilterDeferred.promise;
                },
                removePopupModal: function (info) {
                    var removePopupDeferred = $q.defer();
                    var removePopupModal = $modal
                        .open({
                            templateUrl: './templates/modals/remove-filter.html',
                            controller: 'RemovePopupCtrl',
                            controllerAs: 'RemovePopup',
                            size: 'sm',
                            resolve:{
                                Info:function(){return info;}
                            }
                        });
                    removePopupModal.result.then(function (imageInfo) {
                        removePopupDeferred.resolve(imageInfo);
                    }, function (err) {
                        //do something on cancel
                        removePopupDeferred.reject(err);
                    });
                    return removePopupDeferred.promise;
                },
                removePopupFilterModal: function (info) {
                    var removePopupDeferred = $q.defer();
                    var removePopupModal = $modal
                        .open({
                            templateUrl: './templates/modals/confirm-add-filter.html',
                            controller: 'RemovePopupCtrl',
                            controllerAs: 'RemovePopup',
                            size: 'sm',
                            resolve:{
                                Info:function(){return info;}
                            }
                        });
                    removePopupModal.result.then(function (imageInfo) {
                        removePopupDeferred.resolve(imageInfo);
                    }, function (err) {
                        //do something on cancel
                        removePopupDeferred.reject(err);
                    });
                    return removePopupDeferred.promise;
                },
                removeItemPopupModal: function (info) {
                var removePopupDeferred = $q.defer();
                var removeItemPopupModal = $modal
                  .open({
                    templateUrl: './templates/modals/remove-item.html',
                    controller: 'RemovePopupCtrl',
                    controllerAs: 'RemovePopup',
                    size: 'sm',
                    resolve:{
                      Info:function(){return info;}
                    }
                  });
                  removeItemPopupModal.result.then(function (imageInfo) {
                  removePopupDeferred.resolve(imageInfo);
                }, function (err) {
                  //do something on cancel
                  removePopupDeferred.reject(err);
                });
                return removePopupDeferred.promise;
              },
                showFilterPopupModal: function (info) {
                    var showFilterPopupDeferred = $q.defer();
                    var showFilterPopupModal = $modal
                      .open({
                          templateUrl: './templates/modals/filters.html',
                          controller: 'ShowFilterPopupCtrl',
                          controllerAs: 'ShowFilterPopup',
                          size: 'sm',
                          resolve:{
                              Info:function(){return info;},
                          }
                      });
                    showFilterPopupModal.result.then(function (data) {
                        showFilterPopupDeferred.resolve(data);
                    }, function (err) {
                        //do something on cancel
                        showFilterPopupDeferred.reject(err);
                    });
                    return showFilterPopupDeferred.promise;
                }
            };
        }])
        .controller('AddEditPopupCtrl', ['$scope', '$modalInstance','Info', function ($scope, $modalInstance,Info) {

            if(Info && Info.title)
                $scope.filterTitle = Info.title;
            else
                $scope.filterTitle = '';

            $scope.isEdit = Info.isEdit;

            $scope.ok = function () {
                $modalInstance.close({title : $scope.filterTitle});
            };
            $scope.cancel = function () {
                $modalInstance.dismiss('no');
            };

        }])
        .controller('RemovePopupCtrl', ['$scope', '$modalInstance','Info',  function ($scope, $modalInstance,Info) {
            var RemovePopup = this;
            if(Info && Info.item)
                $scope.item = Info.item;
            else
                $scope.item = '';

            RemovePopup.ok = function () {
                $modalInstance.close('yes');
            };
            RemovePopup.cancel = function () {
                $modalInstance.dismiss('no');
            };
        }]).controller('ShowFilterPopupCtrl', ['$scope','$rootScope', '$modalInstance','Info', 'Buildfire', 'TAG_NAMES', 'DataStore', function ($scope,$rootScope, $modalInstance, Info, Buildfire, TAG_NAMES, DataStore) {
          var ShowFilterPopup = this;
          ShowFilterPopup.data = {};
          if(Info && Info.item)
              $scope.item = Info.item;
          else
              $scope.item = '';


          console.log("KMTKMTKMT", Info);
          ShowFilterPopup.data = Info;
          var searchOptions={
              "filter":{"$json.title": {"$regex": '/*'}},
              "sort": {"title": 1},
              "skip":"0",
              "limit":"50"
          };

          Buildfire.datastore.search(searchOptions, TAG_NAMES.COUPON_CATEGORIES, function (err, result) {

              if (err) {
                  Buildfire.spinner.hide();
                  return console.error('-----------err in getting list-------------', err);
              }
              var tmpArray=[];
              var lastIndex=result.length;
              result.forEach(function(res,index){
                  tmpArray.push({'title' : res.data.title,
                      id:res.id,
                      noOfItems: res.data.noOfItems});
              });

              ShowFilterPopup.data.categories = tmpArray;
              $scope.$digest();
          });
          if(!ShowFilterPopup.data.selectedItems)
          ShowFilterPopup.selection = [];
          else
          ShowFilterPopup.selection = ShowFilterPopup.data.selectedItems;


          ShowFilterPopup.toggleCategoriesSelection = function toggleCategoriesSelection(category) {
              var idx = ShowFilterPopup.selection.indexOf(category.id);
              // is currently selected
              if (idx > -1) {
                  ShowFilterPopup.selection.splice(idx, 1);
                  if(category.noOfItems!=0)
                  category.noOfItems= category.noOfItems-1;
              }

              // is newly selected
              else {
                  ShowFilterPopup.selection.push(category.id);
                  category.noOfItems= category.noOfItems+1;
              }
              Buildfire.datastore.update(category.id, category, TAG_NAMES.COUPON_CATEGORIES, function (err) {
                  if (err)
                      return console.error('There was a problem saving your data');
              })
            }

           $scope.ok = function () {

               ShowFilterPopup.data.itemData.SelectedCategories = ShowFilterPopup.selection;
               if (ShowFilterPopup.data.itemId) {
                  DataStore.update(ShowFilterPopup.data.itemId, ShowFilterPopup.data.itemData, TAG_NAMES.COUPON_ITEMS).then(function (data) {
                      console.log('Item updated successfully-----', data, ShowFilterPopup.data.itemData);
                  }, function (err) {
                      console.error('Error: while updating item--:', err);
                  });
              }
               if(!$scope.$$phase)
               $scope.$digest();
              $modalInstance.close({status:'yes', selection:ShowFilterPopup.selection});

          };
          $scope.cancel = function () {
              $modalInstance.dismiss('no');
          };
      }]);

})(window.angular, window.buildfire);
