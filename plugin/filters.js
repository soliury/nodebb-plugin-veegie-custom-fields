(function (Filter) {
    'use strict';

    var async      = require('async'),
        database   = require('./database'),
        settings   = require('./settings');

    var faIcon = 'fa-plus-square';

    //FIXME Move to controller
    var getCustomFields = function (uid, callback) {
        async.parallel({
            fields: async.apply(database.getFields),
            data  : async.apply(database.getClientFields, uid)
        }, function (error, result) {
            if (error) {
                return callback(error);
            }

            var customFields = [];

            if (result.data) {
                //Reduce to only populated fields
                var i = 0, len = result.fields.length, fieldMeta;
                for (i; i < len; ++i) {
                  fieldMeta = result.fields[i];
                  var value = result.data[fieldMeta.key];
                  if (value) {
                    customFields[fieldMeta.key] = value;
                  }
                }
            }

            callback(null, customFields);
        });
    };

    /**
     * Hook to render user profile.
     * 'userData' will be used as payload in hook handler.
     * @param params {object} Payload :{userData: userData, uid: callerUID}
     * @param callback {function}
     */
    Filter.account = function (params, callback) {
        getCustomFields(params.userData.uid, function (error, fields) {
            if (error) {
                return callback(error);
            }
            params.userData.customFields = {};
            Object.assign(params.userData.customFields, fields);
            callback(null, params);
        });
    };

    Filter.menu = function (custom_header, callback) {
        custom_header.plugins.push({
            route: '/plugins/custom-fields',
            icon : faIcon,
            name : '[[vite:custom-field-top-menu-link]]'
        });
        callback(null, custom_header);
    };

    /**
     * Hook to render topic thread.
     * 'topicData' will be used as payload in hook handler.
     * @param topicData {object} Payload :{posts: [{user:{uid:postOwnerId}}], uid: topicOwnerId}
     * @param callback {function}
     */
    Filter.topic = function (topicData, callback) {
        if (!settings.isFilterTopics()) {
            return callback(null, topicData);
        }

        async.map(topicData.topic.posts, function (post, next) {
            getCustomFields(post.user.uid, function (error, customFields) {
                if (error) {
                    return next(error);
                }
                post.customFields = {};
                Object.assign(post.customFields, customFields);
                next(null, post);
            });
        }, function (error, results) {
            if (error) {
                return callback(error);
            }
            topicData.topic.posts = results;
            callback(null, topicData);
        });
    };

    Filter.posts = function (posts, callback) {
        async.map(posts.posts, function (post, next) {
            if (post == null || post == undefined) {
                next(null, post);
            }
            else {
                getCustomFields(post.uid, function (error, customFields) {
                    if (error) {
                        return next(error);
                    }
                    post.customFields = {};
                    Object.assign(post.customFields, customFields);
                    next(null, post);
                });
            }
        }, function (error, results) {
            if (error) {
                return callback(error);
            }
            posts.posts = results;
            callback(null, posts);
        });
    };

    Filter.post = function (post, callback) {
       getCustomFields(post.post.uid, function (error, customFields) {
               if (error) { return callback(error); }
               post.post.customFields = {};
               Object.assign(post.post.customFields, customFields);
               callback(null, post);
       });
   };

    Filter.userAccountEdit = function (data, callback) {
        data.editButtons.push({
            link: '/user/' + data.userslug + '/edit/vite',
            text: '[[vite:edit-menu-link]]'
        });

        callback(null, data);
    };

})(module.exports);
