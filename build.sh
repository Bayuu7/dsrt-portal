#!/bin/bash
cd "$(dirname "$0")/scripts"
cat core/dsrt-config.js core/dsrt-session.js core/dsrt-bot.js core/dsrt-analytics.js core/dsrt-consent.js core/dsrt-runtime.js > dsrt-runtime.js
npx terser dsrt-runtime.js -o dsrt-runtime.min.js --compress --mangle --source-map "url='dsrt-runtime.min.js.map',includeSources"
echo "Built scripts/dsrt-runtime.min.js"
