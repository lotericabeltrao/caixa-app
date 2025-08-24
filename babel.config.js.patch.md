### Add NativeWind to your babel config

Edit `babel.config.js` and include `nativewind/babel`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['nativewind/babel'],
  };
};
```

Install deps:
```bash
npm i nativewind tailwindcss
npx tailwindcss init
```
