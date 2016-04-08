'use strict';

const Directory = require('./Directory.js');
const File = require('./File.js');

module.exports = {
    Directory,
    File,

    chooseEntry(options) {
        return this.promise(function(resolve, reject) {
            chrome.fileSystem.chooseEntry(options, (entry) => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                return resolve(entry);
            });
        });
    },
    
    restoreEntry(id) {
        return new Promise(function(resolve, reject) {
            chrome.fileSystem.restoreEntry(id, (entry) => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                return resolve(entry);
            });
        });
    }
};
