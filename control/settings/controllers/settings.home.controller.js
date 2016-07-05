'use strict';

(function (angular) {
  angular
    .module('couponPluginSettings')
    .controller('SettingsHomeCtrl', ['$scope', '$timeout', 'DEFAULT_INFO', 'STATUS_CODE', 'DataStore', 'TAG_NAMES',
      function ($scope, $timeout, DEFAULT_INFO, STATUS_CODE, DataStore, TAG_NAMES) {
        var SettingsHome = this;
        var tmrDelay = null;
        SettingsHome.couponInfo = {};

        function updateMasterItem(data) {
          SettingsHome.masterInfo = angular.copy(data);
        }

        function isUnchanged(data) {
          return angular.equals(data, SettingsHome.masterInfo);
        }

        function saveSuccess(result) {
          updateMasterItem(result);
        }

        function SaveError(err) {
          console.error('Error while saving data : settings', err);
        }

        function success(result) {
          if (result.id) {
            SettingsHome.couponInfo = result;
            updateMasterItem(SettingsHome.couponInfo);
          }
          else {
            SettingsHome.couponInfo = angular.copy(DEFAULT_INFO.COUPON_INFO);
            updateMasterItem(SettingsHome.couponInfo);
          }
          if (tmrDelay)clearTimeout(tmrDelay);
        }

        function error(err) {
          if (err && err.code !== STATUS_CODE.NOT_FOUND) {
            console.error('Error while getting data---', err);
            if (tmrDelay)clearTimeout(tmrDelay);
          }
          else if (err && err.code === STATUS_CODE.NOT_FOUND) {
            saveData(JSON.parse(angular.toJson(SettingsHome.data)), TAG_NAMES.COUPON_INFO);
          }
        }

        /*
         * Call the datastore to save the data object
         */
        function saveData(newObj, tag) {
          if (typeof newObj === 'undefined') {
            return;
          }
          if (newObj.data && newObj.data.settings && newObj.data.settings.mapView == 'hide') {
            SettingsHome.couponInfo.data.settings.defaultView = 'list';
            SettingsHome.showMessage = true;
            setTimeout(function(){
              SettingsHome.showMessage = false;
            },2000);
          }
          if(newObj.data) {
            DataStore.save(newObj.data, tag).then(saveSuccess, SaveError);
          }
        }

        function saveDataWithDelay(newObj) {
          if (newObj) {
            if (isUnchanged(newObj)) {
              return;
            }
            if (tmrDelay) {
              $timeout.cancel(tmrDelay);
            }
            tmrDelay = $timeout(function () {
              saveData(JSON.parse(angular.toJson(newObj)), TAG_NAMES.COUPON_INFO);
            }, 500);
          }
        }

        function init() {
          DataStore.get(TAG_NAMES.COUPON_INFO).then(success, error);
        }

        init();
        /*
         * watch for changes in data and trigger the saveDataWithDelay function on change
         * */
        $scope.$watch(function () {
          return SettingsHome.couponInfo;
        }, saveDataWithDelay, true);
      }]);
})(window.angular);
