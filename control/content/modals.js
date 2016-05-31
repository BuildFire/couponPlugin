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

})(window.angular, window.buildfire);
