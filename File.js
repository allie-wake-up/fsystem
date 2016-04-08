'use strict';

const Entry = require('./Entry.js');

module.exports = File;

class File extends Entry {
    readAsText() {
        return new Promise((resolve, reject) => {
            this.entry.file((file) => {
                var reader = new FileReader();

                reader.onloadend = function() {
                    resolve(this.result);
                };

                reader.onerror = function() {
                    reject(this.error);
                };

                reader.readAsText(file);
            });
        });
    }

    readAsUInt8Array() {
        return new Promise((resolve, reject) => {
            this.entry.file((file) => {
                var reader = new FileReader();

                reader.onloadend = function() {
                    const buffer = new Buffer(new Uint8Array(this.result));
                    resolve(buffer);
                };

                reader.onerror = function() {
                    reject(this.error);
                };

                reader.readAsArrayBuffer(file);
            });
        });
    }

    writeWithUInt8Array(data) {
        return new Promise((resolve, reject) => {
            this.entry.createWriter((fileWriter) => {
                fileWriter.onwriteend = function() {
                    resolve();
                };

                fileWriter.onerror = function(e) {
                    reject(e);
                };

                fileWriter.truncate(0);
            });
        }).then(() => {
            return new Promise((resolve, reject) => {
                this.entry.createWriter((fileWriter) => {
                    fileWriter.onwriteend = function() {
                        resolve();
                    };

                    fileWriter.onerror = function(e) {
                        reject(e);
                    };

                    var blob = new Blob([data], {type: 'application/octet-binary'});

                    fileWriter.write(blob);
                });
            });
        });
    }
}
