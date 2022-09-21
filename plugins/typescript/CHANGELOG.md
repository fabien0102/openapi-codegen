# Changelog

## [6.0.0](https://github.com/fabien0102/openapi-codegen/compare/typescript-v5.2.1...typescript-v6.0.0) (2022-09-21)


### ⚠ BREAKING CHANGES

* Implement query cancellation in react-query generated components (#95)

### Features

* Implement query cancellation in react-query generated components ([#95](https://github.com/fabien0102/openapi-codegen/issues/95)) ([450b069](https://github.com/fabien0102/openapi-codegen/commit/450b0696073746615d61ab66a7f09de337139a00))

## [5.2.1](https://github.com/fabien0102/openapi-codegen/compare/typescript-v5.2.0...typescript-v5.2.1) (2022-09-08)


### Bug Fixes

* JSDoc generation ([#92](https://github.com/fabien0102/openapi-codegen/issues/92)) ([2dcfa87](https://github.com/fabien0102/openapi-codegen/commit/2dcfa87fa6285ba8e2b8963eb24e542e9f0d6f91))

## [5.2.0](https://github.com/fabien0102/openapi-codegen/compare/typescript-v5.1.0...typescript-v5.2.0) (2022-09-07)


### Features

* bump typescript & lerna versions ([#89](https://github.com/fabien0102/openapi-codegen/issues/89)) ([cf22aa1](https://github.com/fabien0102/openapi-codegen/commit/cf22aa1b999b86934ec907aa37dc53477ed0a3e2))

## [5.1.0](https://github.com/fabien0102/openapi-codegen/compare/typescript-v5.0.0...typescript-v5.1.0) (2022-08-30)


### Features

* added file upload and download support ([#84](https://github.com/fabien0102/openapi-codegen/issues/84)) ([3a15e0c](https://github.com/fabien0102/openapi-codegen/commit/3a15e0ceb55b8d93947d06b99b699f405af3d469))
* select support added for react-query components ([#83](https://github.com/fabien0102/openapi-codegen/issues/83)) ([01574bc](https://github.com/fabien0102/openapi-codegen/commit/01574bcb41694d11b928f7d1f3723777001b6b4a))

## [5.0.0](https://github.com/fabien0102/openapi-codegen/compare/typescript-v4.0.1...typescript-v5.0.0) (2022-08-02)


### ⚠ BREAKING CHANGES

* Update to react-query v4 (#77)

### Features

* Update to react-query v4 ([#77](https://github.com/fabien0102/openapi-codegen/issues/77)) ([a019e39](https://github.com/fabien0102/openapi-codegen/commit/a019e3936169e39109c5bd2cb5f3eb44d3d771f3))

### [4.0.1](https://github.com/fabien0102/openapi-codegen/compare/typescript-v4.0.0...typescript-v4.0.1) (2022-05-25)


### Bug Fixes

* Fix `gen --pr` command ([#71](https://github.com/fabien0102/openapi-codegen/issues/71)) ([bc9bed4](https://github.com/fabien0102/openapi-codegen/commit/bc9bed4dfad6820556709736db43357d657dbda2))

## [4.0.0](https://github.com/fabien0102/openapi-codegen/compare/typescript-v3.0.2...typescript-v4.0.0) (2022-05-18)


### ⚠ BREAKING CHANGES

* Improve error type safety (#63)

### Features

* Improve error type safety ([#63](https://github.com/fabien0102/openapi-codegen/issues/63)) ([d32d84a](https://github.com/fabien0102/openapi-codegen/commit/d32d84a566c52a2b0b7a97b6b240fdf4ca3facca))

### [3.0.2](https://github.com/fabien0102/openapi-codegen/compare/typescript-v3.0.1...typescript-v3.0.2) (2022-04-20)


### Bug Fixes

* Fix comment generation ([#58](https://github.com/fabien0102/openapi-codegen/issues/58)) ([f291a32](https://github.com/fabien0102/openapi-codegen/commit/f291a32bb6225d224e6f14089aef8313f50481a6))

### [3.0.1](https://github.com/fabien0102/openapi-codegen/compare/typescript-v3.0.0...typescript-v3.0.1) (2022-03-22)


### Bug Fixes

* permit `null` as body ([bdfa4b9](https://github.com/fabien0102/openapi-codegen/commit/bdfa4b9a6062b0b9ddd23f589d0d7acd88589961))
* remove spaces in fetcher template ([58f7741](https://github.com/fabien0102/openapi-codegen/commit/58f774161856afa9bc16eaba299114ce7de03833))

## [3.0.0](https://github.com/fabien0102/openapi-codegen/compare/typescript-v2.2.0...typescript-v3.0.0) (2022-03-21)


### ⚠ BREAKING CHANGES

* React query key cache manager (#49)

### Features

* Allow generating code without a prefix ([#50](https://github.com/fabien0102/openapi-codegen/issues/50)) ([cb4d68f](https://github.com/fabien0102/openapi-codegen/commit/cb4d68fcd52ce0a14ae1f378071fbc2a4e7d1877))
* React query key cache manager ([#49](https://github.com/fabien0102/openapi-codegen/issues/49)) ([4e30ddb](https://github.com/fabien0102/openapi-codegen/commit/4e30ddbbb0db14e5b9c1c54b441218481d8537f6))

## [2.2.0](https://github.com/fabien0102/openapi-codegen/compare/typescript-v2.1.0...typescript-v2.2.0) (2022-03-18)


### Features

* Add fetchers dictionary by tag ([#45](https://github.com/fabien0102/openapi-codegen/issues/45)) ([b2751d0](https://github.com/fabien0102/openapi-codegen/commit/b2751d03c23ccb841822eafb03d9e579d159dc41))


### Bug Fixes

* fix baseUrl in fetcherTemplate ([78b2a40](https://github.com/fabien0102/openapi-codegen/commit/78b2a4003bd9b960cdaf58db36ad205a503888a9))

## [2.1.0](https://github.com/fabien0102/openapi-codegen/compare/typescript-v2.0.0...typescript-v2.1.0) (2022-03-17)


### Features

* Add `init` command ([#44](https://github.com/fabien0102/openapi-codegen/issues/44)) ([2ccd5ec](https://github.com/fabien0102/openapi-codegen/commit/2ccd5ec45c4bc27908c45a16002afef04f92ed96))

## [2.0.0](https://github.com/fabien0102/openapi-codegen/compare/typescript-v1.4.0...typescript-v2.0.0) (2022-02-18)


### ⚠ BREAKING CHANGES

* Inject query options in context (#31)

### Features

* Inject query options in context ([#31](https://github.com/fabien0102/openapi-codegen/issues/31)) ([0a7fd6d](https://github.com/fabien0102/openapi-codegen/commit/0a7fd6d6b46132ae12df787edd4169bbec76dd81))

## [1.4.0](https://github.com/fabien0102/openapi-codegen/compare/typescript-v1.3.0...typescript-v1.4.0) (2022-01-27)


### Features

* Add support for flags in `gen` command ([#27](https://github.com/fabien0102/openapi-codegen/issues/27)) ([ec263c2](https://github.com/fabien0102/openapi-codegen/commit/ec263c2f55e4cc4fcb1bc427bf2c9fd1152f640d))

## [1.3.0](https://github.com/fabien0102/openapi-codegen/compare/typescript-v1.2.0...typescript-v1.3.0) (2022-01-20)


### Features

* [generateFetchers] Add extra props support ([#25](https://github.com/fabien0102/openapi-codegen/issues/25)) ([35fc219](https://github.com/fabien0102/openapi-codegen/commit/35fc219d9c644becdf38b0b3e38e1512d095d2d0))

## [1.2.0](https://github.com/fabien0102/openapi-codegen/compare/typescript-v1.1.0...typescript-v1.2.0) (2022-01-19)


### Features

* **typescript:** Improve generated fetcher names ([2aa1b4b](https://github.com/fabien0102/openapi-codegen/commit/2aa1b4b52628450172d39a68838f825c1bcd2a6d))

## [1.1.0](https://github.com/fabien0102/openapi-codegen/compare/typescript-v1.0.0...typescript-v1.1.0) (2022-01-19)


### Features

* generate fetchers only ([#22](https://github.com/fabien0102/openapi-codegen/issues/22)) ([b1d5c4a](https://github.com/fabien0102/openapi-codegen/commit/b1d5c4a6cc104904f4bc72777974973cdda7832d))

## 1.0.0 (2022-01-17)


### Features

* add react-query generator ([2ecbcf8](https://github.com/fabien0102/openapi-codegen/commit/2ecbcf8cb803163a57303ad9f8d39fcf36dc108c))
