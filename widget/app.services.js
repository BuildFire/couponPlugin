'use strict';

(function (angular, buildfire) {
  angular.module('couponPluginWidget')
    .provider('Buildfire', [function () {
      var Buildfire = this;
      Buildfire.$get = function () {
        return buildfire
      };
      return Buildfire;
    }])

    .factory("DataStore", ['Buildfire', '$q', 'STATUS_CODE', 'STATUS_MESSAGES', function (Buildfire, $q, STATUS_CODE, STATUS_MESSAGES) {
      var onUpdateListeners = {};
      return {
        get: function (_tagName) {
          var deferred = $q.defer();
          Buildfire.datastore.get(_tagName, function (err, result) {
            if (err) {
              return deferred.reject(err);
            } else if (result) {
              return deferred.resolve(result);
            }
          });
          return deferred.promise;
        }, getById: function (_id, _tagName) {
          var deferred = $q.defer();
          if (typeof _id == 'undefined') {
            return deferred.reject(new Error({
              code: STATUS_CODE.UNDEFINED_ID,
              message: STATUS_MESSAGES.UNDEFINED_ID
            }));
          }
          Buildfire.datastore.getById(_id, _tagName, function (err, result) {
            if (err) {
              return deferred.reject(err);
            } else if (result) {
              return deferred.resolve(result);
            }
          });
          return deferred.promise;
        }, save: function (_item, _tagName) {
          var deferred = $q.defer();
          if (typeof _item == 'undefined') {
            return deferred.reject(new Error({
              code: STATUS_CODE.UNDEFINED_DATA,
              message: STATUS_MESSAGES.UNDEFINED_DATA
            }));
          }
          Buildfire.datastore.save(_item, _tagName, function (err, result) {
            if (err) {
              return deferred.reject(err);
            } else if (result) {
              return deferred.resolve(result);
            }
          });
          return deferred.promise;
        }, search: function (options, _tagName) {
          var deferred = $q.defer();
          if (typeof options == 'undefined') {
            return deferred.reject(new Error({
              code: STATUS_CODE.UNDEFINED_OPTIONS,
              message: STATUS_MESSAGES.UNDEFINED_OPTIONS
            }));
          }
          Buildfire.datastore.search(options, _tagName, function (err, result) {
            if (err) {
              return deferred.reject(err);
            } else if (result) {
              return deferred.resolve(result);
            }
          });
          return deferred.promise;
        }, onUpdate: function (viewName) {
          var deferred = $q.defer();
          var onUpdateFn = Buildfire.datastore.onUpdate(function (event) {
            if (!event) {
              return deferred.notify(new Error({
                code: STATUS_CODE.UNDEFINED_EVENT,
                message: STATUS_MESSAGES.UNDEFINED_EVENT
              }), true);
            } else {
              return deferred.notify(event);
            }
          }, true);
          onUpdateListeners[viewName] = onUpdateFn;
          return deferred.promise;
        }, clearListener: function (viewName, clearAll) {
          if (clearAll) {
            for (var i in onUpdateListeners) {
              if (onUpdateListeners.hasOwnProperty(i)) {
                onUpdateListeners[i].clear();
              }
            }
            onUpdateListeners = {};
          }
          if (viewName) {
            var listener = onUpdateListeners[viewName];
            if (listener) {
              listener.clear();
            }
            delete onUpdateListeners[viewName];
          }
        }
      }
    }])
    .factory("UserData", ['Buildfire', '$q', 'STATUS_CODE', 'STATUS_MESSAGES', function (Buildfire, $q, STATUS_CODE, STATUS_MESSAGES) {
      return {
        insert: function (_item, _tagName, _userToken) {
          var deferred = $q.defer();
          if (typeof _item == 'undefined') {
            return deferred.reject(new Error({
              code: STATUS_CODE.UNDEFINED_DATA,
              message: STATUS_MESSAGES.UNDEFINED_DATA
            }));
          }
          if (Array.isArray(_item)) {
            return deferred.reject(new Error({
              code: STATUS_CODE.ITEM_ARRAY_FOUND,
              message: STATUS_MESSAGES.ITEM_ARRAY_FOUND
            }));
          } else {
            Buildfire.userData.insert(_item, _tagName, _userToken, false, function (err, result) {
              if (err) {
                return deferred.reject(err);
              } else if (result) {
                return deferred.resolve(result);
              }
            });
          }
          return deferred.promise;
        },
        search: function (options, _tagName) {

          var deferred = $q.defer();
          if (typeof options == 'undefined') {
            return deferred.reject(new Error({
              code: STATUS_CODE.UNDEFINED_OPTIONS,
              message: STATUS_MESSAGES.UNDEFINED_OPTIONS
            }));
          }

          Buildfire.userData.search(options, _tagName, function (err, result) {

            if (err) {
              return deferred.reject(err);
            } else if (result) {
              return deferred.resolve(result);
            }
          });
          return deferred.promise;
        },
        delete: function (id, _tagName, _userToken) {

          var deferred = $q.defer();
          if (typeof id == 'undefined') {
            return deferred.reject(new Error({
              code: STATUS_CODE.UNDEFINED_OPTIONS,
              message: STATUS_MESSAGES.UNDEFINED_OPTIONS
            }));
          }

          Buildfire.userData.delete(id, _tagName, _userToken, function (err, result) {

            if (err) {
              return deferred.reject(err);
            } else if (result) {
              return deferred.resolve(result);
            }
          });
          return deferred.promise;
        },

        update: function (id, _item, _tagName, _userToken) {

          var deferred = $q.defer();
          if (typeof _item == 'undefined' || typeof id == 'undefined') {
            return deferred.reject(new Error({
              code: STATUS_CODE.UNDEFINED_OPTIONS,
              message: STATUS_MESSAGES.UNDEFINED_OPTIONS
            }));
          }

          Buildfire.userData.update(id, _item, _tagName, _userToken, function (err, result) {

            if (err) {
              return deferred.reject(err);
            } else if (result) {
              return deferred.resolve(result);
            }
          });
          return deferred.promise;
        }
      }
    }])
    .factory('Location', [function () {
      var _location = window.location;
      return {
        goTo: function (path) {
          _location.href = path;
        },
        goToHome: function () {
          _location.href = _location.href.substr(0, _location.href.indexOf('#'));
        }
      };
    }])
    .factory('ViewStack', ['$rootScope', function ($rootScope) {
      var views = [];
      var viewMap = {};
      return {
        push: function (view) {
          console.log(">>>>>>>>>>>>", view, viewMap);
          if (viewMap[view.template]) {
            this.pop();
          }
          else {
            viewMap[view.template] = 1;
            views.push(view);
            $rootScope.$broadcast('VIEW_CHANGED', 'PUSH', view);
          }
          return view;
        },
        pop: function () {
          $rootScope.$broadcast('BEFORE_POP', views[views.length - 1]);
          var view = views.pop();
          delete viewMap[view.template];
          $rootScope.$broadcast('VIEW_CHANGED', 'POP', view);
          return view;
        },
        hasViews: function () {
          return !!views.length;
        },
        getCurrentView: function () {
          return views.length && views[views.length - 1] || {};
        },
        popAllViews: function (noAnimation) {
          $rootScope.$broadcast('VIEW_CHANGED', 'POPALL', views, noAnimation);
          views = [];
          viewMap = {};
        },
        getPreviousView: function () {
          return views.length && views[views.length - 2] || {};
        }
      };
    }])
    .factory('GeoDistance', ['$q', '$http', function ($q, $http) {
      var _getDistance = function (origin, items, distanceUnit) {
        var deferred = $q.defer();
        var originMap;
        if (origin && origin.length)
          originMap = {lat: origin[1], lng: origin[0]};
        else {
          originMap = {lat: 121.88, lng: 37.33};
        }
        var destinationsMap = [];

        if (!origin || !Array.isArray(origin)) {
          deferred.reject({
            code: 'NOT_ARRAY',
            message: 'origin is not an Array'
          });
        }
        if (!items || !Array.isArray(items) || !items.length) {
          deferred.reject({
            code: 'NOT_ARRAY',
            message: 'destinations is not an Array'
          });
        }

        items.forEach(function (_dest) {
          if (_dest && _dest.data && _dest.data.location && _dest.data.location.coordinates && _dest.data.location.coordinates.lat && _dest.data.location.coordinates.lng)
            destinationsMap.push({
              lat: _dest.data.location.coordinates.lat,
              lng: _dest.data.location.coordinates.lng
            });
          else
            destinationsMap.push({lat: 0, lng: 0});
        });

        var service = new google.maps.DistanceMatrixService;
        service.getDistanceMatrix({
          origins: [originMap],
          destinations: destinationsMap,
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: distanceUnit == 'km' ? google.maps.UnitSystem.METRIC : google.maps.UnitSystem.IMPERIAL,
          avoidHighways: false,
          avoidTolls: false
        }, function (response, status) {
          if (status !== google.maps.DistanceMatrixStatus.OK) {
            deferred.reject(status);
          } else {
            deferred.resolve(response);
          }
        });
        return deferred.promise;
      };
      return {
        getDistance: _getDistance
      }
    }]);
})(window.angular, window.buildfire);