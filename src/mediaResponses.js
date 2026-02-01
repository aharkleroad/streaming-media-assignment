const fs = require('fs');
const path = require('path');

const getParty = (request, response) => {
    // takes a dir. and rel. path to a file and creates a file object based on it (doesn't load og file)
    const file = path.resolve(__dirname, '../client/party.mp4')

    // takes file object and callback and returns stats about a file (async func, runs when file loads)
    fs.stat(file, (err, stats) => {
        // err not null = error occured
        if (err){
            // file not found
            if (err.code === 'ENOENT'){
                response.writeHead(404)
            }
            return response.end(err);
        }

        let {range} = request.headers;
        // check if request was sent w/ range header (requests a specific byte range, allows media to be loaded in pieces)
        if (!range){
            // start at byte 0 if it wasn't
            // often no end in range given by client (end range comes after -)
            range = 'bytes=0-';
        }

        // gives us an array of the starting and ending byte positions (bytes=0- -> [0, ])
        const positions = range.replace(/bytes=/, '').split('-');
        // parses 1st array value to base 10 (needed in case bytes=0000- etc.)
        let start = parseInt(positions[0], 10);
        // total file size in bytes
        const total = stats.size;
        const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

        if (start > end) {
            start = end - 1;
        }

        // determine how many bytes are going to be sent back to the browser
        const chunkSize = (end - start) + 1;
        // need to send 206 code (partial content) to say browser can request diff. range but hasn't received whole file
        // accept ranges = type of data to expect the range in
        response.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${total}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'video/mp4'
        });

        // create file stream (takes file object, start, and end point), streams = async
        const stream = fs.createReadStream(file, {start, end});

        // callback called when stream opens, connects stream to response so all bytes read in from response sent to client
        stream.on('open', () => {
            stream.pipe(response);
        });
        // stops sending a response if stream encounters error (and tells client to stop listening)
        stream.on('error', (streamErr) => {
            response.end(streamErr);
        });
        return stream;
    });
};

// const getBling = (request, response){
    
// }

module.exports = {
    getParty
}