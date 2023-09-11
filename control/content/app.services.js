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
        }])
        .factory('PluginEvents', [function () {
            return {
                register: function (event, silentNotification) {
                    if(!event.key || !event.title){
                        return;
                    }

                    buildfire.analytics.registerEvent({
                        title: event.title,
                        key: 'coupon_item_view_' + event.key,
                    }, {silentNotification: silentNotification});
                },
                unregister: function (key) {
                    buildfire.analytics.unregisterEvent('coupon_item_view_' + key);
                }
            };
        }]).factory('StateSeeder', ['TAG_NAMES', 'DataStore' ,function(TAG_NAMES, DataStore) {
            let itemsList;
            let stateSeederInstance;
            let reloadCoupons;
            let jsonTemplate = {
                items: [
                  {
                    title: "",
                    summary: "",
                    listImage: "", 
                  },
                ],
              };
             let handleAIReq = function(err, data) {
                if (
                  err ||
                  !data ||
                  typeof data !== "object" ||
                  !Object.keys(data).length || !data.data || !data.data.items || !data.data.items.length
                ) {
                  return buildfire.dialog.toast({
                    message: "Bad AI request, please try changing your request.",
                    type: "danger",
                  });
                }
          
                itemsList = data.data.items;
                //Check image URLs
                let coupons = itemsList.map(item => {
                  return new Promise((resolve, reject) => {
                    elimanateNotFoundImages(item.listImage).then(res => {
                      if (res.isValid) {
                        item.listImage = res.newURL;
                        resolve(item);
                      } else {
                        reject('image URL not valid');
                      }
                    })
                  })
                })
          
                // Check image URLs
                Promise.allSettled(coupons).then(results => {
                  itemsList = [];
                  results.forEach(res => {
                    if(res.status == 'fulfilled') {
                      const coupon = res.value;
                      if (coupon) {
                        itemsList.push(coupon);
                      }
                    }
                  })
                  if (!itemsList.length) {
                    stateSeederInstance.requestResult.complete();
                    return buildfire.dialog.toast({
                      message: "Bad AI request, please try changing your request.",
                      type: "danger",
                    });
                  }
                  
                    // reset old data
                    checkOldData().then(() => {                    
                    // save new data
                        buildfire.messaging.sendMessageToWidget({ type: "ImportCSV", importing: true });
                        itemsList.forEach((item, i)=> {  
                        item = _applyDefaults(item);
                        DataStore.insert(item, TAG_NAMES.COUPON_ITEMS).then((res)=> {
                            if (res) {
                                item.deepLinkId = res.id,
                                item.deepLinkUrl =  buildfire.deeplink.createLink({ id: res.id })
                                DataStore.update(res.id, item, TAG_NAMES.COUPON_ITEMS).then((res) => {
                                })
                                if(i == (itemsList.length - 1)) {
                                    buildfire.messaging.sendMessageToWidget({ type: "ImportCSV", importing: false });
                                    reloadCoupons();
                                }
                            }
                        })
                    })
                }) 
                stateSeederInstance.requestResult.complete();
              })
              }
          
              // UTILITIES
            let _applyDefaults = function(item) {
                if (item.title) {
                  return {
                    title: item.title,
                    summary: item.summary || "N/A",
                    listImage: item.listImage || "",
                    startOn: Date.now(),
                    expiresOn: Math.trunc(Date.now() + Math.random() * 8640000000),
                    links: [],
                    preRedemptionText: "Redeem Now",
                    postRedemptionText: "Coupon Redeemed",
                    carouselImages: [
                      {
                        "action": "noAction",
                        "iconUrl": item.listImage,
                        "title": "image"
                      }
                    ],
                    rank: 30,
                    addressTitle: "",
                    location: {
                      addressTitle: "",
                      coordinates: {
                        lat: "",
                        lng: ""
                      }
                    },        
                    Categories: [],
                    reuseAfterInMinutes: -1,
                    dateCreated: Date.now(),
                    deepLinkUrl: '', // must have an id from datatore
                    deepLinkId: '', //same as item id
                    SelectedCategories: [],
                  }
                }
                return null
              }
          
              let elimanateNotFoundImages = function(url) {
                const optimisedURL = url.replace('1080x720', '100x100'); 
                return new Promise((resolve) => {
                  if (url.includes("http")){
                    const xhr = new XMLHttpRequest();
                    xhr.open("GET", optimisedURL);
                    xhr.onerror = (error) => {
                      console.warn('provided URL is not a valid image', error);
                      resolve({isValid: false, newURL: null});
                    }
                    xhr.onload = () => {
                      if (xhr.responseURL.includes('source-404') || xhr.status == 404) {
                        return resolve({isValid: false ,newURL: null});
                      } else {
                        return resolve({isValid: true, newURL: xhr.responseURL.replace('h=100', 'h=720').replace('w=100', 'w=1080') });
                      }
                    };
                    xhr.send();
                  } else resolve(false);
                  });
              };``
                
                let checkOldData = function() {
                    return new Promise(resolve => {
                        if (stateSeederInstance.requestResult.resetData){
                            DataStore.save([], TAG_NAMES.COUPON_ITEMS).then(() => {
                                resolve();
                            })
                        } else {
                            resolve();
                        }
                    })
                }

            return {
                initStateSeeder: function(onDataChange) {
                    reloadCoupons = onDataChange;
                    stateSeederInstance = new buildfire.components.aiStateSeeder({
                        generateOptions: {
                        userMessage: `List sample coupons for a new [business-type]`,
                        maxRecords: 5,
                        systemMessage:
                            "listImage is an 1080x720 image URL related to title and the list type, use source.unsplash.com for images, URL should not have premium_photo or source.unsplash.com/random.",
                        jsonTemplate: jsonTemplate,
                        callback: handleAIReq.bind(this),
                        hintText: 'Replace values between brackets to match your requirements.',
                        },
                        importOptions: {
                        jsonTemplate: jsonTemplate,
                        sampleCSV: "Save 20% on Flights, Get 20% off on flight bookings with this exclusive coupon, https://source.unsplash.com/1080x720/?travel\n50% Off Hotel Bookings, Enjoy a 50% discount on hotel reservations using this limited-time coupon, https://source.unsplash.com/1080x720/?hotel\nCar Rental Special Offer, Rent a car for 7 days and pay for only 5 days with this coupon code, https://source.unsplash.com/1080x720/?car\nAdventure Tour Promo, Book an adventure tour and receive a free equipment rental worth $50 using this coupon, https://source.unsplash.com/1080x720/?adventure",
                        maxRecords: 5,
                        hintText: '',
                        systemMessage: '',
                        callback: handleAIReq.bind(this),
                    },
                }).smartShowEmptyState();
                },
            }
        }])
})(window.angular, window.buildfire);