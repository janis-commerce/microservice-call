# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2019-10-08
### Added
- `janis-client` and `x-janis-user` headers can now be injected using Session

### Changed
- Now Authentication needs `JANIS_SERVICE_NAME` and `JANIS_SERVICE_SECRET` env vars (**BREAKING CHANGE**)
- Upgraded `@janiscommerce/router-fetcher` dependency (**BREAKING CHANGE**)

### Fixed
- Multiple path parameters are now replaced properly

### Removed
- API Key settings removed

## [2.0.0] - 2019-08-07
### Added
- Use `@janiscommerce/Settings` dependency

### Changed
- `api-key` config comes from `path/to/root/[MS_PATH]/config/.janiscommercerc.json`

## [1.0.0] - 2019-06-21
### Added
- Project inited
- `MicroService-Call` module added
- *Unit Tests* added
- *"lib/"* folder into package.json files

### Changed
- `MicroService-Call` constructs, don't need parametres anymore
- `MicroServiceCall-Error` changed response format.
- Update *Unit Tests*
- Changed modules files folder into *"lib/"*

### Removed
- `Router-Fetcher` moved to an independent package.
