const fs = require('fs');
const path = require('path');

const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.mp4', '.avi', '.mkv'];

function getMediaFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getMediaFiles(filePath, fileList);
        } else {
            if (mediaExtensions.includes(path.extname(filePath))) {
                fileList.push(filePath);
            }
        }
    });

    return fileList;
}


module.exports = {
    getMediaFiles
}