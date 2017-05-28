# Lambdo

Advanced performance monitoring for AWS Lambdas (or GCE Cloud Functions).

### Installation

`npm install --save lambdo`

## Usage

```js
var Lambdo = require('lambdo')

module.exports = Lambdo.monitor(function(event, context, callback) {
  ...your code...
})
```