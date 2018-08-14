# angular-epub-reader
An ePub reader directive, compatible with ionic / Angular v1, plus sample app.

angular-epub-reader is a reworking of [Patrick G](https://github.com/geek1011)'s excellent [ePubViewer](https://github.com/geek1011/ePubViewer), to make it compatible with [AngularJS] v1 and
[Ionic v1](https://ionicframework.com/docs/v1/). Parts of it are substantially re-written, parts become quite a bit simpler by using the Angular templating system, other parts (styling, for
example) are mostly completely unchanged, except to rename some classes to prevent collision with Ionic's built-in styling classes. I have also removed the original project's dependency on jQuery.

The primary component is a custom AngularJS Directive encapsulating the viewer. You can easily add this as a module to your own app. 

This repo also includes a sample ionic  App codebase illustrating use.

## Installation

Start a new Ionic v1 project as follows:

Ensure you have Ionic V1 installed.

```
ionic start angular-epub-reader blank --type ionic1
```

#### Using script tag


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

### Gotchas with Ionic

If you are using the highlighting features of EpubJS and want to be able to click on highlights (as in the [ePubJS example app](https://github.com/futurepress/epub.js#examples), you have to
deal with Ionic's event handling. By default Ionic seems to stop propagation on click events it is not in control of. So your click events get eaten and the callback to your highlight
doesn't get called. E.g. the console.log message in the code below from the sample app  never gets reached.

```
rendition.on("selected", function(cfiRange, contents) {
      rendition.annotations.highlight(cfiRange, {}, (e) => {
        console.log("highlight clicked", e.target);
      });
      contents.window.getSelection().removeAllRanges();

    });
```

To get around that, you need to add "data-tap-disabled=true" to the "G" elements that EpubJS creates, e.g. something like: 

```
Array.from(document.getElementsByTagName('g')).forEach(function(theG) {
			    var isEpubGElement = theG.getAttribute('data-epubcfi');
			    if(isEpubGElement) {
				theG.setAttribute("data-tap-disabled", true); // stop IONIC from killing the click events on these.
			    }
			});
```

right after you create a highlight.

### Prerequisites

You will need to have Ionic V1 installed to run the sample app. 

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Greatful thanks to [Patrick G](https://github.com/geek1011), the original author of ePubViewer - his code was much simpler to understand than the original [ePub.js angular reader](https://github.com/futurepress/epubjs-angular-reader), and more  up to date. 
* [Futurepress](http://futurepress.org), for creating ePub.js[https://github.com/futurepress/epub.js/] in the first place. 

[angularjs]:http://angularjs.org
