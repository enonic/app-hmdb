# Headless Movie DB

Demonstration app with sample data, combined with XP's headless API

## Quick test

To quickly build and deploy this app locally

. Clone this Github project: `git clone ...`
. From project directory: `enonic project deploy`

## Compatibility

| Version | XP version |
|---------| ---------- |
| 4.0.3   | 7.9.0 |
| 4.0.2   | 7.9.0 |
| 4.0.1   | 7.9.0 |
| 4.0.0   | 7.9.0 |
| 3.0.0   | 7.8.0 |
| 2.7.0   | 7.8.0 |
| 2.6.0   | 7.8.0 |
| 2.5.0   | 7.8.0 |
| 2.4.1   | 7.7.0 |
| 2.4.0   | 7.7.0 |
| 2.3.0   | 7.7.0 |
| 2.2.1   | 7.7.0 |
| 2.2.0   | 7.3.1 |
| 2.1.2   | 7.3.1 |
| 2.1.1   | 7.3.1 |
| 2.1.0   | 7.3.1 |
| 2.0.0   | 7.3.1 |
| 1.1.1	  | 7.3.1 |
| 1.1.0	  | 7.3.1 |
| 1.0.1	  | 7.3.1 |
| 1.0.0	  | 7.3.1 |

## Changelog

### 4.0.0

* `ExtraData` type became a dynamic type with fields that are generated based on form descriptors of the x-data and grouped by application key.
* Naming for `ItemSet` and `OptionSet` types were changed, from:
  `<applicationKey>_<contentTypeName>_<itemSetLabel>` to `<applicationKey>_<contentTypeName>_<itemSetName>`
   and
  `<applicationKey>_<contentTypeName>_<optionSetLabel>` to `<applicationKey>_<contentTypeName>_<optionSetName>`

### 3.0.0

* Changed API mount point from /api to /_graphql
* Updated preview and info pages when running in SDK

### 2.7.0

* Updated to Guillotine 5.5.0

### 2.5.0

* Lib-export used to import content
* Created its own project on startup

### 2.3.0

* Updated to use Guillotine-lib 5.2.1
* Added article content type using "option set blocks"
* Added phrases.properties files to demonstrate use of property files
* Added spotlight x-data to demonstrate extending of media:image

### 1.0.0

* Initial release


