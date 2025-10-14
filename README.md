DSRT Portal — Secure Modular Runtime v2

1. File placement
   - Copy frontend files into your web server root (dsrt-portal).
   - Copy collector folder to a Node-capable server.

2. Collector env
   - Set DSRT_COLLECTOR_TOKEN on server for minimal auth:
     export DSRT_COLLECTOR_TOKEN="your-secret-token"
   - Start:
     cd collector
     npm install
     npm start

3. Frontend config
   - Edit /scripts/core/dsrt-config.js to set ANALYTICS_ENDPOINT if hosted elsewhere.
   - Ensure CSP in index.html is aligned with your CDN & external services.

4. Minify & build
   - Use terser / babel to transpile & minify:
     npx babel scripts --out-dir dist --presets=@babel/preset-env
     npx terser dist/*.js -o dist/*.min.js --compress --mangle --source-map
   - Serve minified files in production.

5. Security recommendations
   - Serve via HTTPS.
   - Add server-side CSP headers (more secure than meta tag).
   - Use a proper auth/token issuance for clients when sending analytics.
   - Persist events to DB and implement purging & retention.

6. Unity integration
   - Copy DSRT.jslib to Assets/Plugins/WebGL/ in your Unity project.
   - Add DSRTBridge.cs to Assets/Scripts/ and create a GameObject named DSRTBridge.
