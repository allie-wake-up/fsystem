'use strict';

const Entry = require('./Entry.js');
const File = require('./File.js');

class Directory extends Entry {
    constructor(entry) {
        super(entry);
        this.files = null;
    }

    createDirectory(name, exclusive = true) {
        if (name[name.length - 1] === '/') {
            name = name.slice(0, -1);
        }
        const dirs = this._getDirArray(name);
        return this._createIntermediateDirs(dirs).then(() => {
            return this.getDirectory(name, {
                create: true,
                exclusive
            });
        });
    }

    createFile(name, exclusive = true) {
        const dirs = this._getDirArray(name);
        return this._createIntermediateDirs(dirs)
            .then(() => this.getFile(name, {
                create: true,
                exclusive
            }));
    }

    deleteFile(name) {
        return this.getFile(name).then((entry) => {
            return new Promise((resolve, reject) => {
                entry.remove(resolve, reject);
            });
        });
    }

    getDirectory(name, options = {}) {
        return new Promise((resolve, reject) => {
            this.entry.getDirectory(name, options, (entry) => {
                resolve(new Directory(entry));
            }, reject);
        });
    }

    getFile(name, options = {create: false}) {
        return new Promise((resolve, reject) => {
            this.entry.getFile(name, options, (entry) => {
                resolve(new File(entry));
            }, reject);
        });
    }

    getFlatFiles(filterFn) {
        const add = function(files, flat) {
            files.forEach((file) => {
                if (file.isFile) {
                    flat.push(file);
                } else {
                    add(file.files, flat);
                }
            });
        };

        return this.readRecursive(filterFn).then(() => {
            const flat = [];
            add(this.files, flat);
            return flat;
        });
    }

    getSimpleFiles(filterFn) {
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

        return this.readRecursive(filterFn).then(() => {
            return {
                name: this.entry.name,
                files: convert(this.files)
            };
        });
    }

    read(filterFn) {
        const reader = this.entry.createReader();

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

                if (typeof filterFn !== 'undefined') {
                    this.files = this.files.filter(file => filterFn(file));
                }

                return resolve(this.files);
            });
        });
    }

    readRecursive(filterFn) {
        return this.read(filterFn).then((files) => {
            const promises = [];

            files.forEach((file) => {
                if (file.isDirectory) {
                    promises.push(file.readRecursive());
                }
            });

            return Promise.all(promises);
        });
    }

    _createIntermediateDirs(dirs) {
        if (!dirs.length) {
            return Promise.resolve();
        } else if (dirs.length === 1) {
            return this.getDirectory(dirs[0], {
                create: true,
                exclusive: false
            });
        } else {
            return this.getDirectory(dirs[0], {
                create: true,
                exclusive: false
            }).then(() => {
                return this._createIntermediateDirs(dirs.slice(1));
            });
        }
    }

    _getDirArray(name) {
        const parts = name.split('/');
        parts.splice(parts.length - 1, 1);
        return parts.map((part, index, parts) => {
            return parts.slice(0, index + 1).join('/');
        });
    }
}

module.exports = Directory;
