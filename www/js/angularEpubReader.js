/**
 * Angular/Ionic ePub Reader Directive
 *
 * (c) Mark Watkins https://github.com/viking2917/angular-epub-reader
 * License: MIT
 *
 * @version: 1.0.0
 */

angular.module('epubreader', [])
.directive('epubreader', function($ionicPopup, $document) {
    return {
	restrict: "E",
	scope: {
	    src: '@', 
	    directivevariable: '='
	},

	templateUrl: 'templates/reader.html',

	controller: function($scope, $rootScope, $timeout, $location, $q, $sce){
	    $scope.state = {error : false, sidebar : false, activeTab : 'toc'};
	    $scope.metadata = {};
	    $scope.settings = {}; 
	    $scope.settings.themes = [
		{bg: "#fff", fg: "#000"}, {bg: "#000", fg: "#fff"}, {bg: "#333", fg: "#eee"}, {bg: "#f5deb3", fg: "#000"}, {bg: "#111", fg: "#f5deb3"}, {bg: "#111b21", fg: "#e8e8e8"}
	    ];
	    $scope.settings.fontsizes = [8,9,10,11,12,14,16,18];
	    $scope.settings.lineSpacings = [1, 1.2, 1.4, 1.6, 1.8, 2, 2.3, 2.6, 3];
	    $scope.settings.margins = [0,1,2,3,4,5,7,9,12,15];
	    $scope.settings.fonts = [
		{name: 'Arial', style: "'Arial', Arimo, Liberation Sans, sans-serif"}, 
		{name: 'Lato', style: "'Lato', sans-serif"},
		{name: 'George', style: "'Georgia', Liberation Serif, serif"},
		{name: 'Times New Roman', style: "'Times New Roman', Tinos, Liberation Serif, Times, serif"},
		{name: 'Arbutus Slab', style: "'Arbutus Slab', serif"}
	    ];
	    
	    $scope.theme = {
		bg: "#fff", fg: "#000",
		l: "#1e83d2", ff: "'Times New Roman', Tinos, Liberation Serif, Times, serif",
		fs: "11", lh: "1.6", ta: "justify", m: "5"
	    };
	    
	    $scope.saveSettingsToStorage = function () {
		localStorage.setItem(`ePubViewer:settings`, JSON.stringify($scope.theme));
	    };
	  
	    $scope.loadSettingsFromStorage = function () {
		let restored = localStorage.getItem(`ePubViewer:settings`);
		if((typeof restored !== 'undefined') && restored) {
		    $scope.theme = JSON.parse(restored);
		}
		$scope.applyTheme();
	    };

	    $scope.applyTheme = function (toggleSidebar) {
		if(typeof toggleSidebar === 'object') toggleSidebar = false;  // epubviewer handler calls this with the content object. Don't show the sidebar in that case.

		try {
		    var rules = {
			"body": {
			    "background": $scope.theme.bg,
			    "color": $scope.theme.fg,
			    "font-family": $scope.theme.ff != "" ? `${$scope.theme.ff} !important` : "!invalid-hack",
			    "font-size": $scope.theme.fs != "" ? `${$scope.theme.fs}pt !important` : "!invalid-hack",
			    "line-height": `${$scope.theme.lh} !important`,
			    "text-align": `${$scope.theme.ta} !important`,
			    "padding-top": $scope.theme.m + 'px',
			    "padding-bottom": $scope.theme.m + 'px'
			},
			"p": {
			    "font-family": $scope.theme.ff != "" ? `${$scope.theme.ff} !important` : "!invalid-hack",
			    "font-size": $scope.theme.fs != "" ? `${$scope.theme.fs}pt !important` : "!invalid-hack",
			},
			"a": {
			    "color": "inherit !important",
			    "text-decoration": "none !important",
			    "-webkit-text-fill-color": "inherit !important"
			},
			"a:link": {
			    "color": `${$scope.theme.l} !important`,
			    "text-decoration": "none !important",
			    "-webkit-text-fill-color": `${$scope.theme.l} !important`
			},
			"a:link:hover": {
			    "background": "rgba(0, 0, 0, 0.1) !important"
			},
			"img": {
			    "max-width": "100% !important"
			},
		    };

		    $scope.saveSettingsToStorage();

		    var el = angular.element( document.querySelector( '.app' ) );
		    el.css('background', $scope.theme.bg);
		    el.css('fontFamily', $scope.theme.ff);
		    el.css('color', $scope.theme.fg);
		    if($scope.state.rendition) $scope.state.rendition.getContents().forEach(c => c.addStylesheetRules(rules));
		    if(toggleSidebar) $scope.doSidebar();
		} catch (err) {
		    console.error("error applying theme", err);
		}
	    };
	    
	    $scope.setTheme = function (theme) {
	    	$scope.theme.bg = theme.bg;
	    	$scope.theme.fg = theme.fg;
		$scope.applyTheme(true);
	    };

	    $scope.setFontSize = function (size) {
		$scope.theme.fs = size;
		$scope.applyTheme(true);
	    };

	    $scope.setLineSpacing = function (size) {
		$scope.theme.lh = size;
		$scope.applyTheme(true);
	    };
	    $scope.setMargin= function (size) {
		$scope.theme.m = size;
		$scope.applyTheme(true);
	    };
	    $scope.setFont= function (font) {
		$scope.theme.ff = font;
		$scope.applyTheme(true);
	    };

	    $scope.onMetadataLoaded = function (metadata) {
		$scope.metadata.title = metadata.title.trim();
		$scope.metadata.author = metadata.creator.trim();
		if (!metadata.series || metadata.series.trim() == "") 
		    $scope.metadata.series = false;
		else {
		    $scope.metadata.series = metadata.series.trim();
		    $scope.metadata.series.index = metadata.seriesIndex.trim();
		}

		$scope.metadata.description = sanitizeHtml(metadata.description);
		$scope.metadata.descriptionhtml = $sce.trustAsHtml($scope.metadata.description);
	    };

	    $scope.onBookCoverLoaded = function (url) {
		if(!url) {
		    return false;
		}
		
		if (!$scope.state.book.archived) {
		    $scope.metadata.cover = url;
		    return;
		}
		$scope.state.book.archive.createUrl(url).then(url => {
		    $scope.metadata.cover = url;
		}).catch(err => $scope.fatal("error loading cover", err));
	    };

	    $scope.onNavigationLoaded = function (nav) {
		var toc = [];
		let handleItems = (items, indent) => {
		    items.forEach(item => {
			item.label = `${"&nbsp;".repeat(indent*4)}${item.label.trim()}`;
			item.labelHtml = $sce.trustAsHtml(item.label);
			toc.push(item);
			handleItems(item.subitems, indent + 1);
		    });
		};
		handleItems(nav.toc, 0);
		nav.toc = toc;
		$scope.navigation = nav;
	    };

	    $scope.onRenditionRelocatedSavePos = function (event) {
		localStorage.setItem(`${$scope.state.book.key()}:pos`, event.start.cfi);
	    };
	    
	    $scope.onRenditionStartedRestorePos = function (event) {
		try {
		    let stored = localStorage.getItem(`${$scope.state.book.key()}:pos`);
		    console.log("storedPos", stored);
		    if (stored) $scope.state.rendition.display(stored);
		} catch (err) {
		    $scope.fatal("error restoring position", err);
		}
	    };
	    
	    $scope.onRenditionRelocatedUpdateIndicators = function (event) {
		try {
		    let stxt = (event.start.location > 0) ? `Loc ${event.start.location}/${$scope.state.book.locations.length()}` : 
			((event.start.percentage > 0 && event.start.percentage < 1) ? `${Math.round(event.start.percentage * 100)}%` : ``);
		    $scope.state.locationString = stxt;
		    $scope.$apply();
		} catch (err) {
		    console.error("error updating indicators");
		}   
	    };
	    
	    $scope.onRenditionClick = function (event) {
		try {
		    if (event.target.tagName.toLowerCase() == "a" && event.target.href) return;
		    if (event.target.parentNode.tagName.toLowerCase() == "a" && event.target.parentNode.href) return;
		    if (window.getSelection().toString().length !== 0) return;
		    if ($scope.state.rendition.manager.getContents()[0].window.getSelection().toString().length !== 0) return;
		} catch (err) {}
		
		let wrapper = $scope.state.rendition.manager.container;
		let third = wrapper.clientWidth / 3;
		let x = event.pageX - wrapper.scrollLeft;
		let b = null;
		if (x > wrapper.clientWidth - 20) {
		    event.preventDefault();
		    $scope.doSidebar();
		} else if (x < third) {
		    event.preventDefault();
		    $scope.prevPage();
		    b = false;
		    //        b = this.qs(".bar button.prev");
		} else if (x > (third * 2)) {
		    event.preventDefault();
		    $scope.nextPage();
		    b = false;
		    //        b = this.qs(".bar button.next");
		}
		if (b) {
		    b.style.transform = "scale(1.15)";
		    window.setTimeout(() => b.style.transform = "", 150);
		}
	    };
	    
	    $scope.onRenditionDisplayedTouchSwipe = function (event) {
		let start = null
		let end = null;
		const el = event.document.documentElement;
		
		el.addEventListener('touchstart', event => {
		    start = event.changedTouches[0];
		});
		el.addEventListener('touchend', event => {
		    end = event.changedTouches[0];
		    
		    let hr = (end.screenX - start.screenX) / el.getBoundingClientRect().width;
		    let vr = (end.screenY - start.screenY) / el.getBoundingClientRect().height;
		    
		    if (hr > vr && hr > 0.25) return $scope.prevPage();
		    if (hr < vr && hr < -0.25) return this.state.rendition.next();
		    if (vr > hr && vr > 0.25) return;
		    if (vr < hr && vr < -0.25) return;
		});
	    };
	    
	    $scope.onRenditionRelocated = function (event) {
		try {$scope.doDictionary(null);} catch (err) {}
		try {
		    $scope.navigation.toc.forEach(function (i, item) {
			item.active = ($scope.state.book.canonical(item.href) == $scope.state.book.canonical(event.start.href));
		    });
		    // $.each($scope.navigation.toc, function (i, item) {
		    // 	item.active = ($scope.state.book.canonical(item.href) == $scope.state.book.canonical(event.start.href));
		    // });
		} catch (err) {
		    $scope.fatal("error updating toc", err);
		}
	    };
		
	    $scope.onBookReady = function () {
		$timeout(function () {

		}, 500);
		
		let chars = 1650;
		let key = `${$scope.state.book.key()}:locations-${chars}`;
		let stored = localStorage.getItem(key);
		console.log("storedLocations", typeof stored == "string" ? stored.substr(0, 40) + "..." : stored);
		
		if (stored) return $scope.state.book.locations.load(stored);
		console.log("generating locations");
		return $scope.state.book.locations.generate(chars).then(() => {
		    localStorage.setItem(key, $scope.state.book.locations.save());
		    console.log("locations generated", $scope.state.book.locations);
		}).catch(err => console.error("error generating locations", err));
	    }
	    
	    $scope.loadFonts = function() {
		$scope.state.rendition.getContents().forEach(c => {
		    ["https://fonts.googleapis.com/css?family=Arbutus+Slab",
		     "https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i"
		    ].forEach(url => {
			let el = c.document.body.appendChild(c.document.createElement("link"));
			el.setAttribute("rel", "stylesheet");
			el.setAttribute("href", url);
		    });
		});
	    };

	    $scope.doBook = function (url, opts) {
		opts = opts || {
		    encoding: "epub"
		};
		
		try {
		    $scope.state.book = ePub(url, opts);
		    let book = angular.element( document.querySelector( '.book' ) );
		    book[0].innerHTML = "";

		    $scope.state.rendition = $scope.state.book.renderTo(
			document.querySelectorAll('.book')[0],
			{});
		} catch (err) {
		    $scope.fatal("error loading book", err);
		    throw err;
		}

		$scope.state.book.ready.then($scope.onBookReady).catch( function (err) { $scope.fatal("error loading book", err, false) });
		$scope.state.book.loaded.metadata.then($scope.onMetadataLoaded).catch( function (err) { $scope.fatal("error loading metadata", err, false) });
		$scope.state.rendition.on("relocated", $scope.onRenditionRelocatedUpdateIndicators);
		$scope.state.book.loaded.navigation.then($scope.onNavigationLoaded).catch( function (err) { $scope.fatal("error loading table of contents", err, false) });
		$scope.state.book.loaded.cover.then($scope.onBookCoverLoaded).catch(err => $scope.fatal("error loading cover", err));
		$scope.state.rendition.hooks.content.register($scope.applyTheme);
		$scope.state.rendition.hooks.content.register($scope.loadFonts);
		$scope.state.rendition.on("relocated", $scope.onRenditionRelocated);
		$scope.state.rendition.on("click", $scope.onRenditionClick);
		$scope.state.rendition.on("displayed", $scope.onRenditionDisplayedTouchSwipe);
		$scope.state.rendition.on("relocated", $scope.onRenditionRelocatedSavePos);
		$scope.state.rendition.on("started", $scope.onRenditionStartedRestorePos);
		$scope.state.rendition.on("displayError", $scope.fatal);

		$scope.state.rendition.display();

		if ($scope.state.dictInterval) window.clearInterval($scope.state.dictInterval);
		$scope.state.dictInterval = window.setInterval($scope.checkDictionary, 50);
		$scope.doDictionary(null);

	
		

	    };
	    
	    $scope.doOpenBook = function () {
		var fi = document.createElement("input");
		fi.setAttribute("accept", "application/epub+zip");
		fi.style.display = "none";
		fi.type = "file";
		fi.onchange = event => {
		    var reader = new FileReader();
		    reader.addEventListener("load", () => {
			var arr = (new Uint8Array(reader.result)).subarray(0, 2);
			var header = "";
			for (var i = 0; i < arr.length; i++) {
			    header += arr[i].toString(16);
			}
			if (header == "504b") {
			    this.doBook(reader.result, {
				encoding: "binary"
			    });
			} else {
			    $scope.fatal("invalid file", "not an epub book");
			}
		    }, false);
		    if (fi.files[0]) {
			reader.readAsArrayBuffer(fi.files[0]);
		    }
		};
		document.body.appendChild(fi);
		fi.click();
	    };

	   
	    $scope.isBookLoaded = function () {
		return $scope.state.book;
	    }

	    $scope.nextPage = function () {
		$scope.state.rendition.next();
	    };

	    $scope.prevPage = function () {
		$scope.state.rendition.prev();		
	    };
	    
	    $scope.locationClick = function () {
		try {
		    $ionicPopup.prompt({
			title: 'Location', template: `Location to go to (up to ${$scope.state.book.locations.length()})?`})
			.then(function(answer) {
			    if (!answer) return;
			    answer = answer.trim();
			    if (answer == "") return;
			    
			    let parsed = parseInt(answer, 10);
			    if (isNaN(parsed) || parsed < 0) throw new Error("Invalid location: not a positive integer");
			    if (parsed > $scope.state.book.locations.length()) throw new Error("Invalid location");
			    
			    let cfi = $scope.state.book.locations.cfiFromLocation(parsed);
			    if (cfi === -1) throw new Error("Invalid location");
			    
			    $scope.state.rendition.display(cfi);
			});
		}
		catch (err) {
		    $ionicPopup.alert({title: "Error", content: '<p>' + err.toString() + '</p>'});
		}
	    };

	    $scope.gotoTocItem = function (href, event) {
		console.log("tocClick", href);
		console.log($scope.state.book.canonical(href));
		$scope.state.rendition.display(href).catch(err => console.warn("error displaying page", err));
		$scope.doSidebar();
	    };

	    $scope.onSearchClick = function (event) {
		$scope.doSearch($scope.state.searchQuery.trim()).then(results => {
		    $scope.state.searchResults = results.slice(0, 200);
		    $scope.$apply();
		}).catch(err => $scope.fatal("error searching book", err));
	    };

	    $scope.doSearch = function (q) {
		return Promise.all($scope.state.book.spine.spineItems.map(item => {
		    return item.load($scope.state.book.load.bind($scope.state.book)).then(doc => {
			let results = item.find(q);
			item.unload();
			return Promise.resolve(results);
		    });
		})).then(results => Promise.resolve([].concat.apply([], results)));
	    };

	    $scope.onResultClick = function (cfi) {
		console.log("tocClick", cfi);
		$scope.state.rendition.display(cfi);
		$scope.doSidebar();
	    };
	    
	    $scope.doSidebar = function () {
		$scope.state.sidebar = !$scope.state.sidebar;
	    };

	    $scope.onTabClick =  function ($event, tab) {
		console.log("tabClick", tab);
		$scope.state.activeTab = tab;
	    };

	    $scope.doFullscreen = function () {
		document.fullscreenEnabled = document.fullscreenEnabled || document.mozFullScreenEnabled || document.documentElement.webkitRequestFullScreen;
		
		let requestFullscreen = element => {
		    if (element.requestFullscreen) {
			element.requestFullscreen();
		    } else if (element.mozRequestFullScreen) {
			element.mozRequestFullScreen();
		    } else if (element.webkitRequestFullScreen) {
			element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
		    }
		};

		if (document.fullscreenEnabled) {
		    requestFullscreen(document.documentElement);
		}
	    };
	    
	    $scope.doReset = function () {
		$ionicPopup.confirm({title: 'Reset All?', template: 'Are you sure?'}).then(function(res) {
		    if(res) {
			localStorage.clear();
			window.location.reload();
		    }
		});
	    };

	    $scope.checkDictionary = function () {
		try {
		    let manager = $scope.state.rendition.manager;
		    let sel = manager ? $scope.state.rendition.manager.getContents() : false;
		    let window = (sel && (sel.length > 0) && (typeof sel[0].window !== 'undefined')) ? sel[0].window : false;
		    let selection = window ? window.getSelection().toString().trim() : "";
		    if (!selection || selection.length < 2 || selection.indexOf(" ") > -1) {
			if ($scope.state.showDictTimeout) window.clearTimeout($scope.state.showDictTimeout);
			$scope.doDictionary(null);
			return;
		    }
		    $scope.state.showDictTimeout = window.setTimeout(() => {
			try {
			    let newSelection = $scope.state.rendition.manager.getContents()[0].window.getSelection().toString().trim();
			    if (newSelection == selection) $scope.doDictionary(newSelection);
			    else $scope.doDictionary(null);

			} catch (err) {console.error(`showDictTimeout: ${err.toString()}`)}
		    }, 300);
		} catch (err) {
		    console.error(`checkDictionary: ${err.toString()}`)
		}
	    };
	    
	    $scope.doDictionary = function (word) {
		if ($scope.state.lastWord) if ($scope.state.lastWord == word) return;
		$scope.state.lastWord = word;
		
		$scope.dictionary = false;
		if (!word) {
		    $scope.$apply();
		    return;
		}

		$scope.dictionary = {word: word};
		
		console.log(`define ${word}`);
		let url = `https://dict.geek1011.net/word/${encodeURIComponent(word)}`;
		fetch(url).then(resp => {
		    if (resp.status >= 500) throw new Error(`Dictionary not available`);
		    return resp.json();
		}).then(obj => {
		    if (obj.status == "error") throw new Error(`ApiError: ${obj.result}`);
		    return obj.result;
		}).then(word => {
		    // console.log("dictLookup", word);
		    if (word.info && word.info.trim() != "") {
			$scope.dictionary.info = word.info;
		    }

		    $scope.dictionary.meanings = word.meanings;

		    if (word.credit && word.credit.trim() != "") {
			$scope.dictionary.credit = word.credit;
		    }

		    $scope.$apply();

		}).catch(err => {
		    try {
			console.error("dictLookup", err);
			if (err.toString().toLowerCase().indexOf("not in dictionary") > -1) {
			    $scope.dictionary.error = "Word not in dictionary.";
			    $scope.$apply();
			    return;
			}
			if (err.toString().toLowerCase().indexOf("not available") > -1 || err.toString().indexOf("networkerror") > -1 || err.toString().indexOf("failed to fetch") > -1) {
			    $scope.dictionary.error = "Word not in dictionary.";
			    $scope.$apply();
			    return;
			}
			$scope.dictionary.error = `Dictionary not available: ${err.toString()}`;
			$scope.$apply();

		    } catch (err) {}
		});
	    };
	    
	
	    $scope.fatal = function (msg, err, usersFault) {
		if( (typeof msg === 'undefined') || !msg) msg = "Error";
		if( (typeof err === 'undefined') || !err) err = "Error";

		console.log(msg, err);
		$scope.state.error = true;
		$scope.state.errorTitle = "Error";
		$scope.state.errorDescription = usersFault ? "" : "Please try again. If the error persists please email us at mark@thehawaiiproject.com to report the issue.";
		$scope.state.errorInfo = msg + ": " + err.toString();

		$ionicPopup.alert({title: "Error", content: '<p>' + $scope.state.errorInfo + '</p><p>' + $scope.state.errorDescription + '</p>'})
		    .then(function(result) {
			void(result);  /* just to get jshint to shut up */
		    });
		try {
		    // if (!usersFault) Raven.captureException(err);
		    // could log error with Fabric or Raven if desired. 
		} catch (err) {}
	    };


	    $document.on('keydown', function (event) {
	    	switch (event.keyCode) {
      	    	case 37: 
	    	    $scope.prevPage();
	    	    break;
      	    	case 39: 
	    	    $scope.nextPage();
	    	    break;
	    	case 13:									    // get enter key to trigger search.
	    	    if($scope.state.searchQuery) {						    
	    		$scope.onSearchClick(false);
	    		delete $scope.state.searchQuery;
	    	    }
	    	    break;
                }            
            });
	    
	    $scope.loadSettingsFromStorage();
	    
	    try {
		let ufn = location.search.replace("?", "") || location.hash.replace("#", "");
		if (ufn.startsWith("!")) {
		    ufn = ufn.replace("!", "");
		    document.querySelector(".app button.open").style = "display: none !important";
		}
		
		// can stream from a url like this:
		// ufn = "https://standardebooks.org/ebooks/walter-scott/ivanhoe/dist/walter-scott_ivanhoe.epub";
		if (ufn) {
		    fetch(ufn).then(resp => {
			if (resp.status != 200) throw new Error("response status: " + resp.status.toString() + " " + resp.statusText);
		    }).catch(err => {
			$scope.fatal("error loading book", err, false);
		    });

		    $scope.doBook(ufn);
		}
		else {
		    $scope.doOpenBook();
		}
	    } catch (err) {
		$scope.fatal("There was an error loading the file", err, false);
	    }
	},

	link: function(scope, element, attrs) {
	}
    }
})
