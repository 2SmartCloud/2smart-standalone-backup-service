const path = require('path');
const fs = require('fs-extra');

const BYTES_IN_MEGABYTE = 1048576;
const BYTES_IN_GIGABYTE = 1073741824;

/**
 * Extract number from string and convert it to number of bytes according to suffix:
 * - "mb" if convert number of megabytes to number of bytes,
 * - "gb" if convert number of gigabytes to number of bytes
 * @param memorySizeString {String} String which contains of memory size with "mb" of "gb" suffix
 * @example
 * // returns 1048576
 * parseMemorySizeAndConvertToBytes('1mb');
 *
 * // returns 1073741824
 * parseMemorySizeAndConvertToBytes('1gb');
 * @returns {Number} Size of memory in bytes or 0 if cannot convert
 */
function parseMemorySizeAndConvertToBytes(memorySizeString) {
    if (memorySizeString.endsWith('mb')) {
        const size = parseFloat(memorySizeString.replace('mb', ''));

        return Math.floor(size * BYTES_IN_MEGABYTE);
    } else if (memorySizeString.endsWith('gb')) {
        const size = parseFloat(memorySizeString.replace('gb', ''));

        return Math.floor(size * BYTES_IN_GIGABYTE);
    }

    return 0;
}
async function getSizeOfDirectoryFiles(dirPath) {
    let totalSize = 0;

    for (const dirEntryName of await fs.readdir(dirPath)) {
        const dirEntryPath = path.resolve(dirPath, dirEntryName);
        const dirEntryStat = await fs.stat(dirEntryPath);

        if (dirEntryStat.isFile()) {
            totalSize += dirEntryStat.size;
        } else if (dirEntryStat.isDirectory()) {
            totalSize += getSizeOfDirectoryFiles(dirEntryPath);
        }
    }

    return totalSize;
}

module.exports = {
    parseMemorySizeAndConvertToBytes,
    getSizeOfDirectoryFiles
};
