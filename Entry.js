'use strict';

class Entry {
    constructor(entry) {
        this.entry = entry;
        this.isDirectory = entry.isDirectory;
        this.isFile = entry.isFile;
        this.name = entry.name;
    }

    getDisplayPath() {
        return new Promise((resolve, reject) => {
            chrome.fileSystem.getDisplayPath(this.entry, (displayPath) => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                return resolve(displayPath);
            });
        });
    }

    retain() {
        return chrome.fileSystem.retainEntry(this.entry);
    }

    remove() {
        return new Promise((resolve, reject) => {
            this.entry.remove(resolve, reject);
        });
    }
}

module.exports = Entry;
