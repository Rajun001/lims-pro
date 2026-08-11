const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9999;
const IMAGE_PATH = 'C:/Users/HP LAB/OneDrive/Desktop/IMG_4560.jpeg';
const OUTPUT_PATH = path.join(__dirname, '../public/logo.png');

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Optimizer</title>
            </head>
            <body>
                <h1>Optimizing Logo...</h1>
                <canvas id="canvas" style="display:none;"></canvas>
                <script>
                    const img = new Image();
                    img.onload = function() {
                        const canvas = document.getElementById('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // We crop the image into a neat square containing the logo.
                        // The logo is centered in the photo.
                        const size = 512;
                        canvas.width = size;
                        canvas.height = size;
                        
                        // Fill white background
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, size, size);
                        
                        const minDim = Math.min(img.width, img.height);
                        const sx = (img.width - minDim) / 2;
                        const sy = (img.height - minDim) / 2;
                        
                        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
                        
                        // Post data back to server
                        const dataUrl = canvas.toDataURL('image/png');
                        fetch('/upload', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ image: dataUrl })
                        })
                        .then(r => r.text())
                        .then(text => {
                            document.body.innerHTML = '<h1>Optimization complete! ' + text + '</h1>';
                        })
                        .catch(err => {
                            document.body.innerHTML = '<h1>Error: ' + err.toString() + '</h1>';
                        });
                    };
                    img.src = '/image';
                </script>
            </body>
            </html>
        `);
    } else if (req.method === 'GET' && req.url === '/image') {
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        fs.createReadStream(IMAGE_PATH).pipe(res);
    } else if (req.method === 'POST' && req.url === '/upload') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const base64Data = data.image.replace(/^data:image\/png;base64,/, '');
                fs.writeFileSync(OUTPUT_PATH, base64Data, 'base64');
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('Saved successfully to ' + OUTPUT_PATH);
                console.log('Saved resized logo successfully to ' + OUTPUT_PATH);
                setTimeout(() => {
                    process.exit(0);
                }, 1000);
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error saving: ' + err.toString());
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
