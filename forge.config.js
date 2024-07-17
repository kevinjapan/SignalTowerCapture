module.exports = {
  packagerConfig: {
    asar: true,
    extraResource:[
      'database',
      'backups',
      'exports'
    ],
   "version-string":{
      "ProductName": "Signal Tower Capture",
      "CompanyName": "signal_tower"
   }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
         authors: 'kev hastie',
         description: 'desktop digital collections solution'
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};
