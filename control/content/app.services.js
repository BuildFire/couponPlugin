'use strict';

(function (angular, buildfire) {
    angular.module('couponPluginContent')
        .provider('Buildfire', [function () {
            var Buildfire = this;
            Buildfire.$get = function () {
                return buildfire
            };
            return Buildfire;
        }])
        .factory("DataStore", ['Buildfire', '$q', 'STATUS_CODE', 'STATUS_MESSAGES', function (Buildfire, $q, STATUS_CODE, STATUS_MESSAGES) {
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
                },
                getById: function (_id, _tagName) {
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
                },
                insert: function (_item, _tagName) {
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
                        Buildfire.datastore.insert(_item, _tagName, false, function (err, result) {
                            if (err) {
                                return deferred.reject(err);
                            } else if (result) {
                                return deferred.resolve(result);
                            }
                        });
                    }
                    return deferred.promise;
                },
                update: function (_id, _item, _tagName) {
                    var deferred = $q.defer();
                    if (typeof _id == 'undefined') {
                        return deferred.reject(new Error({
                            code: STATUS_CODE.UNDEFINED_ID,
                            message: STATUS_MESSAGES.UNDEFINED_ID
                        }));
                    }
                    if (typeof _item == 'undefined') {
                        return deferred.reject(new Error({
                            code: STATUS_CODE.UNDEFINED_DATA,
                            message: STATUS_MESSAGES.UNDEFINED_DATA
                        }));
                    }
                    Buildfire.datastore.update(_id, _item, _tagName, function (err, result) {
                        if (err) {
                            return deferred.reject(err);
                        } else if (result) {
                            return deferred.resolve(result);
                        }
                    });
                    return deferred.promise;
                },
                save: function (_item, _tagName) {
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
                },
                deleteById: function (_id, _tagName) {
                    var deferred = $q.defer();
                    if (typeof _id == 'undefined') {
                        return deferred.reject(new Error({
                            code: STATUS_CODE.UNDEFINED_ID,
                            message: STATUS_MESSAGES.UNDEFINED_ID
                        }));
                    }
                    Buildfire.datastore.delete(_id, _tagName, function (err, result) {
                        if (err) {
                            return deferred.reject(err);
                        } else if (result) {
                            return deferred.resolve(result);
                        }
                    });
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
                    Buildfire.datastore.search(options, _tagName, function (err, result) {
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
        .factory('RankOfLastItem', [function () {
            var _rankOfLastItem;
            return {
                getRank: function () {
                    return _rankOfLastItem;
                },
                setRank: function (value) {
                    _rankOfLastItem = value;
                }
            };
        }])
        .factory('RankOfLastFilter', [function () {
            var _rankOfLastFilter;
            return {
                getRank: function () {
                    return _rankOfLastFilter;
                },
                setRank: function (value) {
                    _rankOfLastFilter = value;
                }
            };
        }])
        .factory("Utils", ['$http', 'GOOGLE_KEYS', '$q', function ($http, GOOGLE_KEYS, $q) {
            function inRange(min, number, max) {
                return ( !isNaN(number) && (number >= min) && (number <= max) );
            }

            return {
                validLongLats: function (longLats) {
                    var deferred = $q.defer()
                        , longitude = longLats.split(",")[0]
                        , latitude = longLats.split(",")[1]
                        , valid = (inRange(-90, latitude, 90) && inRange(-180, longitude, 180));

                    if (valid) {
                        $http.get("https://maps.googleapis.com/maps/api/geocode/json?latlng=" + latitude + "," + longitude + "&key=" + GOOGLE_KEYS.API_KEY)
                            .then(function (response) {
                                // this callback will be called asynchronously
                                // when the response is available
                                if (response.data && response.data.results && response.data.results.length) {
                                    deferred.resolve(response);
                                } else {
                                    deferred.resolve(true);
                                }
                            }, function (error) {
                                // called asynchronously if an error occurs
                                // or server returns response with an error status.
                                deferred.reject(error);
                            });
                    }
                    else {
                        deferred.resolve(null);
                    }
                    return deferred.promise;
                },
                getCoordinatesFromAddress: function (address) {
                    var deferred = $q.defer();

                    if (address) {
                        $http.get("https://maps.googleapis.com/maps/api/geocode/json?address=" + address + "&key=" + GOOGLE_KEYS.API_KEY)
                            .then(function (response) {
                                // this callback will be called asynchronously
                                // when the response is available
                                if (response.data && response.data.results && response.data.results.length) {
                                    deferred.resolve(response);
                                } else {
                                    deferred.resolve(true);
                                }
                            }, function (error) {
                                // called asynchronously if an error occurs
                                // or server returns response with an error status.
                                deferred.reject(error);
                            });
                    }
                    else {
                        deferred.resolve(null);
                    }
                    return deferred.promise;
                }
            }
        }]);
})(window.angular, window.buildfire);