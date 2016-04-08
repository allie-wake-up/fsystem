'use strict';

const Entry = require('./Entry.js');
const File = require('./File.js');

module.exports = Directory;

class Directory extends Entry {
    constructor(entry) {
        super(entry);
        this.files = null;
    }

    createDirectory(name, exclusive = true) {
        return this.getDirectory(name, {
            create: true,
            exclusive
        });
    }

    createFile(name, exclusive = true) {
        return this._createIntermediateDirs(name)
            .then(() => this.getFile(name, {
                create: true,
                exclusive
            }));
    }

    _createIntermediateDirs(name) {
        const parts = name.split('/');
        parts.splice(parts.length - 1, 1);
        if (parts.length) {
            parts.forEach((part, index, parts) => {
                const name = parts.slice(0, index).join('/');
                this.createDir(name);
            });
        }
    }

    getDirectory(name, options = {}) {
        return new Promise((resolve, reject) => {
            this.entry.getDirectory(name, options, resolve, reject);
        });
    }

    getFile(name, options = {}) {
        return new Promise((resolve, reject) => {
            this.entry.getFile(name, options, resolve, reject);
        });
    }

    getFlatFiles() {
        const add = function(files, flat) {
            files.forEach((file) => {
                if (file.isFile) {
                    flat.push(file);
                } else {
                    add(file.files, flat);
                }
            });
        };

        return this.readRecursive().then(() => {
            const flat = [];
            add(this.files, flat);
            return flat;
        });
    }

    getSimpleFiles() {
        const convert = function(files) {
            const simple = files.map((file) => {
                if (file.isFile) {
                    return {name: file.name};
                } else {
                    return {
                        name: file.name,
                        files: convert(file.files)
                    };
                }
            });

            simple.sort((a, b) => {
                if (a.files && !b.files) {
                    return -1;
                } else if (b.files && !a.files) {
                    return 1;
                } else {
                    return a.name.localeCompare(b.name);
                }
            });

            return simple;
        };

        return this.readRecursive().then(() => {
            return {
                name: this.entry.name,
                files: convert(this.files)
            };
        });
    }

    read() {
        const reader = this.createReader();

        return new Promise((resolve, reject) => {
            reader.readEntries((results) => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                this.files = results.map((entry) => {
                    if (entry.isDirectory) {
                        return new Directory(entry);
                    } else {
                        return new File(entry);
                    }
                });
                return resolve(this.files);
            });
        });
    }

    readRecursive() {
        return this.readDir().then((files) => {
            const promises = [];

            files.forEach((file) => {
                if (file.isDirectory) {
                    promises.push(file.readRecursive());
                }
            });

            return Promise.all(promises);
        });
    }
}
