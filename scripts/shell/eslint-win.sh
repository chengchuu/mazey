. scripts/shell/env-win.sh

# npm run lint:fix
npx eslint "./src/**/*.ts" --ext "js,ts,tsx" --fix
npx eslint "./test/**/*.js" --ext "js,ts,tsx" --fix
npx eslint "./scripts/**/*.js" --ext "js,ts,tsx" --fix
npx eslint "./*.js" --ext "js,ts,tsx" --fix
npx eslint "./*.ts" --ext "js,ts,tsx" --fix
