/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = config => ({
  type: "widget",
  icon: 'https://github.com/expo.png',
  entitlements: {
    "com.apple.security.application-groups": ["group.com.mmdev.pokecats"],
  },
  deploymentTarget: "18.0",
  resources: [
    "../../assets/images/widgetcats/LabCat.png",
    "../../assets/images/widgetcats/LabCat-1.png",
    "../../assets/images/widgetcats/LabCat-2.png",
  ],
});