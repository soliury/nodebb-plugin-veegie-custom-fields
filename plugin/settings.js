(function (Settings) {
    'use strict';

    var objectAssign  = require('object-assign'),

        meta          = require.main.require('./src/nodebb').meta,
        constants     = require.main.require('./src/constants'),
        logger        = require.main.require('./src/logger'),

        //Memory cache
        settingsCache = null,
        defaults      = {
            filterTopics: false
        };

    Settings.init = function (done) {
        meta.settings.get(constants.NAMESPACE, function (error, settings) {
            if (error) {
                return done(error);
            }
            settingsCache = objectAssign(defaults, settings);
            logger.log('verbose', 'Settings are loaded', settingsCache);
            done();
        });
    };

    Settings.get = function () {
        return settingsCache;
    };

    Settings.isFilterTopics = function () {
        return settingsCache.filterTopics;
    };

    Settings.save = function (settings, done) {
        settingsCache = objectAssign(settingsCache, settings);
        meta.settings.set(constants.NAMESPACE, settingsCache, function (error) {
            done(error, settingsCache);
        });
    };

})(module.exports);