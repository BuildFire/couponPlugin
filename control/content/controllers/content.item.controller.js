'use strict';
(function (angular) {
    angular
        .module('couponPluginContent')
        .controller('ContentItemCtrl', ['$scope', '$routeParams', '$timeout', 'DEFAULT_DATA', 'DataStore', 'TAG_NAMES',
            function ($scope, $routeParams, $timeout, DEFAULT_DATA, DataStore, TAG_NAMES) {
                var ContentItem = this;
                var tmrDelayForItem = null
                    , isNewItemInserted = false
                    , updating = false;

                /**
                 * This updateMasterItem will update the ContentMedia.masterItem with passed item
                 * @param item
                 */
                function updateMasterItem(item) {
                    ContentItem.masterItem = angular.copy(item);
                }

                /**
                 * This resetItem will reset the ContentMedia.item with ContentMedia.masterItem
                 */
                function resetItem() {
                    ContentItem.item = angular.copy(ContentItem.masterItem);
                }


                /**
                 * isUnChanged to check whether there is change in controller media item or not
                 * @param item
                 * @returns {*|boolean}
                 */
                function isUnChanged(item) {
                    return angular.equals(item, ContentItem.masterItem);
                }

                function isValidItem(item) {
                    return item.title;
                }


                function insertAndUpdate(_item) {
                    updating = true;
                    if (_item.id) {
                        DataStore.update(_item.id, _item.data, TAG_NAMES.COUPON_ITEMS).then(function (data) {
                            console.log('Item updated successfully-----', data);
                            updateMasterItem(data);
                            updating = false;
                        }, function (err) {
                            console.error('Error: while updating item--:',err);
                            resetItem();
                            updating = false;
                        });
                    }
                    else if (!isNewItemInserted) {
                        isNewItemInserted = true;
                        _item.data.dateCreated = new Date();
                        DataStore.insert(_item.data, TAG_NAMES.COUPON_ITEMS).then(function (data) {
                            updating = false;
                            if (data && data.id) {
                                //ContentItem.item.data.deepLinkUrl = Buildfire.deeplink.createLink({id: data.id});
                                ContentItem.item.id = data.id;
                                updateMasterItem(ContentItem.item);
                            }
                            else {
                                isNewItemInserted = false;
                            }
                        }, function (err) {
                            console.error('Error: while inserting item--:',err);
                            resetItem();
                            updating = false;
                            isNewItemInserted = false;
                        });
                    }
                }

                /**
                 * updateItemsWithDelay called when ever there is some change in current item
                 * @param _item
                 */
                function updateItemsWithDelay(_item) {
                    if (updating)
                        return;
                    if (tmrDelayForItem) {
                        $timeout.cancel(tmrDelayForItem);
                    }
                    ContentItem.isItemValid = isValidItem(ContentItem.item.data);
                    if (_item && !isUnChanged(_item) && ContentItem.isItemValid) {
                        tmrDelayForItem = $timeout(function () {
                            insertAndUpdate(_item);
                        }, 300);
                    }
                }

                function init() {
                    if ($routeParams.id) {
                    }
                    else {
                        ContentItem.item = angular.copy(DEFAULT_DATA.ITEM);
                        updateMasterItem(ContentItem.item);
                    }
                }

                init();

                //option for wysiwyg
                ContentItem.bodyWYSIWYGOptions = {
                    plugins: 'advlist autolink link image lists charmap print preview',
                    skin: 'lightgray',
                    trusted: true,
                    theme: 'modern',
                    plugin_preview_width: "500",
                    plugin_preview_height: "500"
                };

                $scope.$watch(function () {
                    return ContentItem.item;
                }, updateItemsWithDelay, true);
            }]);
})(window.angular);