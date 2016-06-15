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
                                Info:function(){return info;},
                            }
                        });
                    removePopupModal.result.then(function (imageInfo) {
                        removePopupDeferred.resolve(imageInfo);
                    }, function (err) {
                        //do something on cancel
                        removePopupDeferred.reject(err);
                    });
                    return removePopupDeferred.promise;
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
        }]);

})(window.angular, window.buildfire);
