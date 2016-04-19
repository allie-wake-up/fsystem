'use strict';

const Directory = require('./Directory.js');
const File = require('./File.js');

module.exports = {
    Directory,
    File,

    chooseEntry(options) {
        return new Promise((resolve, reject) => {
            chrome.fileSystem.chooseEntry(options, (entry) => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }

                if (entry.isDirectory) {
                    return resolve(new Directory(entry));
                } else {
                    return resolve(new File(entry));
                }
            });
        });
    },

    restoreEntry(id) {
        return new Promise((resolve, reject) => {
            chrome.fileSystem.restoreEntry(id, (entry) => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }

                if (entry.isDirectory) {
                    return resolve(new Directory(entry));
                } else {
                    return resolve(new File(entry));
                }
            });
        });
    }
};
