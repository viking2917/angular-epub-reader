# angular-epub-reader
an ePub reader directive, compatible with ionic / Angular v1, plus sample app.

angular-epub-reader is a reworking of [Patrick G](https://github.com/geek1011)'s excellent ePubViewer, to make it compatible with [AngularJS] v1 and
[Ionic v1](https://ionicframework.com/docs/v1/). Parts of it are substantially re-written, parts become quite a bit simpler by using angular's templating system, other parts (styling, for
example) are mostly completely unchanged, except to rename some classes to prevent collision with Ionic's built-in styling classes.

The primary component is a custom AngularJS Directive encapsulating the viewer. You can easily add this as a module to your own app. 

This repo also includes a sample ionic  App codebase illustrating use.

## Installation

#### Using script tag

Ensure you have Ionic V1 installed.

Modify your index.html file to include the following:

```html
<link rel="stylesheet" href="lib/normalize.min.css">
<link href="css/readerstyle.css" rel="stylesheet">
<link href="https://fonts.googleapis.com/css?family=Arbutus+Slab" rel="stylesheet">
<link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet">
<script src="lib/sanitize-html.min.js"></script>
<script src="lib/jszip.min.js"></script>
<script src="lib/epub.js"></script>
<script src="js/angularEpubReader.js"></script>
```

Include the custom directive in your index.html file, or in a template.

```html
<ion-pane>
    <ion-content overflow-scroll="true">
    	<epubreader></epubreader>
    </ion-content>
 </ion-pane>
```

#### Add module "epubreader" as dependency
```js
angular.module('starter', ['ionic', 'epubreader'])
```

### Loading an ePub file

Once the app is running you should see a button entitled 'Open a Book'. Hit that button and load an epub file, e.g. [Treasure Island](http://www.gutenberg.org/ebooks/120) - the file called
EPUB (with images) works nicely.

## Technologies used in this project

- [AngularJS] 
- [ePub.js](https://github.com/futurepress/epub.js/)
- [normalize.css](https://necolas.github.io/normalize.css/) / [sanitizeHtml](https://www.npmjs.com/package/sanitize-html)

### Prerequisites

You will need to have Ionic V1 installed to run the sample app. 

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Greatful thanks to [Patrick G](https://github.com/geek1011), the original author of ePubViewer - his code was much simpler to understand than the original [ePub.js angular reader](https://github.com/futurepress/epubjs-angular-reader), and more  up to date. 
* [Futurepress](http://futurepress.org), for creating ePub.js[https://github.com/futurepress/epub.js/] in the first place. 

[angularjs]:http://angularjs.org
