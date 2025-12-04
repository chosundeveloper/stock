FROM node:18-alpine
WORKDIR /app
RUN echo '{"name": "stock", "version": "1.0.0", "scripts": {"start": "node -e \"const http = require('"'"'http'"'"'); const port = process.env.PORT || 3000; http.createServer((req, res) => { res.writeHead(200); res.end('"'"'stock App Running\\n'"'"'); }).listen(port); console.log('"'"'Server running on port '"'"' + port);\""}}' > package.json
EXPOSE 3000
ENV PORT=3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD node -e "require('http').get('http://localhost:' + process.env.PORT, (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1
CMD ["node", "-e", "const http = require('http'); const port = process.env.PORT || 3000; http.createServer((req, res) => { res.writeHead(200); res.end('stock App Running\\n'); }).listen(port); console.log('Server running on port ' + port);"]
