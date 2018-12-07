(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var ScrollMagic = require('scrollmagic');

require('../node_modules/scrollmagic/scrollmagic/uncompressed/plugins/debug.addIndicators');

var controller = new ScrollMagic.Controller();
var scene = new ScrollMagic.Scene({
  triggerElement: '#trigger-1',
  triggerHook: 'onLeave',
  offset: 10
}).setClassToggle('#element-1', 'new-class').addIndicators().addTo(controller);
var durationScene = new ScrollMagic.Scene({
  triggerElement: '#trigger-2',
  triggerHook: 'onLeave',
  duration: 1000
}).on("enter", function () {
  console.log('Do Something on Enter'); // Do something
}).on('leave', function () {
  // Do something
  console.log('Do Something on leave');
}).addIndicators().addTo(controller);

},{"../node_modules/scrollmagic/scrollmagic/uncompressed/plugins/debug.addIndicators":3,"scrollmagic":2}],2:[function(require,module,exports){
/*!
 * ScrollMagic v2.0.6 (2018-10-08)
 * The javascript library for magical scroll interactions.
 * (c) 2018 Jan Paepke (@janpaepke)
 * Project Website: http://scrollmagic.io
 * 
 * @version 2.0.6
 * @license Dual licensed under MIT license and GPL.
 * @author Jan Paepke - e-mail@janpaepke.de
 *
 * @file ScrollMagic main library.
 */
/**
 * @namespace ScrollMagic
 */
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(factory);
	} else if (typeof exports === 'object') {
		// CommonJS
		module.exports = factory();
	} else {
		// Browser global
		root.ScrollMagic = factory();
	}
}(this, function () {
	"use strict";

	var ScrollMagic = function () {
		_util.log(2, '(COMPATIBILITY NOTICE) -> As of ScrollMagic 2.0.0 you need to use \'new ScrollMagic.Controller()\' to create a new controller instance. Use \'new ScrollMagic.Scene()\' to instance a scene.');
	};

	ScrollMagic.version = "2.0.6";

	// TODO: temporary workaround for chrome's scroll jitter bug
	window.addEventListener("mousewheel", function () {});

	// global const
	var PIN_SPACER_ATTRIBUTE = "data-scrollmagic-pin-spacer";

	/**
	 * The main class that is needed once per scroll container.
	 *
	 * @class
	 *
	 * @example
	 * // basic initialization
	 * var controller = new ScrollMagic.Controller();
	 *
	 * // passing options
	 * var controller = new ScrollMagic.Controller({container: "#myContainer", loglevel: 3});
	 *
	 * @param {object} [options] - An object containing one or more options for the controller.
	 * @param {(string|object)} [options.container=window] - A selector, DOM object that references the main container for scrolling.
	 * @param {boolean} [options.vertical=true] - Sets the scroll mode to vertical (`true`) or horizontal (`false`) scrolling.
	 * @param {object} [options.globalSceneOptions={}] - These options will be passed to every Scene that is added to the controller using the addScene method. For more information on Scene options see {@link ScrollMagic.Scene}.
	 * @param {number} [options.loglevel=2] Loglevel for debugging. Note that logging is disabled in the minified version of ScrollMagic.
	 ** `0` => silent
	 ** `1` => errors
	 ** `2` => errors, warnings
	 ** `3` => errors, warnings, debuginfo
	 * @param {boolean} [options.refreshInterval=100] - Some changes don't call events by default, like changing the container size or moving a scene trigger element.  
	 This interval polls these parameters to fire the necessary events.  
	 If you don't use custom containers, trigger elements or have static layouts, where the positions of the trigger elements don't change, you can set this to 0 disable interval checking and improve performance.
	 *
	 */
	ScrollMagic.Controller = function (options) {
/*
	 * ----------------------------------------------------------------
	 * settings
	 * ----------------------------------------------------------------
	 */
		var
		NAMESPACE = 'ScrollMagic.Controller',
			SCROLL_DIRECTION_FORWARD = 'FORWARD',
			SCROLL_DIRECTION_REVERSE = 'REVERSE',
			SCROLL_DIRECTION_PAUSED = 'PAUSED',
			DEFAULT_OPTIONS = CONTROLLER_OPTIONS.defaults;

/*
	 * ----------------------------------------------------------------
	 * private vars
	 * ----------------------------------------------------------------
	 */
		var
		Controller = this,
			_options = _util.extend({}, DEFAULT_OPTIONS, options),
			_sceneObjects = [],
			_updateScenesOnNextCycle = false,
			// can be boolean (true => all scenes) or an array of scenes to be updated
			_scrollPos = 0,
			_scrollDirection = SCROLL_DIRECTION_PAUSED,
			_isDocument = true,
			_viewPortSize = 0,
			_enabled = true,
			_updateTimeout, _refreshTimeout;

/*
	 * ----------------------------------------------------------------
	 * private functions
	 * ----------------------------------------------------------------
	 */

		/**
		 * Internal constructor function of the ScrollMagic Controller
		 * @private
		 */
		var construct = function () {
			for (var key in _options) {
				if (!DEFAULT_OPTIONS.hasOwnProperty(key)) {
					log(2, "WARNING: Unknown option \"" + key + "\"");
					delete _options[key];
				}
			}
			_options.container = _util.get.elements(_options.container)[0];
			// check ScrollContainer
			if (!_options.container) {
				log(1, "ERROR creating object " + NAMESPACE + ": No valid scroll container supplied");
				throw NAMESPACE + " init failed."; // cancel
			}
			_isDocument = _options.container === window || _options.container === document.body || !document.body.contains(_options.container);
			// normalize to window
			if (_isDocument) {
				_options.container = window;
			}
			// update container size immediately
			_viewPortSize = getViewportSize();
			// set event handlers
			_options.container.addEventListener("resize", onChange);
			_options.container.addEventListener("scroll", onChange);

			var ri = parseInt(_options.refreshInterval, 10);
			_options.refreshInterval = _util.type.Number(ri) ? ri : DEFAULT_OPTIONS.refreshInterval;
			scheduleRefresh();

			log(3, "added new " + NAMESPACE + " controller (v" + ScrollMagic.version + ")");
		};

		/**
		 * Schedule the next execution of the refresh function
		 * @private
		 */
		var scheduleRefresh = function () {
			if (_options.refreshInterval > 0) {
				_refreshTimeout = window.setTimeout(refresh, _options.refreshInterval);
			}
		};

		/**
		 * Default function to get scroll pos - overwriteable using `Controller.scrollPos(newFunction)`
		 * @private
		 */
		var getScrollPos = function () {
			return _options.vertical ? _util.get.scrollTop(_options.container) : _util.get.scrollLeft(_options.container);
		};

		/**
		 * Returns the current viewport Size (width vor horizontal, height for vertical)
		 * @private
		 */
		var getViewportSize = function () {
			return _options.vertical ? _util.get.height(_options.container) : _util.get.width(_options.container);
		};

		/**
		 * Default function to set scroll pos - overwriteable using `Controller.scrollTo(newFunction)`
		 * Make available publicly for pinned mousewheel workaround.
		 * @private
		 */
		var setScrollPos = this._setScrollPos = function (pos) {
			if (_options.vertical) {
				if (_isDocument) {
					window.scrollTo(_util.get.scrollLeft(), pos);
				} else {
					_options.container.scrollTop = pos;
				}
			} else {
				if (_isDocument) {
					window.scrollTo(pos, _util.get.scrollTop());
				} else {
					_options.container.scrollLeft = pos;
				}
			}
		};

		/**
		 * Handle updates in cycles instead of on scroll (performance)
		 * @private
		 */
		var updateScenes = function () {
			if (_enabled && _updateScenesOnNextCycle) {
				// determine scenes to update
				var scenesToUpdate = _util.type.Array(_updateScenesOnNextCycle) ? _updateScenesOnNextCycle : _sceneObjects.slice(0);
				// reset scenes
				_updateScenesOnNextCycle = false;
				var oldScrollPos = _scrollPos;
				// update scroll pos now instead of onChange, as it might have changed since scheduling (i.e. in-browser smooth scroll)
				_scrollPos = Controller.scrollPos();
				var deltaScroll = _scrollPos - oldScrollPos;
				if (deltaScroll !== 0) { // scroll position changed?
					_scrollDirection = (deltaScroll > 0) ? SCROLL_DIRECTION_FORWARD : SCROLL_DIRECTION_REVERSE;
				}
				// reverse order of scenes if scrolling reverse
				if (_scrollDirection === SCROLL_DIRECTION_REVERSE) {
					scenesToUpdate.reverse();
				}
				// update scenes
				scenesToUpdate.forEach(function (scene, index) {
					log(3, "updating Scene " + (index + 1) + "/" + scenesToUpdate.length + " (" + _sceneObjects.length + " total)");
					scene.update(true);
				});
				if (scenesToUpdate.length === 0 && _options.loglevel >= 3) {
					log(3, "updating 0 Scenes (nothing added to controller)");
				}
			}
		};

		/**
		 * Initializes rAF callback
		 * @private
		 */
		var debounceUpdate = function () {
			_updateTimeout = _util.rAF(updateScenes);
		};

		/**
		 * Handles Container changes
		 * @private
		 */
		var onChange = function (e) {
			log(3, "event fired causing an update:", e.type);
			if (e.type == "resize") {
				// resize
				_viewPortSize = getViewportSize();
				_scrollDirection = SCROLL_DIRECTION_PAUSED;
			}
			// schedule update
			if (_updateScenesOnNextCycle !== true) {
				_updateScenesOnNextCycle = true;
				debounceUpdate();
			}
		};

		var refresh = function () {
			if (!_isDocument) {
				// simulate resize event. Only works for viewport relevant param (performance)
				if (_viewPortSize != getViewportSize()) {
					var resizeEvent;
					try {
						resizeEvent = new Event('resize', {
							bubbles: false,
							cancelable: false
						});
					} catch (e) { // stupid IE
						resizeEvent = document.createEvent("Event");
						resizeEvent.initEvent("resize", false, false);
					}
					_options.container.dispatchEvent(resizeEvent);
				}
			}
			_sceneObjects.forEach(function (scene, index) { // refresh all scenes
				scene.refresh();
			});
			scheduleRefresh();
		};

		/**
		 * Send a debug message to the console.
		 * provided publicly with _log for plugins
		 * @private
		 *
		 * @param {number} loglevel - The loglevel required to initiate output for the message.
		 * @param {...mixed} output - One or more variables that should be passed to the console.
		 */
		var log = this._log = function (loglevel, output) {
			if (_options.loglevel >= loglevel) {
				Array.prototype.splice.call(arguments, 1, 0, "(" + NAMESPACE + ") ->");
				_util.log.apply(window, arguments);
			}
		};
		// for scenes we have getters for each option, but for the controller we don't, so we need to make it available externally for plugins
		this._options = _options;

		/**
		 * Sort scenes in ascending order of their start offset.
		 * @private
		 *
		 * @param {array} ScenesArray - an array of ScrollMagic Scenes that should be sorted
		 * @return {array} The sorted array of Scenes.
		 */
		var sortScenes = function (ScenesArray) {
			if (ScenesArray.length <= 1) {
				return ScenesArray;
			} else {
				var scenes = ScenesArray.slice(0);
				scenes.sort(function (a, b) {
					return a.scrollOffset() > b.scrollOffset() ? 1 : -1;
				});
				return scenes;
			}
		};

		/**
		 * ----------------------------------------------------------------
		 * public functions
		 * ----------------------------------------------------------------
		 */

		/**
		 * Add one ore more scene(s) to the controller.  
		 * This is the equivalent to `Scene.addTo(controller)`.
		 * @public
		 * @example
		 * // with a previously defined scene
		 * controller.addScene(scene);
		 *
		 * // with a newly created scene.
		 * controller.addScene(new ScrollMagic.Scene({duration : 0}));
		 *
		 * // adding multiple scenes
		 * controller.addScene([scene, scene2, new ScrollMagic.Scene({duration : 0})]);
		 *
		 * @param {(ScrollMagic.Scene|array)} newScene - ScrollMagic Scene or Array of Scenes to be added to the controller.
		 * @return {Controller} Parent object for chaining.
		 */
		this.addScene = function (newScene) {
			if (_util.type.Array(newScene)) {
				newScene.forEach(function (scene, index) {
					Controller.addScene(scene);
				});
			} else if (newScene instanceof ScrollMagic.Scene) {
				if (newScene.controller() !== Controller) {
					newScene.addTo(Controller);
				} else if (_sceneObjects.indexOf(newScene) < 0) {
					// new scene
					_sceneObjects.push(newScene); // add to array
					_sceneObjects = sortScenes(_sceneObjects); // sort
					newScene.on("shift.controller_sort", function () { // resort whenever scene moves
						_sceneObjects = sortScenes(_sceneObjects);
					});
					// insert Global defaults.
					for (var key in _options.globalSceneOptions) {
						if (newScene[key]) {
							newScene[key].call(newScene, _options.globalSceneOptions[key]);
						}
					}
					log(3, "adding Scene (now " + _sceneObjects.length + " total)");
				}
			} else {
				log(1, "ERROR: invalid argument supplied for '.addScene()'");
			}
			return Controller;
		};

		/**
		 * Remove one ore more scene(s) from the controller.  
		 * This is the equivalent to `Scene.remove()`.
		 * @public
		 * @example
		 * // remove a scene from the controller
		 * controller.removeScene(scene);
		 *
		 * // remove multiple scenes from the controller
		 * controller.removeScene([scene, scene2, scene3]);
		 *
		 * @param {(ScrollMagic.Scene|array)} Scene - ScrollMagic Scene or Array of Scenes to be removed from the controller.
		 * @returns {Controller} Parent object for chaining.
		 */
		this.removeScene = function (Scene) {
			if (_util.type.Array(Scene)) {
				Scene.forEach(function (scene, index) {
					Controller.removeScene(scene);
				});
			} else {
				var index = _sceneObjects.indexOf(Scene);
				if (index > -1) {
					Scene.off("shift.controller_sort");
					_sceneObjects.splice(index, 1);
					log(3, "removing Scene (now " + _sceneObjects.length + " left)");
					Scene.remove();
				}
			}
			return Controller;
		};

		/**
		 * Update one ore more scene(s) according to the scroll position of the container.  
		 * This is the equivalent to `Scene.update()`.  
		 * The update method calculates the scene's start and end position (based on the trigger element, trigger hook, duration and offset) and checks it against the current scroll position of the container.  
		 * It then updates the current scene state accordingly (or does nothing, if the state is already correct) – Pins will be set to their correct position and tweens will be updated to their correct progress.  
		 * _**Note:** This method gets called constantly whenever Controller detects a change. The only application for you is if you change something outside of the realm of ScrollMagic, like moving the trigger or changing tween parameters._
		 * @public
		 * @example
		 * // update a specific scene on next cycle
		 * controller.updateScene(scene);
		 *
		 * // update a specific scene immediately
		 * controller.updateScene(scene, true);
		 *
		 * // update multiple scenes scene on next cycle
		 * controller.updateScene([scene1, scene2, scene3]);
		 *
		 * @param {ScrollMagic.Scene} Scene - ScrollMagic Scene or Array of Scenes that is/are supposed to be updated.
		 * @param {boolean} [immediately=false] - If `true` the update will be instant, if `false` it will wait until next update cycle.  
		 This is useful when changing multiple properties of the scene - this way it will only be updated once all new properties are set (updateScenes).
		 * @return {Controller} Parent object for chaining.
		 */
		this.updateScene = function (Scene, immediately) {
			if (_util.type.Array(Scene)) {
				Scene.forEach(function (scene, index) {
					Controller.updateScene(scene, immediately);
				});
			} else {
				if (immediately) {
					Scene.update(true);
				} else if (_updateScenesOnNextCycle !== true && Scene instanceof ScrollMagic.Scene) { // if _updateScenesOnNextCycle is true, all connected scenes are already scheduled for update
					// prep array for next update cycle
					_updateScenesOnNextCycle = _updateScenesOnNextCycle || [];
					if (_updateScenesOnNextCycle.indexOf(Scene) == -1) {
						_updateScenesOnNextCycle.push(Scene);
					}
					_updateScenesOnNextCycle = sortScenes(_updateScenesOnNextCycle); // sort
					debounceUpdate();
				}
			}
			return Controller;
		};

		/**
		 * Updates the controller params and calls updateScene on every scene, that is attached to the controller.  
		 * See `Controller.updateScene()` for more information about what this means.  
		 * In most cases you will not need this function, as it is called constantly, whenever ScrollMagic detects a state change event, like resize or scroll.  
		 * The only application for this method is when ScrollMagic fails to detect these events.  
		 * One application is with some external scroll libraries (like iScroll) that move an internal container to a negative offset instead of actually scrolling. In this case the update on the controller needs to be called whenever the child container's position changes.
		 * For this case there will also be the need to provide a custom function to calculate the correct scroll position. See `Controller.scrollPos()` for details.
		 * @public
		 * @example
		 * // update the controller on next cycle (saves performance due to elimination of redundant updates)
		 * controller.update();
		 *
		 * // update the controller immediately
		 * controller.update(true);
		 *
		 * @param {boolean} [immediately=false] - If `true` the update will be instant, if `false` it will wait until next update cycle (better performance)
		 * @return {Controller} Parent object for chaining.
		 */
		this.update = function (immediately) {
			onChange({
				type: "resize"
			}); // will update size and set _updateScenesOnNextCycle to true
			if (immediately) {
				updateScenes();
			}
			return Controller;
		};

		/**
		 * Scroll to a numeric scroll offset, a DOM element, the start of a scene or provide an alternate method for scrolling.  
		 * For vertical controllers it will change the top scroll offset and for horizontal applications it will change the left offset.
		 * @public
		 *
		 * @since 1.1.0
		 * @example
		 * // scroll to an offset of 100
		 * controller.scrollTo(100);
		 *
		 * // scroll to a DOM element
		 * controller.scrollTo("#anchor");
		 *
		 * // scroll to the beginning of a scene
		 * var scene = new ScrollMagic.Scene({offset: 200});
		 * controller.scrollTo(scene);
		 *
		 * // define a new scroll position modification function (jQuery animate instead of jump)
		 * controller.scrollTo(function (newScrollPos) {
		 *	$("html, body").animate({scrollTop: newScrollPos});
		 * });
		 * controller.scrollTo(100); // call as usual, but the new function will be used instead
		 *
		 * // define a new scroll function with an additional parameter
		 * controller.scrollTo(function (newScrollPos, message) {
		 *  console.log(message);
		 *	$(this).animate({scrollTop: newScrollPos});
		 * });
		 * // call as usual, but supply an extra parameter to the defined custom function
		 * controller.scrollTo(100, "my message");
		 *
		 * // define a new scroll function with an additional parameter containing multiple variables
		 * controller.scrollTo(function (newScrollPos, options) {
		 *  someGlobalVar = options.a + options.b;
		 *	$(this).animate({scrollTop: newScrollPos});
		 * });
		 * // call as usual, but supply an extra parameter containing multiple options
		 * controller.scrollTo(100, {a: 1, b: 2});
		 *
		 * // define a new scroll function with a callback supplied as an additional parameter
		 * controller.scrollTo(function (newScrollPos, callback) {
		 *	$(this).animate({scrollTop: newScrollPos}, 400, "swing", callback);
		 * });
		 * // call as usual, but supply an extra parameter, which is used as a callback in the previously defined custom scroll function
		 * controller.scrollTo(100, function() {
		 *	console.log("scroll has finished.");
		 * });
		 *
		 * @param {mixed} scrollTarget - The supplied argument can be one of these types:
		 * 1. `number` -> The container will scroll to this new scroll offset.
		 * 2. `string` or `object` -> Can be a selector or a DOM object.  
		 *  The container will scroll to the position of this element.
		 * 3. `ScrollMagic Scene` -> The container will scroll to the start of this scene.
		 * 4. `function` -> This function will be used for future scroll position modifications.  
		 *  This provides a way for you to change the behaviour of scrolling and adding new behaviour like animation. The function receives the new scroll position as a parameter and a reference to the container element using `this`.  
		 *  It may also optionally receive an optional additional parameter (see below)  
		 *  _**NOTE:**  
		 *  All other options will still work as expected, using the new function to scroll._
		 * @param {mixed} [additionalParameter] - If a custom scroll function was defined (see above 4.), you may want to supply additional parameters to it, when calling it. You can do this using this parameter – see examples for details. Please note, that this parameter will have no effect, if you use the default scrolling function.
		 * @returns {Controller} Parent object for chaining.
		 */
		this.scrollTo = function (scrollTarget, additionalParameter) {
			if (_util.type.Number(scrollTarget)) { // excecute
				setScrollPos.call(_options.container, scrollTarget, additionalParameter);
			} else if (scrollTarget instanceof ScrollMagic.Scene) { // scroll to scene
				if (scrollTarget.controller() === Controller) { // check if the controller is associated with this scene
					Controller.scrollTo(scrollTarget.scrollOffset(), additionalParameter);
				} else {
					log(2, "scrollTo(): The supplied scene does not belong to this controller. Scroll cancelled.", scrollTarget);
				}
			} else if (_util.type.Function(scrollTarget)) { // assign new scroll function
				setScrollPos = scrollTarget;
			} else { // scroll to element
				var elem = _util.get.elements(scrollTarget)[0];
				if (elem) {
					// if parent is pin spacer, use spacer position instead so correct start position is returned for pinned elements.
					while (elem.parentNode.hasAttribute(PIN_SPACER_ATTRIBUTE)) {
						elem = elem.parentNode;
					}

					var
					param = _options.vertical ? "top" : "left",
						// which param is of interest ?
						containerOffset = _util.get.offset(_options.container),
						// container position is needed because element offset is returned in relation to document, not in relation to container.
						elementOffset = _util.get.offset(elem);

					if (!_isDocument) { // container is not the document root, so substract scroll Position to get correct trigger element position relative to scrollcontent
						containerOffset[param] -= Controller.scrollPos();
					}

					Controller.scrollTo(elementOffset[param] - containerOffset[param], additionalParameter);
				} else {
					log(2, "scrollTo(): The supplied argument is invalid. Scroll cancelled.", scrollTarget);
				}
			}
			return Controller;
		};

		/**
		 * **Get** the current scrollPosition or **Set** a new method to calculate it.  
		 * -> **GET**:
		 * When used as a getter this function will return the current scroll position.  
		 * To get a cached value use Controller.info("scrollPos"), which will be updated in the update cycle.  
		 * For vertical controllers it will return the top scroll offset and for horizontal applications it will return the left offset.
		 *
		 * -> **SET**:
		 * When used as a setter this method prodes a way to permanently overwrite the controller's scroll position calculation.  
		 * A typical usecase is when the scroll position is not reflected by the containers scrollTop or scrollLeft values, but for example by the inner offset of a child container.  
		 * Moving a child container inside a parent is a commonly used method for several scrolling frameworks, including iScroll.  
		 * By providing an alternate calculation function you can make sure ScrollMagic receives the correct scroll position.  
		 * Please also bear in mind that your function should return y values for vertical scrolls an x for horizontals.
		 *
		 * To change the current scroll position please use `Controller.scrollTo()`.
		 * @public
		 *
		 * @example
		 * // get the current scroll Position
		 * var scrollPos = controller.scrollPos();
		 *
		 * // set a new scroll position calculation method
		 * controller.scrollPos(function () {
		 *	return this.info("vertical") ? -mychildcontainer.y : -mychildcontainer.x
		 * });
		 *
		 * @param {function} [scrollPosMethod] - The function to be used for the scroll position calculation of the container.
		 * @returns {(number|Controller)} Current scroll position or parent object for chaining.
		 */
		this.scrollPos = function (scrollPosMethod) {
			if (!arguments.length) { // get
				return getScrollPos.call(Controller);
			} else { // set
				if (_util.type.Function(scrollPosMethod)) {
					getScrollPos = scrollPosMethod;
				} else {
					log(2, "Provided value for method 'scrollPos' is not a function. To change the current scroll position use 'scrollTo()'.");
				}
			}
			return Controller;
		};

		/**
		 * **Get** all infos or one in particular about the controller.
		 * @public
		 * @example
		 * // returns the current scroll position (number)
		 * var scrollPos = controller.info("scrollPos");
		 *
		 * // returns all infos as an object
		 * var infos = controller.info();
		 *
		 * @param {string} [about] - If passed only this info will be returned instead of an object containing all.  
		 Valid options are:
		 ** `"size"` => the current viewport size of the container
		 ** `"vertical"` => true if vertical scrolling, otherwise false
		 ** `"scrollPos"` => the current scroll position
		 ** `"scrollDirection"` => the last known direction of the scroll
		 ** `"container"` => the container element
		 ** `"isDocument"` => true if container element is the document.
		 * @returns {(mixed|object)} The requested info(s).
		 */
		this.info = function (about) {
			var values = {
				size: _viewPortSize,
				// contains height or width (in regard to orientation);
				vertical: _options.vertical,
				scrollPos: _scrollPos,
				scrollDirection: _scrollDirection,
				container: _options.container,
				isDocument: _isDocument
			};
			if (!arguments.length) { // get all as an object
				return values;
			} else if (values[about] !== undefined) {
				return values[about];
			} else {
				log(1, "ERROR: option \"" + about + "\" is not available");
				return;
			}
		};

		/**
		 * **Get** or **Set** the current loglevel option value.
		 * @public
		 *
		 * @example
		 * // get the current value
		 * var loglevel = controller.loglevel();
		 *
		 * // set a new value
		 * controller.loglevel(3);
		 *
		 * @param {number} [newLoglevel] - The new loglevel setting of the Controller. `[0-3]`
		 * @returns {(number|Controller)} Current loglevel or parent object for chaining.
		 */
		this.loglevel = function (newLoglevel) {
			if (!arguments.length) { // get
				return _options.loglevel;
			} else if (_options.loglevel != newLoglevel) { // set
				_options.loglevel = newLoglevel;
			}
			return Controller;
		};

		/**
		 * **Get** or **Set** the current enabled state of the controller.  
		 * This can be used to disable all Scenes connected to the controller without destroying or removing them.
		 * @public
		 *
		 * @example
		 * // get the current value
		 * var enabled = controller.enabled();
		 *
		 * // disable the controller
		 * controller.enabled(false);
		 *
		 * @param {boolean} [newState] - The new enabled state of the controller `true` or `false`.
		 * @returns {(boolean|Controller)} Current enabled state or parent object for chaining.
		 */
		this.enabled = function (newState) {
			if (!arguments.length) { // get
				return _enabled;
			} else if (_enabled != newState) { // set
				_enabled = !! newState;
				Controller.updateScene(_sceneObjects, true);
			}
			return Controller;
		};

		/**
		 * Destroy the Controller, all Scenes and everything.
		 * @public
		 *
		 * @example
		 * // without resetting the scenes
		 * controller = controller.destroy();
		 *
		 * // with scene reset
		 * controller = controller.destroy(true);
		 *
		 * @param {boolean} [resetScenes=false] - If `true` the pins and tweens (if existent) of all scenes will be reset.
		 * @returns {null} Null to unset handler variables.
		 */
		this.destroy = function (resetScenes) {
			window.clearTimeout(_refreshTimeout);
			var i = _sceneObjects.length;
			while (i--) {
				_sceneObjects[i].destroy(resetScenes);
			}
			_options.container.removeEventListener("resize", onChange);
			_options.container.removeEventListener("scroll", onChange);
			_util.cAF(_updateTimeout);
			log(3, "destroyed " + NAMESPACE + " (reset: " + (resetScenes ? "true" : "false") + ")");
			return null;
		};

		// INIT
		construct();
		return Controller;
	};

	// store pagewide controller options
	var CONTROLLER_OPTIONS = {
		defaults: {
			container: window,
			vertical: true,
			globalSceneOptions: {},
			loglevel: 2,
			refreshInterval: 100
		}
	};
/*
 * method used to add an option to ScrollMagic Scenes.
 */
	ScrollMagic.Controller.addOption = function (name, defaultValue) {
		CONTROLLER_OPTIONS.defaults[name] = defaultValue;
	};
	// instance extension function for plugins
	ScrollMagic.Controller.extend = function (extension) {
		var oldClass = this;
		ScrollMagic.Controller = function () {
			oldClass.apply(this, arguments);
			this.$super = _util.extend({}, this); // copy parent state
			return extension.apply(this, arguments) || this;
		};
		_util.extend(ScrollMagic.Controller, oldClass); // copy properties
		ScrollMagic.Controller.prototype = oldClass.prototype; // copy prototype
		ScrollMagic.Controller.prototype.constructor = ScrollMagic.Controller; // restore constructor
	};


	/**
	 * A Scene defines where the controller should react and how.
	 *
	 * @class
	 *
	 * @example
	 * // create a standard scene and add it to a controller
	 * new ScrollMagic.Scene()
	 *		.addTo(controller);
	 *
	 * // create a scene with custom options and assign a handler to it.
	 * var scene = new ScrollMagic.Scene({
	 * 		duration: 100,
	 *		offset: 200,
	 *		triggerHook: "onEnter",
	 *		reverse: false
	 * });
	 *
	 * @param {object} [options] - Options for the Scene. The options can be updated at any time.  
	 Instead of setting the options for each scene individually you can also set them globally in the controller as the controllers `globalSceneOptions` option. The object accepts the same properties as the ones below.  
	 When a scene is added to the controller the options defined using the Scene constructor will be overwritten by those set in `globalSceneOptions`.
	 * @param {(number|function)} [options.duration=0] - The duration of the scene. 
	 If `0` tweens will auto-play when reaching the scene start point, pins will be pinned indefinetly starting at the start position.  
	 A function retuning the duration value is also supported. Please see `Scene.duration()` for details.
	 * @param {number} [options.offset=0] - Offset Value for the Trigger Position. If no triggerElement is defined this will be the scroll distance from the start of the page, after which the scene will start.
	 * @param {(string|object)} [options.triggerElement=null] - Selector or DOM object that defines the start of the scene. If undefined the scene will start right at the start of the page (unless an offset is set).
	 * @param {(number|string)} [options.triggerHook="onCenter"] - Can be a number between 0 and 1 defining the position of the trigger Hook in relation to the viewport.  
	 Can also be defined using a string:
	 ** `"onEnter"` => `1`
	 ** `"onCenter"` => `0.5`
	 ** `"onLeave"` => `0`
	 * @param {boolean} [options.reverse=true] - Should the scene reverse, when scrolling up?
	 * @param {number} [options.loglevel=2] - Loglevel for debugging. Note that logging is disabled in the minified version of ScrollMagic.
	 ** `0` => silent
	 ** `1` => errors
	 ** `2` => errors, warnings
	 ** `3` => errors, warnings, debuginfo
	 * 
	 */
	ScrollMagic.Scene = function (options) {

/*
	 * ----------------------------------------------------------------
	 * settings
	 * ----------------------------------------------------------------
	 */

		var
		NAMESPACE = 'ScrollMagic.Scene',
			SCENE_STATE_BEFORE = 'BEFORE',
			SCENE_STATE_DURING = 'DURING',
			SCENE_STATE_AFTER = 'AFTER',
			DEFAULT_OPTIONS = SCENE_OPTIONS.defaults;

/*
	 * ----------------------------------------------------------------
	 * private vars
	 * ----------------------------------------------------------------
	 */

		var
		Scene = this,
			_options = _util.extend({}, DEFAULT_OPTIONS, options),
			_state = SCENE_STATE_BEFORE,
			_progress = 0,
			_scrollOffset = {
				start: 0,
				end: 0
			},
			// reflects the controllers's scroll position for the start and end of the scene respectively
			_triggerPos = 0,
			_enabled = true,
			_durationUpdateMethod, _controller;

		/**
		 * Internal constructor function of the ScrollMagic Scene
		 * @private
		 */
		var construct = function () {
			for (var key in _options) { // check supplied options
				if (!DEFAULT_OPTIONS.hasOwnProperty(key)) {
					log(2, "WARNING: Unknown option \"" + key + "\"");
					delete _options[key];
				}
			}
			// add getters/setters for all possible options
			for (var optionName in DEFAULT_OPTIONS) {
				addSceneOption(optionName);
			}
			// validate all options
			validateOption();
		};

/*
 * ----------------------------------------------------------------
 * Event Management
 * ----------------------------------------------------------------
 */

		var _listeners = {};
		/**
		 * Scene start event.  
		 * Fires whenever the scroll position its the starting point of the scene.  
		 * It will also fire when scrolling back up going over the start position of the scene. If you want something to happen only when scrolling down/right, use the scrollDirection parameter passed to the callback.
		 *
		 * For details on this event and the order in which it is fired, please review the {@link Scene.progress} method.
		 *
		 * @event ScrollMagic.Scene#start
		 *
		 * @example
		 * scene.on("start", function (event) {
		 * 	console.log("Hit start point of scene.");
		 * });
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {Scene} event.target - The Scene object that triggered this event
		 * @property {number} event.progress - Reflects the current progress of the scene
		 * @property {string} event.state - The current state of the scene `"BEFORE"` or `"DURING"`
		 * @property {string} event.scrollDirection - Indicates which way we are scrolling `"PAUSED"`, `"FORWARD"` or `"REVERSE"`
		 */
		/**
		 * Scene end event.  
		 * Fires whenever the scroll position its the ending point of the scene.  
		 * It will also fire when scrolling back up from after the scene and going over its end position. If you want something to happen only when scrolling down/right, use the scrollDirection parameter passed to the callback.
		 *
		 * For details on this event and the order in which it is fired, please review the {@link Scene.progress} method.
		 *
		 * @event ScrollMagic.Scene#end
		 *
		 * @example
		 * scene.on("end", function (event) {
		 * 	console.log("Hit end point of scene.");
		 * });
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {Scene} event.target - The Scene object that triggered this event
		 * @property {number} event.progress - Reflects the current progress of the scene
		 * @property {string} event.state - The current state of the scene `"DURING"` or `"AFTER"`
		 * @property {string} event.scrollDirection - Indicates which way we are scrolling `"PAUSED"`, `"FORWARD"` or `"REVERSE"`
		 */
		/**
		 * Scene enter event.  
		 * Fires whenever the scene enters the "DURING" state.  
		 * Keep in mind that it doesn't matter if the scene plays forward or backward: This event always fires when the scene enters its active scroll timeframe, regardless of the scroll-direction.
		 *
		 * For details on this event and the order in which it is fired, please review the {@link Scene.progress} method.
		 *
		 * @event ScrollMagic.Scene#enter
		 *
		 * @example
		 * scene.on("enter", function (event) {
		 * 	console.log("Scene entered.");
		 * });
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {Scene} event.target - The Scene object that triggered this event
		 * @property {number} event.progress - Reflects the current progress of the scene
		 * @property {string} event.state - The current state of the scene - always `"DURING"`
		 * @property {string} event.scrollDirection - Indicates which way we are scrolling `"PAUSED"`, `"FORWARD"` or `"REVERSE"`
		 */
		/**
		 * Scene leave event.  
		 * Fires whenever the scene's state goes from "DURING" to either "BEFORE" or "AFTER".  
		 * Keep in mind that it doesn't matter if the scene plays forward or backward: This event always fires when the scene leaves its active scroll timeframe, regardless of the scroll-direction.
		 *
		 * For details on this event and the order in which it is fired, please review the {@link Scene.progress} method.
		 *
		 * @event ScrollMagic.Scene#leave
		 *
		 * @example
		 * scene.on("leave", function (event) {
		 * 	console.log("Scene left.");
		 * });
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {Scene} event.target - The Scene object that triggered this event
		 * @property {number} event.progress - Reflects the current progress of the scene
		 * @property {string} event.state - The current state of the scene `"BEFORE"` or `"AFTER"`
		 * @property {string} event.scrollDirection - Indicates which way we are scrolling `"PAUSED"`, `"FORWARD"` or `"REVERSE"`
		 */
		/**
		 * Scene update event.  
		 * Fires whenever the scene is updated (but not necessarily changes the progress).
		 *
		 * @event ScrollMagic.Scene#update
		 *
		 * @example
		 * scene.on("update", function (event) {
		 * 	console.log("Scene updated.");
		 * });
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {Scene} event.target - The Scene object that triggered this event
		 * @property {number} event.startPos - The starting position of the scene (in relation to the conainer)
		 * @property {number} event.endPos - The ending position of the scene (in relation to the conainer)
		 * @property {number} event.scrollPos - The current scroll position of the container
		 */
		/**
		 * Scene progress event.  
		 * Fires whenever the progress of the scene changes.
		 *
		 * For details on this event and the order in which it is fired, please review the {@link Scene.progress} method.
		 *
		 * @event ScrollMagic.Scene#progress
		 *
		 * @example
		 * scene.on("progress", function (event) {
		 * 	console.log("Scene progress changed to " + event.progress);
		 * });
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {Scene} event.target - The Scene object that triggered this event
		 * @property {number} event.progress - Reflects the current progress of the scene
		 * @property {string} event.state - The current state of the scene `"BEFORE"`, `"DURING"` or `"AFTER"`
		 * @property {string} event.scrollDirection - Indicates which way we are scrolling `"PAUSED"`, `"FORWARD"` or `"REVERSE"`
		 */
		/**
		 * Scene change event.  
		 * Fires whenvever a property of the scene is changed.
		 *
		 * @event ScrollMagic.Scene#change
		 *
		 * @example
		 * scene.on("change", function (event) {
		 * 	console.log("Scene Property \"" + event.what + "\" changed to " + event.newval);
		 * });
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {Scene} event.target - The Scene object that triggered this event
		 * @property {string} event.what - Indicates what value has been changed
		 * @property {mixed} event.newval - The new value of the changed property
		 */
		/**
		 * Scene shift event.  
		 * Fires whenvever the start or end **scroll offset** of the scene change.
		 * This happens explicitely, when one of these values change: `offset`, `duration` or `triggerHook`.
		 * It will fire implicitly when the `triggerElement` changes, if the new element has a different position (most cases).
		 * It will also fire implicitly when the size of the container changes and the triggerHook is anything other than `onLeave`.
		 *
		 * @event ScrollMagic.Scene#shift
		 * @since 1.1.0
		 *
		 * @example
		 * scene.on("shift", function (event) {
		 * 	console.log("Scene moved, because the " + event.reason + " has changed.)");
		 * });
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {Scene} event.target - The Scene object that triggered this event
		 * @property {string} event.reason - Indicates why the scene has shifted
		 */
		/**
		 * Scene destroy event.  
		 * Fires whenvever the scene is destroyed.
		 * This can be used to tidy up custom behaviour used in events.
		 *
		 * @event ScrollMagic.Scene#destroy
		 * @since 1.1.0
		 *
		 * @example
		 * scene.on("enter", function (event) {
		 *        // add custom action
		 *        $("#my-elem").left("200");
		 *      })
		 *      .on("destroy", function (event) {
		 *        // reset my element to start position
		 *        if (event.reset) {
		 *          $("#my-elem").left("0");
		 *        }
		 *      });
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {Scene} event.target - The Scene object that triggered this event
		 * @property {boolean} event.reset - Indicates if the destroy method was called with reset `true` or `false`.
		 */
		/**
		 * Scene add event.  
		 * Fires when the scene is added to a controller.
		 * This is mostly used by plugins to know that change might be due.
		 *
		 * @event ScrollMagic.Scene#add
		 * @since 2.0.0
		 *
		 * @example
		 * scene.on("add", function (event) {
		 * 	console.log('Scene was added to a new controller.');
		 * });
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {Scene} event.target - The Scene object that triggered this event
		 * @property {boolean} event.controller - The controller object the scene was added to.
		 */
		/**
		 * Scene remove event.  
		 * Fires when the scene is removed from a controller.
		 * This is mostly used by plugins to know that change might be due.
		 *
		 * @event ScrollMagic.Scene#remove
		 * @since 2.0.0
		 *
		 * @example
		 * scene.on("remove", function (event) {
		 * 	console.log('Scene was removed from its controller.');
		 * });
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {Scene} event.target - The Scene object that triggered this event
		 */

		/**
		 * Add one ore more event listener.  
		 * The callback function will be fired at the respective event, and an object containing relevant data will be passed to the callback.
		 * @method ScrollMagic.Scene#on
		 *
		 * @example
		 * function callback (event) {
		 * 		console.log("Event fired! (" + event.type + ")");
		 * }
		 * // add listeners
		 * scene.on("change update progress start end enter leave", callback);
		 *
		 * @param {string} names - The name or names of the event the callback should be attached to.
		 * @param {function} callback - A function that should be executed, when the event is dispatched. An event object will be passed to the callback.
		 * @returns {Scene} Parent object for chaining.
		 */
		this.on = function (names, callback) {
			if (_util.type.Function(callback)) {
				names = names.trim().split(' ');
				names.forEach(function (fullname) {
					var
					nameparts = fullname.split('.'),
						eventname = nameparts[0],
						namespace = nameparts[1];
					if (eventname != "*") { // disallow wildcards
						if (!_listeners[eventname]) {
							_listeners[eventname] = [];
						}
						_listeners[eventname].push({
							namespace: namespace || '',
							callback: callback
						});
					}
				});
			} else {
				log(1, "ERROR when calling '.on()': Supplied callback for '" + names + "' is not a valid function!");
			}
			return Scene;
		};

		/**
		 * Remove one or more event listener.
		 * @method ScrollMagic.Scene#off
		 *
		 * @example
		 * function callback (event) {
		 * 		console.log("Event fired! (" + event.type + ")");
		 * }
		 * // add listeners
		 * scene.on("change update", callback);
		 * // remove listeners
		 * scene.off("change update", callback);
		 *
		 * @param {string} names - The name or names of the event that should be removed.
		 * @param {function} [callback] - A specific callback function that should be removed. If none is passed all callbacks to the event listener will be removed.
		 * @returns {Scene} Parent object for chaining.
		 */
		this.off = function (names, callback) {
			if (!names) {
				log(1, "ERROR: Invalid event name supplied.");
				return Scene;
			}
			names = names.trim().split(' ');
			names.forEach(function (fullname, key) {
				var
				nameparts = fullname.split('.'),
					eventname = nameparts[0],
					namespace = nameparts[1] || '',
					removeList = eventname === '*' ? Object.keys(_listeners) : [eventname];
				removeList.forEach(function (remove) {
					var
					list = _listeners[remove] || [],
						i = list.length;
					while (i--) {
						var listener = list[i];
						if (listener && (namespace === listener.namespace || namespace === '*') && (!callback || callback == listener.callback)) {
							list.splice(i, 1);
						}
					}
					if (!list.length) {
						delete _listeners[remove];
					}
				});
			});
			return Scene;
		};

		/**
		 * Trigger an event.
		 * @method ScrollMagic.Scene#trigger
		 *
		 * @example
		 * this.trigger("change");
		 *
		 * @param {string} name - The name of the event that should be triggered.
		 * @param {object} [vars] - An object containing info that should be passed to the callback.
		 * @returns {Scene} Parent object for chaining.
		 */
		this.trigger = function (name, vars) {
			if (name) {
				var
				nameparts = name.trim().split('.'),
					eventname = nameparts[0],
					namespace = nameparts[1],
					listeners = _listeners[eventname];
				log(3, 'event fired:', eventname, vars ? "->" : '', vars || '');
				if (listeners) {
					listeners.forEach(function (listener, key) {
						if (!namespace || namespace === listener.namespace) {
							listener.callback.call(Scene, new ScrollMagic.Event(eventname, listener.namespace, Scene, vars));
						}
					});
				}
			} else {
				log(1, "ERROR: Invalid event name supplied.");
			}
			return Scene;
		};

		// set event listeners
		Scene.on("change.internal", function (e) {
			if (e.what !== "loglevel" && e.what !== "tweenChanges") { // no need for a scene update scene with these options...
				if (e.what === "triggerElement") {
					updateTriggerElementPosition();
				} else if (e.what === "reverse") { // the only property left that may have an impact on the current scene state. Everything else is handled by the shift event.
					Scene.update();
				}
			}
		}).on("shift.internal", function (e) {
			updateScrollOffset();
			Scene.update(); // update scene to reflect new position
		});

		/**
		 * Send a debug message to the console.
		 * @private
		 * but provided publicly with _log for plugins
		 *
		 * @param {number} loglevel - The loglevel required to initiate output for the message.
		 * @param {...mixed} output - One or more variables that should be passed to the console.
		 */
		var log = this._log = function (loglevel, output) {
			if (_options.loglevel >= loglevel) {
				Array.prototype.splice.call(arguments, 1, 0, "(" + NAMESPACE + ") ->");
				_util.log.apply(window, arguments);
			}
		};

		/**
		 * Add the scene to a controller.  
		 * This is the equivalent to `Controller.addScene(scene)`.
		 * @method ScrollMagic.Scene#addTo
		 *
		 * @example
		 * // add a scene to a ScrollMagic Controller
		 * scene.addTo(controller);
		 *
		 * @param {ScrollMagic.Controller} controller - The controller to which the scene should be added.
		 * @returns {Scene} Parent object for chaining.
		 */
		this.addTo = function (controller) {
			if (!(controller instanceof ScrollMagic.Controller)) {
				log(1, "ERROR: supplied argument of 'addTo()' is not a valid ScrollMagic Controller");
			} else if (_controller != controller) {
				// new controller
				if (_controller) { // was associated to a different controller before, so remove it...
					_controller.removeScene(Scene);
				}
				_controller = controller;
				validateOption();
				updateDuration(true);
				updateTriggerElementPosition(true);
				updateScrollOffset();
				_controller.info("container").addEventListener('resize', onContainerResize);
				controller.addScene(Scene);
				Scene.trigger("add", {
					controller: _controller
				});
				log(3, "added " + NAMESPACE + " to controller");
				Scene.update();
			}
			return Scene;
		};

		/**
		 * **Get** or **Set** the current enabled state of the scene.  
		 * This can be used to disable this scene without removing or destroying it.
		 * @method ScrollMagic.Scene#enabled
		 *
		 * @example
		 * // get the current value
		 * var enabled = scene.enabled();
		 *
		 * // disable the scene
		 * scene.enabled(false);
		 *
		 * @param {boolean} [newState] - The new enabled state of the scene `true` or `false`.
		 * @returns {(boolean|Scene)} Current enabled state or parent object for chaining.
		 */
		this.enabled = function (newState) {
			if (!arguments.length) { // get
				return _enabled;
			} else if (_enabled != newState) { // set
				_enabled = !! newState;
				Scene.update(true);
			}
			return Scene;
		};

		/**
		 * Remove the scene from the controller.  
		 * This is the equivalent to `Controller.removeScene(scene)`.
		 * The scene will not be updated anymore until you readd it to a controller.
		 * To remove the pin or the tween you need to call removeTween() or removePin() respectively.
		 * @method ScrollMagic.Scene#remove
		 * @example
		 * // remove the scene from its controller
		 * scene.remove();
		 *
		 * @returns {Scene} Parent object for chaining.
		 */
		this.remove = function () {
			if (_controller) {
				_controller.info("container").removeEventListener('resize', onContainerResize);
				var tmpParent = _controller;
				_controller = undefined;
				tmpParent.removeScene(Scene);
				Scene.trigger("remove");
				log(3, "removed " + NAMESPACE + " from controller");
			}
			return Scene;
		};

		/**
		 * Destroy the scene and everything.
		 * @method ScrollMagic.Scene#destroy
		 * @example
		 * // destroy the scene without resetting the pin and tween to their initial positions
		 * scene = scene.destroy();
		 *
		 * // destroy the scene and reset the pin and tween
		 * scene = scene.destroy(true);
		 *
		 * @param {boolean} [reset=false] - If `true` the pin and tween (if existent) will be reset.
		 * @returns {null} Null to unset handler variables.
		 */
		this.destroy = function (reset) {
			Scene.trigger("destroy", {
				reset: reset
			});
			Scene.remove();
			Scene.off("*.*");
			log(3, "destroyed " + NAMESPACE + " (reset: " + (reset ? "true" : "false") + ")");
			return null;
		};


		/**
		 * Updates the Scene to reflect the current state.  
		 * This is the equivalent to `Controller.updateScene(scene, immediately)`.  
		 * The update method calculates the scene's start and end position (based on the trigger element, trigger hook, duration and offset) and checks it against the current scroll position of the container.  
		 * It then updates the current scene state accordingly (or does nothing, if the state is already correct) – Pins will be set to their correct position and tweens will be updated to their correct progress.
		 * This means an update doesn't necessarily result in a progress change. The `progress` event will be fired if the progress has indeed changed between this update and the last.  
		 * _**NOTE:** This method gets called constantly whenever ScrollMagic detects a change. The only application for you is if you change something outside of the realm of ScrollMagic, like moving the trigger or changing tween parameters._
		 * @method ScrollMagic.Scene#update
		 * @example
		 * // update the scene on next tick
		 * scene.update();
		 *
		 * // update the scene immediately
		 * scene.update(true);
		 *
		 * @fires Scene.update
		 *
		 * @param {boolean} [immediately=false] - If `true` the update will be instant, if `false` it will wait until next update cycle (better performance).
		 * @returns {Scene} Parent object for chaining.
		 */
		this.update = function (immediately) {
			if (_controller) {
				if (immediately) {
					if (_controller.enabled() && _enabled) {
						var
						scrollPos = _controller.info("scrollPos"),
							newProgress;

						if (_options.duration > 0) {
							newProgress = (scrollPos - _scrollOffset.start) / (_scrollOffset.end - _scrollOffset.start);
						} else {
							newProgress = scrollPos >= _scrollOffset.start ? 1 : 0;
						}

						Scene.trigger("update", {
							startPos: _scrollOffset.start,
							endPos: _scrollOffset.end,
							scrollPos: scrollPos
						});

						Scene.progress(newProgress);
					} else if (_pin && _state === SCENE_STATE_DURING) {
						updatePinState(true); // unpin in position
					}
				} else {
					_controller.updateScene(Scene, false);
				}
			}
			return Scene;
		};

		/**
		 * Updates dynamic scene variables like the trigger element position or the duration.
		 * This method is automatically called in regular intervals from the controller. See {@link ScrollMagic.Controller} option `refreshInterval`.
		 * 
		 * You can call it to minimize lag, for example when you intentionally change the position of the triggerElement.
		 * If you don't it will simply be updated in the next refresh interval of the container, which is usually sufficient.
		 *
		 * @method ScrollMagic.Scene#refresh
		 * @since 1.1.0
		 * @example
		 * scene = new ScrollMagic.Scene({triggerElement: "#trigger"});
		 * 
		 * // change the position of the trigger
		 * $("#trigger").css("top", 500);
		 * // immediately let the scene know of this change
		 * scene.refresh();
		 *
		 * @fires {@link Scene.shift}, if the trigger element position or the duration changed
		 * @fires {@link Scene.change}, if the duration changed
		 *
		 * @returns {Scene} Parent object for chaining.
		 */
		this.refresh = function () {
			updateDuration();
			updateTriggerElementPosition();
			// update trigger element position
			return Scene;
		};

		/**
		 * **Get** or **Set** the scene's progress.  
		 * Usually it shouldn't be necessary to use this as a setter, as it is set automatically by scene.update().  
		 * The order in which the events are fired depends on the duration of the scene:
		 *  1. Scenes with `duration == 0`:  
		 *  Scenes that have no duration by definition have no ending. Thus the `end` event will never be fired.  
		 *  When the trigger position of the scene is passed the events are always fired in this order:  
		 *  `enter`, `start`, `progress` when scrolling forward  
		 *  and  
		 *  `progress`, `start`, `leave` when scrolling in reverse
		 *  2. Scenes with `duration > 0`:  
		 *  Scenes with a set duration have a defined start and end point.  
		 *  When scrolling past the start position of the scene it will fire these events in this order:  
		 *  `enter`, `start`, `progress`  
		 *  When continuing to scroll and passing the end point it will fire these events:  
		 *  `progress`, `end`, `leave`  
		 *  When reversing through the end point these events are fired:  
		 *  `enter`, `end`, `progress`  
		 *  And when continuing to scroll past the start position in reverse it will fire:  
		 *  `progress`, `start`, `leave`  
		 *  In between start and end the `progress` event will be called constantly, whenever the progress changes.
		 * 
		 * In short:  
		 * `enter` events will always trigger **before** the progress update and `leave` envents will trigger **after** the progress update.  
		 * `start` and `end` will always trigger at their respective position.
		 * 
		 * Please review the event descriptions for details on the events and the event object that is passed to the callback.
		 * 
		 * @method ScrollMagic.Scene#progress
		 * @example
		 * // get the current scene progress
		 * var progress = scene.progress();
		 *
		 * // set new scene progress
		 * scene.progress(0.3);
		 *
		 * @fires {@link Scene.enter}, when used as setter
		 * @fires {@link Scene.start}, when used as setter
		 * @fires {@link Scene.progress}, when used as setter
		 * @fires {@link Scene.end}, when used as setter
		 * @fires {@link Scene.leave}, when used as setter
		 *
		 * @param {number} [progress] - The new progress value of the scene `[0-1]`.
		 * @returns {number} `get` -  Current scene progress.
		 * @returns {Scene} `set` -  Parent object for chaining.
		 */
		this.progress = function (progress) {
			if (!arguments.length) { // get
				return _progress;
			} else { // set
				var
				doUpdate = false,
					oldState = _state,
					scrollDirection = _controller ? _controller.info("scrollDirection") : 'PAUSED',
					reverseOrForward = _options.reverse || progress >= _progress;
				if (_options.duration === 0) {
					// zero duration scenes
					doUpdate = _progress != progress;
					_progress = progress < 1 && reverseOrForward ? 0 : 1;
					_state = _progress === 0 ? SCENE_STATE_BEFORE : SCENE_STATE_DURING;
				} else {
					// scenes with start and end
					if (progress < 0 && _state !== SCENE_STATE_BEFORE && reverseOrForward) {
						// go back to initial state
						_progress = 0;
						_state = SCENE_STATE_BEFORE;
						doUpdate = true;
					} else if (progress >= 0 && progress < 1 && reverseOrForward) {
						_progress = progress;
						_state = SCENE_STATE_DURING;
						doUpdate = true;
					} else if (progress >= 1 && _state !== SCENE_STATE_AFTER) {
						_progress = 1;
						_state = SCENE_STATE_AFTER;
						doUpdate = true;
					} else if (_state === SCENE_STATE_DURING && !reverseOrForward) {
						updatePinState(); // in case we scrolled backwards mid-scene and reverse is disabled => update the pin position, so it doesn't move back as well.
					}
				}
				if (doUpdate) {
					// fire events
					var
					eventVars = {
						progress: _progress,
						state: _state,
						scrollDirection: scrollDirection
					},
						stateChanged = _state != oldState;

					var trigger = function (eventName) { // tmp helper to simplify code
						Scene.trigger(eventName, eventVars);
					};

					if (stateChanged) { // enter events
						if (oldState !== SCENE_STATE_DURING) {
							trigger("enter");
							trigger(oldState === SCENE_STATE_BEFORE ? "start" : "end");
						}
					}
					trigger("progress");
					if (stateChanged) { // leave events
						if (_state !== SCENE_STATE_DURING) {
							trigger(_state === SCENE_STATE_BEFORE ? "start" : "end");
							trigger("leave");
						}
					}
				}

				return Scene;
			}
		};


		/**
		 * Update the start and end scrollOffset of the container.
		 * The positions reflect what the controller's scroll position will be at the start and end respectively.
		 * Is called, when:
		 *   - Scene event "change" is called with: offset, triggerHook, duration 
		 *   - scroll container event "resize" is called
		 *   - the position of the triggerElement changes
		 *   - the controller changes -> addTo()
		 * @private
		 */
		var updateScrollOffset = function () {
			_scrollOffset = {
				start: _triggerPos + _options.offset
			};
			if (_controller && _options.triggerElement) {
				// take away triggerHook portion to get relative to top
				_scrollOffset.start -= _controller.info("size") * _options.triggerHook;
			}
			_scrollOffset.end = _scrollOffset.start + _options.duration;
		};

		/**
		 * Updates the duration if set to a dynamic function.
		 * This method is called when the scene is added to a controller and in regular intervals from the controller through scene.refresh().
		 * 
		 * @fires {@link Scene.change}, if the duration changed
		 * @fires {@link Scene.shift}, if the duration changed
		 *
		 * @param {boolean} [suppressEvents=false] - If true the shift event will be suppressed.
		 * @private
		 */
		var updateDuration = function (suppressEvents) {
			// update duration
			if (_durationUpdateMethod) {
				var varname = "duration";
				if (changeOption(varname, _durationUpdateMethod.call(Scene)) && !suppressEvents) { // set
					Scene.trigger("change", {
						what: varname,
						newval: _options[varname]
					});
					Scene.trigger("shift", {
						reason: varname
					});
				}
			}
		};

		/**
		 * Updates the position of the triggerElement, if present.
		 * This method is called ...
		 *  - ... when the triggerElement is changed
		 *  - ... when the scene is added to a (new) controller
		 *  - ... in regular intervals from the controller through scene.refresh().
		 * 
		 * @fires {@link Scene.shift}, if the position changed
		 *
		 * @param {boolean} [suppressEvents=false] - If true the shift event will be suppressed.
		 * @private
		 */
		var updateTriggerElementPosition = function (suppressEvents) {
			var
			elementPos = 0,
				telem = _options.triggerElement;
			if (_controller && (telem || _triggerPos > 0)) { // either an element exists or was removed and the triggerPos is still > 0
				if (telem) { // there currently a triggerElement set
					if (telem.parentNode) { // check if element is still attached to DOM
						var
						controllerInfo = _controller.info(),
							containerOffset = _util.get.offset(controllerInfo.container),
							// container position is needed because element offset is returned in relation to document, not in relation to container.
							param = controllerInfo.vertical ? "top" : "left"; // which param is of interest ?
						// if parent is spacer, use spacer position instead so correct start position is returned for pinned elements.
						while (telem.parentNode.hasAttribute(PIN_SPACER_ATTRIBUTE)) {
							telem = telem.parentNode;
						}

						var elementOffset = _util.get.offset(telem);

						if (!controllerInfo.isDocument) { // container is not the document root, so substract scroll Position to get correct trigger element position relative to scrollcontent
							containerOffset[param] -= _controller.scrollPos();
						}

						elementPos = elementOffset[param] - containerOffset[param];

					} else { // there was an element, but it was removed from DOM
						log(2, "WARNING: triggerElement was removed from DOM and will be reset to", undefined);
						Scene.triggerElement(undefined); // unset, so a change event is triggered
					}
				}

				var changed = elementPos != _triggerPos;
				_triggerPos = elementPos;
				if (changed && !suppressEvents) {
					Scene.trigger("shift", {
						reason: "triggerElementPosition"
					});
				}
			}
		};

		/**
		 * Trigger a shift event, when the container is resized and the triggerHook is > 1.
		 * @private
		 */
		var onContainerResize = function (e) {
			if (_options.triggerHook > 0) {
				Scene.trigger("shift", {
					reason: "containerResize"
				});
			}
		};


		var _validate = _util.extend(SCENE_OPTIONS.validate, {
			// validation for duration handled internally for reference to private var _durationMethod
			duration: function (val) {
				if (_util.type.String(val) && val.match(/^(\.|\d)*\d+%$/)) {
					// percentage value
					var perc = parseFloat(val) / 100;
					val = function () {
						return _controller ? _controller.info("size") * perc : 0;
					};
				}
				if (_util.type.Function(val)) {
					// function
					_durationUpdateMethod = val;
					try {
						val = parseFloat(_durationUpdateMethod());
					} catch (e) {
						val = -1; // will cause error below
					}
				}
				// val has to be float
				val = parseFloat(val);
				if (!_util.type.Number(val) || val < 0) {
					if (_durationUpdateMethod) {
						_durationUpdateMethod = undefined;
						throw ["Invalid return value of supplied function for option \"duration\":", val];
					} else {
						throw ["Invalid value for option \"duration\":", val];
					}
				}
				return val;
			}
		});

		/**
		 * Checks the validity of a specific or all options and reset to default if neccessary.
		 * @private
		 */
		var validateOption = function (check) {
			check = arguments.length ? [check] : Object.keys(_validate);
			check.forEach(function (optionName, key) {
				var value;
				if (_validate[optionName]) { // there is a validation method for this option
					try { // validate value
						value = _validate[optionName](_options[optionName]);
					} catch (e) { // validation failed -> reset to default
						value = DEFAULT_OPTIONS[optionName];
						var logMSG = _util.type.String(e) ? [e] : e;
						if (_util.type.Array(logMSG)) {
							logMSG[0] = "ERROR: " + logMSG[0];
							logMSG.unshift(1); // loglevel 1 for error msg
							log.apply(this, logMSG);
						} else {
							log(1, "ERROR: Problem executing validation callback for option '" + optionName + "':", e.message);
						}
					} finally {
						_options[optionName] = value;
					}
				}
			});
		};

		/**
		 * Helper used by the setter/getters for scene options
		 * @private
		 */
		var changeOption = function (varname, newval) {
			var
			changed = false,
				oldval = _options[varname];
			if (_options[varname] != newval) {
				_options[varname] = newval;
				validateOption(varname); // resets to default if necessary
				changed = oldval != _options[varname];
			}
			return changed;
		};

		// generate getters/setters for all options
		var addSceneOption = function (optionName) {
			if (!Scene[optionName]) {
				Scene[optionName] = function (newVal) {
					if (!arguments.length) { // get
						return _options[optionName];
					} else {
						if (optionName === "duration") { // new duration is set, so any previously set function must be unset
							_durationUpdateMethod = undefined;
						}
						if (changeOption(optionName, newVal)) { // set
							Scene.trigger("change", {
								what: optionName,
								newval: _options[optionName]
							});
							if (SCENE_OPTIONS.shifts.indexOf(optionName) > -1) {
								Scene.trigger("shift", {
									reason: optionName
								});
							}
						}
					}
					return Scene;
				};
			}
		};

		/**
		 * **Get** or **Set** the duration option value.
		 * As a setter it also accepts a function returning a numeric value.  
		 * This is particularly useful for responsive setups.
		 *
		 * The duration is updated using the supplied function every time `Scene.refresh()` is called, which happens periodically from the controller (see ScrollMagic.Controller option `refreshInterval`).  
		 * _**NOTE:** Be aware that it's an easy way to kill performance, if you supply a function that has high CPU demand.  
		 * Even for size and position calculations it is recommended to use a variable to cache the value. (see example)  
		 * This counts double if you use the same function for multiple scenes._
		 *
		 * @method ScrollMagic.Scene#duration
		 * @example
		 * // get the current duration value
		 * var duration = scene.duration();
		 *
		 * // set a new duration
		 * scene.duration(300);
		 *
		 * // use a function to automatically adjust the duration to the window height.
		 * var durationValueCache;
		 * function getDuration () {
		 *   return durationValueCache;
		 * }
		 * function updateDuration (e) {
		 *   durationValueCache = window.innerHeight;
		 * }
		 * $(window).on("resize", updateDuration); // update the duration when the window size changes
		 * $(window).triggerHandler("resize"); // set to initial value
		 * scene.duration(getDuration); // supply duration method
		 *
		 * @fires {@link Scene.change}, when used as setter
		 * @fires {@link Scene.shift}, when used as setter
		 * @param {(number|function)} [newDuration] - The new duration of the scene.
		 * @returns {number} `get` -  Current scene duration.
		 * @returns {Scene} `set` -  Parent object for chaining.
		 */

		/**
		 * **Get** or **Set** the offset option value.
		 * @method ScrollMagic.Scene#offset
		 * @example
		 * // get the current offset
		 * var offset = scene.offset();
		 *
		 * // set a new offset
		 * scene.offset(100);
		 *
		 * @fires {@link Scene.change}, when used as setter
		 * @fires {@link Scene.shift}, when used as setter
		 * @param {number} [newOffset] - The new offset of the scene.
		 * @returns {number} `get` -  Current scene offset.
		 * @returns {Scene} `set` -  Parent object for chaining.
		 */

		/**
		 * **Get** or **Set** the triggerElement option value.
		 * Does **not** fire `Scene.shift`, because changing the trigger Element doesn't necessarily mean the start position changes. This will be determined in `Scene.refresh()`, which is automatically triggered.
		 * @method ScrollMagic.Scene#triggerElement
		 * @example
		 * // get the current triggerElement
		 * var triggerElement = scene.triggerElement();
		 *
		 * // set a new triggerElement using a selector
		 * scene.triggerElement("#trigger");
		 * // set a new triggerElement using a DOM object
		 * scene.triggerElement(document.getElementById("trigger"));
		 *
		 * @fires {@link Scene.change}, when used as setter
		 * @param {(string|object)} [newTriggerElement] - The new trigger element for the scene.
		 * @returns {(string|object)} `get` -  Current triggerElement.
		 * @returns {Scene} `set` -  Parent object for chaining.
		 */

		/**
		 * **Get** or **Set** the triggerHook option value.
		 * @method ScrollMagic.Scene#triggerHook
		 * @example
		 * // get the current triggerHook value
		 * var triggerHook = scene.triggerHook();
		 *
		 * // set a new triggerHook using a string
		 * scene.triggerHook("onLeave");
		 * // set a new triggerHook using a number
		 * scene.triggerHook(0.7);
		 *
		 * @fires {@link Scene.change}, when used as setter
		 * @fires {@link Scene.shift}, when used as setter
		 * @param {(number|string)} [newTriggerHook] - The new triggerHook of the scene. See {@link Scene} parameter description for value options.
		 * @returns {number} `get` -  Current triggerHook (ALWAYS numerical).
		 * @returns {Scene} `set` -  Parent object for chaining.
		 */

		/**
		 * **Get** or **Set** the reverse option value.
		 * @method ScrollMagic.Scene#reverse
		 * @example
		 * // get the current reverse option
		 * var reverse = scene.reverse();
		 *
		 * // set new reverse option
		 * scene.reverse(false);
		 *
		 * @fires {@link Scene.change}, when used as setter
		 * @param {boolean} [newReverse] - The new reverse setting of the scene.
		 * @returns {boolean} `get` -  Current reverse option value.
		 * @returns {Scene} `set` -  Parent object for chaining.
		 */

		/**
		 * **Get** or **Set** the loglevel option value.
		 * @method ScrollMagic.Scene#loglevel
		 * @example
		 * // get the current loglevel
		 * var loglevel = scene.loglevel();
		 *
		 * // set new loglevel
		 * scene.loglevel(3);
		 *
		 * @fires {@link Scene.change}, when used as setter
		 * @param {number} [newLoglevel] - The new loglevel setting of the scene. `[0-3]`
		 * @returns {number} `get` -  Current loglevel.
		 * @returns {Scene} `set` -  Parent object for chaining.
		 */

		/**
		 * **Get** the associated controller.
		 * @method ScrollMagic.Scene#controller
		 * @example
		 * // get the controller of a scene
		 * var controller = scene.controller();
		 *
		 * @returns {ScrollMagic.Controller} Parent controller or `undefined`
		 */
		this.controller = function () {
			return _controller;
		};

		/**
		 * **Get** the current state.
		 * @method ScrollMagic.Scene#state
		 * @example
		 * // get the current state
		 * var state = scene.state();
		 *
		 * @returns {string} `"BEFORE"`, `"DURING"` or `"AFTER"`
		 */
		this.state = function () {
			return _state;
		};

		/**
		 * **Get** the current scroll offset for the start of the scene.  
		 * Mind, that the scrollOffset is related to the size of the container, if `triggerHook` is bigger than `0` (or `"onLeave"`).  
		 * This means, that resizing the container or changing the `triggerHook` will influence the scene's start offset.
		 * @method ScrollMagic.Scene#scrollOffset
		 * @example
		 * // get the current scroll offset for the start and end of the scene.
		 * var start = scene.scrollOffset();
		 * var end = scene.scrollOffset() + scene.duration();
		 * console.log("the scene starts at", start, "and ends at", end);
		 *
		 * @returns {number} The scroll offset (of the container) at which the scene will trigger. Y value for vertical and X value for horizontal scrolls.
		 */
		this.scrollOffset = function () {
			return _scrollOffset.start;
		};

		/**
		 * **Get** the trigger position of the scene (including the value of the `offset` option).  
		 * @method ScrollMagic.Scene#triggerPosition
		 * @example
		 * // get the scene's trigger position
		 * var triggerPosition = scene.triggerPosition();
		 *
		 * @returns {number} Start position of the scene. Top position value for vertical and left position value for horizontal scrolls.
		 */
		this.triggerPosition = function () {
			var pos = _options.offset; // the offset is the basis
			if (_controller) {
				// get the trigger position
				if (_options.triggerElement) {
					// Element as trigger
					pos += _triggerPos;
				} else {
					// return the height of the triggerHook to start at the beginning
					pos += _controller.info("size") * Scene.triggerHook();
				}
			}
			return pos;
		};

		var
		_pin, _pinOptions;

		Scene.on("shift.internal", function (e) {
			var durationChanged = e.reason === "duration";
			if ((_state === SCENE_STATE_AFTER && durationChanged) || (_state === SCENE_STATE_DURING && _options.duration === 0)) {
				// if [duration changed after a scene (inside scene progress updates pin position)] or [duration is 0, we are in pin phase and some other value changed].
				updatePinState();
			}
			if (durationChanged) {
				updatePinDimensions();
			}
		}).on("progress.internal", function (e) {
			updatePinState();
		}).on("add.internal", function (e) {
			updatePinDimensions();
		}).on("destroy.internal", function (e) {
			Scene.removePin(e.reset);
		});
		/**
		 * Update the pin state.
		 * @private
		 */
		var updatePinState = function (forceUnpin) {
			if (_pin && _controller) {
				var
				containerInfo = _controller.info(),
					pinTarget = _pinOptions.spacer.firstChild; // may be pin element or another spacer, if cascading pins
				if (!forceUnpin && _state === SCENE_STATE_DURING) { // during scene or if duration is 0 and we are past the trigger
					// pinned state
					if (_util.css(pinTarget, "position") != "fixed") {
						// change state before updating pin spacer (position changes due to fixed collapsing might occur.)
						_util.css(pinTarget, {
							"position": "fixed"
						});
						// update pin spacer
						updatePinDimensions();
					}

					var
					fixedPos = _util.get.offset(_pinOptions.spacer, true),
						// get viewport position of spacer
						scrollDistance = _options.reverse || _options.duration === 0 ? containerInfo.scrollPos - _scrollOffset.start // quicker
						: Math.round(_progress * _options.duration * 10) / 10; // if no reverse and during pin the position needs to be recalculated using the progress
					// add scrollDistance
					fixedPos[containerInfo.vertical ? "top" : "left"] += scrollDistance;

					// set new values
					_util.css(_pinOptions.spacer.firstChild, {
						top: fixedPos.top,
						left: fixedPos.left
					});
				} else {
					// unpinned state
					var
					newCSS = {
						position: _pinOptions.inFlow ? "relative" : "absolute",
						top: 0,
						left: 0
					},
						change = _util.css(pinTarget, "position") != newCSS.position;

					if (!_pinOptions.pushFollowers) {
						newCSS[containerInfo.vertical ? "top" : "left"] = _options.duration * _progress;
					} else if (_options.duration > 0) { // only concerns scenes with duration
						if (_state === SCENE_STATE_AFTER && parseFloat(_util.css(_pinOptions.spacer, "padding-top")) === 0) {
							change = true; // if in after state but havent updated spacer yet (jumped past pin)
						} else if (_state === SCENE_STATE_BEFORE && parseFloat(_util.css(_pinOptions.spacer, "padding-bottom")) === 0) { // before
							change = true; // jumped past fixed state upward direction
						}
					}
					// set new values
					_util.css(pinTarget, newCSS);
					if (change) {
						// update pin spacer if state changed
						updatePinDimensions();
					}
				}
			}
		};

		/**
		 * Update the pin spacer and/or element size.
		 * The size of the spacer needs to be updated whenever the duration of the scene changes, if it is to push down following elements.
		 * @private
		 */
		var updatePinDimensions = function () {
			if (_pin && _controller && _pinOptions.inFlow) { // no spacerresize, if original position is absolute
				var
				after = (_state === SCENE_STATE_AFTER),
					before = (_state === SCENE_STATE_BEFORE),
					during = (_state === SCENE_STATE_DURING),
					vertical = _controller.info("vertical"),
					pinTarget = _pinOptions.spacer.firstChild,
					// usually the pined element but can also be another spacer (cascaded pins)
					marginCollapse = _util.isMarginCollapseType(_util.css(_pinOptions.spacer, "display")),
					css = {};

				// set new size
				// if relsize: spacer -> pin | else: pin -> spacer
				if (_pinOptions.relSize.width || _pinOptions.relSize.autoFullWidth) {
					if (during) {
						_util.css(_pin, {
							"width": _util.get.width(_pinOptions.spacer)
						});
					} else {
						_util.css(_pin, {
							"width": "100%"
						});
					}
				} else {
					// minwidth is needed for cascaded pins.
					css["min-width"] = _util.get.width(vertical ? _pin : pinTarget, true, true);
					css.width = during ? css["min-width"] : "auto";
				}
				if (_pinOptions.relSize.height) {
					if (during) {
						// the only padding the spacer should ever include is the duration (if pushFollowers = true), so we need to substract that.
						_util.css(_pin, {
							"height": _util.get.height(_pinOptions.spacer) - (_pinOptions.pushFollowers ? _options.duration : 0)
						});
					} else {
						_util.css(_pin, {
							"height": "100%"
						});
					}
				} else {
					// margin is only included if it's a cascaded pin to resolve an IE9 bug
					css["min-height"] = _util.get.height(vertical ? pinTarget : _pin, true, !marginCollapse); // needed for cascading pins
					css.height = during ? css["min-height"] : "auto";
				}

				// add space for duration if pushFollowers is true
				if (_pinOptions.pushFollowers) {
					css["padding" + (vertical ? "Top" : "Left")] = _options.duration * _progress;
					css["padding" + (vertical ? "Bottom" : "Right")] = _options.duration * (1 - _progress);
				}
				_util.css(_pinOptions.spacer, css);
			}
		};

		/**
		 * Updates the Pin state (in certain scenarios)
		 * If the controller container is not the document and we are mid-pin-phase scrolling or resizing the main document can result to wrong pin positions.
		 * So this function is called on resize and scroll of the document.
		 * @private
		 */
		var updatePinInContainer = function () {
			if (_controller && _pin && _state === SCENE_STATE_DURING && !_controller.info("isDocument")) {
				updatePinState();
			}
		};

		/**
		 * Updates the Pin spacer size state (in certain scenarios)
		 * If container is resized during pin and relatively sized the size of the pin might need to be updated...
		 * So this function is called on resize of the container.
		 * @private
		 */
		var updateRelativePinSpacer = function () {
			if (_controller && _pin && // well, duh
			_state === SCENE_STATE_DURING && // element in pinned state?
			( // is width or height relatively sized, but not in relation to body? then we need to recalc.
			((_pinOptions.relSize.width || _pinOptions.relSize.autoFullWidth) && _util.get.width(window) != _util.get.width(_pinOptions.spacer.parentNode)) || (_pinOptions.relSize.height && _util.get.height(window) != _util.get.height(_pinOptions.spacer.parentNode)))) {
				updatePinDimensions();
			}
		};

		/**
		 * Is called, when the mousewhel is used while over a pinned element inside a div container.
		 * If the scene is in fixed state scroll events would be counted towards the body. This forwards the event to the scroll container.
		 * @private
		 */
		var onMousewheelOverPin = function (e) {
			if (_controller && _pin && _state === SCENE_STATE_DURING && !_controller.info("isDocument")) { // in pin state
				e.preventDefault();
				_controller._setScrollPos(_controller.info("scrollPos") - ((e.wheelDelta || e[_controller.info("vertical") ? "wheelDeltaY" : "wheelDeltaX"]) / 3 || -e.detail * 30));
			}
		};

		/**
		 * Pin an element for the duration of the tween.  
		 * If the scene duration is 0 the element will only be unpinned, if the user scrolls back past the start position.  
		 * Make sure only one pin is applied to an element at the same time.
		 * An element can be pinned multiple times, but only successively.
		 * _**NOTE:** The option `pushFollowers` has no effect, when the scene duration is 0._
		 * @method ScrollMagic.Scene#setPin
		 * @example
		 * // pin element and push all following elements down by the amount of the pin duration.
		 * scene.setPin("#pin");
		 *
		 * // pin element and keeping all following elements in their place. The pinned element will move past them.
		 * scene.setPin("#pin", {pushFollowers: false});
		 *
		 * @param {(string|object)} element - A Selector targeting an element or a DOM object that is supposed to be pinned.
		 * @param {object} [settings] - settings for the pin
		 * @param {boolean} [settings.pushFollowers=true] - If `true` following elements will be "pushed" down for the duration of the pin, if `false` the pinned element will just scroll past them.  
		 Ignored, when duration is `0`.
		 * @param {string} [settings.spacerClass="scrollmagic-pin-spacer"] - Classname of the pin spacer element, which is used to replace the element.
		 *
		 * @returns {Scene} Parent object for chaining.
		 */
		this.setPin = function (element, settings) {
			var
			defaultSettings = {
				pushFollowers: true,
				spacerClass: "scrollmagic-pin-spacer"
			};
			settings = _util.extend({}, defaultSettings, settings);

			// validate Element
			element = _util.get.elements(element)[0];
			if (!element) {
				log(1, "ERROR calling method 'setPin()': Invalid pin element supplied.");
				return Scene; // cancel
			} else if (_util.css(element, "position") === "fixed") {
				log(1, "ERROR calling method 'setPin()': Pin does not work with elements that are positioned 'fixed'.");
				return Scene; // cancel
			}

			if (_pin) { // preexisting pin?
				if (_pin === element) {
					// same pin we already have -> do nothing
					return Scene; // cancel
				} else {
					// kill old pin
					Scene.removePin();
				}

			}
			_pin = element;

			var
			parentDisplay = _pin.parentNode.style.display,
				boundsParams = ["top", "left", "bottom", "right", "margin", "marginLeft", "marginRight", "marginTop", "marginBottom"];

			_pin.parentNode.style.display = 'none'; // hack start to force css to return stylesheet values instead of calculated px values.
			var
			inFlow = _util.css(_pin, "position") != "absolute",
				pinCSS = _util.css(_pin, boundsParams.concat(["display"])),
				sizeCSS = _util.css(_pin, ["width", "height"]);
			_pin.parentNode.style.display = parentDisplay; // hack end.
			if (!inFlow && settings.pushFollowers) {
				log(2, "WARNING: If the pinned element is positioned absolutely pushFollowers will be disabled.");
				settings.pushFollowers = false;
			}
			window.setTimeout(function () { // wait until all finished, because with responsive duration it will only be set after scene is added to controller
				if (_pin && _options.duration === 0 && settings.pushFollowers) {
					log(2, "WARNING: pushFollowers =", true, "has no effect, when scene duration is 0.");
				}
			}, 0);

			// create spacer and insert
			var
			spacer = _pin.parentNode.insertBefore(document.createElement('div'), _pin),
				spacerCSS = _util.extend(pinCSS, {
					position: inFlow ? "relative" : "absolute",
					boxSizing: "content-box",
					mozBoxSizing: "content-box",
					webkitBoxSizing: "content-box"
				});

			if (!inFlow) { // copy size if positioned absolutely, to work for bottom/right positioned elements.
				_util.extend(spacerCSS, _util.css(_pin, ["width", "height"]));
			}

			_util.css(spacer, spacerCSS);
			spacer.setAttribute(PIN_SPACER_ATTRIBUTE, "");
			_util.addClass(spacer, settings.spacerClass);

			// set the pin Options
			_pinOptions = {
				spacer: spacer,
				relSize: { // save if size is defined using % values. if so, handle spacer resize differently...
					width: sizeCSS.width.slice(-1) === "%",
					height: sizeCSS.height.slice(-1) === "%",
					autoFullWidth: sizeCSS.width === "auto" && inFlow && _util.isMarginCollapseType(pinCSS.display)
				},
				pushFollowers: settings.pushFollowers,
				inFlow: inFlow,
				// stores if the element takes up space in the document flow
			};

			if (!_pin.___origStyle) {
				_pin.___origStyle = {};
				var
				pinInlineCSS = _pin.style,
					copyStyles = boundsParams.concat(["width", "height", "position", "boxSizing", "mozBoxSizing", "webkitBoxSizing"]);
				copyStyles.forEach(function (val) {
					_pin.___origStyle[val] = pinInlineCSS[val] || "";
				});
			}

			// if relative size, transfer it to spacer and make pin calculate it...
			if (_pinOptions.relSize.width) {
				_util.css(spacer, {
					width: sizeCSS.width
				});
			}
			if (_pinOptions.relSize.height) {
				_util.css(spacer, {
					height: sizeCSS.height
				});
			}

			// now place the pin element inside the spacer	
			spacer.appendChild(_pin);
			// and set new css
			_util.css(_pin, {
				position: inFlow ? "relative" : "absolute",
				margin: "auto",
				top: "auto",
				left: "auto",
				bottom: "auto",
				right: "auto"
			});

			if (_pinOptions.relSize.width || _pinOptions.relSize.autoFullWidth) {
				_util.css(_pin, {
					boxSizing: "border-box",
					mozBoxSizing: "border-box",
					webkitBoxSizing: "border-box"
				});
			}

			// add listener to document to update pin position in case controller is not the document.
			window.addEventListener('scroll', updatePinInContainer);
			window.addEventListener('resize', updatePinInContainer);
			window.addEventListener('resize', updateRelativePinSpacer);
			// add mousewheel listener to catch scrolls over fixed elements
			_pin.addEventListener("mousewheel", onMousewheelOverPin);
			_pin.addEventListener("DOMMouseScroll", onMousewheelOverPin);

			log(3, "added pin");

			// finally update the pin to init
			updatePinState();

			return Scene;
		};

		/**
		 * Remove the pin from the scene.
		 * @method ScrollMagic.Scene#removePin
		 * @example
		 * // remove the pin from the scene without resetting it (the spacer is not removed)
		 * scene.removePin();
		 *
		 * // remove the pin from the scene and reset the pin element to its initial position (spacer is removed)
		 * scene.removePin(true);
		 *
		 * @param {boolean} [reset=false] - If `false` the spacer will not be removed and the element's position will not be reset.
		 * @returns {Scene} Parent object for chaining.
		 */
		this.removePin = function (reset) {
			if (_pin) {
				if (_state === SCENE_STATE_DURING) {
					updatePinState(true); // force unpin at position
				}
				if (reset || !_controller) { // if there's no controller no progress was made anyway...
					var pinTarget = _pinOptions.spacer.firstChild; // usually the pin element, but may be another spacer (cascaded pins)...
					if (pinTarget.hasAttribute(PIN_SPACER_ATTRIBUTE)) { // copy margins to child spacer
						var
						style = _pinOptions.spacer.style,
							values = ["margin", "marginLeft", "marginRight", "marginTop", "marginBottom"],
							margins = {};
						values.forEach(function (val) {
							margins[val] = style[val] || "";
						});
						_util.css(pinTarget, margins);
					}
					_pinOptions.spacer.parentNode.insertBefore(pinTarget, _pinOptions.spacer);
					_pinOptions.spacer.parentNode.removeChild(_pinOptions.spacer);
					if (!_pin.parentNode.hasAttribute(PIN_SPACER_ATTRIBUTE)) { // if it's the last pin for this element -> restore inline styles
						// TODO: only correctly set for first pin (when cascading) - how to fix?
						_util.css(_pin, _pin.___origStyle);
						delete _pin.___origStyle;
					}
				}
				window.removeEventListener('scroll', updatePinInContainer);
				window.removeEventListener('resize', updatePinInContainer);
				window.removeEventListener('resize', updateRelativePinSpacer);
				_pin.removeEventListener("mousewheel", onMousewheelOverPin);
				_pin.removeEventListener("DOMMouseScroll", onMousewheelOverPin);
				_pin = undefined;
				log(3, "removed pin (reset: " + (reset ? "true" : "false") + ")");
			}
			return Scene;
		};


		var
		_cssClasses, _cssClassElems = [];

		Scene.on("destroy.internal", function (e) {
			Scene.removeClassToggle(e.reset);
		});
		/**
		 * Define a css class modification while the scene is active.  
		 * When the scene triggers the classes will be added to the supplied element and removed, when the scene is over.
		 * If the scene duration is 0 the classes will only be removed if the user scrolls back past the start position.
		 * @method ScrollMagic.Scene#setClassToggle
		 * @example
		 * // add the class 'myclass' to the element with the id 'my-elem' for the duration of the scene
		 * scene.setClassToggle("#my-elem", "myclass");
		 *
		 * // add multiple classes to multiple elements defined by the selector '.classChange'
		 * scene.setClassToggle(".classChange", "class1 class2 class3");
		 *
		 * @param {(string|object)} element - A Selector targeting one or more elements or a DOM object that is supposed to be modified.
		 * @param {string} classes - One or more Classnames (separated by space) that should be added to the element during the scene.
		 *
		 * @returns {Scene} Parent object for chaining.
		 */
		this.setClassToggle = function (element, classes) {
			var elems = _util.get.elements(element);
			if (elems.length === 0 || !_util.type.String(classes)) {
				log(1, "ERROR calling method 'setClassToggle()': Invalid " + (elems.length === 0 ? "element" : "classes") + " supplied.");
				return Scene;
			}
			if (_cssClassElems.length > 0) {
				// remove old ones
				Scene.removeClassToggle();
			}
			_cssClasses = classes;
			_cssClassElems = elems;
			Scene.on("enter.internal_class leave.internal_class", function (e) {
				var toggle = e.type === "enter" ? _util.addClass : _util.removeClass;
				_cssClassElems.forEach(function (elem, key) {
					toggle(elem, _cssClasses);
				});
			});
			return Scene;
		};

		/**
		 * Remove the class binding from the scene.
		 * @method ScrollMagic.Scene#removeClassToggle
		 * @example
		 * // remove class binding from the scene without reset
		 * scene.removeClassToggle();
		 *
		 * // remove class binding and remove the changes it caused
		 * scene.removeClassToggle(true);
		 *
		 * @param {boolean} [reset=false] - If `false` and the classes are currently active, they will remain on the element. If `true` they will be removed.
		 * @returns {Scene} Parent object for chaining.
		 */
		this.removeClassToggle = function (reset) {
			if (reset) {
				_cssClassElems.forEach(function (elem, key) {
					_util.removeClass(elem, _cssClasses);
				});
			}
			Scene.off("start.internal_class end.internal_class");
			_cssClasses = undefined;
			_cssClassElems = [];
			return Scene;
		};

		// INIT
		construct();
		return Scene;
	};

	// store pagewide scene options
	var SCENE_OPTIONS = {
		defaults: {
			duration: 0,
			offset: 0,
			triggerElement: undefined,
			triggerHook: 0.5,
			reverse: true,
			loglevel: 2
		},
		validate: {
			offset: function (val) {
				val = parseFloat(val);
				if (!_util.type.Number(val)) {
					throw ["Invalid value for option \"offset\":", val];
				}
				return val;
			},
			triggerElement: function (val) {
				val = val || undefined;
				if (val) {
					var elem = _util.get.elements(val)[0];
					if (elem && elem.parentNode) {
						val = elem;
					} else {
						throw ["Element defined in option \"triggerElement\" was not found:", val];
					}
				}
				return val;
			},
			triggerHook: function (val) {
				var translate = {
					"onCenter": 0.5,
					"onEnter": 1,
					"onLeave": 0
				};
				if (_util.type.Number(val)) {
					val = Math.max(0, Math.min(parseFloat(val), 1)); //  make sure its betweeen 0 and 1
				} else if (val in translate) {
					val = translate[val];
				} else {
					throw ["Invalid value for option \"triggerHook\": ", val];
				}
				return val;
			},
			reverse: function (val) {
				return !!val; // force boolean
			},
			loglevel: function (val) {
				val = parseInt(val);
				if (!_util.type.Number(val) || val < 0 || val > 3) {
					throw ["Invalid value for option \"loglevel\":", val];
				}
				return val;
			}
		},
		// holder for  validation methods. duration validation is handled in 'getters-setters.js'
		shifts: ["duration", "offset", "triggerHook"],
		// list of options that trigger a `shift` event
	};
/*
 * method used to add an option to ScrollMagic Scenes.
 * TODO: DOC (private for dev)
 */
	ScrollMagic.Scene.addOption = function (name, defaultValue, validationCallback, shifts) {
		if (!(name in SCENE_OPTIONS.defaults)) {
			SCENE_OPTIONS.defaults[name] = defaultValue;
			SCENE_OPTIONS.validate[name] = validationCallback;
			if (shifts) {
				SCENE_OPTIONS.shifts.push(name);
			}
		} else {
			ScrollMagic._util.log(1, "[static] ScrollMagic.Scene -> Cannot add Scene option '" + name + "', because it already exists.");
		}
	};
	// instance extension function for plugins
	// TODO: DOC (private for dev)
	ScrollMagic.Scene.extend = function (extension) {
		var oldClass = this;
		ScrollMagic.Scene = function () {
			oldClass.apply(this, arguments);
			this.$super = _util.extend({}, this); // copy parent state
			return extension.apply(this, arguments) || this;
		};
		_util.extend(ScrollMagic.Scene, oldClass); // copy properties
		ScrollMagic.Scene.prototype = oldClass.prototype; // copy prototype
		ScrollMagic.Scene.prototype.constructor = ScrollMagic.Scene; // restore constructor
	};



	/**
	 * TODO: DOCS (private for dev)
	 * @class
	 * @private
	 */

	ScrollMagic.Event = function (type, namespace, target, vars) {
		vars = vars || {};
		for (var key in vars) {
			this[key] = vars[key];
		}
		this.type = type;
		this.target = this.currentTarget = target;
		this.namespace = namespace || '';
		this.timeStamp = this.timestamp = Date.now();
		return this;
	};

/*
 * TODO: DOCS (private for dev)
 */

	var _util = ScrollMagic._util = (function (window) {
		var U = {},
			i;

		/**
		 * ------------------------------
		 * internal helpers
		 * ------------------------------
		 */

		// parse float and fall back to 0.
		var floatval = function (number) {
			return parseFloat(number) || 0;
		};
		// get current style IE safe (otherwise IE would return calculated values for 'auto')
		var _getComputedStyle = function (elem) {
			return elem.currentStyle ? elem.currentStyle : window.getComputedStyle(elem);
		};

		// get element dimension (width or height)
		var _dimension = function (which, elem, outer, includeMargin) {
			elem = (elem === document) ? window : elem;
			if (elem === window) {
				includeMargin = false;
			} else if (!_type.DomElement(elem)) {
				return 0;
			}
			which = which.charAt(0).toUpperCase() + which.substr(1).toLowerCase();
			var dimension = (outer ? elem['offset' + which] || elem['outer' + which] : elem['client' + which] || elem['inner' + which]) || 0;
			if (outer && includeMargin) {
				var style = _getComputedStyle(elem);
				dimension += which === 'Height' ? floatval(style.marginTop) + floatval(style.marginBottom) : floatval(style.marginLeft) + floatval(style.marginRight);
			}
			return dimension;
		};
		// converts 'margin-top' into 'marginTop'
		var _camelCase = function (str) {
			return str.replace(/^[^a-z]+([a-z])/g, '$1').replace(/-([a-z])/g, function (g) {
				return g[1].toUpperCase();
			});
		};

		/**
		 * ------------------------------
		 * external helpers
		 * ------------------------------
		 */

		// extend obj – same as jQuery.extend({}, objA, objB)
		U.extend = function (obj) {
			obj = obj || {};
			for (i = 1; i < arguments.length; i++) {
				if (!arguments[i]) {
					continue;
				}
				for (var key in arguments[i]) {
					if (arguments[i].hasOwnProperty(key)) {
						obj[key] = arguments[i][key];
					}
				}
			}
			return obj;
		};

		// check if a css display type results in margin-collapse or not
		U.isMarginCollapseType = function (str) {
			return ["block", "flex", "list-item", "table", "-webkit-box"].indexOf(str) > -1;
		};

		// implementation of requestAnimationFrame
		// based on https://gist.github.com/paulirish/1579671
		var
		lastTime = 0,
			vendors = ['ms', 'moz', 'webkit', 'o'];
		var _requestAnimationFrame = window.requestAnimationFrame;
		var _cancelAnimationFrame = window.cancelAnimationFrame;
		// try vendor prefixes if the above doesn't work
		for (i = 0; !_requestAnimationFrame && i < vendors.length; ++i) {
			_requestAnimationFrame = window[vendors[i] + 'RequestAnimationFrame'];
			_cancelAnimationFrame = window[vendors[i] + 'CancelAnimationFrame'] || window[vendors[i] + 'CancelRequestAnimationFrame'];
		}

		// fallbacks
		if (!_requestAnimationFrame) {
			_requestAnimationFrame = function (callback) {
				var
				currTime = new Date().getTime(),
					timeToCall = Math.max(0, 16 - (currTime - lastTime)),
					id = window.setTimeout(function () {
						callback(currTime + timeToCall);
					}, timeToCall);
				lastTime = currTime + timeToCall;
				return id;
			};
		}
		if (!_cancelAnimationFrame) {
			_cancelAnimationFrame = function (id) {
				window.clearTimeout(id);
			};
		}
		U.rAF = _requestAnimationFrame.bind(window);
		U.cAF = _cancelAnimationFrame.bind(window);

		var
		loglevels = ["error", "warn", "log"],
			console = window.console || {};

		console.log = console.log ||
		function () {}; // no console log, well - do nothing then...
		// make sure methods for all levels exist.
		for (i = 0; i < loglevels.length; i++) {
			var method = loglevels[i];
			if (!console[method]) {
				console[method] = console.log; // prefer .log over nothing
			}
		}
		U.log = function (loglevel) {
			if (loglevel > loglevels.length || loglevel <= 0) loglevel = loglevels.length;
			var now = new Date(),
				time = ("0" + now.getHours()).slice(-2) + ":" + ("0" + now.getMinutes()).slice(-2) + ":" + ("0" + now.getSeconds()).slice(-2) + ":" + ("00" + now.getMilliseconds()).slice(-3),
				method = loglevels[loglevel - 1],
				args = Array.prototype.splice.call(arguments, 1),
				func = Function.prototype.bind.call(console[method], console);
			args.unshift(time);
			func.apply(console, args);
		};

		/**
		 * ------------------------------
		 * type testing
		 * ------------------------------
		 */

		var _type = U.type = function (v) {
			return Object.prototype.toString.call(v).replace(/^\[object (.+)\]$/, "$1").toLowerCase();
		};
		_type.String = function (v) {
			return _type(v) === 'string';
		};
		_type.Function = function (v) {
			return _type(v) === 'function';
		};
		_type.Array = function (v) {
			return Array.isArray(v);
		};
		_type.Number = function (v) {
			return !_type.Array(v) && (v - parseFloat(v) + 1) >= 0;
		};
		_type.DomElement = function (o) {
			return (
			typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
			o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName === "string");
		};

		/**
		 * ------------------------------
		 * DOM Element info
		 * ------------------------------
		 */
		// always returns a list of matching DOM elements, from a selector, a DOM element or an list of elements or even an array of selectors
		var _get = U.get = {};
		_get.elements = function (selector) {
			var arr = [];
			if (_type.String(selector)) {
				try {
					selector = document.querySelectorAll(selector);
				} catch (e) { // invalid selector
					return arr;
				}
			}
			if (_type(selector) === 'nodelist' || _type.Array(selector)) {
				for (var i = 0, ref = arr.length = selector.length; i < ref; i++) { // list of elements
					var elem = selector[i];
					arr[i] = _type.DomElement(elem) ? elem : _get.elements(elem); // if not an element, try to resolve recursively
				}
			} else if (_type.DomElement(selector) || selector === document || selector === window) {
				arr = [selector]; // only the element
			}
			return arr;
		};
		// get scroll top value
		_get.scrollTop = function (elem) {
			return (elem && typeof elem.scrollTop === 'number') ? elem.scrollTop : window.pageYOffset || 0;
		};
		// get scroll left value
		_get.scrollLeft = function (elem) {
			return (elem && typeof elem.scrollLeft === 'number') ? elem.scrollLeft : window.pageXOffset || 0;
		};
		// get element height
		_get.width = function (elem, outer, includeMargin) {
			return _dimension('width', elem, outer, includeMargin);
		};
		// get element width
		_get.height = function (elem, outer, includeMargin) {
			return _dimension('height', elem, outer, includeMargin);
		};

		// get element position (optionally relative to viewport)
		_get.offset = function (elem, relativeToViewport) {
			var offset = {
				top: 0,
				left: 0
			};
			if (elem && elem.getBoundingClientRect) { // check if available
				var rect = elem.getBoundingClientRect();
				offset.top = rect.top;
				offset.left = rect.left;
				if (!relativeToViewport) { // clientRect is by default relative to viewport...
					offset.top += _get.scrollTop();
					offset.left += _get.scrollLeft();
				}
			}
			return offset;
		};

		/**
		 * ------------------------------
		 * DOM Element manipulation
		 * ------------------------------
		 */

		U.addClass = function (elem, classname) {
			if (classname) {
				if (elem.classList) elem.classList.add(classname);
				else elem.className += ' ' + classname;
			}
		};
		U.removeClass = function (elem, classname) {
			if (classname) {
				if (elem.classList) elem.classList.remove(classname);
				else elem.className = elem.className.replace(new RegExp('(^|\\b)' + classname.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
			}
		};
		// if options is string -> returns css value
		// if options is array -> returns object with css value pairs
		// if options is object -> set new css values
		U.css = function (elem, options) {
			if (_type.String(options)) {
				return _getComputedStyle(elem)[_camelCase(options)];
			} else if (_type.Array(options)) {
				var
				obj = {},
					style = _getComputedStyle(elem);
				options.forEach(function (option, key) {
					obj[option] = style[_camelCase(option)];
				});
				return obj;
			} else {
				for (var option in options) {
					var val = options[option];
					if (val == parseFloat(val)) { // assume pixel for seemingly numerical values
						val += 'px';
					}
					elem.style[_camelCase(option)] = val;
				}
			}
		};

		return U;
	}(window || {}));

	ScrollMagic.Scene.prototype.addIndicators = function () {
		ScrollMagic._util.log(1, '(ScrollMagic.Scene) -> ERROR calling addIndicators() due to missing Plugin \'debug.addIndicators\'. Please make sure to include plugins/debug.addIndicators.js');
		return this;
	}
	ScrollMagic.Scene.prototype.removeIndicators = function () {
		ScrollMagic._util.log(1, '(ScrollMagic.Scene) -> ERROR calling removeIndicators() due to missing Plugin \'debug.addIndicators\'. Please make sure to include plugins/debug.addIndicators.js');
		return this;
	}
	ScrollMagic.Scene.prototype.setTween = function () {
		ScrollMagic._util.log(1, '(ScrollMagic.Scene) -> ERROR calling setTween() due to missing Plugin \'animation.gsap\'. Please make sure to include plugins/animation.gsap.js');
		return this;
	}
	ScrollMagic.Scene.prototype.removeTween = function () {
		ScrollMagic._util.log(1, '(ScrollMagic.Scene) -> ERROR calling removeTween() due to missing Plugin \'animation.gsap\'. Please make sure to include plugins/animation.gsap.js');
		return this;
	}
	ScrollMagic.Scene.prototype.setVelocity = function () {
		ScrollMagic._util.log(1, '(ScrollMagic.Scene) -> ERROR calling setVelocity() due to missing Plugin \'animation.velocity\'. Please make sure to include plugins/animation.velocity.js');
		return this;
	}
	ScrollMagic.Scene.prototype.removeVelocity = function () {
		ScrollMagic._util.log(1, '(ScrollMagic.Scene) -> ERROR calling removeVelocity() due to missing Plugin \'animation.velocity\'. Please make sure to include plugins/animation.velocity.js');
		return this;
	}

	return ScrollMagic;
}));
},{}],3:[function(require,module,exports){
/*!
 * ScrollMagic v2.0.6 (2018-10-08)
 * The javascript library for magical scroll interactions.
 * (c) 2018 Jan Paepke (@janpaepke)
 * Project Website: http://scrollmagic.io
 * 
 * @version 2.0.6
 * @license Dual licensed under MIT license and GPL.
 * @author Jan Paepke - e-mail@janpaepke.de
 *
 * @file Debug Extension for ScrollMagic.
 */
/**
 * This plugin was formerly known as the ScrollMagic debug extension.
 *
 * It enables you to add visual indicators to your page, to be able to see exactly when a scene is triggered.
 *
 * To have access to this extension, please include `plugins/debug.addIndicators.js`.
 * @mixin debug.addIndicators
 */
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['ScrollMagic'], factory);
	} else if (typeof exports === 'object') {
		// CommonJS
		factory(require('scrollmagic'));
	} else {
		// no browser global export needed, just execute
		factory(root.ScrollMagic || (root.jQuery && root.jQuery.ScrollMagic));
	}
}(this, function (ScrollMagic) {
	"use strict";
	var NAMESPACE = "debug.addIndicators";

	var
	console = window.console || {},
		err = Function.prototype.bind.call(console.error || console.log ||
		function () {}, console);
	if (!ScrollMagic) {
		err("(" + NAMESPACE + ") -> ERROR: The ScrollMagic main module could not be found. Please make sure it's loaded before this plugin or use an asynchronous loader like requirejs.");
	}

	// plugin settings
	var
	FONT_SIZE = "0.85em",
		ZINDEX = "9999",
		EDGE_OFFSET = 15; // minimum edge distance, added to indentation

	// overall vars
	var
	_util = ScrollMagic._util,
		_autoindex = 0;



	ScrollMagic.Scene.extend(function () {
		var
		Scene = this,
			_indicator;

		var log = function () {
			if (Scene._log) { // not available, when main source minified
				Array.prototype.splice.call(arguments, 1, 0, "(" + NAMESPACE + ")", "->");
				Scene._log.apply(this, arguments);
			}
		};

		/**
		 * Add visual indicators for a ScrollMagic.Scene.  
		 * @memberof! debug.addIndicators#
		 *
		 * @example
		 * // add basic indicators
		 * scene.addIndicators()
		 *
		 * // passing options
		 * scene.addIndicators({name: "pin scene", colorEnd: "#FFFFFF"});
		 *
		 * @param {object} [options] - An object containing one or more options for the indicators.
		 * @param {(string|object)} [options.parent=undefined] - A selector, DOM Object or a jQuery object that the indicators should be added to.  
		 If undefined, the controller's container will be used.
		 * @param {number} [options.name=""] - This string will be displayed at the start and end indicators of the scene for identification purposes. If no name is supplied an automatic index will be used.
		 * @param {number} [options.indent=0] - Additional position offset for the indicators (useful, when having multiple scenes starting at the same position).
		 * @param {string} [options.colorStart=green] - CSS color definition for the start indicator.
		 * @param {string} [options.colorEnd=red] - CSS color definition for the end indicator.
		 * @param {string} [options.colorTrigger=blue] - CSS color definition for the trigger indicator.
		 */
		Scene.addIndicators = function (options) {
			if (!_indicator) {
				var
				DEFAULT_OPTIONS = {
					name: "",
					indent: 0,
					parent: undefined,
					colorStart: "green",
					colorEnd: "red",
					colorTrigger: "blue",
				};

				options = _util.extend({}, DEFAULT_OPTIONS, options);

				_autoindex++;
				_indicator = new Indicator(Scene, options);

				Scene.on("add.plugin_addIndicators", _indicator.add);
				Scene.on("remove.plugin_addIndicators", _indicator.remove);
				Scene.on("destroy.plugin_addIndicators", Scene.removeIndicators);

				// it the scene already has a controller we can start right away.
				if (Scene.controller()) {
					_indicator.add();
				}
			}
			return Scene;
		};

		/**
		 * Removes visual indicators from a ScrollMagic.Scene.
		 * @memberof! debug.addIndicators#
		 *
		 * @example
		 * // remove previously added indicators
		 * scene.removeIndicators()
		 *
		 */
		Scene.removeIndicators = function () {
			if (_indicator) {
				_indicator.remove();
				this.off("*.plugin_addIndicators");
				_indicator = undefined;
			}
			return Scene;
		};

	});


/*
	 * ----------------------------------------------------------------
	 * Extension for controller to store and update related indicators
	 * ----------------------------------------------------------------
	 */
	// add option to globally auto-add indicators to scenes
	/**
	 * Every ScrollMagic.Controller instance now accepts an additional option.  
	 * See {@link ScrollMagic.Controller} for a complete list of the standard options.
	 * @memberof! debug.addIndicators#
	 * @method new ScrollMagic.Controller(options)
	 * @example
	 * // make a controller and add indicators to all scenes attached
	 * var controller = new ScrollMagic.Controller({addIndicators: true});
	 * // this scene will automatically have indicators added to it
	 * new ScrollMagic.Scene()
	 *                .addTo(controller);
	 *
	 * @param {object} [options] - Options for the Controller.
	 * @param {boolean} [options.addIndicators=false] - If set to `true` every scene that is added to the controller will automatically get indicators added to it.
	 */
	ScrollMagic.Controller.addOption("addIndicators", false);
	// extend Controller
	ScrollMagic.Controller.extend(function () {
		var
		Controller = this,
			_info = Controller.info(),
			_container = _info.container,
			_isDocument = _info.isDocument,
			_vertical = _info.vertical,
			_indicators = { // container for all indicators and methods
				groups: []
			};

		var log = function () {
			if (Controller._log) { // not available, when main source minified
				Array.prototype.splice.call(arguments, 1, 0, "(" + NAMESPACE + ")", "->");
				Controller._log.apply(this, arguments);
			}
		};
		if (Controller._indicators) {
			log(2, "WARNING: Scene already has a property '_indicators', which will be overwritten by plugin.");
		}

		// add indicators container
		this._indicators = _indicators;
/*
			needed updates:
			+++++++++++++++
			start/end position on scene shift (handled in Indicator class)
			trigger parameters on triggerHook value change (handled in Indicator class)
			bounds position on container scroll or resize (to keep alignment to bottom/right)
			trigger position on container resize, window resize (if container isn't document) and window scroll (if container isn't document)
		*/

		// event handler for when associated bounds markers need to be repositioned
		var handleBoundsPositionChange = function () {
			_indicators.updateBoundsPositions();
		};

		// event handler for when associated trigger groups need to be repositioned
		var handleTriggerPositionChange = function () {
			_indicators.updateTriggerGroupPositions();
		};

		_container.addEventListener("resize", handleTriggerPositionChange);
		if (!_isDocument) {
			window.addEventListener("resize", handleTriggerPositionChange);
			window.addEventListener("scroll", handleTriggerPositionChange);
		}
		// update all related bounds containers
		_container.addEventListener("resize", handleBoundsPositionChange);
		_container.addEventListener("scroll", handleBoundsPositionChange);


		// updates the position of the bounds container to aligned to the right for vertical containers and to the bottom for horizontal
		this._indicators.updateBoundsPositions = function (specificIndicator) {
			var // constant for all bounds
			groups = specificIndicator ? [_util.extend({}, specificIndicator.triggerGroup, {
				members: [specificIndicator]
			})] : // create a group with only one element
			_indicators.groups,
				// use all
				g = groups.length,
				css = {},
				paramPos = _vertical ? "left" : "top",
				paramDimension = _vertical ? "width" : "height",
				edge = _vertical ? _util.get.scrollLeft(_container) + _util.get.width(_container) - EDGE_OFFSET : _util.get.scrollTop(_container) + _util.get.height(_container) - EDGE_OFFSET,
				b, triggerSize, group;
			while (g--) { // group loop
				group = groups[g];
				b = group.members.length;
				triggerSize = _util.get[paramDimension](group.element.firstChild);
				while (b--) { // indicators loop
					css[paramPos] = edge - triggerSize;
					_util.css(group.members[b].bounds, css);
				}
			}
		};

		// updates the positions of all trigger groups attached to a controller or a specific one, if provided
		this._indicators.updateTriggerGroupPositions = function (specificGroup) {
			var // constant vars
			groups = specificGroup ? [specificGroup] : _indicators.groups,
				i = groups.length,
				container = _isDocument ? document.body : _container,
				containerOffset = _isDocument ? {
					top: 0,
					left: 0
				} : _util.get.offset(container, true),
				edge = _vertical ? _util.get.width(_container) - EDGE_OFFSET : _util.get.height(_container) - EDGE_OFFSET,
				paramDimension = _vertical ? "width" : "height",
				paramTransform = _vertical ? "Y" : "X";
			var // changing vars
			group, elem, pos, elemSize, transform;
			while (i--) {
				group = groups[i];
				elem = group.element;
				pos = group.triggerHook * Controller.info("size");
				elemSize = _util.get[paramDimension](elem.firstChild.firstChild);
				transform = pos > elemSize ? "translate" + paramTransform + "(-100%)" : "";

				_util.css(elem, {
					top: containerOffset.top + (_vertical ? pos : edge - group.members[0].options.indent),
					left: containerOffset.left + (_vertical ? edge - group.members[0].options.indent : pos)
				});
				_util.css(elem.firstChild.firstChild, {
					"-ms-transform": transform,
					"-webkit-transform": transform,
					"transform": transform
				});
			}
		};

		// updates the label for the group to contain the name, if it only has one member
		this._indicators.updateTriggerGroupLabel = function (group) {
			var
			text = "trigger" + (group.members.length > 1 ? "" : " " + group.members[0].options.name),
				elem = group.element.firstChild.firstChild,
				doUpdate = elem.textContent !== text;
			if (doUpdate) {
				elem.textContent = text;
				if (_vertical) { // bounds position is dependent on text length, so update
					_indicators.updateBoundsPositions();
				}
			}
		};

		// add indicators if global option is set
		this.addScene = function (newScene) {

			if (this._options.addIndicators && newScene instanceof ScrollMagic.Scene && newScene.controller() === Controller) {
				newScene.addIndicators();
			}
			// call original destroy method
			this.$super.addScene.apply(this, arguments);
		};

		// remove all previously set listeners on destroy
		this.destroy = function () {
			_container.removeEventListener("resize", handleTriggerPositionChange);
			if (!_isDocument) {
				window.removeEventListener("resize", handleTriggerPositionChange);
				window.removeEventListener("scroll", handleTriggerPositionChange);
			}
			_container.removeEventListener("resize", handleBoundsPositionChange);
			_container.removeEventListener("scroll", handleBoundsPositionChange);
			// call original destroy method
			this.$super.destroy.apply(this, arguments);
		};
		return Controller;

	});

/*
	 * ----------------------------------------------------------------
	 * Internal class for the construction of Indicators
	 * ----------------------------------------------------------------
	 */
	var Indicator = function (Scene, options) {
		var
		Indicator = this,
			_elemBounds = TPL.bounds(),
			_elemStart = TPL.start(options.colorStart),
			_elemEnd = TPL.end(options.colorEnd),
			_boundsContainer = options.parent && _util.get.elements(options.parent)[0],
			_vertical, _ctrl;

		var log = function () {
			if (Scene._log) { // not available, when main source minified
				Array.prototype.splice.call(arguments, 1, 0, "(" + NAMESPACE + ")", "->");
				Scene._log.apply(this, arguments);
			}
		};

		options.name = options.name || _autoindex;

		// prepare bounds elements
		_elemStart.firstChild.textContent += " " + options.name;
		_elemEnd.textContent += " " + options.name;
		_elemBounds.appendChild(_elemStart);
		_elemBounds.appendChild(_elemEnd);

		// set public variables
		Indicator.options = options;
		Indicator.bounds = _elemBounds;
		// will be set later
		Indicator.triggerGroup = undefined;

		// add indicators to DOM
		this.add = function () {
			_ctrl = Scene.controller();
			_vertical = _ctrl.info("vertical");

			var isDocument = _ctrl.info("isDocument");

			if (!_boundsContainer) {
				// no parent supplied or doesnt exist
				_boundsContainer = isDocument ? document.body : _ctrl.info("container"); // check if window/document (then use body)
			}
			if (!isDocument && _util.css(_boundsContainer, "position") === 'static') {
				// position mode needed for correct positioning of indicators
				_util.css(_boundsContainer, {
					position: "relative"
				});
			}

			// add listeners for updates
			Scene.on("change.plugin_addIndicators", handleTriggerParamsChange);
			Scene.on("shift.plugin_addIndicators", handleBoundsParamsChange);

			// updates trigger & bounds (will add elements if needed)
			updateTriggerGroup();
			updateBounds();

			setTimeout(function () { // do after all execution is finished otherwise sometimes size calculations are off
				_ctrl._indicators.updateBoundsPositions(Indicator);
			}, 0);

			log(3, "added indicators");
		};

		// remove indicators from DOM
		this.remove = function () {
			if (Indicator.triggerGroup) { // if not set there's nothing to remove
				Scene.off("change.plugin_addIndicators", handleTriggerParamsChange);
				Scene.off("shift.plugin_addIndicators", handleBoundsParamsChange);

				if (Indicator.triggerGroup.members.length > 1) {
					// just remove from memberlist of old group
					var group = Indicator.triggerGroup;
					group.members.splice(group.members.indexOf(Indicator), 1);
					_ctrl._indicators.updateTriggerGroupLabel(group);
					_ctrl._indicators.updateTriggerGroupPositions(group);
					Indicator.triggerGroup = undefined;
				} else {
					// remove complete group
					removeTriggerGroup();
				}
				removeBounds();

				log(3, "removed indicators");
			}
		};

/*
		 * ----------------------------------------------------------------
		 * internal Event Handlers
		 * ----------------------------------------------------------------
		 */

		// event handler for when bounds params change
		var handleBoundsParamsChange = function () {
			updateBounds();
		};

		// event handler for when trigger params change
		var handleTriggerParamsChange = function (e) {
			if (e.what === "triggerHook") {
				updateTriggerGroup();
			}
		};

/*
		 * ----------------------------------------------------------------
		 * Bounds (start / stop) management
		 * ----------------------------------------------------------------
		 */

		// adds an new bounds elements to the array and to the DOM
		var addBounds = function () {
			var v = _ctrl.info("vertical");
			// apply stuff we didn't know before...
			_util.css(_elemStart.firstChild, {
				"border-bottom-width": v ? 1 : 0,
				"border-right-width": v ? 0 : 1,
				"bottom": v ? -1 : options.indent,
				"right": v ? options.indent : -1,
				"padding": v ? "0 8px" : "2px 4px",
			});
			_util.css(_elemEnd, {
				"border-top-width": v ? 1 : 0,
				"border-left-width": v ? 0 : 1,
				"top": v ? "100%" : "",
				"right": v ? options.indent : "",
				"bottom": v ? "" : options.indent,
				"left": v ? "" : "100%",
				"padding": v ? "0 8px" : "2px 4px"
			});
			// append
			_boundsContainer.appendChild(_elemBounds);
		};

		// remove bounds from list and DOM
		var removeBounds = function () {
			_elemBounds.parentNode.removeChild(_elemBounds);
		};

		// update the start and end positions of the scene
		var updateBounds = function () {
			if (_elemBounds.parentNode !== _boundsContainer) {
				addBounds(); // Add Bounds elements (start/end)
			}
			var css = {};
			css[_vertical ? "top" : "left"] = Scene.triggerPosition();
			css[_vertical ? "height" : "width"] = Scene.duration();
			_util.css(_elemBounds, css);
			_util.css(_elemEnd, {
				display: Scene.duration() > 0 ? "" : "none"
			});
		};

/*
		 * ----------------------------------------------------------------
		 * trigger and trigger group management
		 * ----------------------------------------------------------------
		 */

		// adds an new trigger group to the array and to the DOM
		var addTriggerGroup = function () {
			var triggerElem = TPL.trigger(options.colorTrigger); // new trigger element
			var css = {};
			css[_vertical ? "right" : "bottom"] = 0;
			css[_vertical ? "border-top-width" : "border-left-width"] = 1;
			_util.css(triggerElem.firstChild, css);
			_util.css(triggerElem.firstChild.firstChild, {
				padding: _vertical ? "0 8px 3px 8px" : "3px 4px"
			});
			document.body.appendChild(triggerElem); // directly add to body
			var newGroup = {
				triggerHook: Scene.triggerHook(),
				element: triggerElem,
				members: [Indicator]
			};
			_ctrl._indicators.groups.push(newGroup);
			Indicator.triggerGroup = newGroup;
			// update right away
			_ctrl._indicators.updateTriggerGroupLabel(newGroup);
			_ctrl._indicators.updateTriggerGroupPositions(newGroup);
		};

		var removeTriggerGroup = function () {
			_ctrl._indicators.groups.splice(_ctrl._indicators.groups.indexOf(Indicator.triggerGroup), 1);
			Indicator.triggerGroup.element.parentNode.removeChild(Indicator.triggerGroup.element);
			Indicator.triggerGroup = undefined;
		};

		// updates the trigger group -> either join existing or add new one
/*	
		 * Logic:
		 * 1 if a trigger group exist, check if it's in sync with Scene settings – if so, nothing else needs to happen
		 * 2 try to find an existing one that matches Scene parameters
		 * 	 2.1 If a match is found check if already assigned to an existing group
		 *			 If so:
		 *       A: it was the last member of existing group -> kill whole group
		 *       B: the existing group has other members -> just remove from member list
		 *	 2.2 Assign to matching group
		 * 3 if no new match could be found, check if assigned to existing group
		 *   A: yes, and it's the only member -> just update parameters and positions and keep using this group
		 *   B: yes but there are other members -> remove from member list and create a new one
		 *   C: no, so create a new one
		 */
		var updateTriggerGroup = function () {
			var
			triggerHook = Scene.triggerHook(),
				closeEnough = 0.0001;

			// Have a group, check if it still matches
			if (Indicator.triggerGroup) {
				if (Math.abs(Indicator.triggerGroup.triggerHook - triggerHook) < closeEnough) {
					// _util.log(0, "trigger", options.name, "->", "no need to change, still in sync");
					return; // all good
				}
			}
			// Don't have a group, check if a matching one exists
			// _util.log(0, "trigger", options.name, "->", "out of sync!");
			var
			groups = _ctrl._indicators.groups,
				group, i = groups.length;
			while (i--) {
				group = groups[i];
				if (Math.abs(group.triggerHook - triggerHook) < closeEnough) {
					// found a match!
					// _util.log(0, "trigger", options.name, "->", "found match");
					if (Indicator.triggerGroup) { // do I have an old group that is out of sync?
						if (Indicator.triggerGroup.members.length === 1) { // is it the only remaining group?
							// _util.log(0, "trigger", options.name, "->", "kill");
							// was the last member, remove the whole group
							removeTriggerGroup();
						} else {
							Indicator.triggerGroup.members.splice(Indicator.triggerGroup.members.indexOf(Indicator), 1); // just remove from memberlist of old group
							_ctrl._indicators.updateTriggerGroupLabel(Indicator.triggerGroup);
							_ctrl._indicators.updateTriggerGroupPositions(Indicator.triggerGroup);
							// _util.log(0, "trigger", options.name, "->", "removing from previous member list");
						}
					}
					// join new group
					group.members.push(Indicator);
					Indicator.triggerGroup = group;
					_ctrl._indicators.updateTriggerGroupLabel(group);
					return;
				}
			}

			// at this point I am obviously out of sync and don't match any other group
			if (Indicator.triggerGroup) {
				if (Indicator.triggerGroup.members.length === 1) {
					// _util.log(0, "trigger", options.name, "->", "updating existing");
					// out of sync but i'm the only member => just change and update
					Indicator.triggerGroup.triggerHook = triggerHook;
					_ctrl._indicators.updateTriggerGroupPositions(Indicator.triggerGroup);
					return;
				} else {
					// _util.log(0, "trigger", options.name, "->", "removing from previous member list");
					Indicator.triggerGroup.members.splice(Indicator.triggerGroup.members.indexOf(Indicator), 1); // just remove from memberlist of old group
					_ctrl._indicators.updateTriggerGroupLabel(Indicator.triggerGroup);
					_ctrl._indicators.updateTriggerGroupPositions(Indicator.triggerGroup);
					Indicator.triggerGroup = undefined; // need a brand new group...
				}
			}
			// _util.log(0, "trigger", options.name, "->", "add a new one");
			// did not find any match, make new trigger group
			addTriggerGroup();
		};
	};

/*
	 * ----------------------------------------------------------------
	 * Templates for the indicators
	 * ----------------------------------------------------------------
	 */
	var TPL = {
		start: function (color) {
			// inner element (for bottom offset -1, while keeping top position 0)
			var inner = document.createElement("div");
			inner.textContent = "start";
			_util.css(inner, {
				position: "absolute",
				overflow: "visible",
				"border-width": 0,
				"border-style": "solid",
				color: color,
				"border-color": color
			});
			var e = document.createElement('div');
			// wrapper
			_util.css(e, {
				position: "absolute",
				overflow: "visible",
				width: 0,
				height: 0
			});
			e.appendChild(inner);
			return e;
		},
		end: function (color) {
			var e = document.createElement('div');
			e.textContent = "end";
			_util.css(e, {
				position: "absolute",
				overflow: "visible",
				"border-width": 0,
				"border-style": "solid",
				color: color,
				"border-color": color
			});
			return e;
		},
		bounds: function () {
			var e = document.createElement('div');
			_util.css(e, {
				position: "absolute",
				overflow: "visible",
				"white-space": "nowrap",
				"pointer-events": "none",
				"font-size": FONT_SIZE
			});
			e.style.zIndex = ZINDEX;
			return e;
		},
		trigger: function (color) {
			// inner to be above or below line but keep position
			var inner = document.createElement('div');
			inner.textContent = "trigger";
			_util.css(inner, {
				position: "relative",
			});
			// inner wrapper for right: 0 and main element has no size
			var w = document.createElement('div');
			_util.css(w, {
				position: "absolute",
				overflow: "visible",
				"border-width": 0,
				"border-style": "solid",
				color: color,
				"border-color": color
			});
			w.appendChild(inner);
			// wrapper
			var e = document.createElement('div');
			_util.css(e, {
				position: "fixed",
				overflow: "visible",
				"white-space": "nowrap",
				"pointer-events": "none",
				"font-size": FONT_SIZE
			});
			e.style.zIndex = ZINDEX;
			e.appendChild(w);
			return e;
		},
	};

}));
},{"scrollmagic":2}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9tYWluLmpzIiwibm9kZV9tb2R1bGVzL3Njcm9sbG1hZ2ljL3Njcm9sbG1hZ2ljL3VuY29tcHJlc3NlZC9TY3JvbGxNYWdpYy5qcyIsIm5vZGVfbW9kdWxlcy9zY3JvbGxtYWdpYy9zY3JvbGxtYWdpYy91bmNvbXByZXNzZWQvcGx1Z2lucy9kZWJ1Zy5hZGRJbmRpY2F0b3JzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNDQSxJQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsYUFBRCxDQUEzQjs7QUFDQSxPQUFPLENBQUMsa0ZBQUQsQ0FBUDs7QUFFQSxJQUFJLFVBQVUsR0FBRyxJQUFJLFdBQVcsQ0FBQyxVQUFoQixFQUFqQjtBQUdBLElBQUksS0FBSyxHQUFHLElBQUksV0FBVyxDQUFDLEtBQWhCLENBQXNCO0FBQ2hDLEVBQUEsY0FBYyxFQUFFLFlBRGdCO0FBRWhDLEVBQUEsV0FBVyxFQUFFLFNBRm1CO0FBR2hDLEVBQUEsTUFBTSxFQUFFO0FBSHdCLENBQXRCLEVBSVQsY0FKUyxDQUlNLFlBSk4sRUFJbUIsV0FKbkIsRUFLWCxhQUxXLEdBTVgsS0FOVyxDQU1MLFVBTkssQ0FBWjtBQVVBLElBQUksYUFBYSxHQUFHLElBQUksV0FBVyxDQUFDLEtBQWhCLENBQXNCO0FBQ3hDLEVBQUEsY0FBYyxFQUFFLFlBRHdCO0FBRXRDLEVBQUEsV0FBVyxFQUFFLFNBRnlCO0FBR3hDLEVBQUEsUUFBUSxFQUFFO0FBSDhCLENBQXRCLEVBSWpCLEVBSmlCLENBSWQsT0FKYyxFQUlMLFlBQU07QUFDbkIsRUFBQSxPQUFPLENBQUMsR0FBUixDQUFZLHVCQUFaLEVBRG1CLENBRW5CO0FBQ0QsQ0FQbUIsRUFPakIsRUFQaUIsQ0FPZCxPQVBjLEVBT0wsWUFBTTtBQUNuQjtBQUNBLEVBQUEsT0FBTyxDQUFDLEdBQVIsQ0FBWSx1QkFBWjtBQUNELENBVm1CLEVBVWpCLGFBVmlCLEdBV25CLEtBWG1CLENBV2IsVUFYYSxDQUFwQjs7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdnVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJcclxuY29uc3QgU2Nyb2xsTWFnaWMgPSByZXF1aXJlKCdzY3JvbGxtYWdpYycpO1xyXG5yZXF1aXJlKCcuLi9ub2RlX21vZHVsZXMvc2Nyb2xsbWFnaWMvc2Nyb2xsbWFnaWMvdW5jb21wcmVzc2VkL3BsdWdpbnMvZGVidWcuYWRkSW5kaWNhdG9ycycpO1xyXG5cclxubGV0IGNvbnRyb2xsZXIgPSBuZXcgU2Nyb2xsTWFnaWMuQ29udHJvbGxlcigpO1xyXG5cclxuXHJcbmxldCBzY2VuZSA9IG5ldyBTY3JvbGxNYWdpYy5TY2VuZSh7XHJcbiAgdHJpZ2dlckVsZW1lbnQ6ICcjdHJpZ2dlci0xJyxcclxuICB0cmlnZ2VySG9vazogJ29uTGVhdmUnLFxyXG4gIG9mZnNldDogMTBcclxufSkuc2V0Q2xhc3NUb2dnbGUoJyNlbGVtZW50LTEnLCduZXctY2xhc3MnKVxyXG4uYWRkSW5kaWNhdG9ycygpXHJcbi5hZGRUbyhjb250cm9sbGVyKTtcclxuXHJcblxyXG5cclxubGV0IGR1cmF0aW9uU2NlbmUgPSBuZXcgU2Nyb2xsTWFnaWMuU2NlbmUoe1xyXG4gIHRyaWdnZXJFbGVtZW50OiAnI3RyaWdnZXItMicsXHJcbiAgICB0cmlnZ2VySG9vazogJ29uTGVhdmUnLFxyXG4gIGR1cmF0aW9uOiAxMDAwXHJcbn0pLm9uKFwiZW50ZXJcIiwgKCkgPT4ge1xyXG4gIGNvbnNvbGUubG9nKCdEbyBTb21ldGhpbmcgb24gRW50ZXInKTtcclxuICAvLyBEbyBzb21ldGhpbmdcclxufSkub24oJ2xlYXZlJywgKCkgPT4ge1xyXG4gIC8vIERvIHNvbWV0aGluZ1xyXG4gIGNvbnNvbGUubG9nKCdEbyBTb21ldGhpbmcgb24gbGVhdmUnKTtcclxufSkuYWRkSW5kaWNhdG9ycygpXHJcbi5hZGRUbyhjb250cm9sbGVyKTsiLCIvKiFcbiAqIFNjcm9sbE1hZ2ljIHYyLjAuNiAoMjAxOC0xMC0wOClcbiAqIFRoZSBqYXZhc2NyaXB0IGxpYnJhcnkgZm9yIG1hZ2ljYWwgc2Nyb2xsIGludGVyYWN0aW9ucy5cbiAqIChjKSAyMDE4IEphbiBQYWVwa2UgKEBqYW5wYWVwa2UpXG4gKiBQcm9qZWN0IFdlYnNpdGU6IGh0dHA6Ly9zY3JvbGxtYWdpYy5pb1xuICogXG4gKiBAdmVyc2lvbiAyLjAuNlxuICogQGxpY2Vuc2UgRHVhbCBsaWNlbnNlZCB1bmRlciBNSVQgbGljZW5zZSBhbmQgR1BMLlxuICogQGF1dGhvciBKYW4gUGFlcGtlIC0gZS1tYWlsQGphbnBhZXBrZS5kZVxuICpcbiAqIEBmaWxlIFNjcm9sbE1hZ2ljIG1haW4gbGlicmFyeS5cbiAqL1xuLyoqXG4gKiBAbmFtZXNwYWNlIFNjcm9sbE1hZ2ljXG4gKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0Ly8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlLlxuXHRcdGRlZmluZShmYWN0b3J5KTtcblx0fSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0XHQvLyBDb21tb25KU1xuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHR9IGVsc2Uge1xuXHRcdC8vIEJyb3dzZXIgZ2xvYmFsXG5cdFx0cm9vdC5TY3JvbGxNYWdpYyA9IGZhY3RvcnkoKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciBTY3JvbGxNYWdpYyA9IGZ1bmN0aW9uICgpIHtcblx0XHRfdXRpbC5sb2coMiwgJyhDT01QQVRJQklMSVRZIE5PVElDRSkgLT4gQXMgb2YgU2Nyb2xsTWFnaWMgMi4wLjAgeW91IG5lZWQgdG8gdXNlIFxcJ25ldyBTY3JvbGxNYWdpYy5Db250cm9sbGVyKClcXCcgdG8gY3JlYXRlIGEgbmV3IGNvbnRyb2xsZXIgaW5zdGFuY2UuIFVzZSBcXCduZXcgU2Nyb2xsTWFnaWMuU2NlbmUoKVxcJyB0byBpbnN0YW5jZSBhIHNjZW5lLicpO1xuXHR9O1xuXG5cdFNjcm9sbE1hZ2ljLnZlcnNpb24gPSBcIjIuMC42XCI7XG5cblx0Ly8gVE9ETzogdGVtcG9yYXJ5IHdvcmthcm91bmQgZm9yIGNocm9tZSdzIHNjcm9sbCBqaXR0ZXIgYnVnXG5cdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2V3aGVlbFwiLCBmdW5jdGlvbiAoKSB7fSk7XG5cblx0Ly8gZ2xvYmFsIGNvbnN0XG5cdHZhciBQSU5fU1BBQ0VSX0FUVFJJQlVURSA9IFwiZGF0YS1zY3JvbGxtYWdpYy1waW4tc3BhY2VyXCI7XG5cblx0LyoqXG5cdCAqIFRoZSBtYWluIGNsYXNzIHRoYXQgaXMgbmVlZGVkIG9uY2UgcGVyIHNjcm9sbCBjb250YWluZXIuXG5cdCAqXG5cdCAqIEBjbGFzc1xuXHQgKlxuXHQgKiBAZXhhbXBsZVxuXHQgKiAvLyBiYXNpYyBpbml0aWFsaXphdGlvblxuXHQgKiB2YXIgY29udHJvbGxlciA9IG5ldyBTY3JvbGxNYWdpYy5Db250cm9sbGVyKCk7XG5cdCAqXG5cdCAqIC8vIHBhc3Npbmcgb3B0aW9uc1xuXHQgKiB2YXIgY29udHJvbGxlciA9IG5ldyBTY3JvbGxNYWdpYy5Db250cm9sbGVyKHtjb250YWluZXI6IFwiI215Q29udGFpbmVyXCIsIGxvZ2xldmVsOiAzfSk7XG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3QgY29udGFpbmluZyBvbmUgb3IgbW9yZSBvcHRpb25zIGZvciB0aGUgY29udHJvbGxlci5cblx0ICogQHBhcmFtIHsoc3RyaW5nfG9iamVjdCl9IFtvcHRpb25zLmNvbnRhaW5lcj13aW5kb3ddIC0gQSBzZWxlY3RvciwgRE9NIG9iamVjdCB0aGF0IHJlZmVyZW5jZXMgdGhlIG1haW4gY29udGFpbmVyIGZvciBzY3JvbGxpbmcuXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudmVydGljYWw9dHJ1ZV0gLSBTZXRzIHRoZSBzY3JvbGwgbW9kZSB0byB2ZXJ0aWNhbCAoYHRydWVgKSBvciBob3Jpem9udGFsIChgZmFsc2VgKSBzY3JvbGxpbmcuXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy5nbG9iYWxTY2VuZU9wdGlvbnM9e31dIC0gVGhlc2Ugb3B0aW9ucyB3aWxsIGJlIHBhc3NlZCB0byBldmVyeSBTY2VuZSB0aGF0IGlzIGFkZGVkIHRvIHRoZSBjb250cm9sbGVyIHVzaW5nIHRoZSBhZGRTY2VuZSBtZXRob2QuIEZvciBtb3JlIGluZm9ybWF0aW9uIG9uIFNjZW5lIG9wdGlvbnMgc2VlIHtAbGluayBTY3JvbGxNYWdpYy5TY2VuZX0uXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5sb2dsZXZlbD0yXSBMb2dsZXZlbCBmb3IgZGVidWdnaW5nLiBOb3RlIHRoYXQgbG9nZ2luZyBpcyBkaXNhYmxlZCBpbiB0aGUgbWluaWZpZWQgdmVyc2lvbiBvZiBTY3JvbGxNYWdpYy5cblx0ICoqIGAwYCA9PiBzaWxlbnRcblx0ICoqIGAxYCA9PiBlcnJvcnNcblx0ICoqIGAyYCA9PiBlcnJvcnMsIHdhcm5pbmdzXG5cdCAqKiBgM2AgPT4gZXJyb3JzLCB3YXJuaW5ncywgZGVidWdpbmZvXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMucmVmcmVzaEludGVydmFsPTEwMF0gLSBTb21lIGNoYW5nZXMgZG9uJ3QgY2FsbCBldmVudHMgYnkgZGVmYXVsdCwgbGlrZSBjaGFuZ2luZyB0aGUgY29udGFpbmVyIHNpemUgb3IgbW92aW5nIGEgc2NlbmUgdHJpZ2dlciBlbGVtZW50LiAgXG5cdCBUaGlzIGludGVydmFsIHBvbGxzIHRoZXNlIHBhcmFtZXRlcnMgdG8gZmlyZSB0aGUgbmVjZXNzYXJ5IGV2ZW50cy4gIFxuXHQgSWYgeW91IGRvbid0IHVzZSBjdXN0b20gY29udGFpbmVycywgdHJpZ2dlciBlbGVtZW50cyBvciBoYXZlIHN0YXRpYyBsYXlvdXRzLCB3aGVyZSB0aGUgcG9zaXRpb25zIG9mIHRoZSB0cmlnZ2VyIGVsZW1lbnRzIGRvbid0IGNoYW5nZSwgeW91IGNhbiBzZXQgdGhpcyB0byAwIGRpc2FibGUgaW50ZXJ2YWwgY2hlY2tpbmcgYW5kIGltcHJvdmUgcGVyZm9ybWFuY2UuXG5cdCAqXG5cdCAqL1xuXHRTY3JvbGxNYWdpYy5Db250cm9sbGVyID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbi8qXG5cdCAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0ICogc2V0dGluZ3Ncblx0ICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQgKi9cblx0XHR2YXJcblx0XHROQU1FU1BBQ0UgPSAnU2Nyb2xsTWFnaWMuQ29udHJvbGxlcicsXG5cdFx0XHRTQ1JPTExfRElSRUNUSU9OX0ZPUldBUkQgPSAnRk9SV0FSRCcsXG5cdFx0XHRTQ1JPTExfRElSRUNUSU9OX1JFVkVSU0UgPSAnUkVWRVJTRScsXG5cdFx0XHRTQ1JPTExfRElSRUNUSU9OX1BBVVNFRCA9ICdQQVVTRUQnLFxuXHRcdFx0REVGQVVMVF9PUFRJT05TID0gQ09OVFJPTExFUl9PUFRJT05TLmRlZmF1bHRzO1xuXG4vKlxuXHQgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdCAqIHByaXZhdGUgdmFyc1xuXHQgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdCAqL1xuXHRcdHZhclxuXHRcdENvbnRyb2xsZXIgPSB0aGlzLFxuXHRcdFx0X29wdGlvbnMgPSBfdXRpbC5leHRlbmQoe30sIERFRkFVTFRfT1BUSU9OUywgb3B0aW9ucyksXG5cdFx0XHRfc2NlbmVPYmplY3RzID0gW10sXG5cdFx0XHRfdXBkYXRlU2NlbmVzT25OZXh0Q3ljbGUgPSBmYWxzZSxcblx0XHRcdC8vIGNhbiBiZSBib29sZWFuICh0cnVlID0+IGFsbCBzY2VuZXMpIG9yIGFuIGFycmF5IG9mIHNjZW5lcyB0byBiZSB1cGRhdGVkXG5cdFx0XHRfc2Nyb2xsUG9zID0gMCxcblx0XHRcdF9zY3JvbGxEaXJlY3Rpb24gPSBTQ1JPTExfRElSRUNUSU9OX1BBVVNFRCxcblx0XHRcdF9pc0RvY3VtZW50ID0gdHJ1ZSxcblx0XHRcdF92aWV3UG9ydFNpemUgPSAwLFxuXHRcdFx0X2VuYWJsZWQgPSB0cnVlLFxuXHRcdFx0X3VwZGF0ZVRpbWVvdXQsIF9yZWZyZXNoVGltZW91dDtcblxuLypcblx0ICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQgKiBwcml2YXRlIGZ1bmN0aW9uc1xuXHQgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdCAqL1xuXG5cdFx0LyoqXG5cdFx0ICogSW50ZXJuYWwgY29uc3RydWN0b3IgZnVuY3Rpb24gb2YgdGhlIFNjcm9sbE1hZ2ljIENvbnRyb2xsZXJcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBjb25zdHJ1Y3QgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gX29wdGlvbnMpIHtcblx0XHRcdFx0aWYgKCFERUZBVUxUX09QVElPTlMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHRcdFx0XHRcdGxvZygyLCBcIldBUk5JTkc6IFVua25vd24gb3B0aW9uIFxcXCJcIiArIGtleSArIFwiXFxcIlwiKTtcblx0XHRcdFx0XHRkZWxldGUgX29wdGlvbnNba2V5XTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0X29wdGlvbnMuY29udGFpbmVyID0gX3V0aWwuZ2V0LmVsZW1lbnRzKF9vcHRpb25zLmNvbnRhaW5lcilbMF07XG5cdFx0XHQvLyBjaGVjayBTY3JvbGxDb250YWluZXJcblx0XHRcdGlmICghX29wdGlvbnMuY29udGFpbmVyKSB7XG5cdFx0XHRcdGxvZygxLCBcIkVSUk9SIGNyZWF0aW5nIG9iamVjdCBcIiArIE5BTUVTUEFDRSArIFwiOiBObyB2YWxpZCBzY3JvbGwgY29udGFpbmVyIHN1cHBsaWVkXCIpO1xuXHRcdFx0XHR0aHJvdyBOQU1FU1BBQ0UgKyBcIiBpbml0IGZhaWxlZC5cIjsgLy8gY2FuY2VsXG5cdFx0XHR9XG5cdFx0XHRfaXNEb2N1bWVudCA9IF9vcHRpb25zLmNvbnRhaW5lciA9PT0gd2luZG93IHx8IF9vcHRpb25zLmNvbnRhaW5lciA9PT0gZG9jdW1lbnQuYm9keSB8fCAhZG9jdW1lbnQuYm9keS5jb250YWlucyhfb3B0aW9ucy5jb250YWluZXIpO1xuXHRcdFx0Ly8gbm9ybWFsaXplIHRvIHdpbmRvd1xuXHRcdFx0aWYgKF9pc0RvY3VtZW50KSB7XG5cdFx0XHRcdF9vcHRpb25zLmNvbnRhaW5lciA9IHdpbmRvdztcblx0XHRcdH1cblx0XHRcdC8vIHVwZGF0ZSBjb250YWluZXIgc2l6ZSBpbW1lZGlhdGVseVxuXHRcdFx0X3ZpZXdQb3J0U2l6ZSA9IGdldFZpZXdwb3J0U2l6ZSgpO1xuXHRcdFx0Ly8gc2V0IGV2ZW50IGhhbmRsZXJzXG5cdFx0XHRfb3B0aW9ucy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCBvbkNoYW5nZSk7XG5cdFx0XHRfb3B0aW9ucy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInNjcm9sbFwiLCBvbkNoYW5nZSk7XG5cblx0XHRcdHZhciByaSA9IHBhcnNlSW50KF9vcHRpb25zLnJlZnJlc2hJbnRlcnZhbCwgMTApO1xuXHRcdFx0X29wdGlvbnMucmVmcmVzaEludGVydmFsID0gX3V0aWwudHlwZS5OdW1iZXIocmkpID8gcmkgOiBERUZBVUxUX09QVElPTlMucmVmcmVzaEludGVydmFsO1xuXHRcdFx0c2NoZWR1bGVSZWZyZXNoKCk7XG5cblx0XHRcdGxvZygzLCBcImFkZGVkIG5ldyBcIiArIE5BTUVTUEFDRSArIFwiIGNvbnRyb2xsZXIgKHZcIiArIFNjcm9sbE1hZ2ljLnZlcnNpb24gKyBcIilcIik7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFNjaGVkdWxlIHRoZSBuZXh0IGV4ZWN1dGlvbiBvZiB0aGUgcmVmcmVzaCBmdW5jdGlvblxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dmFyIHNjaGVkdWxlUmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChfb3B0aW9ucy5yZWZyZXNoSW50ZXJ2YWwgPiAwKSB7XG5cdFx0XHRcdF9yZWZyZXNoVGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KHJlZnJlc2gsIF9vcHRpb25zLnJlZnJlc2hJbnRlcnZhbCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIERlZmF1bHQgZnVuY3Rpb24gdG8gZ2V0IHNjcm9sbCBwb3MgLSBvdmVyd3JpdGVhYmxlIHVzaW5nIGBDb250cm9sbGVyLnNjcm9sbFBvcyhuZXdGdW5jdGlvbilgXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgZ2V0U2Nyb2xsUG9zID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIF9vcHRpb25zLnZlcnRpY2FsID8gX3V0aWwuZ2V0LnNjcm9sbFRvcChfb3B0aW9ucy5jb250YWluZXIpIDogX3V0aWwuZ2V0LnNjcm9sbExlZnQoX29wdGlvbnMuY29udGFpbmVyKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJucyB0aGUgY3VycmVudCB2aWV3cG9ydCBTaXplICh3aWR0aCB2b3IgaG9yaXpvbnRhbCwgaGVpZ2h0IGZvciB2ZXJ0aWNhbClcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBnZXRWaWV3cG9ydFNpemUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gX29wdGlvbnMudmVydGljYWwgPyBfdXRpbC5nZXQuaGVpZ2h0KF9vcHRpb25zLmNvbnRhaW5lcikgOiBfdXRpbC5nZXQud2lkdGgoX29wdGlvbnMuY29udGFpbmVyKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogRGVmYXVsdCBmdW5jdGlvbiB0byBzZXQgc2Nyb2xsIHBvcyAtIG92ZXJ3cml0ZWFibGUgdXNpbmcgYENvbnRyb2xsZXIuc2Nyb2xsVG8obmV3RnVuY3Rpb24pYFxuXHRcdCAqIE1ha2UgYXZhaWxhYmxlIHB1YmxpY2x5IGZvciBwaW5uZWQgbW91c2V3aGVlbCB3b3JrYXJvdW5kLlxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dmFyIHNldFNjcm9sbFBvcyA9IHRoaXMuX3NldFNjcm9sbFBvcyA9IGZ1bmN0aW9uIChwb3MpIHtcblx0XHRcdGlmIChfb3B0aW9ucy52ZXJ0aWNhbCkge1xuXHRcdFx0XHRpZiAoX2lzRG9jdW1lbnQpIHtcblx0XHRcdFx0XHR3aW5kb3cuc2Nyb2xsVG8oX3V0aWwuZ2V0LnNjcm9sbExlZnQoKSwgcG9zKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRfb3B0aW9ucy5jb250YWluZXIuc2Nyb2xsVG9wID0gcG9zO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoX2lzRG9jdW1lbnQpIHtcblx0XHRcdFx0XHR3aW5kb3cuc2Nyb2xsVG8ocG9zLCBfdXRpbC5nZXQuc2Nyb2xsVG9wKCkpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdF9vcHRpb25zLmNvbnRhaW5lci5zY3JvbGxMZWZ0ID0gcG9zO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIEhhbmRsZSB1cGRhdGVzIGluIGN5Y2xlcyBpbnN0ZWFkIG9mIG9uIHNjcm9sbCAocGVyZm9ybWFuY2UpXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgdXBkYXRlU2NlbmVzID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKF9lbmFibGVkICYmIF91cGRhdGVTY2VuZXNPbk5leHRDeWNsZSkge1xuXHRcdFx0XHQvLyBkZXRlcm1pbmUgc2NlbmVzIHRvIHVwZGF0ZVxuXHRcdFx0XHR2YXIgc2NlbmVzVG9VcGRhdGUgPSBfdXRpbC50eXBlLkFycmF5KF91cGRhdGVTY2VuZXNPbk5leHRDeWNsZSkgPyBfdXBkYXRlU2NlbmVzT25OZXh0Q3ljbGUgOiBfc2NlbmVPYmplY3RzLnNsaWNlKDApO1xuXHRcdFx0XHQvLyByZXNldCBzY2VuZXNcblx0XHRcdFx0X3VwZGF0ZVNjZW5lc09uTmV4dEN5Y2xlID0gZmFsc2U7XG5cdFx0XHRcdHZhciBvbGRTY3JvbGxQb3MgPSBfc2Nyb2xsUG9zO1xuXHRcdFx0XHQvLyB1cGRhdGUgc2Nyb2xsIHBvcyBub3cgaW5zdGVhZCBvZiBvbkNoYW5nZSwgYXMgaXQgbWlnaHQgaGF2ZSBjaGFuZ2VkIHNpbmNlIHNjaGVkdWxpbmcgKGkuZS4gaW4tYnJvd3NlciBzbW9vdGggc2Nyb2xsKVxuXHRcdFx0XHRfc2Nyb2xsUG9zID0gQ29udHJvbGxlci5zY3JvbGxQb3MoKTtcblx0XHRcdFx0dmFyIGRlbHRhU2Nyb2xsID0gX3Njcm9sbFBvcyAtIG9sZFNjcm9sbFBvcztcblx0XHRcdFx0aWYgKGRlbHRhU2Nyb2xsICE9PSAwKSB7IC8vIHNjcm9sbCBwb3NpdGlvbiBjaGFuZ2VkP1xuXHRcdFx0XHRcdF9zY3JvbGxEaXJlY3Rpb24gPSAoZGVsdGFTY3JvbGwgPiAwKSA/IFNDUk9MTF9ESVJFQ1RJT05fRk9SV0FSRCA6IFNDUk9MTF9ESVJFQ1RJT05fUkVWRVJTRTtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyByZXZlcnNlIG9yZGVyIG9mIHNjZW5lcyBpZiBzY3JvbGxpbmcgcmV2ZXJzZVxuXHRcdFx0XHRpZiAoX3Njcm9sbERpcmVjdGlvbiA9PT0gU0NST0xMX0RJUkVDVElPTl9SRVZFUlNFKSB7XG5cdFx0XHRcdFx0c2NlbmVzVG9VcGRhdGUucmV2ZXJzZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIHVwZGF0ZSBzY2VuZXNcblx0XHRcdFx0c2NlbmVzVG9VcGRhdGUuZm9yRWFjaChmdW5jdGlvbiAoc2NlbmUsIGluZGV4KSB7XG5cdFx0XHRcdFx0bG9nKDMsIFwidXBkYXRpbmcgU2NlbmUgXCIgKyAoaW5kZXggKyAxKSArIFwiL1wiICsgc2NlbmVzVG9VcGRhdGUubGVuZ3RoICsgXCIgKFwiICsgX3NjZW5lT2JqZWN0cy5sZW5ndGggKyBcIiB0b3RhbClcIik7XG5cdFx0XHRcdFx0c2NlbmUudXBkYXRlKHRydWUpO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0aWYgKHNjZW5lc1RvVXBkYXRlLmxlbmd0aCA9PT0gMCAmJiBfb3B0aW9ucy5sb2dsZXZlbCA+PSAzKSB7XG5cdFx0XHRcdFx0bG9nKDMsIFwidXBkYXRpbmcgMCBTY2VuZXMgKG5vdGhpbmcgYWRkZWQgdG8gY29udHJvbGxlcilcIik7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogSW5pdGlhbGl6ZXMgckFGIGNhbGxiYWNrXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgZGVib3VuY2VVcGRhdGUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRfdXBkYXRlVGltZW91dCA9IF91dGlsLnJBRih1cGRhdGVTY2VuZXMpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBIYW5kbGVzIENvbnRhaW5lciBjaGFuZ2VzXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgb25DaGFuZ2UgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0bG9nKDMsIFwiZXZlbnQgZmlyZWQgY2F1c2luZyBhbiB1cGRhdGU6XCIsIGUudHlwZSk7XG5cdFx0XHRpZiAoZS50eXBlID09IFwicmVzaXplXCIpIHtcblx0XHRcdFx0Ly8gcmVzaXplXG5cdFx0XHRcdF92aWV3UG9ydFNpemUgPSBnZXRWaWV3cG9ydFNpemUoKTtcblx0XHRcdFx0X3Njcm9sbERpcmVjdGlvbiA9IFNDUk9MTF9ESVJFQ1RJT05fUEFVU0VEO1xuXHRcdFx0fVxuXHRcdFx0Ly8gc2NoZWR1bGUgdXBkYXRlXG5cdFx0XHRpZiAoX3VwZGF0ZVNjZW5lc09uTmV4dEN5Y2xlICE9PSB0cnVlKSB7XG5cdFx0XHRcdF91cGRhdGVTY2VuZXNPbk5leHRDeWNsZSA9IHRydWU7XG5cdFx0XHRcdGRlYm91bmNlVXBkYXRlKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHZhciByZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKCFfaXNEb2N1bWVudCkge1xuXHRcdFx0XHQvLyBzaW11bGF0ZSByZXNpemUgZXZlbnQuIE9ubHkgd29ya3MgZm9yIHZpZXdwb3J0IHJlbGV2YW50IHBhcmFtIChwZXJmb3JtYW5jZSlcblx0XHRcdFx0aWYgKF92aWV3UG9ydFNpemUgIT0gZ2V0Vmlld3BvcnRTaXplKCkpIHtcblx0XHRcdFx0XHR2YXIgcmVzaXplRXZlbnQ7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdHJlc2l6ZUV2ZW50ID0gbmV3IEV2ZW50KCdyZXNpemUnLCB7XG5cdFx0XHRcdFx0XHRcdGJ1YmJsZXM6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRjYW5jZWxhYmxlOiBmYWxzZVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fSBjYXRjaCAoZSkgeyAvLyBzdHVwaWQgSUVcblx0XHRcdFx0XHRcdHJlc2l6ZUV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJFdmVudFwiKTtcblx0XHRcdFx0XHRcdHJlc2l6ZUV2ZW50LmluaXRFdmVudChcInJlc2l6ZVwiLCBmYWxzZSwgZmFsc2UpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRfb3B0aW9ucy5jb250YWluZXIuZGlzcGF0Y2hFdmVudChyZXNpemVFdmVudCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdF9zY2VuZU9iamVjdHMuZm9yRWFjaChmdW5jdGlvbiAoc2NlbmUsIGluZGV4KSB7IC8vIHJlZnJlc2ggYWxsIHNjZW5lc1xuXHRcdFx0XHRzY2VuZS5yZWZyZXNoKCk7XG5cdFx0XHR9KTtcblx0XHRcdHNjaGVkdWxlUmVmcmVzaCgpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTZW5kIGEgZGVidWcgbWVzc2FnZSB0byB0aGUgY29uc29sZS5cblx0XHQgKiBwcm92aWRlZCBwdWJsaWNseSB3aXRoIF9sb2cgZm9yIHBsdWdpbnNcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IGxvZ2xldmVsIC0gVGhlIGxvZ2xldmVsIHJlcXVpcmVkIHRvIGluaXRpYXRlIG91dHB1dCBmb3IgdGhlIG1lc3NhZ2UuXG5cdFx0ICogQHBhcmFtIHsuLi5taXhlZH0gb3V0cHV0IC0gT25lIG9yIG1vcmUgdmFyaWFibGVzIHRoYXQgc2hvdWxkIGJlIHBhc3NlZCB0byB0aGUgY29uc29sZS5cblx0XHQgKi9cblx0XHR2YXIgbG9nID0gdGhpcy5fbG9nID0gZnVuY3Rpb24gKGxvZ2xldmVsLCBvdXRwdXQpIHtcblx0XHRcdGlmIChfb3B0aW9ucy5sb2dsZXZlbCA+PSBsb2dsZXZlbCkge1xuXHRcdFx0XHRBcnJheS5wcm90b3R5cGUuc3BsaWNlLmNhbGwoYXJndW1lbnRzLCAxLCAwLCBcIihcIiArIE5BTUVTUEFDRSArIFwiKSAtPlwiKTtcblx0XHRcdFx0X3V0aWwubG9nLmFwcGx5KHdpbmRvdywgYXJndW1lbnRzKTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdC8vIGZvciBzY2VuZXMgd2UgaGF2ZSBnZXR0ZXJzIGZvciBlYWNoIG9wdGlvbiwgYnV0IGZvciB0aGUgY29udHJvbGxlciB3ZSBkb24ndCwgc28gd2UgbmVlZCB0byBtYWtlIGl0IGF2YWlsYWJsZSBleHRlcm5hbGx5IGZvciBwbHVnaW5zXG5cdFx0dGhpcy5fb3B0aW9ucyA9IF9vcHRpb25zO1xuXG5cdFx0LyoqXG5cdFx0ICogU29ydCBzY2VuZXMgaW4gYXNjZW5kaW5nIG9yZGVyIG9mIHRoZWlyIHN0YXJ0IG9mZnNldC5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqXG5cdFx0ICogQHBhcmFtIHthcnJheX0gU2NlbmVzQXJyYXkgLSBhbiBhcnJheSBvZiBTY3JvbGxNYWdpYyBTY2VuZXMgdGhhdCBzaG91bGQgYmUgc29ydGVkXG5cdFx0ICogQHJldHVybiB7YXJyYXl9IFRoZSBzb3J0ZWQgYXJyYXkgb2YgU2NlbmVzLlxuXHRcdCAqL1xuXHRcdHZhciBzb3J0U2NlbmVzID0gZnVuY3Rpb24gKFNjZW5lc0FycmF5KSB7XG5cdFx0XHRpZiAoU2NlbmVzQXJyYXkubGVuZ3RoIDw9IDEpIHtcblx0XHRcdFx0cmV0dXJuIFNjZW5lc0FycmF5O1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dmFyIHNjZW5lcyA9IFNjZW5lc0FycmF5LnNsaWNlKDApO1xuXHRcdFx0XHRzY2VuZXMuc29ydChmdW5jdGlvbiAoYSwgYikge1xuXHRcdFx0XHRcdHJldHVybiBhLnNjcm9sbE9mZnNldCgpID4gYi5zY3JvbGxPZmZzZXQoKSA/IDEgOiAtMTtcblx0XHRcdFx0fSk7XG5cdFx0XHRcdHJldHVybiBzY2VuZXM7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQgKiBwdWJsaWMgZnVuY3Rpb25zXG5cdFx0ICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCAqL1xuXG5cdFx0LyoqXG5cdFx0ICogQWRkIG9uZSBvcmUgbW9yZSBzY2VuZShzKSB0byB0aGUgY29udHJvbGxlci4gIFxuXHRcdCAqIFRoaXMgaXMgdGhlIGVxdWl2YWxlbnQgdG8gYFNjZW5lLmFkZFRvKGNvbnRyb2xsZXIpYC5cblx0XHQgKiBAcHVibGljXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiAvLyB3aXRoIGEgcHJldmlvdXNseSBkZWZpbmVkIHNjZW5lXG5cdFx0ICogY29udHJvbGxlci5hZGRTY2VuZShzY2VuZSk7XG5cdFx0ICpcblx0XHQgKiAvLyB3aXRoIGEgbmV3bHkgY3JlYXRlZCBzY2VuZS5cblx0XHQgKiBjb250cm9sbGVyLmFkZFNjZW5lKG5ldyBTY3JvbGxNYWdpYy5TY2VuZSh7ZHVyYXRpb24gOiAwfSkpO1xuXHRcdCAqXG5cdFx0ICogLy8gYWRkaW5nIG11bHRpcGxlIHNjZW5lc1xuXHRcdCAqIGNvbnRyb2xsZXIuYWRkU2NlbmUoW3NjZW5lLCBzY2VuZTIsIG5ldyBTY3JvbGxNYWdpYy5TY2VuZSh7ZHVyYXRpb24gOiAwfSldKTtcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7KFNjcm9sbE1hZ2ljLlNjZW5lfGFycmF5KX0gbmV3U2NlbmUgLSBTY3JvbGxNYWdpYyBTY2VuZSBvciBBcnJheSBvZiBTY2VuZXMgdG8gYmUgYWRkZWQgdG8gdGhlIGNvbnRyb2xsZXIuXG5cdFx0ICogQHJldHVybiB7Q29udHJvbGxlcn0gUGFyZW50IG9iamVjdCBmb3IgY2hhaW5pbmcuXG5cdFx0ICovXG5cdFx0dGhpcy5hZGRTY2VuZSA9IGZ1bmN0aW9uIChuZXdTY2VuZSkge1xuXHRcdFx0aWYgKF91dGlsLnR5cGUuQXJyYXkobmV3U2NlbmUpKSB7XG5cdFx0XHRcdG5ld1NjZW5lLmZvckVhY2goZnVuY3Rpb24gKHNjZW5lLCBpbmRleCkge1xuXHRcdFx0XHRcdENvbnRyb2xsZXIuYWRkU2NlbmUoc2NlbmUpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSBpZiAobmV3U2NlbmUgaW5zdGFuY2VvZiBTY3JvbGxNYWdpYy5TY2VuZSkge1xuXHRcdFx0XHRpZiAobmV3U2NlbmUuY29udHJvbGxlcigpICE9PSBDb250cm9sbGVyKSB7XG5cdFx0XHRcdFx0bmV3U2NlbmUuYWRkVG8oQ29udHJvbGxlcik7XG5cdFx0XHRcdH0gZWxzZSBpZiAoX3NjZW5lT2JqZWN0cy5pbmRleE9mKG5ld1NjZW5lKSA8IDApIHtcblx0XHRcdFx0XHQvLyBuZXcgc2NlbmVcblx0XHRcdFx0XHRfc2NlbmVPYmplY3RzLnB1c2gobmV3U2NlbmUpOyAvLyBhZGQgdG8gYXJyYXlcblx0XHRcdFx0XHRfc2NlbmVPYmplY3RzID0gc29ydFNjZW5lcyhfc2NlbmVPYmplY3RzKTsgLy8gc29ydFxuXHRcdFx0XHRcdG5ld1NjZW5lLm9uKFwic2hpZnQuY29udHJvbGxlcl9zb3J0XCIsIGZ1bmN0aW9uICgpIHsgLy8gcmVzb3J0IHdoZW5ldmVyIHNjZW5lIG1vdmVzXG5cdFx0XHRcdFx0XHRfc2NlbmVPYmplY3RzID0gc29ydFNjZW5lcyhfc2NlbmVPYmplY3RzKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHQvLyBpbnNlcnQgR2xvYmFsIGRlZmF1bHRzLlxuXHRcdFx0XHRcdGZvciAodmFyIGtleSBpbiBfb3B0aW9ucy5nbG9iYWxTY2VuZU9wdGlvbnMpIHtcblx0XHRcdFx0XHRcdGlmIChuZXdTY2VuZVtrZXldKSB7XG5cdFx0XHRcdFx0XHRcdG5ld1NjZW5lW2tleV0uY2FsbChuZXdTY2VuZSwgX29wdGlvbnMuZ2xvYmFsU2NlbmVPcHRpb25zW2tleV0pO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRsb2coMywgXCJhZGRpbmcgU2NlbmUgKG5vdyBcIiArIF9zY2VuZU9iamVjdHMubGVuZ3RoICsgXCIgdG90YWwpXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRsb2coMSwgXCJFUlJPUjogaW52YWxpZCBhcmd1bWVudCBzdXBwbGllZCBmb3IgJy5hZGRTY2VuZSgpJ1wiKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBDb250cm9sbGVyO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZW1vdmUgb25lIG9yZSBtb3JlIHNjZW5lKHMpIGZyb20gdGhlIGNvbnRyb2xsZXIuICBcblx0XHQgKiBUaGlzIGlzIHRoZSBlcXVpdmFsZW50IHRvIGBTY2VuZS5yZW1vdmUoKWAuXG5cdFx0ICogQHB1YmxpY1xuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogLy8gcmVtb3ZlIGEgc2NlbmUgZnJvbSB0aGUgY29udHJvbGxlclxuXHRcdCAqIGNvbnRyb2xsZXIucmVtb3ZlU2NlbmUoc2NlbmUpO1xuXHRcdCAqXG5cdFx0ICogLy8gcmVtb3ZlIG11bHRpcGxlIHNjZW5lcyBmcm9tIHRoZSBjb250cm9sbGVyXG5cdFx0ICogY29udHJvbGxlci5yZW1vdmVTY2VuZShbc2NlbmUsIHNjZW5lMiwgc2NlbmUzXSk7XG5cdFx0ICpcblx0XHQgKiBAcGFyYW0geyhTY3JvbGxNYWdpYy5TY2VuZXxhcnJheSl9IFNjZW5lIC0gU2Nyb2xsTWFnaWMgU2NlbmUgb3IgQXJyYXkgb2YgU2NlbmVzIHRvIGJlIHJlbW92ZWQgZnJvbSB0aGUgY29udHJvbGxlci5cblx0XHQgKiBAcmV0dXJucyB7Q29udHJvbGxlcn0gUGFyZW50IG9iamVjdCBmb3IgY2hhaW5pbmcuXG5cdFx0ICovXG5cdFx0dGhpcy5yZW1vdmVTY2VuZSA9IGZ1bmN0aW9uIChTY2VuZSkge1xuXHRcdFx0aWYgKF91dGlsLnR5cGUuQXJyYXkoU2NlbmUpKSB7XG5cdFx0XHRcdFNjZW5lLmZvckVhY2goZnVuY3Rpb24gKHNjZW5lLCBpbmRleCkge1xuXHRcdFx0XHRcdENvbnRyb2xsZXIucmVtb3ZlU2NlbmUoc2NlbmUpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHZhciBpbmRleCA9IF9zY2VuZU9iamVjdHMuaW5kZXhPZihTY2VuZSk7XG5cdFx0XHRcdGlmIChpbmRleCA+IC0xKSB7XG5cdFx0XHRcdFx0U2NlbmUub2ZmKFwic2hpZnQuY29udHJvbGxlcl9zb3J0XCIpO1xuXHRcdFx0XHRcdF9zY2VuZU9iamVjdHMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdFx0XHRsb2coMywgXCJyZW1vdmluZyBTY2VuZSAobm93IFwiICsgX3NjZW5lT2JqZWN0cy5sZW5ndGggKyBcIiBsZWZ0KVwiKTtcblx0XHRcdFx0XHRTY2VuZS5yZW1vdmUoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIENvbnRyb2xsZXI7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFVwZGF0ZSBvbmUgb3JlIG1vcmUgc2NlbmUocykgYWNjb3JkaW5nIHRvIHRoZSBzY3JvbGwgcG9zaXRpb24gb2YgdGhlIGNvbnRhaW5lci4gIFxuXHRcdCAqIFRoaXMgaXMgdGhlIGVxdWl2YWxlbnQgdG8gYFNjZW5lLnVwZGF0ZSgpYC4gIFxuXHRcdCAqIFRoZSB1cGRhdGUgbWV0aG9kIGNhbGN1bGF0ZXMgdGhlIHNjZW5lJ3Mgc3RhcnQgYW5kIGVuZCBwb3NpdGlvbiAoYmFzZWQgb24gdGhlIHRyaWdnZXIgZWxlbWVudCwgdHJpZ2dlciBob29rLCBkdXJhdGlvbiBhbmQgb2Zmc2V0KSBhbmQgY2hlY2tzIGl0IGFnYWluc3QgdGhlIGN1cnJlbnQgc2Nyb2xsIHBvc2l0aW9uIG9mIHRoZSBjb250YWluZXIuICBcblx0XHQgKiBJdCB0aGVuIHVwZGF0ZXMgdGhlIGN1cnJlbnQgc2NlbmUgc3RhdGUgYWNjb3JkaW5nbHkgKG9yIGRvZXMgbm90aGluZywgaWYgdGhlIHN0YXRlIGlzIGFscmVhZHkgY29ycmVjdCkg4oCTIFBpbnMgd2lsbCBiZSBzZXQgdG8gdGhlaXIgY29ycmVjdCBwb3NpdGlvbiBhbmQgdHdlZW5zIHdpbGwgYmUgdXBkYXRlZCB0byB0aGVpciBjb3JyZWN0IHByb2dyZXNzLiAgXG5cdFx0ICogXyoqTm90ZToqKiBUaGlzIG1ldGhvZCBnZXRzIGNhbGxlZCBjb25zdGFudGx5IHdoZW5ldmVyIENvbnRyb2xsZXIgZGV0ZWN0cyBhIGNoYW5nZS4gVGhlIG9ubHkgYXBwbGljYXRpb24gZm9yIHlvdSBpcyBpZiB5b3UgY2hhbmdlIHNvbWV0aGluZyBvdXRzaWRlIG9mIHRoZSByZWFsbSBvZiBTY3JvbGxNYWdpYywgbGlrZSBtb3ZpbmcgdGhlIHRyaWdnZXIgb3IgY2hhbmdpbmcgdHdlZW4gcGFyYW1ldGVycy5fXG5cdFx0ICogQHB1YmxpY1xuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogLy8gdXBkYXRlIGEgc3BlY2lmaWMgc2NlbmUgb24gbmV4dCBjeWNsZVxuXHRcdCAqIGNvbnRyb2xsZXIudXBkYXRlU2NlbmUoc2NlbmUpO1xuXHRcdCAqXG5cdFx0ICogLy8gdXBkYXRlIGEgc3BlY2lmaWMgc2NlbmUgaW1tZWRpYXRlbHlcblx0XHQgKiBjb250cm9sbGVyLnVwZGF0ZVNjZW5lKHNjZW5lLCB0cnVlKTtcblx0XHQgKlxuXHRcdCAqIC8vIHVwZGF0ZSBtdWx0aXBsZSBzY2VuZXMgc2NlbmUgb24gbmV4dCBjeWNsZVxuXHRcdCAqIGNvbnRyb2xsZXIudXBkYXRlU2NlbmUoW3NjZW5lMSwgc2NlbmUyLCBzY2VuZTNdKTtcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7U2Nyb2xsTWFnaWMuU2NlbmV9IFNjZW5lIC0gU2Nyb2xsTWFnaWMgU2NlbmUgb3IgQXJyYXkgb2YgU2NlbmVzIHRoYXQgaXMvYXJlIHN1cHBvc2VkIHRvIGJlIHVwZGF0ZWQuXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBbaW1tZWRpYXRlbHk9ZmFsc2VdIC0gSWYgYHRydWVgIHRoZSB1cGRhdGUgd2lsbCBiZSBpbnN0YW50LCBpZiBgZmFsc2VgIGl0IHdpbGwgd2FpdCB1bnRpbCBuZXh0IHVwZGF0ZSBjeWNsZS4gIFxuXHRcdCBUaGlzIGlzIHVzZWZ1bCB3aGVuIGNoYW5naW5nIG11bHRpcGxlIHByb3BlcnRpZXMgb2YgdGhlIHNjZW5lIC0gdGhpcyB3YXkgaXQgd2lsbCBvbmx5IGJlIHVwZGF0ZWQgb25jZSBhbGwgbmV3IHByb3BlcnRpZXMgYXJlIHNldCAodXBkYXRlU2NlbmVzKS5cblx0XHQgKiBAcmV0dXJuIHtDb250cm9sbGVyfSBQYXJlbnQgb2JqZWN0IGZvciBjaGFpbmluZy5cblx0XHQgKi9cblx0XHR0aGlzLnVwZGF0ZVNjZW5lID0gZnVuY3Rpb24gKFNjZW5lLCBpbW1lZGlhdGVseSkge1xuXHRcdFx0aWYgKF91dGlsLnR5cGUuQXJyYXkoU2NlbmUpKSB7XG5cdFx0XHRcdFNjZW5lLmZvckVhY2goZnVuY3Rpb24gKHNjZW5lLCBpbmRleCkge1xuXHRcdFx0XHRcdENvbnRyb2xsZXIudXBkYXRlU2NlbmUoc2NlbmUsIGltbWVkaWF0ZWx5KTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoaW1tZWRpYXRlbHkpIHtcblx0XHRcdFx0XHRTY2VuZS51cGRhdGUodHJ1ZSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoX3VwZGF0ZVNjZW5lc09uTmV4dEN5Y2xlICE9PSB0cnVlICYmIFNjZW5lIGluc3RhbmNlb2YgU2Nyb2xsTWFnaWMuU2NlbmUpIHsgLy8gaWYgX3VwZGF0ZVNjZW5lc09uTmV4dEN5Y2xlIGlzIHRydWUsIGFsbCBjb25uZWN0ZWQgc2NlbmVzIGFyZSBhbHJlYWR5IHNjaGVkdWxlZCBmb3IgdXBkYXRlXG5cdFx0XHRcdFx0Ly8gcHJlcCBhcnJheSBmb3IgbmV4dCB1cGRhdGUgY3ljbGVcblx0XHRcdFx0XHRfdXBkYXRlU2NlbmVzT25OZXh0Q3ljbGUgPSBfdXBkYXRlU2NlbmVzT25OZXh0Q3ljbGUgfHwgW107XG5cdFx0XHRcdFx0aWYgKF91cGRhdGVTY2VuZXNPbk5leHRDeWNsZS5pbmRleE9mKFNjZW5lKSA9PSAtMSkge1xuXHRcdFx0XHRcdFx0X3VwZGF0ZVNjZW5lc09uTmV4dEN5Y2xlLnB1c2goU2NlbmUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRfdXBkYXRlU2NlbmVzT25OZXh0Q3ljbGUgPSBzb3J0U2NlbmVzKF91cGRhdGVTY2VuZXNPbk5leHRDeWNsZSk7IC8vIHNvcnRcblx0XHRcdFx0XHRkZWJvdW5jZVVwZGF0ZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gQ29udHJvbGxlcjtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogVXBkYXRlcyB0aGUgY29udHJvbGxlciBwYXJhbXMgYW5kIGNhbGxzIHVwZGF0ZVNjZW5lIG9uIGV2ZXJ5IHNjZW5lLCB0aGF0IGlzIGF0dGFjaGVkIHRvIHRoZSBjb250cm9sbGVyLiAgXG5cdFx0ICogU2VlIGBDb250cm9sbGVyLnVwZGF0ZVNjZW5lKClgIGZvciBtb3JlIGluZm9ybWF0aW9uIGFib3V0IHdoYXQgdGhpcyBtZWFucy4gIFxuXHRcdCAqIEluIG1vc3QgY2FzZXMgeW91IHdpbGwgbm90IG5lZWQgdGhpcyBmdW5jdGlvbiwgYXMgaXQgaXMgY2FsbGVkIGNvbnN0YW50bHksIHdoZW5ldmVyIFNjcm9sbE1hZ2ljIGRldGVjdHMgYSBzdGF0ZSBjaGFuZ2UgZXZlbnQsIGxpa2UgcmVzaXplIG9yIHNjcm9sbC4gIFxuXHRcdCAqIFRoZSBvbmx5IGFwcGxpY2F0aW9uIGZvciB0aGlzIG1ldGhvZCBpcyB3aGVuIFNjcm9sbE1hZ2ljIGZhaWxzIHRvIGRldGVjdCB0aGVzZSBldmVudHMuICBcblx0XHQgKiBPbmUgYXBwbGljYXRpb24gaXMgd2l0aCBzb21lIGV4dGVybmFsIHNjcm9sbCBsaWJyYXJpZXMgKGxpa2UgaVNjcm9sbCkgdGhhdCBtb3ZlIGFuIGludGVybmFsIGNvbnRhaW5lciB0byBhIG5lZ2F0aXZlIG9mZnNldCBpbnN0ZWFkIG9mIGFjdHVhbGx5IHNjcm9sbGluZy4gSW4gdGhpcyBjYXNlIHRoZSB1cGRhdGUgb24gdGhlIGNvbnRyb2xsZXIgbmVlZHMgdG8gYmUgY2FsbGVkIHdoZW5ldmVyIHRoZSBjaGlsZCBjb250YWluZXIncyBwb3NpdGlvbiBjaGFuZ2VzLlxuXHRcdCAqIEZvciB0aGlzIGNhc2UgdGhlcmUgd2lsbCBhbHNvIGJlIHRoZSBuZWVkIHRvIHByb3ZpZGUgYSBjdXN0b20gZnVuY3Rpb24gdG8gY2FsY3VsYXRlIHRoZSBjb3JyZWN0IHNjcm9sbCBwb3NpdGlvbi4gU2VlIGBDb250cm9sbGVyLnNjcm9sbFBvcygpYCBmb3IgZGV0YWlscy5cblx0XHQgKiBAcHVibGljXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiAvLyB1cGRhdGUgdGhlIGNvbnRyb2xsZXIgb24gbmV4dCBjeWNsZSAoc2F2ZXMgcGVyZm9ybWFuY2UgZHVlIHRvIGVsaW1pbmF0aW9uIG9mIHJlZHVuZGFudCB1cGRhdGVzKVxuXHRcdCAqIGNvbnRyb2xsZXIudXBkYXRlKCk7XG5cdFx0ICpcblx0XHQgKiAvLyB1cGRhdGUgdGhlIGNvbnRyb2xsZXIgaW1tZWRpYXRlbHlcblx0XHQgKiBjb250cm9sbGVyLnVwZGF0ZSh0cnVlKTtcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gW2ltbWVkaWF0ZWx5PWZhbHNlXSAtIElmIGB0cnVlYCB0aGUgdXBkYXRlIHdpbGwgYmUgaW5zdGFudCwgaWYgYGZhbHNlYCBpdCB3aWxsIHdhaXQgdW50aWwgbmV4dCB1cGRhdGUgY3ljbGUgKGJldHRlciBwZXJmb3JtYW5jZSlcblx0XHQgKiBAcmV0dXJuIHtDb250cm9sbGVyfSBQYXJlbnQgb2JqZWN0IGZvciBjaGFpbmluZy5cblx0XHQgKi9cblx0XHR0aGlzLnVwZGF0ZSA9IGZ1bmN0aW9uIChpbW1lZGlhdGVseSkge1xuXHRcdFx0b25DaGFuZ2Uoe1xuXHRcdFx0XHR0eXBlOiBcInJlc2l6ZVwiXG5cdFx0XHR9KTsgLy8gd2lsbCB1cGRhdGUgc2l6ZSBhbmQgc2V0IF91cGRhdGVTY2VuZXNPbk5leHRDeWNsZSB0byB0cnVlXG5cdFx0XHRpZiAoaW1tZWRpYXRlbHkpIHtcblx0XHRcdFx0dXBkYXRlU2NlbmVzKCk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gQ29udHJvbGxlcjtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogU2Nyb2xsIHRvIGEgbnVtZXJpYyBzY3JvbGwgb2Zmc2V0LCBhIERPTSBlbGVtZW50LCB0aGUgc3RhcnQgb2YgYSBzY2VuZSBvciBwcm92aWRlIGFuIGFsdGVybmF0ZSBtZXRob2QgZm9yIHNjcm9sbGluZy4gIFxuXHRcdCAqIEZvciB2ZXJ0aWNhbCBjb250cm9sbGVycyBpdCB3aWxsIGNoYW5nZSB0aGUgdG9wIHNjcm9sbCBvZmZzZXQgYW5kIGZvciBob3Jpem9udGFsIGFwcGxpY2F0aW9ucyBpdCB3aWxsIGNoYW5nZSB0aGUgbGVmdCBvZmZzZXQuXG5cdFx0ICogQHB1YmxpY1xuXHRcdCAqXG5cdFx0ICogQHNpbmNlIDEuMS4wXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiAvLyBzY3JvbGwgdG8gYW4gb2Zmc2V0IG9mIDEwMFxuXHRcdCAqIGNvbnRyb2xsZXIuc2Nyb2xsVG8oMTAwKTtcblx0XHQgKlxuXHRcdCAqIC8vIHNjcm9sbCB0byBhIERPTSBlbGVtZW50XG5cdFx0ICogY29udHJvbGxlci5zY3JvbGxUbyhcIiNhbmNob3JcIik7XG5cdFx0ICpcblx0XHQgKiAvLyBzY3JvbGwgdG8gdGhlIGJlZ2lubmluZyBvZiBhIHNjZW5lXG5cdFx0ICogdmFyIHNjZW5lID0gbmV3IFNjcm9sbE1hZ2ljLlNjZW5lKHtvZmZzZXQ6IDIwMH0pO1xuXHRcdCAqIGNvbnRyb2xsZXIuc2Nyb2xsVG8oc2NlbmUpO1xuXHRcdCAqXG5cdFx0ICogLy8gZGVmaW5lIGEgbmV3IHNjcm9sbCBwb3NpdGlvbiBtb2RpZmljYXRpb24gZnVuY3Rpb24gKGpRdWVyeSBhbmltYXRlIGluc3RlYWQgb2YganVtcClcblx0XHQgKiBjb250cm9sbGVyLnNjcm9sbFRvKGZ1bmN0aW9uIChuZXdTY3JvbGxQb3MpIHtcblx0XHQgKlx0JChcImh0bWwsIGJvZHlcIikuYW5pbWF0ZSh7c2Nyb2xsVG9wOiBuZXdTY3JvbGxQb3N9KTtcblx0XHQgKiB9KTtcblx0XHQgKiBjb250cm9sbGVyLnNjcm9sbFRvKDEwMCk7IC8vIGNhbGwgYXMgdXN1YWwsIGJ1dCB0aGUgbmV3IGZ1bmN0aW9uIHdpbGwgYmUgdXNlZCBpbnN0ZWFkXG5cdFx0ICpcblx0XHQgKiAvLyBkZWZpbmUgYSBuZXcgc2Nyb2xsIGZ1bmN0aW9uIHdpdGggYW4gYWRkaXRpb25hbCBwYXJhbWV0ZXJcblx0XHQgKiBjb250cm9sbGVyLnNjcm9sbFRvKGZ1bmN0aW9uIChuZXdTY3JvbGxQb3MsIG1lc3NhZ2UpIHtcblx0XHQgKiAgY29uc29sZS5sb2cobWVzc2FnZSk7XG5cdFx0ICpcdCQodGhpcykuYW5pbWF0ZSh7c2Nyb2xsVG9wOiBuZXdTY3JvbGxQb3N9KTtcblx0XHQgKiB9KTtcblx0XHQgKiAvLyBjYWxsIGFzIHVzdWFsLCBidXQgc3VwcGx5IGFuIGV4dHJhIHBhcmFtZXRlciB0byB0aGUgZGVmaW5lZCBjdXN0b20gZnVuY3Rpb25cblx0XHQgKiBjb250cm9sbGVyLnNjcm9sbFRvKDEwMCwgXCJteSBtZXNzYWdlXCIpO1xuXHRcdCAqXG5cdFx0ICogLy8gZGVmaW5lIGEgbmV3IHNjcm9sbCBmdW5jdGlvbiB3aXRoIGFuIGFkZGl0aW9uYWwgcGFyYW1ldGVyIGNvbnRhaW5pbmcgbXVsdGlwbGUgdmFyaWFibGVzXG5cdFx0ICogY29udHJvbGxlci5zY3JvbGxUbyhmdW5jdGlvbiAobmV3U2Nyb2xsUG9zLCBvcHRpb25zKSB7XG5cdFx0ICogIHNvbWVHbG9iYWxWYXIgPSBvcHRpb25zLmEgKyBvcHRpb25zLmI7XG5cdFx0ICpcdCQodGhpcykuYW5pbWF0ZSh7c2Nyb2xsVG9wOiBuZXdTY3JvbGxQb3N9KTtcblx0XHQgKiB9KTtcblx0XHQgKiAvLyBjYWxsIGFzIHVzdWFsLCBidXQgc3VwcGx5IGFuIGV4dHJhIHBhcmFtZXRlciBjb250YWluaW5nIG11bHRpcGxlIG9wdGlvbnNcblx0XHQgKiBjb250cm9sbGVyLnNjcm9sbFRvKDEwMCwge2E6IDEsIGI6IDJ9KTtcblx0XHQgKlxuXHRcdCAqIC8vIGRlZmluZSBhIG5ldyBzY3JvbGwgZnVuY3Rpb24gd2l0aCBhIGNhbGxiYWNrIHN1cHBsaWVkIGFzIGFuIGFkZGl0aW9uYWwgcGFyYW1ldGVyXG5cdFx0ICogY29udHJvbGxlci5zY3JvbGxUbyhmdW5jdGlvbiAobmV3U2Nyb2xsUG9zLCBjYWxsYmFjaykge1xuXHRcdCAqXHQkKHRoaXMpLmFuaW1hdGUoe3Njcm9sbFRvcDogbmV3U2Nyb2xsUG9zfSwgNDAwLCBcInN3aW5nXCIsIGNhbGxiYWNrKTtcblx0XHQgKiB9KTtcblx0XHQgKiAvLyBjYWxsIGFzIHVzdWFsLCBidXQgc3VwcGx5IGFuIGV4dHJhIHBhcmFtZXRlciwgd2hpY2ggaXMgdXNlZCBhcyBhIGNhbGxiYWNrIGluIHRoZSBwcmV2aW91c2x5IGRlZmluZWQgY3VzdG9tIHNjcm9sbCBmdW5jdGlvblxuXHRcdCAqIGNvbnRyb2xsZXIuc2Nyb2xsVG8oMTAwLCBmdW5jdGlvbigpIHtcblx0XHQgKlx0Y29uc29sZS5sb2coXCJzY3JvbGwgaGFzIGZpbmlzaGVkLlwiKTtcblx0XHQgKiB9KTtcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7bWl4ZWR9IHNjcm9sbFRhcmdldCAtIFRoZSBzdXBwbGllZCBhcmd1bWVudCBjYW4gYmUgb25lIG9mIHRoZXNlIHR5cGVzOlxuXHRcdCAqIDEuIGBudW1iZXJgIC0+IFRoZSBjb250YWluZXIgd2lsbCBzY3JvbGwgdG8gdGhpcyBuZXcgc2Nyb2xsIG9mZnNldC5cblx0XHQgKiAyLiBgc3RyaW5nYCBvciBgb2JqZWN0YCAtPiBDYW4gYmUgYSBzZWxlY3RvciBvciBhIERPTSBvYmplY3QuICBcblx0XHQgKiAgVGhlIGNvbnRhaW5lciB3aWxsIHNjcm9sbCB0byB0aGUgcG9zaXRpb24gb2YgdGhpcyBlbGVtZW50LlxuXHRcdCAqIDMuIGBTY3JvbGxNYWdpYyBTY2VuZWAgLT4gVGhlIGNvbnRhaW5lciB3aWxsIHNjcm9sbCB0byB0aGUgc3RhcnQgb2YgdGhpcyBzY2VuZS5cblx0XHQgKiA0LiBgZnVuY3Rpb25gIC0+IFRoaXMgZnVuY3Rpb24gd2lsbCBiZSB1c2VkIGZvciBmdXR1cmUgc2Nyb2xsIHBvc2l0aW9uIG1vZGlmaWNhdGlvbnMuICBcblx0XHQgKiAgVGhpcyBwcm92aWRlcyBhIHdheSBmb3IgeW91IHRvIGNoYW5nZSB0aGUgYmVoYXZpb3VyIG9mIHNjcm9sbGluZyBhbmQgYWRkaW5nIG5ldyBiZWhhdmlvdXIgbGlrZSBhbmltYXRpb24uIFRoZSBmdW5jdGlvbiByZWNlaXZlcyB0aGUgbmV3IHNjcm9sbCBwb3NpdGlvbiBhcyBhIHBhcmFtZXRlciBhbmQgYSByZWZlcmVuY2UgdG8gdGhlIGNvbnRhaW5lciBlbGVtZW50IHVzaW5nIGB0aGlzYC4gIFxuXHRcdCAqICBJdCBtYXkgYWxzbyBvcHRpb25hbGx5IHJlY2VpdmUgYW4gb3B0aW9uYWwgYWRkaXRpb25hbCBwYXJhbWV0ZXIgKHNlZSBiZWxvdykgIFxuXHRcdCAqICBfKipOT1RFOioqICBcblx0XHQgKiAgQWxsIG90aGVyIG9wdGlvbnMgd2lsbCBzdGlsbCB3b3JrIGFzIGV4cGVjdGVkLCB1c2luZyB0aGUgbmV3IGZ1bmN0aW9uIHRvIHNjcm9sbC5fXG5cdFx0ICogQHBhcmFtIHttaXhlZH0gW2FkZGl0aW9uYWxQYXJhbWV0ZXJdIC0gSWYgYSBjdXN0b20gc2Nyb2xsIGZ1bmN0aW9uIHdhcyBkZWZpbmVkIChzZWUgYWJvdmUgNC4pLCB5b3UgbWF5IHdhbnQgdG8gc3VwcGx5IGFkZGl0aW9uYWwgcGFyYW1ldGVycyB0byBpdCwgd2hlbiBjYWxsaW5nIGl0LiBZb3UgY2FuIGRvIHRoaXMgdXNpbmcgdGhpcyBwYXJhbWV0ZXIg4oCTIHNlZSBleGFtcGxlcyBmb3IgZGV0YWlscy4gUGxlYXNlIG5vdGUsIHRoYXQgdGhpcyBwYXJhbWV0ZXIgd2lsbCBoYXZlIG5vIGVmZmVjdCwgaWYgeW91IHVzZSB0aGUgZGVmYXVsdCBzY3JvbGxpbmcgZnVuY3Rpb24uXG5cdFx0ICogQHJldHVybnMge0NvbnRyb2xsZXJ9IFBhcmVudCBvYmplY3QgZm9yIGNoYWluaW5nLlxuXHRcdCAqL1xuXHRcdHRoaXMuc2Nyb2xsVG8gPSBmdW5jdGlvbiAoc2Nyb2xsVGFyZ2V0LCBhZGRpdGlvbmFsUGFyYW1ldGVyKSB7XG5cdFx0XHRpZiAoX3V0aWwudHlwZS5OdW1iZXIoc2Nyb2xsVGFyZ2V0KSkgeyAvLyBleGNlY3V0ZVxuXHRcdFx0XHRzZXRTY3JvbGxQb3MuY2FsbChfb3B0aW9ucy5jb250YWluZXIsIHNjcm9sbFRhcmdldCwgYWRkaXRpb25hbFBhcmFtZXRlcik7XG5cdFx0XHR9IGVsc2UgaWYgKHNjcm9sbFRhcmdldCBpbnN0YW5jZW9mIFNjcm9sbE1hZ2ljLlNjZW5lKSB7IC8vIHNjcm9sbCB0byBzY2VuZVxuXHRcdFx0XHRpZiAoc2Nyb2xsVGFyZ2V0LmNvbnRyb2xsZXIoKSA9PT0gQ29udHJvbGxlcikgeyAvLyBjaGVjayBpZiB0aGUgY29udHJvbGxlciBpcyBhc3NvY2lhdGVkIHdpdGggdGhpcyBzY2VuZVxuXHRcdFx0XHRcdENvbnRyb2xsZXIuc2Nyb2xsVG8oc2Nyb2xsVGFyZ2V0LnNjcm9sbE9mZnNldCgpLCBhZGRpdGlvbmFsUGFyYW1ldGVyKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRsb2coMiwgXCJzY3JvbGxUbygpOiBUaGUgc3VwcGxpZWQgc2NlbmUgZG9lcyBub3QgYmVsb25nIHRvIHRoaXMgY29udHJvbGxlci4gU2Nyb2xsIGNhbmNlbGxlZC5cIiwgc2Nyb2xsVGFyZ2V0KTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmIChfdXRpbC50eXBlLkZ1bmN0aW9uKHNjcm9sbFRhcmdldCkpIHsgLy8gYXNzaWduIG5ldyBzY3JvbGwgZnVuY3Rpb25cblx0XHRcdFx0c2V0U2Nyb2xsUG9zID0gc2Nyb2xsVGFyZ2V0O1xuXHRcdFx0fSBlbHNlIHsgLy8gc2Nyb2xsIHRvIGVsZW1lbnRcblx0XHRcdFx0dmFyIGVsZW0gPSBfdXRpbC5nZXQuZWxlbWVudHMoc2Nyb2xsVGFyZ2V0KVswXTtcblx0XHRcdFx0aWYgKGVsZW0pIHtcblx0XHRcdFx0XHQvLyBpZiBwYXJlbnQgaXMgcGluIHNwYWNlciwgdXNlIHNwYWNlciBwb3NpdGlvbiBpbnN0ZWFkIHNvIGNvcnJlY3Qgc3RhcnQgcG9zaXRpb24gaXMgcmV0dXJuZWQgZm9yIHBpbm5lZCBlbGVtZW50cy5cblx0XHRcdFx0XHR3aGlsZSAoZWxlbS5wYXJlbnROb2RlLmhhc0F0dHJpYnV0ZShQSU5fU1BBQ0VSX0FUVFJJQlVURSkpIHtcblx0XHRcdFx0XHRcdGVsZW0gPSBlbGVtLnBhcmVudE5vZGU7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0dmFyXG5cdFx0XHRcdFx0cGFyYW0gPSBfb3B0aW9ucy52ZXJ0aWNhbCA/IFwidG9wXCIgOiBcImxlZnRcIixcblx0XHRcdFx0XHRcdC8vIHdoaWNoIHBhcmFtIGlzIG9mIGludGVyZXN0ID9cblx0XHRcdFx0XHRcdGNvbnRhaW5lck9mZnNldCA9IF91dGlsLmdldC5vZmZzZXQoX29wdGlvbnMuY29udGFpbmVyKSxcblx0XHRcdFx0XHRcdC8vIGNvbnRhaW5lciBwb3NpdGlvbiBpcyBuZWVkZWQgYmVjYXVzZSBlbGVtZW50IG9mZnNldCBpcyByZXR1cm5lZCBpbiByZWxhdGlvbiB0byBkb2N1bWVudCwgbm90IGluIHJlbGF0aW9uIHRvIGNvbnRhaW5lci5cblx0XHRcdFx0XHRcdGVsZW1lbnRPZmZzZXQgPSBfdXRpbC5nZXQub2Zmc2V0KGVsZW0pO1xuXG5cdFx0XHRcdFx0aWYgKCFfaXNEb2N1bWVudCkgeyAvLyBjb250YWluZXIgaXMgbm90IHRoZSBkb2N1bWVudCByb290LCBzbyBzdWJzdHJhY3Qgc2Nyb2xsIFBvc2l0aW9uIHRvIGdldCBjb3JyZWN0IHRyaWdnZXIgZWxlbWVudCBwb3NpdGlvbiByZWxhdGl2ZSB0byBzY3JvbGxjb250ZW50XG5cdFx0XHRcdFx0XHRjb250YWluZXJPZmZzZXRbcGFyYW1dIC09IENvbnRyb2xsZXIuc2Nyb2xsUG9zKCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Q29udHJvbGxlci5zY3JvbGxUbyhlbGVtZW50T2Zmc2V0W3BhcmFtXSAtIGNvbnRhaW5lck9mZnNldFtwYXJhbV0sIGFkZGl0aW9uYWxQYXJhbWV0ZXIpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGxvZygyLCBcInNjcm9sbFRvKCk6IFRoZSBzdXBwbGllZCBhcmd1bWVudCBpcyBpbnZhbGlkLiBTY3JvbGwgY2FuY2VsbGVkLlwiLCBzY3JvbGxUYXJnZXQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gQ29udHJvbGxlcjtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogKipHZXQqKiB0aGUgY3VycmVudCBzY3JvbGxQb3NpdGlvbiBvciAqKlNldCoqIGEgbmV3IG1ldGhvZCB0byBjYWxjdWxhdGUgaXQuICBcblx0XHQgKiAtPiAqKkdFVCoqOlxuXHRcdCAqIFdoZW4gdXNlZCBhcyBhIGdldHRlciB0aGlzIGZ1bmN0aW9uIHdpbGwgcmV0dXJuIHRoZSBjdXJyZW50IHNjcm9sbCBwb3NpdGlvbi4gIFxuXHRcdCAqIFRvIGdldCBhIGNhY2hlZCB2YWx1ZSB1c2UgQ29udHJvbGxlci5pbmZvKFwic2Nyb2xsUG9zXCIpLCB3aGljaCB3aWxsIGJlIHVwZGF0ZWQgaW4gdGhlIHVwZGF0ZSBjeWNsZS4gIFxuXHRcdCAqIEZvciB2ZXJ0aWNhbCBjb250cm9sbGVycyBpdCB3aWxsIHJldHVybiB0aGUgdG9wIHNjcm9sbCBvZmZzZXQgYW5kIGZvciBob3Jpem9udGFsIGFwcGxpY2F0aW9ucyBpdCB3aWxsIHJldHVybiB0aGUgbGVmdCBvZmZzZXQuXG5cdFx0ICpcblx0XHQgKiAtPiAqKlNFVCoqOlxuXHRcdCAqIFdoZW4gdXNlZCBhcyBhIHNldHRlciB0aGlzIG1ldGhvZCBwcm9kZXMgYSB3YXkgdG8gcGVybWFuZW50bHkgb3ZlcndyaXRlIHRoZSBjb250cm9sbGVyJ3Mgc2Nyb2xsIHBvc2l0aW9uIGNhbGN1bGF0aW9uLiAgXG5cdFx0ICogQSB0eXBpY2FsIHVzZWNhc2UgaXMgd2hlbiB0aGUgc2Nyb2xsIHBvc2l0aW9uIGlzIG5vdCByZWZsZWN0ZWQgYnkgdGhlIGNvbnRhaW5lcnMgc2Nyb2xsVG9wIG9yIHNjcm9sbExlZnQgdmFsdWVzLCBidXQgZm9yIGV4YW1wbGUgYnkgdGhlIGlubmVyIG9mZnNldCBvZiBhIGNoaWxkIGNvbnRhaW5lci4gIFxuXHRcdCAqIE1vdmluZyBhIGNoaWxkIGNvbnRhaW5lciBpbnNpZGUgYSBwYXJlbnQgaXMgYSBjb21tb25seSB1c2VkIG1ldGhvZCBmb3Igc2V2ZXJhbCBzY3JvbGxpbmcgZnJhbWV3b3JrcywgaW5jbHVkaW5nIGlTY3JvbGwuICBcblx0XHQgKiBCeSBwcm92aWRpbmcgYW4gYWx0ZXJuYXRlIGNhbGN1bGF0aW9uIGZ1bmN0aW9uIHlvdSBjYW4gbWFrZSBzdXJlIFNjcm9sbE1hZ2ljIHJlY2VpdmVzIHRoZSBjb3JyZWN0IHNjcm9sbCBwb3NpdGlvbi4gIFxuXHRcdCAqIFBsZWFzZSBhbHNvIGJlYXIgaW4gbWluZCB0aGF0IHlvdXIgZnVuY3Rpb24gc2hvdWxkIHJldHVybiB5IHZhbHVlcyBmb3IgdmVydGljYWwgc2Nyb2xscyBhbiB4IGZvciBob3Jpem9udGFscy5cblx0XHQgKlxuXHRcdCAqIFRvIGNoYW5nZSB0aGUgY3VycmVudCBzY3JvbGwgcG9zaXRpb24gcGxlYXNlIHVzZSBgQ29udHJvbGxlci5zY3JvbGxUbygpYC5cblx0XHQgKiBAcHVibGljXG5cdFx0ICpcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIGdldCB0aGUgY3VycmVudCBzY3JvbGwgUG9zaXRpb25cblx0XHQgKiB2YXIgc2Nyb2xsUG9zID0gY29udHJvbGxlci5zY3JvbGxQb3MoKTtcblx0XHQgKlxuXHRcdCAqIC8vIHNldCBhIG5ldyBzY3JvbGwgcG9zaXRpb24gY2FsY3VsYXRpb24gbWV0aG9kXG5cdFx0ICogY29udHJvbGxlci5zY3JvbGxQb3MoZnVuY3Rpb24gKCkge1xuXHRcdCAqXHRyZXR1cm4gdGhpcy5pbmZvKFwidmVydGljYWxcIikgPyAtbXljaGlsZGNvbnRhaW5lci55IDogLW15Y2hpbGRjb250YWluZXIueFxuXHRcdCAqIH0pO1xuXHRcdCAqXG5cdFx0ICogQHBhcmFtIHtmdW5jdGlvbn0gW3Njcm9sbFBvc01ldGhvZF0gLSBUaGUgZnVuY3Rpb24gdG8gYmUgdXNlZCBmb3IgdGhlIHNjcm9sbCBwb3NpdGlvbiBjYWxjdWxhdGlvbiBvZiB0aGUgY29udGFpbmVyLlxuXHRcdCAqIEByZXR1cm5zIHsobnVtYmVyfENvbnRyb2xsZXIpfSBDdXJyZW50IHNjcm9sbCBwb3NpdGlvbiBvciBwYXJlbnQgb2JqZWN0IGZvciBjaGFpbmluZy5cblx0XHQgKi9cblx0XHR0aGlzLnNjcm9sbFBvcyA9IGZ1bmN0aW9uIChzY3JvbGxQb3NNZXRob2QpIHtcblx0XHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgeyAvLyBnZXRcblx0XHRcdFx0cmV0dXJuIGdldFNjcm9sbFBvcy5jYWxsKENvbnRyb2xsZXIpO1xuXHRcdFx0fSBlbHNlIHsgLy8gc2V0XG5cdFx0XHRcdGlmIChfdXRpbC50eXBlLkZ1bmN0aW9uKHNjcm9sbFBvc01ldGhvZCkpIHtcblx0XHRcdFx0XHRnZXRTY3JvbGxQb3MgPSBzY3JvbGxQb3NNZXRob2Q7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0bG9nKDIsIFwiUHJvdmlkZWQgdmFsdWUgZm9yIG1ldGhvZCAnc2Nyb2xsUG9zJyBpcyBub3QgYSBmdW5jdGlvbi4gVG8gY2hhbmdlIHRoZSBjdXJyZW50IHNjcm9sbCBwb3NpdGlvbiB1c2UgJ3Njcm9sbFRvKCknLlwiKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIENvbnRyb2xsZXI7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqICoqR2V0KiogYWxsIGluZm9zIG9yIG9uZSBpbiBwYXJ0aWN1bGFyIGFib3V0IHRoZSBjb250cm9sbGVyLlxuXHRcdCAqIEBwdWJsaWNcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIHJldHVybnMgdGhlIGN1cnJlbnQgc2Nyb2xsIHBvc2l0aW9uIChudW1iZXIpXG5cdFx0ICogdmFyIHNjcm9sbFBvcyA9IGNvbnRyb2xsZXIuaW5mbyhcInNjcm9sbFBvc1wiKTtcblx0XHQgKlxuXHRcdCAqIC8vIHJldHVybnMgYWxsIGluZm9zIGFzIGFuIG9iamVjdFxuXHRcdCAqIHZhciBpbmZvcyA9IGNvbnRyb2xsZXIuaW5mbygpO1xuXHRcdCAqXG5cdFx0ICogQHBhcmFtIHtzdHJpbmd9IFthYm91dF0gLSBJZiBwYXNzZWQgb25seSB0aGlzIGluZm8gd2lsbCBiZSByZXR1cm5lZCBpbnN0ZWFkIG9mIGFuIG9iamVjdCBjb250YWluaW5nIGFsbC4gIFxuXHRcdCBWYWxpZCBvcHRpb25zIGFyZTpcblx0XHQgKiogYFwic2l6ZVwiYCA9PiB0aGUgY3VycmVudCB2aWV3cG9ydCBzaXplIG9mIHRoZSBjb250YWluZXJcblx0XHQgKiogYFwidmVydGljYWxcImAgPT4gdHJ1ZSBpZiB2ZXJ0aWNhbCBzY3JvbGxpbmcsIG90aGVyd2lzZSBmYWxzZVxuXHRcdCAqKiBgXCJzY3JvbGxQb3NcImAgPT4gdGhlIGN1cnJlbnQgc2Nyb2xsIHBvc2l0aW9uXG5cdFx0ICoqIGBcInNjcm9sbERpcmVjdGlvblwiYCA9PiB0aGUgbGFzdCBrbm93biBkaXJlY3Rpb24gb2YgdGhlIHNjcm9sbFxuXHRcdCAqKiBgXCJjb250YWluZXJcImAgPT4gdGhlIGNvbnRhaW5lciBlbGVtZW50XG5cdFx0ICoqIGBcImlzRG9jdW1lbnRcImAgPT4gdHJ1ZSBpZiBjb250YWluZXIgZWxlbWVudCBpcyB0aGUgZG9jdW1lbnQuXG5cdFx0ICogQHJldHVybnMgeyhtaXhlZHxvYmplY3QpfSBUaGUgcmVxdWVzdGVkIGluZm8ocykuXG5cdFx0ICovXG5cdFx0dGhpcy5pbmZvID0gZnVuY3Rpb24gKGFib3V0KSB7XG5cdFx0XHR2YXIgdmFsdWVzID0ge1xuXHRcdFx0XHRzaXplOiBfdmlld1BvcnRTaXplLFxuXHRcdFx0XHQvLyBjb250YWlucyBoZWlnaHQgb3Igd2lkdGggKGluIHJlZ2FyZCB0byBvcmllbnRhdGlvbik7XG5cdFx0XHRcdHZlcnRpY2FsOiBfb3B0aW9ucy52ZXJ0aWNhbCxcblx0XHRcdFx0c2Nyb2xsUG9zOiBfc2Nyb2xsUG9zLFxuXHRcdFx0XHRzY3JvbGxEaXJlY3Rpb246IF9zY3JvbGxEaXJlY3Rpb24sXG5cdFx0XHRcdGNvbnRhaW5lcjogX29wdGlvbnMuY29udGFpbmVyLFxuXHRcdFx0XHRpc0RvY3VtZW50OiBfaXNEb2N1bWVudFxuXHRcdFx0fTtcblx0XHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgeyAvLyBnZXQgYWxsIGFzIGFuIG9iamVjdFxuXHRcdFx0XHRyZXR1cm4gdmFsdWVzO1xuXHRcdFx0fSBlbHNlIGlmICh2YWx1ZXNbYWJvdXRdICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0cmV0dXJuIHZhbHVlc1thYm91dF07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRsb2coMSwgXCJFUlJPUjogb3B0aW9uIFxcXCJcIiArIGFib3V0ICsgXCJcXFwiIGlzIG5vdCBhdmFpbGFibGVcIik7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogKipHZXQqKiBvciAqKlNldCoqIHRoZSBjdXJyZW50IGxvZ2xldmVsIG9wdGlvbiB2YWx1ZS5cblx0XHQgKiBAcHVibGljXG5cdFx0ICpcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIGdldCB0aGUgY3VycmVudCB2YWx1ZVxuXHRcdCAqIHZhciBsb2dsZXZlbCA9IGNvbnRyb2xsZXIubG9nbGV2ZWwoKTtcblx0XHQgKlxuXHRcdCAqIC8vIHNldCBhIG5ldyB2YWx1ZVxuXHRcdCAqIGNvbnRyb2xsZXIubG9nbGV2ZWwoMyk7XG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge251bWJlcn0gW25ld0xvZ2xldmVsXSAtIFRoZSBuZXcgbG9nbGV2ZWwgc2V0dGluZyBvZiB0aGUgQ29udHJvbGxlci4gYFswLTNdYFxuXHRcdCAqIEByZXR1cm5zIHsobnVtYmVyfENvbnRyb2xsZXIpfSBDdXJyZW50IGxvZ2xldmVsIG9yIHBhcmVudCBvYmplY3QgZm9yIGNoYWluaW5nLlxuXHRcdCAqL1xuXHRcdHRoaXMubG9nbGV2ZWwgPSBmdW5jdGlvbiAobmV3TG9nbGV2ZWwpIHtcblx0XHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgeyAvLyBnZXRcblx0XHRcdFx0cmV0dXJuIF9vcHRpb25zLmxvZ2xldmVsO1xuXHRcdFx0fSBlbHNlIGlmIChfb3B0aW9ucy5sb2dsZXZlbCAhPSBuZXdMb2dsZXZlbCkgeyAvLyBzZXRcblx0XHRcdFx0X29wdGlvbnMubG9nbGV2ZWwgPSBuZXdMb2dsZXZlbDtcblx0XHRcdH1cblx0XHRcdHJldHVybiBDb250cm9sbGVyO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiAqKkdldCoqIG9yICoqU2V0KiogdGhlIGN1cnJlbnQgZW5hYmxlZCBzdGF0ZSBvZiB0aGUgY29udHJvbGxlci4gIFxuXHRcdCAqIFRoaXMgY2FuIGJlIHVzZWQgdG8gZGlzYWJsZSBhbGwgU2NlbmVzIGNvbm5lY3RlZCB0byB0aGUgY29udHJvbGxlciB3aXRob3V0IGRlc3Ryb3lpbmcgb3IgcmVtb3ZpbmcgdGhlbS5cblx0XHQgKiBAcHVibGljXG5cdFx0ICpcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIGdldCB0aGUgY3VycmVudCB2YWx1ZVxuXHRcdCAqIHZhciBlbmFibGVkID0gY29udHJvbGxlci5lbmFibGVkKCk7XG5cdFx0ICpcblx0XHQgKiAvLyBkaXNhYmxlIHRoZSBjb250cm9sbGVyXG5cdFx0ICogY29udHJvbGxlci5lbmFibGVkKGZhbHNlKTtcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gW25ld1N0YXRlXSAtIFRoZSBuZXcgZW5hYmxlZCBzdGF0ZSBvZiB0aGUgY29udHJvbGxlciBgdHJ1ZWAgb3IgYGZhbHNlYC5cblx0XHQgKiBAcmV0dXJucyB7KGJvb2xlYW58Q29udHJvbGxlcil9IEN1cnJlbnQgZW5hYmxlZCBzdGF0ZSBvciBwYXJlbnQgb2JqZWN0IGZvciBjaGFpbmluZy5cblx0XHQgKi9cblx0XHR0aGlzLmVuYWJsZWQgPSBmdW5jdGlvbiAobmV3U3RhdGUpIHtcblx0XHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgeyAvLyBnZXRcblx0XHRcdFx0cmV0dXJuIF9lbmFibGVkO1xuXHRcdFx0fSBlbHNlIGlmIChfZW5hYmxlZCAhPSBuZXdTdGF0ZSkgeyAvLyBzZXRcblx0XHRcdFx0X2VuYWJsZWQgPSAhISBuZXdTdGF0ZTtcblx0XHRcdFx0Q29udHJvbGxlci51cGRhdGVTY2VuZShfc2NlbmVPYmplY3RzLCB0cnVlKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBDb250cm9sbGVyO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBEZXN0cm95IHRoZSBDb250cm9sbGVyLCBhbGwgU2NlbmVzIGFuZCBldmVyeXRoaW5nLlxuXHRcdCAqIEBwdWJsaWNcblx0XHQgKlxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogLy8gd2l0aG91dCByZXNldHRpbmcgdGhlIHNjZW5lc1xuXHRcdCAqIGNvbnRyb2xsZXIgPSBjb250cm9sbGVyLmRlc3Ryb3koKTtcblx0XHQgKlxuXHRcdCAqIC8vIHdpdGggc2NlbmUgcmVzZXRcblx0XHQgKiBjb250cm9sbGVyID0gY29udHJvbGxlci5kZXN0cm95KHRydWUpO1xuXHRcdCAqXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBbcmVzZXRTY2VuZXM9ZmFsc2VdIC0gSWYgYHRydWVgIHRoZSBwaW5zIGFuZCB0d2VlbnMgKGlmIGV4aXN0ZW50KSBvZiBhbGwgc2NlbmVzIHdpbGwgYmUgcmVzZXQuXG5cdFx0ICogQHJldHVybnMge251bGx9IE51bGwgdG8gdW5zZXQgaGFuZGxlciB2YXJpYWJsZXMuXG5cdFx0ICovXG5cdFx0dGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKHJlc2V0U2NlbmVzKSB7XG5cdFx0XHR3aW5kb3cuY2xlYXJUaW1lb3V0KF9yZWZyZXNoVGltZW91dCk7XG5cdFx0XHR2YXIgaSA9IF9zY2VuZU9iamVjdHMubGVuZ3RoO1xuXHRcdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0XHRfc2NlbmVPYmplY3RzW2ldLmRlc3Ryb3kocmVzZXRTY2VuZXMpO1xuXHRcdFx0fVxuXHRcdFx0X29wdGlvbnMuY29udGFpbmVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgb25DaGFuZ2UpO1xuXHRcdFx0X29wdGlvbnMuY29udGFpbmVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJzY3JvbGxcIiwgb25DaGFuZ2UpO1xuXHRcdFx0X3V0aWwuY0FGKF91cGRhdGVUaW1lb3V0KTtcblx0XHRcdGxvZygzLCBcImRlc3Ryb3llZCBcIiArIE5BTUVTUEFDRSArIFwiIChyZXNldDogXCIgKyAocmVzZXRTY2VuZXMgPyBcInRydWVcIiA6IFwiZmFsc2VcIikgKyBcIilcIik7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9O1xuXG5cdFx0Ly8gSU5JVFxuXHRcdGNvbnN0cnVjdCgpO1xuXHRcdHJldHVybiBDb250cm9sbGVyO1xuXHR9O1xuXG5cdC8vIHN0b3JlIHBhZ2V3aWRlIGNvbnRyb2xsZXIgb3B0aW9uc1xuXHR2YXIgQ09OVFJPTExFUl9PUFRJT05TID0ge1xuXHRcdGRlZmF1bHRzOiB7XG5cdFx0XHRjb250YWluZXI6IHdpbmRvdyxcblx0XHRcdHZlcnRpY2FsOiB0cnVlLFxuXHRcdFx0Z2xvYmFsU2NlbmVPcHRpb25zOiB7fSxcblx0XHRcdGxvZ2xldmVsOiAyLFxuXHRcdFx0cmVmcmVzaEludGVydmFsOiAxMDBcblx0XHR9XG5cdH07XG4vKlxuICogbWV0aG9kIHVzZWQgdG8gYWRkIGFuIG9wdGlvbiB0byBTY3JvbGxNYWdpYyBTY2VuZXMuXG4gKi9cblx0U2Nyb2xsTWFnaWMuQ29udHJvbGxlci5hZGRPcHRpb24gPSBmdW5jdGlvbiAobmFtZSwgZGVmYXVsdFZhbHVlKSB7XG5cdFx0Q09OVFJPTExFUl9PUFRJT05TLmRlZmF1bHRzW25hbWVdID0gZGVmYXVsdFZhbHVlO1xuXHR9O1xuXHQvLyBpbnN0YW5jZSBleHRlbnNpb24gZnVuY3Rpb24gZm9yIHBsdWdpbnNcblx0U2Nyb2xsTWFnaWMuQ29udHJvbGxlci5leHRlbmQgPSBmdW5jdGlvbiAoZXh0ZW5zaW9uKSB7XG5cdFx0dmFyIG9sZENsYXNzID0gdGhpcztcblx0XHRTY3JvbGxNYWdpYy5Db250cm9sbGVyID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0b2xkQ2xhc3MuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHRcdHRoaXMuJHN1cGVyID0gX3V0aWwuZXh0ZW5kKHt9LCB0aGlzKTsgLy8gY29weSBwYXJlbnQgc3RhdGVcblx0XHRcdHJldHVybiBleHRlbnNpb24uYXBwbHkodGhpcywgYXJndW1lbnRzKSB8fCB0aGlzO1xuXHRcdH07XG5cdFx0X3V0aWwuZXh0ZW5kKFNjcm9sbE1hZ2ljLkNvbnRyb2xsZXIsIG9sZENsYXNzKTsgLy8gY29weSBwcm9wZXJ0aWVzXG5cdFx0U2Nyb2xsTWFnaWMuQ29udHJvbGxlci5wcm90b3R5cGUgPSBvbGRDbGFzcy5wcm90b3R5cGU7IC8vIGNvcHkgcHJvdG90eXBlXG5cdFx0U2Nyb2xsTWFnaWMuQ29udHJvbGxlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTY3JvbGxNYWdpYy5Db250cm9sbGVyOyAvLyByZXN0b3JlIGNvbnN0cnVjdG9yXG5cdH07XG5cblxuXHQvKipcblx0ICogQSBTY2VuZSBkZWZpbmVzIHdoZXJlIHRoZSBjb250cm9sbGVyIHNob3VsZCByZWFjdCBhbmQgaG93LlxuXHQgKlxuXHQgKiBAY2xhc3Ncblx0ICpcblx0ICogQGV4YW1wbGVcblx0ICogLy8gY3JlYXRlIGEgc3RhbmRhcmQgc2NlbmUgYW5kIGFkZCBpdCB0byBhIGNvbnRyb2xsZXJcblx0ICogbmV3IFNjcm9sbE1hZ2ljLlNjZW5lKClcblx0ICpcdFx0LmFkZFRvKGNvbnRyb2xsZXIpO1xuXHQgKlxuXHQgKiAvLyBjcmVhdGUgYSBzY2VuZSB3aXRoIGN1c3RvbSBvcHRpb25zIGFuZCBhc3NpZ24gYSBoYW5kbGVyIHRvIGl0LlxuXHQgKiB2YXIgc2NlbmUgPSBuZXcgU2Nyb2xsTWFnaWMuU2NlbmUoe1xuXHQgKiBcdFx0ZHVyYXRpb246IDEwMCxcblx0ICpcdFx0b2Zmc2V0OiAyMDAsXG5cdCAqXHRcdHRyaWdnZXJIb29rOiBcIm9uRW50ZXJcIixcblx0ICpcdFx0cmV2ZXJzZTogZmFsc2Vcblx0ICogfSk7XG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gLSBPcHRpb25zIGZvciB0aGUgU2NlbmUuIFRoZSBvcHRpb25zIGNhbiBiZSB1cGRhdGVkIGF0IGFueSB0aW1lLiAgXG5cdCBJbnN0ZWFkIG9mIHNldHRpbmcgdGhlIG9wdGlvbnMgZm9yIGVhY2ggc2NlbmUgaW5kaXZpZHVhbGx5IHlvdSBjYW4gYWxzbyBzZXQgdGhlbSBnbG9iYWxseSBpbiB0aGUgY29udHJvbGxlciBhcyB0aGUgY29udHJvbGxlcnMgYGdsb2JhbFNjZW5lT3B0aW9uc2Agb3B0aW9uLiBUaGUgb2JqZWN0IGFjY2VwdHMgdGhlIHNhbWUgcHJvcGVydGllcyBhcyB0aGUgb25lcyBiZWxvdy4gIFxuXHQgV2hlbiBhIHNjZW5lIGlzIGFkZGVkIHRvIHRoZSBjb250cm9sbGVyIHRoZSBvcHRpb25zIGRlZmluZWQgdXNpbmcgdGhlIFNjZW5lIGNvbnN0cnVjdG9yIHdpbGwgYmUgb3ZlcndyaXR0ZW4gYnkgdGhvc2Ugc2V0IGluIGBnbG9iYWxTY2VuZU9wdGlvbnNgLlxuXHQgKiBAcGFyYW0geyhudW1iZXJ8ZnVuY3Rpb24pfSBbb3B0aW9ucy5kdXJhdGlvbj0wXSAtIFRoZSBkdXJhdGlvbiBvZiB0aGUgc2NlbmUuIFxuXHQgSWYgYDBgIHR3ZWVucyB3aWxsIGF1dG8tcGxheSB3aGVuIHJlYWNoaW5nIHRoZSBzY2VuZSBzdGFydCBwb2ludCwgcGlucyB3aWxsIGJlIHBpbm5lZCBpbmRlZmluZXRseSBzdGFydGluZyBhdCB0aGUgc3RhcnQgcG9zaXRpb24uICBcblx0IEEgZnVuY3Rpb24gcmV0dW5pbmcgdGhlIGR1cmF0aW9uIHZhbHVlIGlzIGFsc28gc3VwcG9ydGVkLiBQbGVhc2Ugc2VlIGBTY2VuZS5kdXJhdGlvbigpYCBmb3IgZGV0YWlscy5cblx0ICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm9mZnNldD0wXSAtIE9mZnNldCBWYWx1ZSBmb3IgdGhlIFRyaWdnZXIgUG9zaXRpb24uIElmIG5vIHRyaWdnZXJFbGVtZW50IGlzIGRlZmluZWQgdGhpcyB3aWxsIGJlIHRoZSBzY3JvbGwgZGlzdGFuY2UgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIHBhZ2UsIGFmdGVyIHdoaWNoIHRoZSBzY2VuZSB3aWxsIHN0YXJ0LlxuXHQgKiBAcGFyYW0geyhzdHJpbmd8b2JqZWN0KX0gW29wdGlvbnMudHJpZ2dlckVsZW1lbnQ9bnVsbF0gLSBTZWxlY3RvciBvciBET00gb2JqZWN0IHRoYXQgZGVmaW5lcyB0aGUgc3RhcnQgb2YgdGhlIHNjZW5lLiBJZiB1bmRlZmluZWQgdGhlIHNjZW5lIHdpbGwgc3RhcnQgcmlnaHQgYXQgdGhlIHN0YXJ0IG9mIHRoZSBwYWdlICh1bmxlc3MgYW4gb2Zmc2V0IGlzIHNldCkuXG5cdCAqIEBwYXJhbSB7KG51bWJlcnxzdHJpbmcpfSBbb3B0aW9ucy50cmlnZ2VySG9vaz1cIm9uQ2VudGVyXCJdIC0gQ2FuIGJlIGEgbnVtYmVyIGJldHdlZW4gMCBhbmQgMSBkZWZpbmluZyB0aGUgcG9zaXRpb24gb2YgdGhlIHRyaWdnZXIgSG9vayBpbiByZWxhdGlvbiB0byB0aGUgdmlld3BvcnQuICBcblx0IENhbiBhbHNvIGJlIGRlZmluZWQgdXNpbmcgYSBzdHJpbmc6XG5cdCAqKiBgXCJvbkVudGVyXCJgID0+IGAxYFxuXHQgKiogYFwib25DZW50ZXJcImAgPT4gYDAuNWBcblx0ICoqIGBcIm9uTGVhdmVcImAgPT4gYDBgXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMucmV2ZXJzZT10cnVlXSAtIFNob3VsZCB0aGUgc2NlbmUgcmV2ZXJzZSwgd2hlbiBzY3JvbGxpbmcgdXA/XG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5sb2dsZXZlbD0yXSAtIExvZ2xldmVsIGZvciBkZWJ1Z2dpbmcuIE5vdGUgdGhhdCBsb2dnaW5nIGlzIGRpc2FibGVkIGluIHRoZSBtaW5pZmllZCB2ZXJzaW9uIG9mIFNjcm9sbE1hZ2ljLlxuXHQgKiogYDBgID0+IHNpbGVudFxuXHQgKiogYDFgID0+IGVycm9yc1xuXHQgKiogYDJgID0+IGVycm9ycywgd2FybmluZ3Ncblx0ICoqIGAzYCA9PiBlcnJvcnMsIHdhcm5pbmdzLCBkZWJ1Z2luZm9cblx0ICogXG5cdCAqL1xuXHRTY3JvbGxNYWdpYy5TY2VuZSA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG5cbi8qXG5cdCAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0ICogc2V0dGluZ3Ncblx0ICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQgKi9cblxuXHRcdHZhclxuXHRcdE5BTUVTUEFDRSA9ICdTY3JvbGxNYWdpYy5TY2VuZScsXG5cdFx0XHRTQ0VORV9TVEFURV9CRUZPUkUgPSAnQkVGT1JFJyxcblx0XHRcdFNDRU5FX1NUQVRFX0RVUklORyA9ICdEVVJJTkcnLFxuXHRcdFx0U0NFTkVfU1RBVEVfQUZURVIgPSAnQUZURVInLFxuXHRcdFx0REVGQVVMVF9PUFRJT05TID0gU0NFTkVfT1BUSU9OUy5kZWZhdWx0cztcblxuLypcblx0ICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQgKiBwcml2YXRlIHZhcnNcblx0ICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQgKi9cblxuXHRcdHZhclxuXHRcdFNjZW5lID0gdGhpcyxcblx0XHRcdF9vcHRpb25zID0gX3V0aWwuZXh0ZW5kKHt9LCBERUZBVUxUX09QVElPTlMsIG9wdGlvbnMpLFxuXHRcdFx0X3N0YXRlID0gU0NFTkVfU1RBVEVfQkVGT1JFLFxuXHRcdFx0X3Byb2dyZXNzID0gMCxcblx0XHRcdF9zY3JvbGxPZmZzZXQgPSB7XG5cdFx0XHRcdHN0YXJ0OiAwLFxuXHRcdFx0XHRlbmQ6IDBcblx0XHRcdH0sXG5cdFx0XHQvLyByZWZsZWN0cyB0aGUgY29udHJvbGxlcnMncyBzY3JvbGwgcG9zaXRpb24gZm9yIHRoZSBzdGFydCBhbmQgZW5kIG9mIHRoZSBzY2VuZSByZXNwZWN0aXZlbHlcblx0XHRcdF90cmlnZ2VyUG9zID0gMCxcblx0XHRcdF9lbmFibGVkID0gdHJ1ZSxcblx0XHRcdF9kdXJhdGlvblVwZGF0ZU1ldGhvZCwgX2NvbnRyb2xsZXI7XG5cblx0XHQvKipcblx0XHQgKiBJbnRlcm5hbCBjb25zdHJ1Y3RvciBmdW5jdGlvbiBvZiB0aGUgU2Nyb2xsTWFnaWMgU2NlbmVcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBjb25zdHJ1Y3QgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gX29wdGlvbnMpIHsgLy8gY2hlY2sgc3VwcGxpZWQgb3B0aW9uc1xuXHRcdFx0XHRpZiAoIURFRkFVTFRfT1BUSU9OUy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdFx0bG9nKDIsIFwiV0FSTklORzogVW5rbm93biBvcHRpb24gXFxcIlwiICsga2V5ICsgXCJcXFwiXCIpO1xuXHRcdFx0XHRcdGRlbGV0ZSBfb3B0aW9uc1trZXldO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHQvLyBhZGQgZ2V0dGVycy9zZXR0ZXJzIGZvciBhbGwgcG9zc2libGUgb3B0aW9uc1xuXHRcdFx0Zm9yICh2YXIgb3B0aW9uTmFtZSBpbiBERUZBVUxUX09QVElPTlMpIHtcblx0XHRcdFx0YWRkU2NlbmVPcHRpb24ob3B0aW9uTmFtZSk7XG5cdFx0XHR9XG5cdFx0XHQvLyB2YWxpZGF0ZSBhbGwgb3B0aW9uc1xuXHRcdFx0dmFsaWRhdGVPcHRpb24oKTtcblx0XHR9O1xuXG4vKlxuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogRXZlbnQgTWFuYWdlbWVudFxuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICovXG5cblx0XHR2YXIgX2xpc3RlbmVycyA9IHt9O1xuXHRcdC8qKlxuXHRcdCAqIFNjZW5lIHN0YXJ0IGV2ZW50LiAgXG5cdFx0ICogRmlyZXMgd2hlbmV2ZXIgdGhlIHNjcm9sbCBwb3NpdGlvbiBpdHMgdGhlIHN0YXJ0aW5nIHBvaW50IG9mIHRoZSBzY2VuZS4gIFxuXHRcdCAqIEl0IHdpbGwgYWxzbyBmaXJlIHdoZW4gc2Nyb2xsaW5nIGJhY2sgdXAgZ29pbmcgb3ZlciB0aGUgc3RhcnQgcG9zaXRpb24gb2YgdGhlIHNjZW5lLiBJZiB5b3Ugd2FudCBzb21ldGhpbmcgdG8gaGFwcGVuIG9ubHkgd2hlbiBzY3JvbGxpbmcgZG93bi9yaWdodCwgdXNlIHRoZSBzY3JvbGxEaXJlY3Rpb24gcGFyYW1ldGVyIHBhc3NlZCB0byB0aGUgY2FsbGJhY2suXG5cdFx0ICpcblx0XHQgKiBGb3IgZGV0YWlscyBvbiB0aGlzIGV2ZW50IGFuZCB0aGUgb3JkZXIgaW4gd2hpY2ggaXQgaXMgZmlyZWQsIHBsZWFzZSByZXZpZXcgdGhlIHtAbGluayBTY2VuZS5wcm9ncmVzc30gbWV0aG9kLlxuXHRcdCAqXG5cdFx0ICogQGV2ZW50IFNjcm9sbE1hZ2ljLlNjZW5lI3N0YXJ0XG5cdFx0ICpcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIHNjZW5lLm9uKFwic3RhcnRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG5cdFx0ICogXHRjb25zb2xlLmxvZyhcIkhpdCBzdGFydCBwb2ludCBvZiBzY2VuZS5cIik7XG5cdFx0ICogfSk7XG5cdFx0ICpcblx0XHQgKiBAcHJvcGVydHkge29iamVjdH0gZXZlbnQgLSBUaGUgZXZlbnQgT2JqZWN0IHBhc3NlZCB0byBlYWNoIGNhbGxiYWNrXG5cdFx0ICogQHByb3BlcnR5IHtzdHJpbmd9IGV2ZW50LnR5cGUgLSBUaGUgbmFtZSBvZiB0aGUgZXZlbnRcblx0XHQgKiBAcHJvcGVydHkge1NjZW5lfSBldmVudC50YXJnZXQgLSBUaGUgU2NlbmUgb2JqZWN0IHRoYXQgdHJpZ2dlcmVkIHRoaXMgZXZlbnRcblx0XHQgKiBAcHJvcGVydHkge251bWJlcn0gZXZlbnQucHJvZ3Jlc3MgLSBSZWZsZWN0cyB0aGUgY3VycmVudCBwcm9ncmVzcyBvZiB0aGUgc2NlbmVcblx0XHQgKiBAcHJvcGVydHkge3N0cmluZ30gZXZlbnQuc3RhdGUgLSBUaGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgc2NlbmUgYFwiQkVGT1JFXCJgIG9yIGBcIkRVUklOR1wiYFxuXHRcdCAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBldmVudC5zY3JvbGxEaXJlY3Rpb24gLSBJbmRpY2F0ZXMgd2hpY2ggd2F5IHdlIGFyZSBzY3JvbGxpbmcgYFwiUEFVU0VEXCJgLCBgXCJGT1JXQVJEXCJgIG9yIGBcIlJFVkVSU0VcImBcblx0XHQgKi9cblx0XHQvKipcblx0XHQgKiBTY2VuZSBlbmQgZXZlbnQuICBcblx0XHQgKiBGaXJlcyB3aGVuZXZlciB0aGUgc2Nyb2xsIHBvc2l0aW9uIGl0cyB0aGUgZW5kaW5nIHBvaW50IG9mIHRoZSBzY2VuZS4gIFxuXHRcdCAqIEl0IHdpbGwgYWxzbyBmaXJlIHdoZW4gc2Nyb2xsaW5nIGJhY2sgdXAgZnJvbSBhZnRlciB0aGUgc2NlbmUgYW5kIGdvaW5nIG92ZXIgaXRzIGVuZCBwb3NpdGlvbi4gSWYgeW91IHdhbnQgc29tZXRoaW5nIHRvIGhhcHBlbiBvbmx5IHdoZW4gc2Nyb2xsaW5nIGRvd24vcmlnaHQsIHVzZSB0aGUgc2Nyb2xsRGlyZWN0aW9uIHBhcmFtZXRlciBwYXNzZWQgdG8gdGhlIGNhbGxiYWNrLlxuXHRcdCAqXG5cdFx0ICogRm9yIGRldGFpbHMgb24gdGhpcyBldmVudCBhbmQgdGhlIG9yZGVyIGluIHdoaWNoIGl0IGlzIGZpcmVkLCBwbGVhc2UgcmV2aWV3IHRoZSB7QGxpbmsgU2NlbmUucHJvZ3Jlc3N9IG1ldGhvZC5cblx0XHQgKlxuXHRcdCAqIEBldmVudCBTY3JvbGxNYWdpYy5TY2VuZSNlbmRcblx0XHQgKlxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogc2NlbmUub24oXCJlbmRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG5cdFx0ICogXHRjb25zb2xlLmxvZyhcIkhpdCBlbmQgcG9pbnQgb2Ygc2NlbmUuXCIpO1xuXHRcdCAqIH0pO1xuXHRcdCAqXG5cdFx0ICogQHByb3BlcnR5IHtvYmplY3R9IGV2ZW50IC0gVGhlIGV2ZW50IE9iamVjdCBwYXNzZWQgdG8gZWFjaCBjYWxsYmFja1xuXHRcdCAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBldmVudC50eXBlIC0gVGhlIG5hbWUgb2YgdGhlIGV2ZW50XG5cdFx0ICogQHByb3BlcnR5IHtTY2VuZX0gZXZlbnQudGFyZ2V0IC0gVGhlIFNjZW5lIG9iamVjdCB0aGF0IHRyaWdnZXJlZCB0aGlzIGV2ZW50XG5cdFx0ICogQHByb3BlcnR5IHtudW1iZXJ9IGV2ZW50LnByb2dyZXNzIC0gUmVmbGVjdHMgdGhlIGN1cnJlbnQgcHJvZ3Jlc3Mgb2YgdGhlIHNjZW5lXG5cdFx0ICogQHByb3BlcnR5IHtzdHJpbmd9IGV2ZW50LnN0YXRlIC0gVGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIHNjZW5lIGBcIkRVUklOR1wiYCBvciBgXCJBRlRFUlwiYFxuXHRcdCAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBldmVudC5zY3JvbGxEaXJlY3Rpb24gLSBJbmRpY2F0ZXMgd2hpY2ggd2F5IHdlIGFyZSBzY3JvbGxpbmcgYFwiUEFVU0VEXCJgLCBgXCJGT1JXQVJEXCJgIG9yIGBcIlJFVkVSU0VcImBcblx0XHQgKi9cblx0XHQvKipcblx0XHQgKiBTY2VuZSBlbnRlciBldmVudC4gIFxuXHRcdCAqIEZpcmVzIHdoZW5ldmVyIHRoZSBzY2VuZSBlbnRlcnMgdGhlIFwiRFVSSU5HXCIgc3RhdGUuICBcblx0XHQgKiBLZWVwIGluIG1pbmQgdGhhdCBpdCBkb2Vzbid0IG1hdHRlciBpZiB0aGUgc2NlbmUgcGxheXMgZm9yd2FyZCBvciBiYWNrd2FyZDogVGhpcyBldmVudCBhbHdheXMgZmlyZXMgd2hlbiB0aGUgc2NlbmUgZW50ZXJzIGl0cyBhY3RpdmUgc2Nyb2xsIHRpbWVmcmFtZSwgcmVnYXJkbGVzcyBvZiB0aGUgc2Nyb2xsLWRpcmVjdGlvbi5cblx0XHQgKlxuXHRcdCAqIEZvciBkZXRhaWxzIG9uIHRoaXMgZXZlbnQgYW5kIHRoZSBvcmRlciBpbiB3aGljaCBpdCBpcyBmaXJlZCwgcGxlYXNlIHJldmlldyB0aGUge0BsaW5rIFNjZW5lLnByb2dyZXNzfSBtZXRob2QuXG5cdFx0ICpcblx0XHQgKiBAZXZlbnQgU2Nyb2xsTWFnaWMuU2NlbmUjZW50ZXJcblx0XHQgKlxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogc2NlbmUub24oXCJlbnRlclwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcblx0XHQgKiBcdGNvbnNvbGUubG9nKFwiU2NlbmUgZW50ZXJlZC5cIik7XG5cdFx0ICogfSk7XG5cdFx0ICpcblx0XHQgKiBAcHJvcGVydHkge29iamVjdH0gZXZlbnQgLSBUaGUgZXZlbnQgT2JqZWN0IHBhc3NlZCB0byBlYWNoIGNhbGxiYWNrXG5cdFx0ICogQHByb3BlcnR5IHtzdHJpbmd9IGV2ZW50LnR5cGUgLSBUaGUgbmFtZSBvZiB0aGUgZXZlbnRcblx0XHQgKiBAcHJvcGVydHkge1NjZW5lfSBldmVudC50YXJnZXQgLSBUaGUgU2NlbmUgb2JqZWN0IHRoYXQgdHJpZ2dlcmVkIHRoaXMgZXZlbnRcblx0XHQgKiBAcHJvcGVydHkge251bWJlcn0gZXZlbnQucHJvZ3Jlc3MgLSBSZWZsZWN0cyB0aGUgY3VycmVudCBwcm9ncmVzcyBvZiB0aGUgc2NlbmVcblx0XHQgKiBAcHJvcGVydHkge3N0cmluZ30gZXZlbnQuc3RhdGUgLSBUaGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgc2NlbmUgLSBhbHdheXMgYFwiRFVSSU5HXCJgXG5cdFx0ICogQHByb3BlcnR5IHtzdHJpbmd9IGV2ZW50LnNjcm9sbERpcmVjdGlvbiAtIEluZGljYXRlcyB3aGljaCB3YXkgd2UgYXJlIHNjcm9sbGluZyBgXCJQQVVTRURcImAsIGBcIkZPUldBUkRcImAgb3IgYFwiUkVWRVJTRVwiYFxuXHRcdCAqL1xuXHRcdC8qKlxuXHRcdCAqIFNjZW5lIGxlYXZlIGV2ZW50LiAgXG5cdFx0ICogRmlyZXMgd2hlbmV2ZXIgdGhlIHNjZW5lJ3Mgc3RhdGUgZ29lcyBmcm9tIFwiRFVSSU5HXCIgdG8gZWl0aGVyIFwiQkVGT1JFXCIgb3IgXCJBRlRFUlwiLiAgXG5cdFx0ICogS2VlcCBpbiBtaW5kIHRoYXQgaXQgZG9lc24ndCBtYXR0ZXIgaWYgdGhlIHNjZW5lIHBsYXlzIGZvcndhcmQgb3IgYmFja3dhcmQ6IFRoaXMgZXZlbnQgYWx3YXlzIGZpcmVzIHdoZW4gdGhlIHNjZW5lIGxlYXZlcyBpdHMgYWN0aXZlIHNjcm9sbCB0aW1lZnJhbWUsIHJlZ2FyZGxlc3Mgb2YgdGhlIHNjcm9sbC1kaXJlY3Rpb24uXG5cdFx0ICpcblx0XHQgKiBGb3IgZGV0YWlscyBvbiB0aGlzIGV2ZW50IGFuZCB0aGUgb3JkZXIgaW4gd2hpY2ggaXQgaXMgZmlyZWQsIHBsZWFzZSByZXZpZXcgdGhlIHtAbGluayBTY2VuZS5wcm9ncmVzc30gbWV0aG9kLlxuXHRcdCAqXG5cdFx0ICogQGV2ZW50IFNjcm9sbE1hZ2ljLlNjZW5lI2xlYXZlXG5cdFx0ICpcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIHNjZW5lLm9uKFwibGVhdmVcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG5cdFx0ICogXHRjb25zb2xlLmxvZyhcIlNjZW5lIGxlZnQuXCIpO1xuXHRcdCAqIH0pO1xuXHRcdCAqXG5cdFx0ICogQHByb3BlcnR5IHtvYmplY3R9IGV2ZW50IC0gVGhlIGV2ZW50IE9iamVjdCBwYXNzZWQgdG8gZWFjaCBjYWxsYmFja1xuXHRcdCAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBldmVudC50eXBlIC0gVGhlIG5hbWUgb2YgdGhlIGV2ZW50XG5cdFx0ICogQHByb3BlcnR5IHtTY2VuZX0gZXZlbnQudGFyZ2V0IC0gVGhlIFNjZW5lIG9iamVjdCB0aGF0IHRyaWdnZXJlZCB0aGlzIGV2ZW50XG5cdFx0ICogQHByb3BlcnR5IHtudW1iZXJ9IGV2ZW50LnByb2dyZXNzIC0gUmVmbGVjdHMgdGhlIGN1cnJlbnQgcHJvZ3Jlc3Mgb2YgdGhlIHNjZW5lXG5cdFx0ICogQHByb3BlcnR5IHtzdHJpbmd9IGV2ZW50LnN0YXRlIC0gVGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIHNjZW5lIGBcIkJFRk9SRVwiYCBvciBgXCJBRlRFUlwiYFxuXHRcdCAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBldmVudC5zY3JvbGxEaXJlY3Rpb24gLSBJbmRpY2F0ZXMgd2hpY2ggd2F5IHdlIGFyZSBzY3JvbGxpbmcgYFwiUEFVU0VEXCJgLCBgXCJGT1JXQVJEXCJgIG9yIGBcIlJFVkVSU0VcImBcblx0XHQgKi9cblx0XHQvKipcblx0XHQgKiBTY2VuZSB1cGRhdGUgZXZlbnQuICBcblx0XHQgKiBGaXJlcyB3aGVuZXZlciB0aGUgc2NlbmUgaXMgdXBkYXRlZCAoYnV0IG5vdCBuZWNlc3NhcmlseSBjaGFuZ2VzIHRoZSBwcm9ncmVzcykuXG5cdFx0ICpcblx0XHQgKiBAZXZlbnQgU2Nyb2xsTWFnaWMuU2NlbmUjdXBkYXRlXG5cdFx0ICpcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIHNjZW5lLm9uKFwidXBkYXRlXCIsIGZ1bmN0aW9uIChldmVudCkge1xuXHRcdCAqIFx0Y29uc29sZS5sb2coXCJTY2VuZSB1cGRhdGVkLlwiKTtcblx0XHQgKiB9KTtcblx0XHQgKlxuXHRcdCAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBldmVudCAtIFRoZSBldmVudCBPYmplY3QgcGFzc2VkIHRvIGVhY2ggY2FsbGJhY2tcblx0XHQgKiBAcHJvcGVydHkge3N0cmluZ30gZXZlbnQudHlwZSAtIFRoZSBuYW1lIG9mIHRoZSBldmVudFxuXHRcdCAqIEBwcm9wZXJ0eSB7U2NlbmV9IGV2ZW50LnRhcmdldCAtIFRoZSBTY2VuZSBvYmplY3QgdGhhdCB0cmlnZ2VyZWQgdGhpcyBldmVudFxuXHRcdCAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBldmVudC5zdGFydFBvcyAtIFRoZSBzdGFydGluZyBwb3NpdGlvbiBvZiB0aGUgc2NlbmUgKGluIHJlbGF0aW9uIHRvIHRoZSBjb25haW5lcilcblx0XHQgKiBAcHJvcGVydHkge251bWJlcn0gZXZlbnQuZW5kUG9zIC0gVGhlIGVuZGluZyBwb3NpdGlvbiBvZiB0aGUgc2NlbmUgKGluIHJlbGF0aW9uIHRvIHRoZSBjb25haW5lcilcblx0XHQgKiBAcHJvcGVydHkge251bWJlcn0gZXZlbnQuc2Nyb2xsUG9zIC0gVGhlIGN1cnJlbnQgc2Nyb2xsIHBvc2l0aW9uIG9mIHRoZSBjb250YWluZXJcblx0XHQgKi9cblx0XHQvKipcblx0XHQgKiBTY2VuZSBwcm9ncmVzcyBldmVudC4gIFxuXHRcdCAqIEZpcmVzIHdoZW5ldmVyIHRoZSBwcm9ncmVzcyBvZiB0aGUgc2NlbmUgY2hhbmdlcy5cblx0XHQgKlxuXHRcdCAqIEZvciBkZXRhaWxzIG9uIHRoaXMgZXZlbnQgYW5kIHRoZSBvcmRlciBpbiB3aGljaCBpdCBpcyBmaXJlZCwgcGxlYXNlIHJldmlldyB0aGUge0BsaW5rIFNjZW5lLnByb2dyZXNzfSBtZXRob2QuXG5cdFx0ICpcblx0XHQgKiBAZXZlbnQgU2Nyb2xsTWFnaWMuU2NlbmUjcHJvZ3Jlc3Ncblx0XHQgKlxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogc2NlbmUub24oXCJwcm9ncmVzc1wiLCBmdW5jdGlvbiAoZXZlbnQpIHtcblx0XHQgKiBcdGNvbnNvbGUubG9nKFwiU2NlbmUgcHJvZ3Jlc3MgY2hhbmdlZCB0byBcIiArIGV2ZW50LnByb2dyZXNzKTtcblx0XHQgKiB9KTtcblx0XHQgKlxuXHRcdCAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBldmVudCAtIFRoZSBldmVudCBPYmplY3QgcGFzc2VkIHRvIGVhY2ggY2FsbGJhY2tcblx0XHQgKiBAcHJvcGVydHkge3N0cmluZ30gZXZlbnQudHlwZSAtIFRoZSBuYW1lIG9mIHRoZSBldmVudFxuXHRcdCAqIEBwcm9wZXJ0eSB7U2NlbmV9IGV2ZW50LnRhcmdldCAtIFRoZSBTY2VuZSBvYmplY3QgdGhhdCB0cmlnZ2VyZWQgdGhpcyBldmVudFxuXHRcdCAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBldmVudC5wcm9ncmVzcyAtIFJlZmxlY3RzIHRoZSBjdXJyZW50IHByb2dyZXNzIG9mIHRoZSBzY2VuZVxuXHRcdCAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBldmVudC5zdGF0ZSAtIFRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBzY2VuZSBgXCJCRUZPUkVcImAsIGBcIkRVUklOR1wiYCBvciBgXCJBRlRFUlwiYFxuXHRcdCAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBldmVudC5zY3JvbGxEaXJlY3Rpb24gLSBJbmRpY2F0ZXMgd2hpY2ggd2F5IHdlIGFyZSBzY3JvbGxpbmcgYFwiUEFVU0VEXCJgLCBgXCJGT1JXQVJEXCJgIG9yIGBcIlJFVkVSU0VcImBcblx0XHQgKi9cblx0XHQvKipcblx0XHQgKiBTY2VuZSBjaGFuZ2UgZXZlbnQuICBcblx0XHQgKiBGaXJlcyB3aGVudmV2ZXIgYSBwcm9wZXJ0eSBvZiB0aGUgc2NlbmUgaXMgY2hhbmdlZC5cblx0XHQgKlxuXHRcdCAqIEBldmVudCBTY3JvbGxNYWdpYy5TY2VuZSNjaGFuZ2Vcblx0XHQgKlxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogc2NlbmUub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG5cdFx0ICogXHRjb25zb2xlLmxvZyhcIlNjZW5lIFByb3BlcnR5IFxcXCJcIiArIGV2ZW50LndoYXQgKyBcIlxcXCIgY2hhbmdlZCB0byBcIiArIGV2ZW50Lm5ld3ZhbCk7XG5cdFx0ICogfSk7XG5cdFx0ICpcblx0XHQgKiBAcHJvcGVydHkge29iamVjdH0gZXZlbnQgLSBUaGUgZXZlbnQgT2JqZWN0IHBhc3NlZCB0byBlYWNoIGNhbGxiYWNrXG5cdFx0ICogQHByb3BlcnR5IHtzdHJpbmd9IGV2ZW50LnR5cGUgLSBUaGUgbmFtZSBvZiB0aGUgZXZlbnRcblx0XHQgKiBAcHJvcGVydHkge1NjZW5lfSBldmVudC50YXJnZXQgLSBUaGUgU2NlbmUgb2JqZWN0IHRoYXQgdHJpZ2dlcmVkIHRoaXMgZXZlbnRcblx0XHQgKiBAcHJvcGVydHkge3N0cmluZ30gZXZlbnQud2hhdCAtIEluZGljYXRlcyB3aGF0IHZhbHVlIGhhcyBiZWVuIGNoYW5nZWRcblx0XHQgKiBAcHJvcGVydHkge21peGVkfSBldmVudC5uZXd2YWwgLSBUaGUgbmV3IHZhbHVlIG9mIHRoZSBjaGFuZ2VkIHByb3BlcnR5XG5cdFx0ICovXG5cdFx0LyoqXG5cdFx0ICogU2NlbmUgc2hpZnQgZXZlbnQuICBcblx0XHQgKiBGaXJlcyB3aGVudmV2ZXIgdGhlIHN0YXJ0IG9yIGVuZCAqKnNjcm9sbCBvZmZzZXQqKiBvZiB0aGUgc2NlbmUgY2hhbmdlLlxuXHRcdCAqIFRoaXMgaGFwcGVucyBleHBsaWNpdGVseSwgd2hlbiBvbmUgb2YgdGhlc2UgdmFsdWVzIGNoYW5nZTogYG9mZnNldGAsIGBkdXJhdGlvbmAgb3IgYHRyaWdnZXJIb29rYC5cblx0XHQgKiBJdCB3aWxsIGZpcmUgaW1wbGljaXRseSB3aGVuIHRoZSBgdHJpZ2dlckVsZW1lbnRgIGNoYW5nZXMsIGlmIHRoZSBuZXcgZWxlbWVudCBoYXMgYSBkaWZmZXJlbnQgcG9zaXRpb24gKG1vc3QgY2FzZXMpLlxuXHRcdCAqIEl0IHdpbGwgYWxzbyBmaXJlIGltcGxpY2l0bHkgd2hlbiB0aGUgc2l6ZSBvZiB0aGUgY29udGFpbmVyIGNoYW5nZXMgYW5kIHRoZSB0cmlnZ2VySG9vayBpcyBhbnl0aGluZyBvdGhlciB0aGFuIGBvbkxlYXZlYC5cblx0XHQgKlxuXHRcdCAqIEBldmVudCBTY3JvbGxNYWdpYy5TY2VuZSNzaGlmdFxuXHRcdCAqIEBzaW5jZSAxLjEuMFxuXHRcdCAqXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiBzY2VuZS5vbihcInNoaWZ0XCIsIGZ1bmN0aW9uIChldmVudCkge1xuXHRcdCAqIFx0Y29uc29sZS5sb2coXCJTY2VuZSBtb3ZlZCwgYmVjYXVzZSB0aGUgXCIgKyBldmVudC5yZWFzb24gKyBcIiBoYXMgY2hhbmdlZC4pXCIpO1xuXHRcdCAqIH0pO1xuXHRcdCAqXG5cdFx0ICogQHByb3BlcnR5IHtvYmplY3R9IGV2ZW50IC0gVGhlIGV2ZW50IE9iamVjdCBwYXNzZWQgdG8gZWFjaCBjYWxsYmFja1xuXHRcdCAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBldmVudC50eXBlIC0gVGhlIG5hbWUgb2YgdGhlIGV2ZW50XG5cdFx0ICogQHByb3BlcnR5IHtTY2VuZX0gZXZlbnQudGFyZ2V0IC0gVGhlIFNjZW5lIG9iamVjdCB0aGF0IHRyaWdnZXJlZCB0aGlzIGV2ZW50XG5cdFx0ICogQHByb3BlcnR5IHtzdHJpbmd9IGV2ZW50LnJlYXNvbiAtIEluZGljYXRlcyB3aHkgdGhlIHNjZW5lIGhhcyBzaGlmdGVkXG5cdFx0ICovXG5cdFx0LyoqXG5cdFx0ICogU2NlbmUgZGVzdHJveSBldmVudC4gIFxuXHRcdCAqIEZpcmVzIHdoZW52ZXZlciB0aGUgc2NlbmUgaXMgZGVzdHJveWVkLlxuXHRcdCAqIFRoaXMgY2FuIGJlIHVzZWQgdG8gdGlkeSB1cCBjdXN0b20gYmVoYXZpb3VyIHVzZWQgaW4gZXZlbnRzLlxuXHRcdCAqXG5cdFx0ICogQGV2ZW50IFNjcm9sbE1hZ2ljLlNjZW5lI2Rlc3Ryb3lcblx0XHQgKiBAc2luY2UgMS4xLjBcblx0XHQgKlxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogc2NlbmUub24oXCJlbnRlclwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcblx0XHQgKiAgICAgICAgLy8gYWRkIGN1c3RvbSBhY3Rpb25cblx0XHQgKiAgICAgICAgJChcIiNteS1lbGVtXCIpLmxlZnQoXCIyMDBcIik7XG5cdFx0ICogICAgICB9KVxuXHRcdCAqICAgICAgLm9uKFwiZGVzdHJveVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcblx0XHQgKiAgICAgICAgLy8gcmVzZXQgbXkgZWxlbWVudCB0byBzdGFydCBwb3NpdGlvblxuXHRcdCAqICAgICAgICBpZiAoZXZlbnQucmVzZXQpIHtcblx0XHQgKiAgICAgICAgICAkKFwiI215LWVsZW1cIikubGVmdChcIjBcIik7XG5cdFx0ICogICAgICAgIH1cblx0XHQgKiAgICAgIH0pO1xuXHRcdCAqXG5cdFx0ICogQHByb3BlcnR5IHtvYmplY3R9IGV2ZW50IC0gVGhlIGV2ZW50IE9iamVjdCBwYXNzZWQgdG8gZWFjaCBjYWxsYmFja1xuXHRcdCAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBldmVudC50eXBlIC0gVGhlIG5hbWUgb2YgdGhlIGV2ZW50XG5cdFx0ICogQHByb3BlcnR5IHtTY2VuZX0gZXZlbnQudGFyZ2V0IC0gVGhlIFNjZW5lIG9iamVjdCB0aGF0IHRyaWdnZXJlZCB0aGlzIGV2ZW50XG5cdFx0ICogQHByb3BlcnR5IHtib29sZWFufSBldmVudC5yZXNldCAtIEluZGljYXRlcyBpZiB0aGUgZGVzdHJveSBtZXRob2Qgd2FzIGNhbGxlZCB3aXRoIHJlc2V0IGB0cnVlYCBvciBgZmFsc2VgLlxuXHRcdCAqL1xuXHRcdC8qKlxuXHRcdCAqIFNjZW5lIGFkZCBldmVudC4gIFxuXHRcdCAqIEZpcmVzIHdoZW4gdGhlIHNjZW5lIGlzIGFkZGVkIHRvIGEgY29udHJvbGxlci5cblx0XHQgKiBUaGlzIGlzIG1vc3RseSB1c2VkIGJ5IHBsdWdpbnMgdG8ga25vdyB0aGF0IGNoYW5nZSBtaWdodCBiZSBkdWUuXG5cdFx0ICpcblx0XHQgKiBAZXZlbnQgU2Nyb2xsTWFnaWMuU2NlbmUjYWRkXG5cdFx0ICogQHNpbmNlIDIuMC4wXG5cdFx0ICpcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIHNjZW5lLm9uKFwiYWRkXCIsIGZ1bmN0aW9uIChldmVudCkge1xuXHRcdCAqIFx0Y29uc29sZS5sb2coJ1NjZW5lIHdhcyBhZGRlZCB0byBhIG5ldyBjb250cm9sbGVyLicpO1xuXHRcdCAqIH0pO1xuXHRcdCAqXG5cdFx0ICogQHByb3BlcnR5IHtvYmplY3R9IGV2ZW50IC0gVGhlIGV2ZW50IE9iamVjdCBwYXNzZWQgdG8gZWFjaCBjYWxsYmFja1xuXHRcdCAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBldmVudC50eXBlIC0gVGhlIG5hbWUgb2YgdGhlIGV2ZW50XG5cdFx0ICogQHByb3BlcnR5IHtTY2VuZX0gZXZlbnQudGFyZ2V0IC0gVGhlIFNjZW5lIG9iamVjdCB0aGF0IHRyaWdnZXJlZCB0aGlzIGV2ZW50XG5cdFx0ICogQHByb3BlcnR5IHtib29sZWFufSBldmVudC5jb250cm9sbGVyIC0gVGhlIGNvbnRyb2xsZXIgb2JqZWN0IHRoZSBzY2VuZSB3YXMgYWRkZWQgdG8uXG5cdFx0ICovXG5cdFx0LyoqXG5cdFx0ICogU2NlbmUgcmVtb3ZlIGV2ZW50LiAgXG5cdFx0ICogRmlyZXMgd2hlbiB0aGUgc2NlbmUgaXMgcmVtb3ZlZCBmcm9tIGEgY29udHJvbGxlci5cblx0XHQgKiBUaGlzIGlzIG1vc3RseSB1c2VkIGJ5IHBsdWdpbnMgdG8ga25vdyB0aGF0IGNoYW5nZSBtaWdodCBiZSBkdWUuXG5cdFx0ICpcblx0XHQgKiBAZXZlbnQgU2Nyb2xsTWFnaWMuU2NlbmUjcmVtb3ZlXG5cdFx0ICogQHNpbmNlIDIuMC4wXG5cdFx0ICpcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIHNjZW5lLm9uKFwicmVtb3ZlXCIsIGZ1bmN0aW9uIChldmVudCkge1xuXHRcdCAqIFx0Y29uc29sZS5sb2coJ1NjZW5lIHdhcyByZW1vdmVkIGZyb20gaXRzIGNvbnRyb2xsZXIuJyk7XG5cdFx0ICogfSk7XG5cdFx0ICpcblx0XHQgKiBAcHJvcGVydHkge29iamVjdH0gZXZlbnQgLSBUaGUgZXZlbnQgT2JqZWN0IHBhc3NlZCB0byBlYWNoIGNhbGxiYWNrXG5cdFx0ICogQHByb3BlcnR5IHtzdHJpbmd9IGV2ZW50LnR5cGUgLSBUaGUgbmFtZSBvZiB0aGUgZXZlbnRcblx0XHQgKiBAcHJvcGVydHkge1NjZW5lfSBldmVudC50YXJnZXQgLSBUaGUgU2NlbmUgb2JqZWN0IHRoYXQgdHJpZ2dlcmVkIHRoaXMgZXZlbnRcblx0XHQgKi9cblxuXHRcdC8qKlxuXHRcdCAqIEFkZCBvbmUgb3JlIG1vcmUgZXZlbnQgbGlzdGVuZXIuICBcblx0XHQgKiBUaGUgY2FsbGJhY2sgZnVuY3Rpb24gd2lsbCBiZSBmaXJlZCBhdCB0aGUgcmVzcGVjdGl2ZSBldmVudCwgYW5kIGFuIG9iamVjdCBjb250YWluaW5nIHJlbGV2YW50IGRhdGEgd2lsbCBiZSBwYXNzZWQgdG8gdGhlIGNhbGxiYWNrLlxuXHRcdCAqIEBtZXRob2QgU2Nyb2xsTWFnaWMuU2NlbmUjb25cblx0XHQgKlxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogZnVuY3Rpb24gY2FsbGJhY2sgKGV2ZW50KSB7XG5cdFx0ICogXHRcdGNvbnNvbGUubG9nKFwiRXZlbnQgZmlyZWQhIChcIiArIGV2ZW50LnR5cGUgKyBcIilcIik7XG5cdFx0ICogfVxuXHRcdCAqIC8vIGFkZCBsaXN0ZW5lcnNcblx0XHQgKiBzY2VuZS5vbihcImNoYW5nZSB1cGRhdGUgcHJvZ3Jlc3Mgc3RhcnQgZW5kIGVudGVyIGxlYXZlXCIsIGNhbGxiYWNrKTtcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lcyAtIFRoZSBuYW1lIG9yIG5hbWVzIG9mIHRoZSBldmVudCB0aGUgY2FsbGJhY2sgc2hvdWxkIGJlIGF0dGFjaGVkIHRvLlxuXHRcdCAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gQSBmdW5jdGlvbiB0aGF0IHNob3VsZCBiZSBleGVjdXRlZCwgd2hlbiB0aGUgZXZlbnQgaXMgZGlzcGF0Y2hlZC4gQW4gZXZlbnQgb2JqZWN0IHdpbGwgYmUgcGFzc2VkIHRvIHRoZSBjYWxsYmFjay5cblx0XHQgKiBAcmV0dXJucyB7U2NlbmV9IFBhcmVudCBvYmplY3QgZm9yIGNoYWluaW5nLlxuXHRcdCAqL1xuXHRcdHRoaXMub24gPSBmdW5jdGlvbiAobmFtZXMsIGNhbGxiYWNrKSB7XG5cdFx0XHRpZiAoX3V0aWwudHlwZS5GdW5jdGlvbihjYWxsYmFjaykpIHtcblx0XHRcdFx0bmFtZXMgPSBuYW1lcy50cmltKCkuc3BsaXQoJyAnKTtcblx0XHRcdFx0bmFtZXMuZm9yRWFjaChmdW5jdGlvbiAoZnVsbG5hbWUpIHtcblx0XHRcdFx0XHR2YXJcblx0XHRcdFx0XHRuYW1lcGFydHMgPSBmdWxsbmFtZS5zcGxpdCgnLicpLFxuXHRcdFx0XHRcdFx0ZXZlbnRuYW1lID0gbmFtZXBhcnRzWzBdLFxuXHRcdFx0XHRcdFx0bmFtZXNwYWNlID0gbmFtZXBhcnRzWzFdO1xuXHRcdFx0XHRcdGlmIChldmVudG5hbWUgIT0gXCIqXCIpIHsgLy8gZGlzYWxsb3cgd2lsZGNhcmRzXG5cdFx0XHRcdFx0XHRpZiAoIV9saXN0ZW5lcnNbZXZlbnRuYW1lXSkge1xuXHRcdFx0XHRcdFx0XHRfbGlzdGVuZXJzW2V2ZW50bmFtZV0gPSBbXTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdF9saXN0ZW5lcnNbZXZlbnRuYW1lXS5wdXNoKHtcblx0XHRcdFx0XHRcdFx0bmFtZXNwYWNlOiBuYW1lc3BhY2UgfHwgJycsXG5cdFx0XHRcdFx0XHRcdGNhbGxiYWNrOiBjYWxsYmFja1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGxvZygxLCBcIkVSUk9SIHdoZW4gY2FsbGluZyAnLm9uKCknOiBTdXBwbGllZCBjYWxsYmFjayBmb3IgJ1wiICsgbmFtZXMgKyBcIicgaXMgbm90IGEgdmFsaWQgZnVuY3Rpb24hXCIpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIFNjZW5lO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZW1vdmUgb25lIG9yIG1vcmUgZXZlbnQgbGlzdGVuZXIuXG5cdFx0ICogQG1ldGhvZCBTY3JvbGxNYWdpYy5TY2VuZSNvZmZcblx0XHQgKlxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogZnVuY3Rpb24gY2FsbGJhY2sgKGV2ZW50KSB7XG5cdFx0ICogXHRcdGNvbnNvbGUubG9nKFwiRXZlbnQgZmlyZWQhIChcIiArIGV2ZW50LnR5cGUgKyBcIilcIik7XG5cdFx0ICogfVxuXHRcdCAqIC8vIGFkZCBsaXN0ZW5lcnNcblx0XHQgKiBzY2VuZS5vbihcImNoYW5nZSB1cGRhdGVcIiwgY2FsbGJhY2spO1xuXHRcdCAqIC8vIHJlbW92ZSBsaXN0ZW5lcnNcblx0XHQgKiBzY2VuZS5vZmYoXCJjaGFuZ2UgdXBkYXRlXCIsIGNhbGxiYWNrKTtcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lcyAtIFRoZSBuYW1lIG9yIG5hbWVzIG9mIHRoZSBldmVudCB0aGF0IHNob3VsZCBiZSByZW1vdmVkLlxuXHRcdCAqIEBwYXJhbSB7ZnVuY3Rpb259IFtjYWxsYmFja10gLSBBIHNwZWNpZmljIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgc2hvdWxkIGJlIHJlbW92ZWQuIElmIG5vbmUgaXMgcGFzc2VkIGFsbCBjYWxsYmFja3MgdG8gdGhlIGV2ZW50IGxpc3RlbmVyIHdpbGwgYmUgcmVtb3ZlZC5cblx0XHQgKiBAcmV0dXJucyB7U2NlbmV9IFBhcmVudCBvYmplY3QgZm9yIGNoYWluaW5nLlxuXHRcdCAqL1xuXHRcdHRoaXMub2ZmID0gZnVuY3Rpb24gKG5hbWVzLCBjYWxsYmFjaykge1xuXHRcdFx0aWYgKCFuYW1lcykge1xuXHRcdFx0XHRsb2coMSwgXCJFUlJPUjogSW52YWxpZCBldmVudCBuYW1lIHN1cHBsaWVkLlwiKTtcblx0XHRcdFx0cmV0dXJuIFNjZW5lO1xuXHRcdFx0fVxuXHRcdFx0bmFtZXMgPSBuYW1lcy50cmltKCkuc3BsaXQoJyAnKTtcblx0XHRcdG5hbWVzLmZvckVhY2goZnVuY3Rpb24gKGZ1bGxuYW1lLCBrZXkpIHtcblx0XHRcdFx0dmFyXG5cdFx0XHRcdG5hbWVwYXJ0cyA9IGZ1bGxuYW1lLnNwbGl0KCcuJyksXG5cdFx0XHRcdFx0ZXZlbnRuYW1lID0gbmFtZXBhcnRzWzBdLFxuXHRcdFx0XHRcdG5hbWVzcGFjZSA9IG5hbWVwYXJ0c1sxXSB8fCAnJyxcblx0XHRcdFx0XHRyZW1vdmVMaXN0ID0gZXZlbnRuYW1lID09PSAnKicgPyBPYmplY3Qua2V5cyhfbGlzdGVuZXJzKSA6IFtldmVudG5hbWVdO1xuXHRcdFx0XHRyZW1vdmVMaXN0LmZvckVhY2goZnVuY3Rpb24gKHJlbW92ZSkge1xuXHRcdFx0XHRcdHZhclxuXHRcdFx0XHRcdGxpc3QgPSBfbGlzdGVuZXJzW3JlbW92ZV0gfHwgW10sXG5cdFx0XHRcdFx0XHRpID0gbGlzdC5sZW5ndGg7XG5cdFx0XHRcdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0XHRcdFx0dmFyIGxpc3RlbmVyID0gbGlzdFtpXTtcblx0XHRcdFx0XHRcdGlmIChsaXN0ZW5lciAmJiAobmFtZXNwYWNlID09PSBsaXN0ZW5lci5uYW1lc3BhY2UgfHwgbmFtZXNwYWNlID09PSAnKicpICYmICghY2FsbGJhY2sgfHwgY2FsbGJhY2sgPT0gbGlzdGVuZXIuY2FsbGJhY2spKSB7XG5cdFx0XHRcdFx0XHRcdGxpc3Quc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoIWxpc3QubGVuZ3RoKSB7XG5cdFx0XHRcdFx0XHRkZWxldGUgX2xpc3RlbmVyc1tyZW1vdmVdO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBTY2VuZTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogVHJpZ2dlciBhbiBldmVudC5cblx0XHQgKiBAbWV0aG9kIFNjcm9sbE1hZ2ljLlNjZW5lI3RyaWdnZXJcblx0XHQgKlxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogdGhpcy50cmlnZ2VyKFwiY2hhbmdlXCIpO1xuXHRcdCAqXG5cdFx0ICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgZXZlbnQgdGhhdCBzaG91bGQgYmUgdHJpZ2dlcmVkLlxuXHRcdCAqIEBwYXJhbSB7b2JqZWN0fSBbdmFyc10gLSBBbiBvYmplY3QgY29udGFpbmluZyBpbmZvIHRoYXQgc2hvdWxkIGJlIHBhc3NlZCB0byB0aGUgY2FsbGJhY2suXG5cdFx0ICogQHJldHVybnMge1NjZW5lfSBQYXJlbnQgb2JqZWN0IGZvciBjaGFpbmluZy5cblx0XHQgKi9cblx0XHR0aGlzLnRyaWdnZXIgPSBmdW5jdGlvbiAobmFtZSwgdmFycykge1xuXHRcdFx0aWYgKG5hbWUpIHtcblx0XHRcdFx0dmFyXG5cdFx0XHRcdG5hbWVwYXJ0cyA9IG5hbWUudHJpbSgpLnNwbGl0KCcuJyksXG5cdFx0XHRcdFx0ZXZlbnRuYW1lID0gbmFtZXBhcnRzWzBdLFxuXHRcdFx0XHRcdG5hbWVzcGFjZSA9IG5hbWVwYXJ0c1sxXSxcblx0XHRcdFx0XHRsaXN0ZW5lcnMgPSBfbGlzdGVuZXJzW2V2ZW50bmFtZV07XG5cdFx0XHRcdGxvZygzLCAnZXZlbnQgZmlyZWQ6JywgZXZlbnRuYW1lLCB2YXJzID8gXCItPlwiIDogJycsIHZhcnMgfHwgJycpO1xuXHRcdFx0XHRpZiAobGlzdGVuZXJzKSB7XG5cdFx0XHRcdFx0bGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24gKGxpc3RlbmVyLCBrZXkpIHtcblx0XHRcdFx0XHRcdGlmICghbmFtZXNwYWNlIHx8IG5hbWVzcGFjZSA9PT0gbGlzdGVuZXIubmFtZXNwYWNlKSB7XG5cdFx0XHRcdFx0XHRcdGxpc3RlbmVyLmNhbGxiYWNrLmNhbGwoU2NlbmUsIG5ldyBTY3JvbGxNYWdpYy5FdmVudChldmVudG5hbWUsIGxpc3RlbmVyLm5hbWVzcGFjZSwgU2NlbmUsIHZhcnMpKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bG9nKDEsIFwiRVJST1I6IEludmFsaWQgZXZlbnQgbmFtZSBzdXBwbGllZC5cIik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gU2NlbmU7XG5cdFx0fTtcblxuXHRcdC8vIHNldCBldmVudCBsaXN0ZW5lcnNcblx0XHRTY2VuZS5vbihcImNoYW5nZS5pbnRlcm5hbFwiLCBmdW5jdGlvbiAoZSkge1xuXHRcdFx0aWYgKGUud2hhdCAhPT0gXCJsb2dsZXZlbFwiICYmIGUud2hhdCAhPT0gXCJ0d2VlbkNoYW5nZXNcIikgeyAvLyBubyBuZWVkIGZvciBhIHNjZW5lIHVwZGF0ZSBzY2VuZSB3aXRoIHRoZXNlIG9wdGlvbnMuLi5cblx0XHRcdFx0aWYgKGUud2hhdCA9PT0gXCJ0cmlnZ2VyRWxlbWVudFwiKSB7XG5cdFx0XHRcdFx0dXBkYXRlVHJpZ2dlckVsZW1lbnRQb3NpdGlvbigpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGUud2hhdCA9PT0gXCJyZXZlcnNlXCIpIHsgLy8gdGhlIG9ubHkgcHJvcGVydHkgbGVmdCB0aGF0IG1heSBoYXZlIGFuIGltcGFjdCBvbiB0aGUgY3VycmVudCBzY2VuZSBzdGF0ZS4gRXZlcnl0aGluZyBlbHNlIGlzIGhhbmRsZWQgYnkgdGhlIHNoaWZ0IGV2ZW50LlxuXHRcdFx0XHRcdFNjZW5lLnVwZGF0ZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSkub24oXCJzaGlmdC5pbnRlcm5hbFwiLCBmdW5jdGlvbiAoZSkge1xuXHRcdFx0dXBkYXRlU2Nyb2xsT2Zmc2V0KCk7XG5cdFx0XHRTY2VuZS51cGRhdGUoKTsgLy8gdXBkYXRlIHNjZW5lIHRvIHJlZmxlY3QgbmV3IHBvc2l0aW9uXG5cdFx0fSk7XG5cblx0XHQvKipcblx0XHQgKiBTZW5kIGEgZGVidWcgbWVzc2FnZSB0byB0aGUgY29uc29sZS5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqIGJ1dCBwcm92aWRlZCBwdWJsaWNseSB3aXRoIF9sb2cgZm9yIHBsdWdpbnNcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSBsb2dsZXZlbCAtIFRoZSBsb2dsZXZlbCByZXF1aXJlZCB0byBpbml0aWF0ZSBvdXRwdXQgZm9yIHRoZSBtZXNzYWdlLlxuXHRcdCAqIEBwYXJhbSB7Li4ubWl4ZWR9IG91dHB1dCAtIE9uZSBvciBtb3JlIHZhcmlhYmxlcyB0aGF0IHNob3VsZCBiZSBwYXNzZWQgdG8gdGhlIGNvbnNvbGUuXG5cdFx0ICovXG5cdFx0dmFyIGxvZyA9IHRoaXMuX2xvZyA9IGZ1bmN0aW9uIChsb2dsZXZlbCwgb3V0cHV0KSB7XG5cdFx0XHRpZiAoX29wdGlvbnMubG9nbGV2ZWwgPj0gbG9nbGV2ZWwpIHtcblx0XHRcdFx0QXJyYXkucHJvdG90eXBlLnNwbGljZS5jYWxsKGFyZ3VtZW50cywgMSwgMCwgXCIoXCIgKyBOQU1FU1BBQ0UgKyBcIikgLT5cIik7XG5cdFx0XHRcdF91dGlsLmxvZy5hcHBseSh3aW5kb3csIGFyZ3VtZW50cyk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIEFkZCB0aGUgc2NlbmUgdG8gYSBjb250cm9sbGVyLiAgXG5cdFx0ICogVGhpcyBpcyB0aGUgZXF1aXZhbGVudCB0byBgQ29udHJvbGxlci5hZGRTY2VuZShzY2VuZSlgLlxuXHRcdCAqIEBtZXRob2QgU2Nyb2xsTWFnaWMuU2NlbmUjYWRkVG9cblx0XHQgKlxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogLy8gYWRkIGEgc2NlbmUgdG8gYSBTY3JvbGxNYWdpYyBDb250cm9sbGVyXG5cdFx0ICogc2NlbmUuYWRkVG8oY29udHJvbGxlcik7XG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge1Njcm9sbE1hZ2ljLkNvbnRyb2xsZXJ9IGNvbnRyb2xsZXIgLSBUaGUgY29udHJvbGxlciB0byB3aGljaCB0aGUgc2NlbmUgc2hvdWxkIGJlIGFkZGVkLlxuXHRcdCAqIEByZXR1cm5zIHtTY2VuZX0gUGFyZW50IG9iamVjdCBmb3IgY2hhaW5pbmcuXG5cdFx0ICovXG5cdFx0dGhpcy5hZGRUbyA9IGZ1bmN0aW9uIChjb250cm9sbGVyKSB7XG5cdFx0XHRpZiAoIShjb250cm9sbGVyIGluc3RhbmNlb2YgU2Nyb2xsTWFnaWMuQ29udHJvbGxlcikpIHtcblx0XHRcdFx0bG9nKDEsIFwiRVJST1I6IHN1cHBsaWVkIGFyZ3VtZW50IG9mICdhZGRUbygpJyBpcyBub3QgYSB2YWxpZCBTY3JvbGxNYWdpYyBDb250cm9sbGVyXCIpO1xuXHRcdFx0fSBlbHNlIGlmIChfY29udHJvbGxlciAhPSBjb250cm9sbGVyKSB7XG5cdFx0XHRcdC8vIG5ldyBjb250cm9sbGVyXG5cdFx0XHRcdGlmIChfY29udHJvbGxlcikgeyAvLyB3YXMgYXNzb2NpYXRlZCB0byBhIGRpZmZlcmVudCBjb250cm9sbGVyIGJlZm9yZSwgc28gcmVtb3ZlIGl0Li4uXG5cdFx0XHRcdFx0X2NvbnRyb2xsZXIucmVtb3ZlU2NlbmUoU2NlbmUpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdF9jb250cm9sbGVyID0gY29udHJvbGxlcjtcblx0XHRcdFx0dmFsaWRhdGVPcHRpb24oKTtcblx0XHRcdFx0dXBkYXRlRHVyYXRpb24odHJ1ZSk7XG5cdFx0XHRcdHVwZGF0ZVRyaWdnZXJFbGVtZW50UG9zaXRpb24odHJ1ZSk7XG5cdFx0XHRcdHVwZGF0ZVNjcm9sbE9mZnNldCgpO1xuXHRcdFx0XHRfY29udHJvbGxlci5pbmZvKFwiY29udGFpbmVyXCIpLmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIG9uQ29udGFpbmVyUmVzaXplKTtcblx0XHRcdFx0Y29udHJvbGxlci5hZGRTY2VuZShTY2VuZSk7XG5cdFx0XHRcdFNjZW5lLnRyaWdnZXIoXCJhZGRcIiwge1xuXHRcdFx0XHRcdGNvbnRyb2xsZXI6IF9jb250cm9sbGVyXG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRsb2coMywgXCJhZGRlZCBcIiArIE5BTUVTUEFDRSArIFwiIHRvIGNvbnRyb2xsZXJcIik7XG5cdFx0XHRcdFNjZW5lLnVwZGF0ZSgpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIFNjZW5lO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiAqKkdldCoqIG9yICoqU2V0KiogdGhlIGN1cnJlbnQgZW5hYmxlZCBzdGF0ZSBvZiB0aGUgc2NlbmUuICBcblx0XHQgKiBUaGlzIGNhbiBiZSB1c2VkIHRvIGRpc2FibGUgdGhpcyBzY2VuZSB3aXRob3V0IHJlbW92aW5nIG9yIGRlc3Ryb3lpbmcgaXQuXG5cdFx0ICogQG1ldGhvZCBTY3JvbGxNYWdpYy5TY2VuZSNlbmFibGVkXG5cdFx0ICpcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIGdldCB0aGUgY3VycmVudCB2YWx1ZVxuXHRcdCAqIHZhciBlbmFibGVkID0gc2NlbmUuZW5hYmxlZCgpO1xuXHRcdCAqXG5cdFx0ICogLy8gZGlzYWJsZSB0aGUgc2NlbmVcblx0XHQgKiBzY2VuZS5lbmFibGVkKGZhbHNlKTtcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gW25ld1N0YXRlXSAtIFRoZSBuZXcgZW5hYmxlZCBzdGF0ZSBvZiB0aGUgc2NlbmUgYHRydWVgIG9yIGBmYWxzZWAuXG5cdFx0ICogQHJldHVybnMgeyhib29sZWFufFNjZW5lKX0gQ3VycmVudCBlbmFibGVkIHN0YXRlIG9yIHBhcmVudCBvYmplY3QgZm9yIGNoYWluaW5nLlxuXHRcdCAqL1xuXHRcdHRoaXMuZW5hYmxlZCA9IGZ1bmN0aW9uIChuZXdTdGF0ZSkge1xuXHRcdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7IC8vIGdldFxuXHRcdFx0XHRyZXR1cm4gX2VuYWJsZWQ7XG5cdFx0XHR9IGVsc2UgaWYgKF9lbmFibGVkICE9IG5ld1N0YXRlKSB7IC8vIHNldFxuXHRcdFx0XHRfZW5hYmxlZCA9ICEhIG5ld1N0YXRlO1xuXHRcdFx0XHRTY2VuZS51cGRhdGUodHJ1ZSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gU2NlbmU7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJlbW92ZSB0aGUgc2NlbmUgZnJvbSB0aGUgY29udHJvbGxlci4gIFxuXHRcdCAqIFRoaXMgaXMgdGhlIGVxdWl2YWxlbnQgdG8gYENvbnRyb2xsZXIucmVtb3ZlU2NlbmUoc2NlbmUpYC5cblx0XHQgKiBUaGUgc2NlbmUgd2lsbCBub3QgYmUgdXBkYXRlZCBhbnltb3JlIHVudGlsIHlvdSByZWFkZCBpdCB0byBhIGNvbnRyb2xsZXIuXG5cdFx0ICogVG8gcmVtb3ZlIHRoZSBwaW4gb3IgdGhlIHR3ZWVuIHlvdSBuZWVkIHRvIGNhbGwgcmVtb3ZlVHdlZW4oKSBvciByZW1vdmVQaW4oKSByZXNwZWN0aXZlbHkuXG5cdFx0ICogQG1ldGhvZCBTY3JvbGxNYWdpYy5TY2VuZSNyZW1vdmVcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIHJlbW92ZSB0aGUgc2NlbmUgZnJvbSBpdHMgY29udHJvbGxlclxuXHRcdCAqIHNjZW5lLnJlbW92ZSgpO1xuXHRcdCAqXG5cdFx0ICogQHJldHVybnMge1NjZW5lfSBQYXJlbnQgb2JqZWN0IGZvciBjaGFpbmluZy5cblx0XHQgKi9cblx0XHR0aGlzLnJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChfY29udHJvbGxlcikge1xuXHRcdFx0XHRfY29udHJvbGxlci5pbmZvKFwiY29udGFpbmVyXCIpLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIG9uQ29udGFpbmVyUmVzaXplKTtcblx0XHRcdFx0dmFyIHRtcFBhcmVudCA9IF9jb250cm9sbGVyO1xuXHRcdFx0XHRfY29udHJvbGxlciA9IHVuZGVmaW5lZDtcblx0XHRcdFx0dG1wUGFyZW50LnJlbW92ZVNjZW5lKFNjZW5lKTtcblx0XHRcdFx0U2NlbmUudHJpZ2dlcihcInJlbW92ZVwiKTtcblx0XHRcdFx0bG9nKDMsIFwicmVtb3ZlZCBcIiArIE5BTUVTUEFDRSArIFwiIGZyb20gY29udHJvbGxlclwiKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBTY2VuZTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogRGVzdHJveSB0aGUgc2NlbmUgYW5kIGV2ZXJ5dGhpbmcuXG5cdFx0ICogQG1ldGhvZCBTY3JvbGxNYWdpYy5TY2VuZSNkZXN0cm95XG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiAvLyBkZXN0cm95IHRoZSBzY2VuZSB3aXRob3V0IHJlc2V0dGluZyB0aGUgcGluIGFuZCB0d2VlbiB0byB0aGVpciBpbml0aWFsIHBvc2l0aW9uc1xuXHRcdCAqIHNjZW5lID0gc2NlbmUuZGVzdHJveSgpO1xuXHRcdCAqXG5cdFx0ICogLy8gZGVzdHJveSB0aGUgc2NlbmUgYW5kIHJlc2V0IHRoZSBwaW4gYW5kIHR3ZWVuXG5cdFx0ICogc2NlbmUgPSBzY2VuZS5kZXN0cm95KHRydWUpO1xuXHRcdCAqXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBbcmVzZXQ9ZmFsc2VdIC0gSWYgYHRydWVgIHRoZSBwaW4gYW5kIHR3ZWVuIChpZiBleGlzdGVudCkgd2lsbCBiZSByZXNldC5cblx0XHQgKiBAcmV0dXJucyB7bnVsbH0gTnVsbCB0byB1bnNldCBoYW5kbGVyIHZhcmlhYmxlcy5cblx0XHQgKi9cblx0XHR0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAocmVzZXQpIHtcblx0XHRcdFNjZW5lLnRyaWdnZXIoXCJkZXN0cm95XCIsIHtcblx0XHRcdFx0cmVzZXQ6IHJlc2V0XG5cdFx0XHR9KTtcblx0XHRcdFNjZW5lLnJlbW92ZSgpO1xuXHRcdFx0U2NlbmUub2ZmKFwiKi4qXCIpO1xuXHRcdFx0bG9nKDMsIFwiZGVzdHJveWVkIFwiICsgTkFNRVNQQUNFICsgXCIgKHJlc2V0OiBcIiArIChyZXNldCA/IFwidHJ1ZVwiIDogXCJmYWxzZVwiKSArIFwiKVwiKTtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH07XG5cblxuXHRcdC8qKlxuXHRcdCAqIFVwZGF0ZXMgdGhlIFNjZW5lIHRvIHJlZmxlY3QgdGhlIGN1cnJlbnQgc3RhdGUuICBcblx0XHQgKiBUaGlzIGlzIHRoZSBlcXVpdmFsZW50IHRvIGBDb250cm9sbGVyLnVwZGF0ZVNjZW5lKHNjZW5lLCBpbW1lZGlhdGVseSlgLiAgXG5cdFx0ICogVGhlIHVwZGF0ZSBtZXRob2QgY2FsY3VsYXRlcyB0aGUgc2NlbmUncyBzdGFydCBhbmQgZW5kIHBvc2l0aW9uIChiYXNlZCBvbiB0aGUgdHJpZ2dlciBlbGVtZW50LCB0cmlnZ2VyIGhvb2ssIGR1cmF0aW9uIGFuZCBvZmZzZXQpIGFuZCBjaGVja3MgaXQgYWdhaW5zdCB0aGUgY3VycmVudCBzY3JvbGwgcG9zaXRpb24gb2YgdGhlIGNvbnRhaW5lci4gIFxuXHRcdCAqIEl0IHRoZW4gdXBkYXRlcyB0aGUgY3VycmVudCBzY2VuZSBzdGF0ZSBhY2NvcmRpbmdseSAob3IgZG9lcyBub3RoaW5nLCBpZiB0aGUgc3RhdGUgaXMgYWxyZWFkeSBjb3JyZWN0KSDigJMgUGlucyB3aWxsIGJlIHNldCB0byB0aGVpciBjb3JyZWN0IHBvc2l0aW9uIGFuZCB0d2VlbnMgd2lsbCBiZSB1cGRhdGVkIHRvIHRoZWlyIGNvcnJlY3QgcHJvZ3Jlc3MuXG5cdFx0ICogVGhpcyBtZWFucyBhbiB1cGRhdGUgZG9lc24ndCBuZWNlc3NhcmlseSByZXN1bHQgaW4gYSBwcm9ncmVzcyBjaGFuZ2UuIFRoZSBgcHJvZ3Jlc3NgIGV2ZW50IHdpbGwgYmUgZmlyZWQgaWYgdGhlIHByb2dyZXNzIGhhcyBpbmRlZWQgY2hhbmdlZCBiZXR3ZWVuIHRoaXMgdXBkYXRlIGFuZCB0aGUgbGFzdC4gIFxuXHRcdCAqIF8qKk5PVEU6KiogVGhpcyBtZXRob2QgZ2V0cyBjYWxsZWQgY29uc3RhbnRseSB3aGVuZXZlciBTY3JvbGxNYWdpYyBkZXRlY3RzIGEgY2hhbmdlLiBUaGUgb25seSBhcHBsaWNhdGlvbiBmb3IgeW91IGlzIGlmIHlvdSBjaGFuZ2Ugc29tZXRoaW5nIG91dHNpZGUgb2YgdGhlIHJlYWxtIG9mIFNjcm9sbE1hZ2ljLCBsaWtlIG1vdmluZyB0aGUgdHJpZ2dlciBvciBjaGFuZ2luZyB0d2VlbiBwYXJhbWV0ZXJzLl9cblx0XHQgKiBAbWV0aG9kIFNjcm9sbE1hZ2ljLlNjZW5lI3VwZGF0ZVxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogLy8gdXBkYXRlIHRoZSBzY2VuZSBvbiBuZXh0IHRpY2tcblx0XHQgKiBzY2VuZS51cGRhdGUoKTtcblx0XHQgKlxuXHRcdCAqIC8vIHVwZGF0ZSB0aGUgc2NlbmUgaW1tZWRpYXRlbHlcblx0XHQgKiBzY2VuZS51cGRhdGUodHJ1ZSk7XG5cdFx0ICpcblx0XHQgKiBAZmlyZXMgU2NlbmUudXBkYXRlXG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IFtpbW1lZGlhdGVseT1mYWxzZV0gLSBJZiBgdHJ1ZWAgdGhlIHVwZGF0ZSB3aWxsIGJlIGluc3RhbnQsIGlmIGBmYWxzZWAgaXQgd2lsbCB3YWl0IHVudGlsIG5leHQgdXBkYXRlIGN5Y2xlIChiZXR0ZXIgcGVyZm9ybWFuY2UpLlxuXHRcdCAqIEByZXR1cm5zIHtTY2VuZX0gUGFyZW50IG9iamVjdCBmb3IgY2hhaW5pbmcuXG5cdFx0ICovXG5cdFx0dGhpcy51cGRhdGUgPSBmdW5jdGlvbiAoaW1tZWRpYXRlbHkpIHtcblx0XHRcdGlmIChfY29udHJvbGxlcikge1xuXHRcdFx0XHRpZiAoaW1tZWRpYXRlbHkpIHtcblx0XHRcdFx0XHRpZiAoX2NvbnRyb2xsZXIuZW5hYmxlZCgpICYmIF9lbmFibGVkKSB7XG5cdFx0XHRcdFx0XHR2YXJcblx0XHRcdFx0XHRcdHNjcm9sbFBvcyA9IF9jb250cm9sbGVyLmluZm8oXCJzY3JvbGxQb3NcIiksXG5cdFx0XHRcdFx0XHRcdG5ld1Byb2dyZXNzO1xuXG5cdFx0XHRcdFx0XHRpZiAoX29wdGlvbnMuZHVyYXRpb24gPiAwKSB7XG5cdFx0XHRcdFx0XHRcdG5ld1Byb2dyZXNzID0gKHNjcm9sbFBvcyAtIF9zY3JvbGxPZmZzZXQuc3RhcnQpIC8gKF9zY3JvbGxPZmZzZXQuZW5kIC0gX3Njcm9sbE9mZnNldC5zdGFydCk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRuZXdQcm9ncmVzcyA9IHNjcm9sbFBvcyA+PSBfc2Nyb2xsT2Zmc2V0LnN0YXJ0ID8gMSA6IDA7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFNjZW5lLnRyaWdnZXIoXCJ1cGRhdGVcIiwge1xuXHRcdFx0XHRcdFx0XHRzdGFydFBvczogX3Njcm9sbE9mZnNldC5zdGFydCxcblx0XHRcdFx0XHRcdFx0ZW5kUG9zOiBfc2Nyb2xsT2Zmc2V0LmVuZCxcblx0XHRcdFx0XHRcdFx0c2Nyb2xsUG9zOiBzY3JvbGxQb3Ncblx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRTY2VuZS5wcm9ncmVzcyhuZXdQcm9ncmVzcyk7XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChfcGluICYmIF9zdGF0ZSA9PT0gU0NFTkVfU1RBVEVfRFVSSU5HKSB7XG5cdFx0XHRcdFx0XHR1cGRhdGVQaW5TdGF0ZSh0cnVlKTsgLy8gdW5waW4gaW4gcG9zaXRpb25cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0X2NvbnRyb2xsZXIudXBkYXRlU2NlbmUoU2NlbmUsIGZhbHNlKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIFNjZW5lO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBVcGRhdGVzIGR5bmFtaWMgc2NlbmUgdmFyaWFibGVzIGxpa2UgdGhlIHRyaWdnZXIgZWxlbWVudCBwb3NpdGlvbiBvciB0aGUgZHVyYXRpb24uXG5cdFx0ICogVGhpcyBtZXRob2QgaXMgYXV0b21hdGljYWxseSBjYWxsZWQgaW4gcmVndWxhciBpbnRlcnZhbHMgZnJvbSB0aGUgY29udHJvbGxlci4gU2VlIHtAbGluayBTY3JvbGxNYWdpYy5Db250cm9sbGVyfSBvcHRpb24gYHJlZnJlc2hJbnRlcnZhbGAuXG5cdFx0ICogXG5cdFx0ICogWW91IGNhbiBjYWxsIGl0IHRvIG1pbmltaXplIGxhZywgZm9yIGV4YW1wbGUgd2hlbiB5b3UgaW50ZW50aW9uYWxseSBjaGFuZ2UgdGhlIHBvc2l0aW9uIG9mIHRoZSB0cmlnZ2VyRWxlbWVudC5cblx0XHQgKiBJZiB5b3UgZG9uJ3QgaXQgd2lsbCBzaW1wbHkgYmUgdXBkYXRlZCBpbiB0aGUgbmV4dCByZWZyZXNoIGludGVydmFsIG9mIHRoZSBjb250YWluZXIsIHdoaWNoIGlzIHVzdWFsbHkgc3VmZmljaWVudC5cblx0XHQgKlxuXHRcdCAqIEBtZXRob2QgU2Nyb2xsTWFnaWMuU2NlbmUjcmVmcmVzaFxuXHRcdCAqIEBzaW5jZSAxLjEuMFxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogc2NlbmUgPSBuZXcgU2Nyb2xsTWFnaWMuU2NlbmUoe3RyaWdnZXJFbGVtZW50OiBcIiN0cmlnZ2VyXCJ9KTtcblx0XHQgKiBcblx0XHQgKiAvLyBjaGFuZ2UgdGhlIHBvc2l0aW9uIG9mIHRoZSB0cmlnZ2VyXG5cdFx0ICogJChcIiN0cmlnZ2VyXCIpLmNzcyhcInRvcFwiLCA1MDApO1xuXHRcdCAqIC8vIGltbWVkaWF0ZWx5IGxldCB0aGUgc2NlbmUga25vdyBvZiB0aGlzIGNoYW5nZVxuXHRcdCAqIHNjZW5lLnJlZnJlc2goKTtcblx0XHQgKlxuXHRcdCAqIEBmaXJlcyB7QGxpbmsgU2NlbmUuc2hpZnR9LCBpZiB0aGUgdHJpZ2dlciBlbGVtZW50IHBvc2l0aW9uIG9yIHRoZSBkdXJhdGlvbiBjaGFuZ2VkXG5cdFx0ICogQGZpcmVzIHtAbGluayBTY2VuZS5jaGFuZ2V9LCBpZiB0aGUgZHVyYXRpb24gY2hhbmdlZFxuXHRcdCAqXG5cdFx0ICogQHJldHVybnMge1NjZW5lfSBQYXJlbnQgb2JqZWN0IGZvciBjaGFpbmluZy5cblx0XHQgKi9cblx0XHR0aGlzLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR1cGRhdGVEdXJhdGlvbigpO1xuXHRcdFx0dXBkYXRlVHJpZ2dlckVsZW1lbnRQb3NpdGlvbigpO1xuXHRcdFx0Ly8gdXBkYXRlIHRyaWdnZXIgZWxlbWVudCBwb3NpdGlvblxuXHRcdFx0cmV0dXJuIFNjZW5lO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiAqKkdldCoqIG9yICoqU2V0KiogdGhlIHNjZW5lJ3MgcHJvZ3Jlc3MuICBcblx0XHQgKiBVc3VhbGx5IGl0IHNob3VsZG4ndCBiZSBuZWNlc3NhcnkgdG8gdXNlIHRoaXMgYXMgYSBzZXR0ZXIsIGFzIGl0IGlzIHNldCBhdXRvbWF0aWNhbGx5IGJ5IHNjZW5lLnVwZGF0ZSgpLiAgXG5cdFx0ICogVGhlIG9yZGVyIGluIHdoaWNoIHRoZSBldmVudHMgYXJlIGZpcmVkIGRlcGVuZHMgb24gdGhlIGR1cmF0aW9uIG9mIHRoZSBzY2VuZTpcblx0XHQgKiAgMS4gU2NlbmVzIHdpdGggYGR1cmF0aW9uID09IDBgOiAgXG5cdFx0ICogIFNjZW5lcyB0aGF0IGhhdmUgbm8gZHVyYXRpb24gYnkgZGVmaW5pdGlvbiBoYXZlIG5vIGVuZGluZy4gVGh1cyB0aGUgYGVuZGAgZXZlbnQgd2lsbCBuZXZlciBiZSBmaXJlZC4gIFxuXHRcdCAqICBXaGVuIHRoZSB0cmlnZ2VyIHBvc2l0aW9uIG9mIHRoZSBzY2VuZSBpcyBwYXNzZWQgdGhlIGV2ZW50cyBhcmUgYWx3YXlzIGZpcmVkIGluIHRoaXMgb3JkZXI6ICBcblx0XHQgKiAgYGVudGVyYCwgYHN0YXJ0YCwgYHByb2dyZXNzYCB3aGVuIHNjcm9sbGluZyBmb3J3YXJkICBcblx0XHQgKiAgYW5kICBcblx0XHQgKiAgYHByb2dyZXNzYCwgYHN0YXJ0YCwgYGxlYXZlYCB3aGVuIHNjcm9sbGluZyBpbiByZXZlcnNlXG5cdFx0ICogIDIuIFNjZW5lcyB3aXRoIGBkdXJhdGlvbiA+IDBgOiAgXG5cdFx0ICogIFNjZW5lcyB3aXRoIGEgc2V0IGR1cmF0aW9uIGhhdmUgYSBkZWZpbmVkIHN0YXJ0IGFuZCBlbmQgcG9pbnQuICBcblx0XHQgKiAgV2hlbiBzY3JvbGxpbmcgcGFzdCB0aGUgc3RhcnQgcG9zaXRpb24gb2YgdGhlIHNjZW5lIGl0IHdpbGwgZmlyZSB0aGVzZSBldmVudHMgaW4gdGhpcyBvcmRlcjogIFxuXHRcdCAqICBgZW50ZXJgLCBgc3RhcnRgLCBgcHJvZ3Jlc3NgICBcblx0XHQgKiAgV2hlbiBjb250aW51aW5nIHRvIHNjcm9sbCBhbmQgcGFzc2luZyB0aGUgZW5kIHBvaW50IGl0IHdpbGwgZmlyZSB0aGVzZSBldmVudHM6ICBcblx0XHQgKiAgYHByb2dyZXNzYCwgYGVuZGAsIGBsZWF2ZWAgIFxuXHRcdCAqICBXaGVuIHJldmVyc2luZyB0aHJvdWdoIHRoZSBlbmQgcG9pbnQgdGhlc2UgZXZlbnRzIGFyZSBmaXJlZDogIFxuXHRcdCAqICBgZW50ZXJgLCBgZW5kYCwgYHByb2dyZXNzYCAgXG5cdFx0ICogIEFuZCB3aGVuIGNvbnRpbnVpbmcgdG8gc2Nyb2xsIHBhc3QgdGhlIHN0YXJ0IHBvc2l0aW9uIGluIHJldmVyc2UgaXQgd2lsbCBmaXJlOiAgXG5cdFx0ICogIGBwcm9ncmVzc2AsIGBzdGFydGAsIGBsZWF2ZWAgIFxuXHRcdCAqICBJbiBiZXR3ZWVuIHN0YXJ0IGFuZCBlbmQgdGhlIGBwcm9ncmVzc2AgZXZlbnQgd2lsbCBiZSBjYWxsZWQgY29uc3RhbnRseSwgd2hlbmV2ZXIgdGhlIHByb2dyZXNzIGNoYW5nZXMuXG5cdFx0ICogXG5cdFx0ICogSW4gc2hvcnQ6ICBcblx0XHQgKiBgZW50ZXJgIGV2ZW50cyB3aWxsIGFsd2F5cyB0cmlnZ2VyICoqYmVmb3JlKiogdGhlIHByb2dyZXNzIHVwZGF0ZSBhbmQgYGxlYXZlYCBlbnZlbnRzIHdpbGwgdHJpZ2dlciAqKmFmdGVyKiogdGhlIHByb2dyZXNzIHVwZGF0ZS4gIFxuXHRcdCAqIGBzdGFydGAgYW5kIGBlbmRgIHdpbGwgYWx3YXlzIHRyaWdnZXIgYXQgdGhlaXIgcmVzcGVjdGl2ZSBwb3NpdGlvbi5cblx0XHQgKiBcblx0XHQgKiBQbGVhc2UgcmV2aWV3IHRoZSBldmVudCBkZXNjcmlwdGlvbnMgZm9yIGRldGFpbHMgb24gdGhlIGV2ZW50cyBhbmQgdGhlIGV2ZW50IG9iamVjdCB0aGF0IGlzIHBhc3NlZCB0byB0aGUgY2FsbGJhY2suXG5cdFx0ICogXG5cdFx0ICogQG1ldGhvZCBTY3JvbGxNYWdpYy5TY2VuZSNwcm9ncmVzc1xuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogLy8gZ2V0IHRoZSBjdXJyZW50IHNjZW5lIHByb2dyZXNzXG5cdFx0ICogdmFyIHByb2dyZXNzID0gc2NlbmUucHJvZ3Jlc3MoKTtcblx0XHQgKlxuXHRcdCAqIC8vIHNldCBuZXcgc2NlbmUgcHJvZ3Jlc3Ncblx0XHQgKiBzY2VuZS5wcm9ncmVzcygwLjMpO1xuXHRcdCAqXG5cdFx0ICogQGZpcmVzIHtAbGluayBTY2VuZS5lbnRlcn0sIHdoZW4gdXNlZCBhcyBzZXR0ZXJcblx0XHQgKiBAZmlyZXMge0BsaW5rIFNjZW5lLnN0YXJ0fSwgd2hlbiB1c2VkIGFzIHNldHRlclxuXHRcdCAqIEBmaXJlcyB7QGxpbmsgU2NlbmUucHJvZ3Jlc3N9LCB3aGVuIHVzZWQgYXMgc2V0dGVyXG5cdFx0ICogQGZpcmVzIHtAbGluayBTY2VuZS5lbmR9LCB3aGVuIHVzZWQgYXMgc2V0dGVyXG5cdFx0ICogQGZpcmVzIHtAbGluayBTY2VuZS5sZWF2ZX0sIHdoZW4gdXNlZCBhcyBzZXR0ZXJcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSBbcHJvZ3Jlc3NdIC0gVGhlIG5ldyBwcm9ncmVzcyB2YWx1ZSBvZiB0aGUgc2NlbmUgYFswLTFdYC5cblx0XHQgKiBAcmV0dXJucyB7bnVtYmVyfSBgZ2V0YCAtICBDdXJyZW50IHNjZW5lIHByb2dyZXNzLlxuXHRcdCAqIEByZXR1cm5zIHtTY2VuZX0gYHNldGAgLSAgUGFyZW50IG9iamVjdCBmb3IgY2hhaW5pbmcuXG5cdFx0ICovXG5cdFx0dGhpcy5wcm9ncmVzcyA9IGZ1bmN0aW9uIChwcm9ncmVzcykge1xuXHRcdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7IC8vIGdldFxuXHRcdFx0XHRyZXR1cm4gX3Byb2dyZXNzO1xuXHRcdFx0fSBlbHNlIHsgLy8gc2V0XG5cdFx0XHRcdHZhclxuXHRcdFx0XHRkb1VwZGF0ZSA9IGZhbHNlLFxuXHRcdFx0XHRcdG9sZFN0YXRlID0gX3N0YXRlLFxuXHRcdFx0XHRcdHNjcm9sbERpcmVjdGlvbiA9IF9jb250cm9sbGVyID8gX2NvbnRyb2xsZXIuaW5mbyhcInNjcm9sbERpcmVjdGlvblwiKSA6ICdQQVVTRUQnLFxuXHRcdFx0XHRcdHJldmVyc2VPckZvcndhcmQgPSBfb3B0aW9ucy5yZXZlcnNlIHx8IHByb2dyZXNzID49IF9wcm9ncmVzcztcblx0XHRcdFx0aWYgKF9vcHRpb25zLmR1cmF0aW9uID09PSAwKSB7XG5cdFx0XHRcdFx0Ly8gemVybyBkdXJhdGlvbiBzY2VuZXNcblx0XHRcdFx0XHRkb1VwZGF0ZSA9IF9wcm9ncmVzcyAhPSBwcm9ncmVzcztcblx0XHRcdFx0XHRfcHJvZ3Jlc3MgPSBwcm9ncmVzcyA8IDEgJiYgcmV2ZXJzZU9yRm9yd2FyZCA/IDAgOiAxO1xuXHRcdFx0XHRcdF9zdGF0ZSA9IF9wcm9ncmVzcyA9PT0gMCA/IFNDRU5FX1NUQVRFX0JFRk9SRSA6IFNDRU5FX1NUQVRFX0RVUklORztcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBzY2VuZXMgd2l0aCBzdGFydCBhbmQgZW5kXG5cdFx0XHRcdFx0aWYgKHByb2dyZXNzIDwgMCAmJiBfc3RhdGUgIT09IFNDRU5FX1NUQVRFX0JFRk9SRSAmJiByZXZlcnNlT3JGb3J3YXJkKSB7XG5cdFx0XHRcdFx0XHQvLyBnbyBiYWNrIHRvIGluaXRpYWwgc3RhdGVcblx0XHRcdFx0XHRcdF9wcm9ncmVzcyA9IDA7XG5cdFx0XHRcdFx0XHRfc3RhdGUgPSBTQ0VORV9TVEFURV9CRUZPUkU7XG5cdFx0XHRcdFx0XHRkb1VwZGF0ZSA9IHRydWU7XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChwcm9ncmVzcyA+PSAwICYmIHByb2dyZXNzIDwgMSAmJiByZXZlcnNlT3JGb3J3YXJkKSB7XG5cdFx0XHRcdFx0XHRfcHJvZ3Jlc3MgPSBwcm9ncmVzcztcblx0XHRcdFx0XHRcdF9zdGF0ZSA9IFNDRU5FX1NUQVRFX0RVUklORztcblx0XHRcdFx0XHRcdGRvVXBkYXRlID0gdHJ1ZTtcblx0XHRcdFx0XHR9IGVsc2UgaWYgKHByb2dyZXNzID49IDEgJiYgX3N0YXRlICE9PSBTQ0VORV9TVEFURV9BRlRFUikge1xuXHRcdFx0XHRcdFx0X3Byb2dyZXNzID0gMTtcblx0XHRcdFx0XHRcdF9zdGF0ZSA9IFNDRU5FX1NUQVRFX0FGVEVSO1xuXHRcdFx0XHRcdFx0ZG9VcGRhdGUgPSB0cnVlO1xuXHRcdFx0XHRcdH0gZWxzZSBpZiAoX3N0YXRlID09PSBTQ0VORV9TVEFURV9EVVJJTkcgJiYgIXJldmVyc2VPckZvcndhcmQpIHtcblx0XHRcdFx0XHRcdHVwZGF0ZVBpblN0YXRlKCk7IC8vIGluIGNhc2Ugd2Ugc2Nyb2xsZWQgYmFja3dhcmRzIG1pZC1zY2VuZSBhbmQgcmV2ZXJzZSBpcyBkaXNhYmxlZCA9PiB1cGRhdGUgdGhlIHBpbiBwb3NpdGlvbiwgc28gaXQgZG9lc24ndCBtb3ZlIGJhY2sgYXMgd2VsbC5cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGRvVXBkYXRlKSB7XG5cdFx0XHRcdFx0Ly8gZmlyZSBldmVudHNcblx0XHRcdFx0XHR2YXJcblx0XHRcdFx0XHRldmVudFZhcnMgPSB7XG5cdFx0XHRcdFx0XHRwcm9ncmVzczogX3Byb2dyZXNzLFxuXHRcdFx0XHRcdFx0c3RhdGU6IF9zdGF0ZSxcblx0XHRcdFx0XHRcdHNjcm9sbERpcmVjdGlvbjogc2Nyb2xsRGlyZWN0aW9uXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdHN0YXRlQ2hhbmdlZCA9IF9zdGF0ZSAhPSBvbGRTdGF0ZTtcblxuXHRcdFx0XHRcdHZhciB0cmlnZ2VyID0gZnVuY3Rpb24gKGV2ZW50TmFtZSkgeyAvLyB0bXAgaGVscGVyIHRvIHNpbXBsaWZ5IGNvZGVcblx0XHRcdFx0XHRcdFNjZW5lLnRyaWdnZXIoZXZlbnROYW1lLCBldmVudFZhcnMpO1xuXHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRpZiAoc3RhdGVDaGFuZ2VkKSB7IC8vIGVudGVyIGV2ZW50c1xuXHRcdFx0XHRcdFx0aWYgKG9sZFN0YXRlICE9PSBTQ0VORV9TVEFURV9EVVJJTkcpIHtcblx0XHRcdFx0XHRcdFx0dHJpZ2dlcihcImVudGVyXCIpO1xuXHRcdFx0XHRcdFx0XHR0cmlnZ2VyKG9sZFN0YXRlID09PSBTQ0VORV9TVEFURV9CRUZPUkUgPyBcInN0YXJ0XCIgOiBcImVuZFwiKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dHJpZ2dlcihcInByb2dyZXNzXCIpO1xuXHRcdFx0XHRcdGlmIChzdGF0ZUNoYW5nZWQpIHsgLy8gbGVhdmUgZXZlbnRzXG5cdFx0XHRcdFx0XHRpZiAoX3N0YXRlICE9PSBTQ0VORV9TVEFURV9EVVJJTkcpIHtcblx0XHRcdFx0XHRcdFx0dHJpZ2dlcihfc3RhdGUgPT09IFNDRU5FX1NUQVRFX0JFRk9SRSA/IFwic3RhcnRcIiA6IFwiZW5kXCIpO1xuXHRcdFx0XHRcdFx0XHR0cmlnZ2VyKFwibGVhdmVcIik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIFNjZW5lO1xuXHRcdFx0fVxuXHRcdH07XG5cblxuXHRcdC8qKlxuXHRcdCAqIFVwZGF0ZSB0aGUgc3RhcnQgYW5kIGVuZCBzY3JvbGxPZmZzZXQgb2YgdGhlIGNvbnRhaW5lci5cblx0XHQgKiBUaGUgcG9zaXRpb25zIHJlZmxlY3Qgd2hhdCB0aGUgY29udHJvbGxlcidzIHNjcm9sbCBwb3NpdGlvbiB3aWxsIGJlIGF0IHRoZSBzdGFydCBhbmQgZW5kIHJlc3BlY3RpdmVseS5cblx0XHQgKiBJcyBjYWxsZWQsIHdoZW46XG5cdFx0ICogICAtIFNjZW5lIGV2ZW50IFwiY2hhbmdlXCIgaXMgY2FsbGVkIHdpdGg6IG9mZnNldCwgdHJpZ2dlckhvb2ssIGR1cmF0aW9uIFxuXHRcdCAqICAgLSBzY3JvbGwgY29udGFpbmVyIGV2ZW50IFwicmVzaXplXCIgaXMgY2FsbGVkXG5cdFx0ICogICAtIHRoZSBwb3NpdGlvbiBvZiB0aGUgdHJpZ2dlckVsZW1lbnQgY2hhbmdlc1xuXHRcdCAqICAgLSB0aGUgY29udHJvbGxlciBjaGFuZ2VzIC0+IGFkZFRvKClcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciB1cGRhdGVTY3JvbGxPZmZzZXQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRfc2Nyb2xsT2Zmc2V0ID0ge1xuXHRcdFx0XHRzdGFydDogX3RyaWdnZXJQb3MgKyBfb3B0aW9ucy5vZmZzZXRcblx0XHRcdH07XG5cdFx0XHRpZiAoX2NvbnRyb2xsZXIgJiYgX29wdGlvbnMudHJpZ2dlckVsZW1lbnQpIHtcblx0XHRcdFx0Ly8gdGFrZSBhd2F5IHRyaWdnZXJIb29rIHBvcnRpb24gdG8gZ2V0IHJlbGF0aXZlIHRvIHRvcFxuXHRcdFx0XHRfc2Nyb2xsT2Zmc2V0LnN0YXJ0IC09IF9jb250cm9sbGVyLmluZm8oXCJzaXplXCIpICogX29wdGlvbnMudHJpZ2dlckhvb2s7XG5cdFx0XHR9XG5cdFx0XHRfc2Nyb2xsT2Zmc2V0LmVuZCA9IF9zY3JvbGxPZmZzZXQuc3RhcnQgKyBfb3B0aW9ucy5kdXJhdGlvbjtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogVXBkYXRlcyB0aGUgZHVyYXRpb24gaWYgc2V0IHRvIGEgZHluYW1pYyBmdW5jdGlvbi5cblx0XHQgKiBUaGlzIG1ldGhvZCBpcyBjYWxsZWQgd2hlbiB0aGUgc2NlbmUgaXMgYWRkZWQgdG8gYSBjb250cm9sbGVyIGFuZCBpbiByZWd1bGFyIGludGVydmFscyBmcm9tIHRoZSBjb250cm9sbGVyIHRocm91Z2ggc2NlbmUucmVmcmVzaCgpLlxuXHRcdCAqIFxuXHRcdCAqIEBmaXJlcyB7QGxpbmsgU2NlbmUuY2hhbmdlfSwgaWYgdGhlIGR1cmF0aW9uIGNoYW5nZWRcblx0XHQgKiBAZmlyZXMge0BsaW5rIFNjZW5lLnNoaWZ0fSwgaWYgdGhlIGR1cmF0aW9uIGNoYW5nZWRcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gW3N1cHByZXNzRXZlbnRzPWZhbHNlXSAtIElmIHRydWUgdGhlIHNoaWZ0IGV2ZW50IHdpbGwgYmUgc3VwcHJlc3NlZC5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciB1cGRhdGVEdXJhdGlvbiA9IGZ1bmN0aW9uIChzdXBwcmVzc0V2ZW50cykge1xuXHRcdFx0Ly8gdXBkYXRlIGR1cmF0aW9uXG5cdFx0XHRpZiAoX2R1cmF0aW9uVXBkYXRlTWV0aG9kKSB7XG5cdFx0XHRcdHZhciB2YXJuYW1lID0gXCJkdXJhdGlvblwiO1xuXHRcdFx0XHRpZiAoY2hhbmdlT3B0aW9uKHZhcm5hbWUsIF9kdXJhdGlvblVwZGF0ZU1ldGhvZC5jYWxsKFNjZW5lKSkgJiYgIXN1cHByZXNzRXZlbnRzKSB7IC8vIHNldFxuXHRcdFx0XHRcdFNjZW5lLnRyaWdnZXIoXCJjaGFuZ2VcIiwge1xuXHRcdFx0XHRcdFx0d2hhdDogdmFybmFtZSxcblx0XHRcdFx0XHRcdG5ld3ZhbDogX29wdGlvbnNbdmFybmFtZV1cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRTY2VuZS50cmlnZ2VyKFwic2hpZnRcIiwge1xuXHRcdFx0XHRcdFx0cmVhc29uOiB2YXJuYW1lXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogVXBkYXRlcyB0aGUgcG9zaXRpb24gb2YgdGhlIHRyaWdnZXJFbGVtZW50LCBpZiBwcmVzZW50LlxuXHRcdCAqIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCAuLi5cblx0XHQgKiAgLSAuLi4gd2hlbiB0aGUgdHJpZ2dlckVsZW1lbnQgaXMgY2hhbmdlZFxuXHRcdCAqICAtIC4uLiB3aGVuIHRoZSBzY2VuZSBpcyBhZGRlZCB0byBhIChuZXcpIGNvbnRyb2xsZXJcblx0XHQgKiAgLSAuLi4gaW4gcmVndWxhciBpbnRlcnZhbHMgZnJvbSB0aGUgY29udHJvbGxlciB0aHJvdWdoIHNjZW5lLnJlZnJlc2goKS5cblx0XHQgKiBcblx0XHQgKiBAZmlyZXMge0BsaW5rIFNjZW5lLnNoaWZ0fSwgaWYgdGhlIHBvc2l0aW9uIGNoYW5nZWRcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gW3N1cHByZXNzRXZlbnRzPWZhbHNlXSAtIElmIHRydWUgdGhlIHNoaWZ0IGV2ZW50IHdpbGwgYmUgc3VwcHJlc3NlZC5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciB1cGRhdGVUcmlnZ2VyRWxlbWVudFBvc2l0aW9uID0gZnVuY3Rpb24gKHN1cHByZXNzRXZlbnRzKSB7XG5cdFx0XHR2YXJcblx0XHRcdGVsZW1lbnRQb3MgPSAwLFxuXHRcdFx0XHR0ZWxlbSA9IF9vcHRpb25zLnRyaWdnZXJFbGVtZW50O1xuXHRcdFx0aWYgKF9jb250cm9sbGVyICYmICh0ZWxlbSB8fCBfdHJpZ2dlclBvcyA+IDApKSB7IC8vIGVpdGhlciBhbiBlbGVtZW50IGV4aXN0cyBvciB3YXMgcmVtb3ZlZCBhbmQgdGhlIHRyaWdnZXJQb3MgaXMgc3RpbGwgPiAwXG5cdFx0XHRcdGlmICh0ZWxlbSkgeyAvLyB0aGVyZSBjdXJyZW50bHkgYSB0cmlnZ2VyRWxlbWVudCBzZXRcblx0XHRcdFx0XHRpZiAodGVsZW0ucGFyZW50Tm9kZSkgeyAvLyBjaGVjayBpZiBlbGVtZW50IGlzIHN0aWxsIGF0dGFjaGVkIHRvIERPTVxuXHRcdFx0XHRcdFx0dmFyXG5cdFx0XHRcdFx0XHRjb250cm9sbGVySW5mbyA9IF9jb250cm9sbGVyLmluZm8oKSxcblx0XHRcdFx0XHRcdFx0Y29udGFpbmVyT2Zmc2V0ID0gX3V0aWwuZ2V0Lm9mZnNldChjb250cm9sbGVySW5mby5jb250YWluZXIpLFxuXHRcdFx0XHRcdFx0XHQvLyBjb250YWluZXIgcG9zaXRpb24gaXMgbmVlZGVkIGJlY2F1c2UgZWxlbWVudCBvZmZzZXQgaXMgcmV0dXJuZWQgaW4gcmVsYXRpb24gdG8gZG9jdW1lbnQsIG5vdCBpbiByZWxhdGlvbiB0byBjb250YWluZXIuXG5cdFx0XHRcdFx0XHRcdHBhcmFtID0gY29udHJvbGxlckluZm8udmVydGljYWwgPyBcInRvcFwiIDogXCJsZWZ0XCI7IC8vIHdoaWNoIHBhcmFtIGlzIG9mIGludGVyZXN0ID9cblx0XHRcdFx0XHRcdC8vIGlmIHBhcmVudCBpcyBzcGFjZXIsIHVzZSBzcGFjZXIgcG9zaXRpb24gaW5zdGVhZCBzbyBjb3JyZWN0IHN0YXJ0IHBvc2l0aW9uIGlzIHJldHVybmVkIGZvciBwaW5uZWQgZWxlbWVudHMuXG5cdFx0XHRcdFx0XHR3aGlsZSAodGVsZW0ucGFyZW50Tm9kZS5oYXNBdHRyaWJ1dGUoUElOX1NQQUNFUl9BVFRSSUJVVEUpKSB7XG5cdFx0XHRcdFx0XHRcdHRlbGVtID0gdGVsZW0ucGFyZW50Tm9kZTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0dmFyIGVsZW1lbnRPZmZzZXQgPSBfdXRpbC5nZXQub2Zmc2V0KHRlbGVtKTtcblxuXHRcdFx0XHRcdFx0aWYgKCFjb250cm9sbGVySW5mby5pc0RvY3VtZW50KSB7IC8vIGNvbnRhaW5lciBpcyBub3QgdGhlIGRvY3VtZW50IHJvb3QsIHNvIHN1YnN0cmFjdCBzY3JvbGwgUG9zaXRpb24gdG8gZ2V0IGNvcnJlY3QgdHJpZ2dlciBlbGVtZW50IHBvc2l0aW9uIHJlbGF0aXZlIHRvIHNjcm9sbGNvbnRlbnRcblx0XHRcdFx0XHRcdFx0Y29udGFpbmVyT2Zmc2V0W3BhcmFtXSAtPSBfY29udHJvbGxlci5zY3JvbGxQb3MoKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0ZWxlbWVudFBvcyA9IGVsZW1lbnRPZmZzZXRbcGFyYW1dIC0gY29udGFpbmVyT2Zmc2V0W3BhcmFtXTtcblxuXHRcdFx0XHRcdH0gZWxzZSB7IC8vIHRoZXJlIHdhcyBhbiBlbGVtZW50LCBidXQgaXQgd2FzIHJlbW92ZWQgZnJvbSBET01cblx0XHRcdFx0XHRcdGxvZygyLCBcIldBUk5JTkc6IHRyaWdnZXJFbGVtZW50IHdhcyByZW1vdmVkIGZyb20gRE9NIGFuZCB3aWxsIGJlIHJlc2V0IHRvXCIsIHVuZGVmaW5lZCk7XG5cdFx0XHRcdFx0XHRTY2VuZS50cmlnZ2VyRWxlbWVudCh1bmRlZmluZWQpOyAvLyB1bnNldCwgc28gYSBjaGFuZ2UgZXZlbnQgaXMgdHJpZ2dlcmVkXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGNoYW5nZWQgPSBlbGVtZW50UG9zICE9IF90cmlnZ2VyUG9zO1xuXHRcdFx0XHRfdHJpZ2dlclBvcyA9IGVsZW1lbnRQb3M7XG5cdFx0XHRcdGlmIChjaGFuZ2VkICYmICFzdXBwcmVzc0V2ZW50cykge1xuXHRcdFx0XHRcdFNjZW5lLnRyaWdnZXIoXCJzaGlmdFwiLCB7XG5cdFx0XHRcdFx0XHRyZWFzb246IFwidHJpZ2dlckVsZW1lbnRQb3NpdGlvblwiXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogVHJpZ2dlciBhIHNoaWZ0IGV2ZW50LCB3aGVuIHRoZSBjb250YWluZXIgaXMgcmVzaXplZCBhbmQgdGhlIHRyaWdnZXJIb29rIGlzID4gMS5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBvbkNvbnRhaW5lclJlc2l6ZSA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRpZiAoX29wdGlvbnMudHJpZ2dlckhvb2sgPiAwKSB7XG5cdFx0XHRcdFNjZW5lLnRyaWdnZXIoXCJzaGlmdFwiLCB7XG5cdFx0XHRcdFx0cmVhc29uOiBcImNvbnRhaW5lclJlc2l6ZVwiXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH07XG5cblxuXHRcdHZhciBfdmFsaWRhdGUgPSBfdXRpbC5leHRlbmQoU0NFTkVfT1BUSU9OUy52YWxpZGF0ZSwge1xuXHRcdFx0Ly8gdmFsaWRhdGlvbiBmb3IgZHVyYXRpb24gaGFuZGxlZCBpbnRlcm5hbGx5IGZvciByZWZlcmVuY2UgdG8gcHJpdmF0ZSB2YXIgX2R1cmF0aW9uTWV0aG9kXG5cdFx0XHRkdXJhdGlvbjogZnVuY3Rpb24gKHZhbCkge1xuXHRcdFx0XHRpZiAoX3V0aWwudHlwZS5TdHJpbmcodmFsKSAmJiB2YWwubWF0Y2goL14oXFwufFxcZCkqXFxkKyUkLykpIHtcblx0XHRcdFx0XHQvLyBwZXJjZW50YWdlIHZhbHVlXG5cdFx0XHRcdFx0dmFyIHBlcmMgPSBwYXJzZUZsb2F0KHZhbCkgLyAxMDA7XG5cdFx0XHRcdFx0dmFsID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIF9jb250cm9sbGVyID8gX2NvbnRyb2xsZXIuaW5mbyhcInNpemVcIikgKiBwZXJjIDogMDtcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChfdXRpbC50eXBlLkZ1bmN0aW9uKHZhbCkpIHtcblx0XHRcdFx0XHQvLyBmdW5jdGlvblxuXHRcdFx0XHRcdF9kdXJhdGlvblVwZGF0ZU1ldGhvZCA9IHZhbDtcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0dmFsID0gcGFyc2VGbG9hdChfZHVyYXRpb25VcGRhdGVNZXRob2QoKSk7XG5cdFx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdFx0dmFsID0gLTE7IC8vIHdpbGwgY2F1c2UgZXJyb3IgYmVsb3dcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gdmFsIGhhcyB0byBiZSBmbG9hdFxuXHRcdFx0XHR2YWwgPSBwYXJzZUZsb2F0KHZhbCk7XG5cdFx0XHRcdGlmICghX3V0aWwudHlwZS5OdW1iZXIodmFsKSB8fCB2YWwgPCAwKSB7XG5cdFx0XHRcdFx0aWYgKF9kdXJhdGlvblVwZGF0ZU1ldGhvZCkge1xuXHRcdFx0XHRcdFx0X2R1cmF0aW9uVXBkYXRlTWV0aG9kID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdFx0dGhyb3cgW1wiSW52YWxpZCByZXR1cm4gdmFsdWUgb2Ygc3VwcGxpZWQgZnVuY3Rpb24gZm9yIG9wdGlvbiBcXFwiZHVyYXRpb25cXFwiOlwiLCB2YWxdO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR0aHJvdyBbXCJJbnZhbGlkIHZhbHVlIGZvciBvcHRpb24gXFxcImR1cmF0aW9uXFxcIjpcIiwgdmFsXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHZhbDtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8qKlxuXHRcdCAqIENoZWNrcyB0aGUgdmFsaWRpdHkgb2YgYSBzcGVjaWZpYyBvciBhbGwgb3B0aW9ucyBhbmQgcmVzZXQgdG8gZGVmYXVsdCBpZiBuZWNjZXNzYXJ5LlxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dmFyIHZhbGlkYXRlT3B0aW9uID0gZnVuY3Rpb24gKGNoZWNrKSB7XG5cdFx0XHRjaGVjayA9IGFyZ3VtZW50cy5sZW5ndGggPyBbY2hlY2tdIDogT2JqZWN0LmtleXMoX3ZhbGlkYXRlKTtcblx0XHRcdGNoZWNrLmZvckVhY2goZnVuY3Rpb24gKG9wdGlvbk5hbWUsIGtleSkge1xuXHRcdFx0XHR2YXIgdmFsdWU7XG5cdFx0XHRcdGlmIChfdmFsaWRhdGVbb3B0aW9uTmFtZV0pIHsgLy8gdGhlcmUgaXMgYSB2YWxpZGF0aW9uIG1ldGhvZCBmb3IgdGhpcyBvcHRpb25cblx0XHRcdFx0XHR0cnkgeyAvLyB2YWxpZGF0ZSB2YWx1ZVxuXHRcdFx0XHRcdFx0dmFsdWUgPSBfdmFsaWRhdGVbb3B0aW9uTmFtZV0oX29wdGlvbnNbb3B0aW9uTmFtZV0pO1xuXHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHsgLy8gdmFsaWRhdGlvbiBmYWlsZWQgLT4gcmVzZXQgdG8gZGVmYXVsdFxuXHRcdFx0XHRcdFx0dmFsdWUgPSBERUZBVUxUX09QVElPTlNbb3B0aW9uTmFtZV07XG5cdFx0XHRcdFx0XHR2YXIgbG9nTVNHID0gX3V0aWwudHlwZS5TdHJpbmcoZSkgPyBbZV0gOiBlO1xuXHRcdFx0XHRcdFx0aWYgKF91dGlsLnR5cGUuQXJyYXkobG9nTVNHKSkge1xuXHRcdFx0XHRcdFx0XHRsb2dNU0dbMF0gPSBcIkVSUk9SOiBcIiArIGxvZ01TR1swXTtcblx0XHRcdFx0XHRcdFx0bG9nTVNHLnVuc2hpZnQoMSk7IC8vIGxvZ2xldmVsIDEgZm9yIGVycm9yIG1zZ1xuXHRcdFx0XHRcdFx0XHRsb2cuYXBwbHkodGhpcywgbG9nTVNHKTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGxvZygxLCBcIkVSUk9SOiBQcm9ibGVtIGV4ZWN1dGluZyB2YWxpZGF0aW9uIGNhbGxiYWNrIGZvciBvcHRpb24gJ1wiICsgb3B0aW9uTmFtZSArIFwiJzpcIiwgZS5tZXNzYWdlKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGZpbmFsbHkge1xuXHRcdFx0XHRcdFx0X29wdGlvbnNbb3B0aW9uTmFtZV0gPSB2YWx1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBIZWxwZXIgdXNlZCBieSB0aGUgc2V0dGVyL2dldHRlcnMgZm9yIHNjZW5lIG9wdGlvbnNcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBjaGFuZ2VPcHRpb24gPSBmdW5jdGlvbiAodmFybmFtZSwgbmV3dmFsKSB7XG5cdFx0XHR2YXJcblx0XHRcdGNoYW5nZWQgPSBmYWxzZSxcblx0XHRcdFx0b2xkdmFsID0gX29wdGlvbnNbdmFybmFtZV07XG5cdFx0XHRpZiAoX29wdGlvbnNbdmFybmFtZV0gIT0gbmV3dmFsKSB7XG5cdFx0XHRcdF9vcHRpb25zW3Zhcm5hbWVdID0gbmV3dmFsO1xuXHRcdFx0XHR2YWxpZGF0ZU9wdGlvbih2YXJuYW1lKTsgLy8gcmVzZXRzIHRvIGRlZmF1bHQgaWYgbmVjZXNzYXJ5XG5cdFx0XHRcdGNoYW5nZWQgPSBvbGR2YWwgIT0gX29wdGlvbnNbdmFybmFtZV07XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gY2hhbmdlZDtcblx0XHR9O1xuXG5cdFx0Ly8gZ2VuZXJhdGUgZ2V0dGVycy9zZXR0ZXJzIGZvciBhbGwgb3B0aW9uc1xuXHRcdHZhciBhZGRTY2VuZU9wdGlvbiA9IGZ1bmN0aW9uIChvcHRpb25OYW1lKSB7XG5cdFx0XHRpZiAoIVNjZW5lW29wdGlvbk5hbWVdKSB7XG5cdFx0XHRcdFNjZW5lW29wdGlvbk5hbWVdID0gZnVuY3Rpb24gKG5ld1ZhbCkge1xuXHRcdFx0XHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgeyAvLyBnZXRcblx0XHRcdFx0XHRcdHJldHVybiBfb3B0aW9uc1tvcHRpb25OYW1lXTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0aWYgKG9wdGlvbk5hbWUgPT09IFwiZHVyYXRpb25cIikgeyAvLyBuZXcgZHVyYXRpb24gaXMgc2V0LCBzbyBhbnkgcHJldmlvdXNseSBzZXQgZnVuY3Rpb24gbXVzdCBiZSB1bnNldFxuXHRcdFx0XHRcdFx0XHRfZHVyYXRpb25VcGRhdGVNZXRob2QgPSB1bmRlZmluZWQ7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpZiAoY2hhbmdlT3B0aW9uKG9wdGlvbk5hbWUsIG5ld1ZhbCkpIHsgLy8gc2V0XG5cdFx0XHRcdFx0XHRcdFNjZW5lLnRyaWdnZXIoXCJjaGFuZ2VcIiwge1xuXHRcdFx0XHRcdFx0XHRcdHdoYXQ6IG9wdGlvbk5hbWUsXG5cdFx0XHRcdFx0XHRcdFx0bmV3dmFsOiBfb3B0aW9uc1tvcHRpb25OYW1lXVxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0aWYgKFNDRU5FX09QVElPTlMuc2hpZnRzLmluZGV4T2Yob3B0aW9uTmFtZSkgPiAtMSkge1xuXHRcdFx0XHRcdFx0XHRcdFNjZW5lLnRyaWdnZXIoXCJzaGlmdFwiLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRyZWFzb246IG9wdGlvbk5hbWVcblx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gU2NlbmU7XG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqICoqR2V0Kiogb3IgKipTZXQqKiB0aGUgZHVyYXRpb24gb3B0aW9uIHZhbHVlLlxuXHRcdCAqIEFzIGEgc2V0dGVyIGl0IGFsc28gYWNjZXB0cyBhIGZ1bmN0aW9uIHJldHVybmluZyBhIG51bWVyaWMgdmFsdWUuICBcblx0XHQgKiBUaGlzIGlzIHBhcnRpY3VsYXJseSB1c2VmdWwgZm9yIHJlc3BvbnNpdmUgc2V0dXBzLlxuXHRcdCAqXG5cdFx0ICogVGhlIGR1cmF0aW9uIGlzIHVwZGF0ZWQgdXNpbmcgdGhlIHN1cHBsaWVkIGZ1bmN0aW9uIGV2ZXJ5IHRpbWUgYFNjZW5lLnJlZnJlc2goKWAgaXMgY2FsbGVkLCB3aGljaCBoYXBwZW5zIHBlcmlvZGljYWxseSBmcm9tIHRoZSBjb250cm9sbGVyIChzZWUgU2Nyb2xsTWFnaWMuQ29udHJvbGxlciBvcHRpb24gYHJlZnJlc2hJbnRlcnZhbGApLiAgXG5cdFx0ICogXyoqTk9URToqKiBCZSBhd2FyZSB0aGF0IGl0J3MgYW4gZWFzeSB3YXkgdG8ga2lsbCBwZXJmb3JtYW5jZSwgaWYgeW91IHN1cHBseSBhIGZ1bmN0aW9uIHRoYXQgaGFzIGhpZ2ggQ1BVIGRlbWFuZC4gIFxuXHRcdCAqIEV2ZW4gZm9yIHNpemUgYW5kIHBvc2l0aW9uIGNhbGN1bGF0aW9ucyBpdCBpcyByZWNvbW1lbmRlZCB0byB1c2UgYSB2YXJpYWJsZSB0byBjYWNoZSB0aGUgdmFsdWUuIChzZWUgZXhhbXBsZSkgIFxuXHRcdCAqIFRoaXMgY291bnRzIGRvdWJsZSBpZiB5b3UgdXNlIHRoZSBzYW1lIGZ1bmN0aW9uIGZvciBtdWx0aXBsZSBzY2VuZXMuX1xuXHRcdCAqXG5cdFx0ICogQG1ldGhvZCBTY3JvbGxNYWdpYy5TY2VuZSNkdXJhdGlvblxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogLy8gZ2V0IHRoZSBjdXJyZW50IGR1cmF0aW9uIHZhbHVlXG5cdFx0ICogdmFyIGR1cmF0aW9uID0gc2NlbmUuZHVyYXRpb24oKTtcblx0XHQgKlxuXHRcdCAqIC8vIHNldCBhIG5ldyBkdXJhdGlvblxuXHRcdCAqIHNjZW5lLmR1cmF0aW9uKDMwMCk7XG5cdFx0ICpcblx0XHQgKiAvLyB1c2UgYSBmdW5jdGlvbiB0byBhdXRvbWF0aWNhbGx5IGFkanVzdCB0aGUgZHVyYXRpb24gdG8gdGhlIHdpbmRvdyBoZWlnaHQuXG5cdFx0ICogdmFyIGR1cmF0aW9uVmFsdWVDYWNoZTtcblx0XHQgKiBmdW5jdGlvbiBnZXREdXJhdGlvbiAoKSB7XG5cdFx0ICogICByZXR1cm4gZHVyYXRpb25WYWx1ZUNhY2hlO1xuXHRcdCAqIH1cblx0XHQgKiBmdW5jdGlvbiB1cGRhdGVEdXJhdGlvbiAoZSkge1xuXHRcdCAqICAgZHVyYXRpb25WYWx1ZUNhY2hlID0gd2luZG93LmlubmVySGVpZ2h0O1xuXHRcdCAqIH1cblx0XHQgKiAkKHdpbmRvdykub24oXCJyZXNpemVcIiwgdXBkYXRlRHVyYXRpb24pOyAvLyB1cGRhdGUgdGhlIGR1cmF0aW9uIHdoZW4gdGhlIHdpbmRvdyBzaXplIGNoYW5nZXNcblx0XHQgKiAkKHdpbmRvdykudHJpZ2dlckhhbmRsZXIoXCJyZXNpemVcIik7IC8vIHNldCB0byBpbml0aWFsIHZhbHVlXG5cdFx0ICogc2NlbmUuZHVyYXRpb24oZ2V0RHVyYXRpb24pOyAvLyBzdXBwbHkgZHVyYXRpb24gbWV0aG9kXG5cdFx0ICpcblx0XHQgKiBAZmlyZXMge0BsaW5rIFNjZW5lLmNoYW5nZX0sIHdoZW4gdXNlZCBhcyBzZXR0ZXJcblx0XHQgKiBAZmlyZXMge0BsaW5rIFNjZW5lLnNoaWZ0fSwgd2hlbiB1c2VkIGFzIHNldHRlclxuXHRcdCAqIEBwYXJhbSB7KG51bWJlcnxmdW5jdGlvbil9IFtuZXdEdXJhdGlvbl0gLSBUaGUgbmV3IGR1cmF0aW9uIG9mIHRoZSBzY2VuZS5cblx0XHQgKiBAcmV0dXJucyB7bnVtYmVyfSBgZ2V0YCAtICBDdXJyZW50IHNjZW5lIGR1cmF0aW9uLlxuXHRcdCAqIEByZXR1cm5zIHtTY2VuZX0gYHNldGAgLSAgUGFyZW50IG9iamVjdCBmb3IgY2hhaW5pbmcuXG5cdFx0ICovXG5cblx0XHQvKipcblx0XHQgKiAqKkdldCoqIG9yICoqU2V0KiogdGhlIG9mZnNldCBvcHRpb24gdmFsdWUuXG5cdFx0ICogQG1ldGhvZCBTY3JvbGxNYWdpYy5TY2VuZSNvZmZzZXRcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIGdldCB0aGUgY3VycmVudCBvZmZzZXRcblx0XHQgKiB2YXIgb2Zmc2V0ID0gc2NlbmUub2Zmc2V0KCk7XG5cdFx0ICpcblx0XHQgKiAvLyBzZXQgYSBuZXcgb2Zmc2V0XG5cdFx0ICogc2NlbmUub2Zmc2V0KDEwMCk7XG5cdFx0ICpcblx0XHQgKiBAZmlyZXMge0BsaW5rIFNjZW5lLmNoYW5nZX0sIHdoZW4gdXNlZCBhcyBzZXR0ZXJcblx0XHQgKiBAZmlyZXMge0BsaW5rIFNjZW5lLnNoaWZ0fSwgd2hlbiB1c2VkIGFzIHNldHRlclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSBbbmV3T2Zmc2V0XSAtIFRoZSBuZXcgb2Zmc2V0IG9mIHRoZSBzY2VuZS5cblx0XHQgKiBAcmV0dXJucyB7bnVtYmVyfSBgZ2V0YCAtICBDdXJyZW50IHNjZW5lIG9mZnNldC5cblx0XHQgKiBAcmV0dXJucyB7U2NlbmV9IGBzZXRgIC0gIFBhcmVudCBvYmplY3QgZm9yIGNoYWluaW5nLlxuXHRcdCAqL1xuXG5cdFx0LyoqXG5cdFx0ICogKipHZXQqKiBvciAqKlNldCoqIHRoZSB0cmlnZ2VyRWxlbWVudCBvcHRpb24gdmFsdWUuXG5cdFx0ICogRG9lcyAqKm5vdCoqIGZpcmUgYFNjZW5lLnNoaWZ0YCwgYmVjYXVzZSBjaGFuZ2luZyB0aGUgdHJpZ2dlciBFbGVtZW50IGRvZXNuJ3QgbmVjZXNzYXJpbHkgbWVhbiB0aGUgc3RhcnQgcG9zaXRpb24gY2hhbmdlcy4gVGhpcyB3aWxsIGJlIGRldGVybWluZWQgaW4gYFNjZW5lLnJlZnJlc2goKWAsIHdoaWNoIGlzIGF1dG9tYXRpY2FsbHkgdHJpZ2dlcmVkLlxuXHRcdCAqIEBtZXRob2QgU2Nyb2xsTWFnaWMuU2NlbmUjdHJpZ2dlckVsZW1lbnRcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIGdldCB0aGUgY3VycmVudCB0cmlnZ2VyRWxlbWVudFxuXHRcdCAqIHZhciB0cmlnZ2VyRWxlbWVudCA9IHNjZW5lLnRyaWdnZXJFbGVtZW50KCk7XG5cdFx0ICpcblx0XHQgKiAvLyBzZXQgYSBuZXcgdHJpZ2dlckVsZW1lbnQgdXNpbmcgYSBzZWxlY3RvclxuXHRcdCAqIHNjZW5lLnRyaWdnZXJFbGVtZW50KFwiI3RyaWdnZXJcIik7XG5cdFx0ICogLy8gc2V0IGEgbmV3IHRyaWdnZXJFbGVtZW50IHVzaW5nIGEgRE9NIG9iamVjdFxuXHRcdCAqIHNjZW5lLnRyaWdnZXJFbGVtZW50KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidHJpZ2dlclwiKSk7XG5cdFx0ICpcblx0XHQgKiBAZmlyZXMge0BsaW5rIFNjZW5lLmNoYW5nZX0sIHdoZW4gdXNlZCBhcyBzZXR0ZXJcblx0XHQgKiBAcGFyYW0geyhzdHJpbmd8b2JqZWN0KX0gW25ld1RyaWdnZXJFbGVtZW50XSAtIFRoZSBuZXcgdHJpZ2dlciBlbGVtZW50IGZvciB0aGUgc2NlbmUuXG5cdFx0ICogQHJldHVybnMgeyhzdHJpbmd8b2JqZWN0KX0gYGdldGAgLSAgQ3VycmVudCB0cmlnZ2VyRWxlbWVudC5cblx0XHQgKiBAcmV0dXJucyB7U2NlbmV9IGBzZXRgIC0gIFBhcmVudCBvYmplY3QgZm9yIGNoYWluaW5nLlxuXHRcdCAqL1xuXG5cdFx0LyoqXG5cdFx0ICogKipHZXQqKiBvciAqKlNldCoqIHRoZSB0cmlnZ2VySG9vayBvcHRpb24gdmFsdWUuXG5cdFx0ICogQG1ldGhvZCBTY3JvbGxNYWdpYy5TY2VuZSN0cmlnZ2VySG9va1xuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogLy8gZ2V0IHRoZSBjdXJyZW50IHRyaWdnZXJIb29rIHZhbHVlXG5cdFx0ICogdmFyIHRyaWdnZXJIb29rID0gc2NlbmUudHJpZ2dlckhvb2soKTtcblx0XHQgKlxuXHRcdCAqIC8vIHNldCBhIG5ldyB0cmlnZ2VySG9vayB1c2luZyBhIHN0cmluZ1xuXHRcdCAqIHNjZW5lLnRyaWdnZXJIb29rKFwib25MZWF2ZVwiKTtcblx0XHQgKiAvLyBzZXQgYSBuZXcgdHJpZ2dlckhvb2sgdXNpbmcgYSBudW1iZXJcblx0XHQgKiBzY2VuZS50cmlnZ2VySG9vaygwLjcpO1xuXHRcdCAqXG5cdFx0ICogQGZpcmVzIHtAbGluayBTY2VuZS5jaGFuZ2V9LCB3aGVuIHVzZWQgYXMgc2V0dGVyXG5cdFx0ICogQGZpcmVzIHtAbGluayBTY2VuZS5zaGlmdH0sIHdoZW4gdXNlZCBhcyBzZXR0ZXJcblx0XHQgKiBAcGFyYW0geyhudW1iZXJ8c3RyaW5nKX0gW25ld1RyaWdnZXJIb29rXSAtIFRoZSBuZXcgdHJpZ2dlckhvb2sgb2YgdGhlIHNjZW5lLiBTZWUge0BsaW5rIFNjZW5lfSBwYXJhbWV0ZXIgZGVzY3JpcHRpb24gZm9yIHZhbHVlIG9wdGlvbnMuXG5cdFx0ICogQHJldHVybnMge251bWJlcn0gYGdldGAgLSAgQ3VycmVudCB0cmlnZ2VySG9vayAoQUxXQVlTIG51bWVyaWNhbCkuXG5cdFx0ICogQHJldHVybnMge1NjZW5lfSBgc2V0YCAtICBQYXJlbnQgb2JqZWN0IGZvciBjaGFpbmluZy5cblx0XHQgKi9cblxuXHRcdC8qKlxuXHRcdCAqICoqR2V0Kiogb3IgKipTZXQqKiB0aGUgcmV2ZXJzZSBvcHRpb24gdmFsdWUuXG5cdFx0ICogQG1ldGhvZCBTY3JvbGxNYWdpYy5TY2VuZSNyZXZlcnNlXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiAvLyBnZXQgdGhlIGN1cnJlbnQgcmV2ZXJzZSBvcHRpb25cblx0XHQgKiB2YXIgcmV2ZXJzZSA9IHNjZW5lLnJldmVyc2UoKTtcblx0XHQgKlxuXHRcdCAqIC8vIHNldCBuZXcgcmV2ZXJzZSBvcHRpb25cblx0XHQgKiBzY2VuZS5yZXZlcnNlKGZhbHNlKTtcblx0XHQgKlxuXHRcdCAqIEBmaXJlcyB7QGxpbmsgU2NlbmUuY2hhbmdlfSwgd2hlbiB1c2VkIGFzIHNldHRlclxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gW25ld1JldmVyc2VdIC0gVGhlIG5ldyByZXZlcnNlIHNldHRpbmcgb2YgdGhlIHNjZW5lLlxuXHRcdCAqIEByZXR1cm5zIHtib29sZWFufSBgZ2V0YCAtICBDdXJyZW50IHJldmVyc2Ugb3B0aW9uIHZhbHVlLlxuXHRcdCAqIEByZXR1cm5zIHtTY2VuZX0gYHNldGAgLSAgUGFyZW50IG9iamVjdCBmb3IgY2hhaW5pbmcuXG5cdFx0ICovXG5cblx0XHQvKipcblx0XHQgKiAqKkdldCoqIG9yICoqU2V0KiogdGhlIGxvZ2xldmVsIG9wdGlvbiB2YWx1ZS5cblx0XHQgKiBAbWV0aG9kIFNjcm9sbE1hZ2ljLlNjZW5lI2xvZ2xldmVsXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiAvLyBnZXQgdGhlIGN1cnJlbnQgbG9nbGV2ZWxcblx0XHQgKiB2YXIgbG9nbGV2ZWwgPSBzY2VuZS5sb2dsZXZlbCgpO1xuXHRcdCAqXG5cdFx0ICogLy8gc2V0IG5ldyBsb2dsZXZlbFxuXHRcdCAqIHNjZW5lLmxvZ2xldmVsKDMpO1xuXHRcdCAqXG5cdFx0ICogQGZpcmVzIHtAbGluayBTY2VuZS5jaGFuZ2V9LCB3aGVuIHVzZWQgYXMgc2V0dGVyXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IFtuZXdMb2dsZXZlbF0gLSBUaGUgbmV3IGxvZ2xldmVsIHNldHRpbmcgb2YgdGhlIHNjZW5lLiBgWzAtM11gXG5cdFx0ICogQHJldHVybnMge251bWJlcn0gYGdldGAgLSAgQ3VycmVudCBsb2dsZXZlbC5cblx0XHQgKiBAcmV0dXJucyB7U2NlbmV9IGBzZXRgIC0gIFBhcmVudCBvYmplY3QgZm9yIGNoYWluaW5nLlxuXHRcdCAqL1xuXG5cdFx0LyoqXG5cdFx0ICogKipHZXQqKiB0aGUgYXNzb2NpYXRlZCBjb250cm9sbGVyLlxuXHRcdCAqIEBtZXRob2QgU2Nyb2xsTWFnaWMuU2NlbmUjY29udHJvbGxlclxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogLy8gZ2V0IHRoZSBjb250cm9sbGVyIG9mIGEgc2NlbmVcblx0XHQgKiB2YXIgY29udHJvbGxlciA9IHNjZW5lLmNvbnRyb2xsZXIoKTtcblx0XHQgKlxuXHRcdCAqIEByZXR1cm5zIHtTY3JvbGxNYWdpYy5Db250cm9sbGVyfSBQYXJlbnQgY29udHJvbGxlciBvciBgdW5kZWZpbmVkYFxuXHRcdCAqL1xuXHRcdHRoaXMuY29udHJvbGxlciA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBfY29udHJvbGxlcjtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogKipHZXQqKiB0aGUgY3VycmVudCBzdGF0ZS5cblx0XHQgKiBAbWV0aG9kIFNjcm9sbE1hZ2ljLlNjZW5lI3N0YXRlXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiAvLyBnZXQgdGhlIGN1cnJlbnQgc3RhdGVcblx0XHQgKiB2YXIgc3RhdGUgPSBzY2VuZS5zdGF0ZSgpO1xuXHRcdCAqXG5cdFx0ICogQHJldHVybnMge3N0cmluZ30gYFwiQkVGT1JFXCJgLCBgXCJEVVJJTkdcImAgb3IgYFwiQUZURVJcImBcblx0XHQgKi9cblx0XHR0aGlzLnN0YXRlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIF9zdGF0ZTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogKipHZXQqKiB0aGUgY3VycmVudCBzY3JvbGwgb2Zmc2V0IGZvciB0aGUgc3RhcnQgb2YgdGhlIHNjZW5lLiAgXG5cdFx0ICogTWluZCwgdGhhdCB0aGUgc2Nyb2xsT2Zmc2V0IGlzIHJlbGF0ZWQgdG8gdGhlIHNpemUgb2YgdGhlIGNvbnRhaW5lciwgaWYgYHRyaWdnZXJIb29rYCBpcyBiaWdnZXIgdGhhbiBgMGAgKG9yIGBcIm9uTGVhdmVcImApLiAgXG5cdFx0ICogVGhpcyBtZWFucywgdGhhdCByZXNpemluZyB0aGUgY29udGFpbmVyIG9yIGNoYW5naW5nIHRoZSBgdHJpZ2dlckhvb2tgIHdpbGwgaW5mbHVlbmNlIHRoZSBzY2VuZSdzIHN0YXJ0IG9mZnNldC5cblx0XHQgKiBAbWV0aG9kIFNjcm9sbE1hZ2ljLlNjZW5lI3Njcm9sbE9mZnNldFxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogLy8gZ2V0IHRoZSBjdXJyZW50IHNjcm9sbCBvZmZzZXQgZm9yIHRoZSBzdGFydCBhbmQgZW5kIG9mIHRoZSBzY2VuZS5cblx0XHQgKiB2YXIgc3RhcnQgPSBzY2VuZS5zY3JvbGxPZmZzZXQoKTtcblx0XHQgKiB2YXIgZW5kID0gc2NlbmUuc2Nyb2xsT2Zmc2V0KCkgKyBzY2VuZS5kdXJhdGlvbigpO1xuXHRcdCAqIGNvbnNvbGUubG9nKFwidGhlIHNjZW5lIHN0YXJ0cyBhdFwiLCBzdGFydCwgXCJhbmQgZW5kcyBhdFwiLCBlbmQpO1xuXHRcdCAqXG5cdFx0ICogQHJldHVybnMge251bWJlcn0gVGhlIHNjcm9sbCBvZmZzZXQgKG9mIHRoZSBjb250YWluZXIpIGF0IHdoaWNoIHRoZSBzY2VuZSB3aWxsIHRyaWdnZXIuIFkgdmFsdWUgZm9yIHZlcnRpY2FsIGFuZCBYIHZhbHVlIGZvciBob3Jpem9udGFsIHNjcm9sbHMuXG5cdFx0ICovXG5cdFx0dGhpcy5zY3JvbGxPZmZzZXQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gX3Njcm9sbE9mZnNldC5zdGFydDtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogKipHZXQqKiB0aGUgdHJpZ2dlciBwb3NpdGlvbiBvZiB0aGUgc2NlbmUgKGluY2x1ZGluZyB0aGUgdmFsdWUgb2YgdGhlIGBvZmZzZXRgIG9wdGlvbikuICBcblx0XHQgKiBAbWV0aG9kIFNjcm9sbE1hZ2ljLlNjZW5lI3RyaWdnZXJQb3NpdGlvblxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogLy8gZ2V0IHRoZSBzY2VuZSdzIHRyaWdnZXIgcG9zaXRpb25cblx0XHQgKiB2YXIgdHJpZ2dlclBvc2l0aW9uID0gc2NlbmUudHJpZ2dlclBvc2l0aW9uKCk7XG5cdFx0ICpcblx0XHQgKiBAcmV0dXJucyB7bnVtYmVyfSBTdGFydCBwb3NpdGlvbiBvZiB0aGUgc2NlbmUuIFRvcCBwb3NpdGlvbiB2YWx1ZSBmb3IgdmVydGljYWwgYW5kIGxlZnQgcG9zaXRpb24gdmFsdWUgZm9yIGhvcml6b250YWwgc2Nyb2xscy5cblx0XHQgKi9cblx0XHR0aGlzLnRyaWdnZXJQb3NpdGlvbiA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBwb3MgPSBfb3B0aW9ucy5vZmZzZXQ7IC8vIHRoZSBvZmZzZXQgaXMgdGhlIGJhc2lzXG5cdFx0XHRpZiAoX2NvbnRyb2xsZXIpIHtcblx0XHRcdFx0Ly8gZ2V0IHRoZSB0cmlnZ2VyIHBvc2l0aW9uXG5cdFx0XHRcdGlmIChfb3B0aW9ucy50cmlnZ2VyRWxlbWVudCkge1xuXHRcdFx0XHRcdC8vIEVsZW1lbnQgYXMgdHJpZ2dlclxuXHRcdFx0XHRcdHBvcyArPSBfdHJpZ2dlclBvcztcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyByZXR1cm4gdGhlIGhlaWdodCBvZiB0aGUgdHJpZ2dlckhvb2sgdG8gc3RhcnQgYXQgdGhlIGJlZ2lubmluZ1xuXHRcdFx0XHRcdHBvcyArPSBfY29udHJvbGxlci5pbmZvKFwic2l6ZVwiKSAqIFNjZW5lLnRyaWdnZXJIb29rKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiBwb3M7XG5cdFx0fTtcblxuXHRcdHZhclxuXHRcdF9waW4sIF9waW5PcHRpb25zO1xuXG5cdFx0U2NlbmUub24oXCJzaGlmdC5pbnRlcm5hbFwiLCBmdW5jdGlvbiAoZSkge1xuXHRcdFx0dmFyIGR1cmF0aW9uQ2hhbmdlZCA9IGUucmVhc29uID09PSBcImR1cmF0aW9uXCI7XG5cdFx0XHRpZiAoKF9zdGF0ZSA9PT0gU0NFTkVfU1RBVEVfQUZURVIgJiYgZHVyYXRpb25DaGFuZ2VkKSB8fCAoX3N0YXRlID09PSBTQ0VORV9TVEFURV9EVVJJTkcgJiYgX29wdGlvbnMuZHVyYXRpb24gPT09IDApKSB7XG5cdFx0XHRcdC8vIGlmIFtkdXJhdGlvbiBjaGFuZ2VkIGFmdGVyIGEgc2NlbmUgKGluc2lkZSBzY2VuZSBwcm9ncmVzcyB1cGRhdGVzIHBpbiBwb3NpdGlvbildIG9yIFtkdXJhdGlvbiBpcyAwLCB3ZSBhcmUgaW4gcGluIHBoYXNlIGFuZCBzb21lIG90aGVyIHZhbHVlIGNoYW5nZWRdLlxuXHRcdFx0XHR1cGRhdGVQaW5TdGF0ZSgpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGR1cmF0aW9uQ2hhbmdlZCkge1xuXHRcdFx0XHR1cGRhdGVQaW5EaW1lbnNpb25zKCk7XG5cdFx0XHR9XG5cdFx0fSkub24oXCJwcm9ncmVzcy5pbnRlcm5hbFwiLCBmdW5jdGlvbiAoZSkge1xuXHRcdFx0dXBkYXRlUGluU3RhdGUoKTtcblx0XHR9KS5vbihcImFkZC5pbnRlcm5hbFwiLCBmdW5jdGlvbiAoZSkge1xuXHRcdFx0dXBkYXRlUGluRGltZW5zaW9ucygpO1xuXHRcdH0pLm9uKFwiZGVzdHJveS5pbnRlcm5hbFwiLCBmdW5jdGlvbiAoZSkge1xuXHRcdFx0U2NlbmUucmVtb3ZlUGluKGUucmVzZXQpO1xuXHRcdH0pO1xuXHRcdC8qKlxuXHRcdCAqIFVwZGF0ZSB0aGUgcGluIHN0YXRlLlxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dmFyIHVwZGF0ZVBpblN0YXRlID0gZnVuY3Rpb24gKGZvcmNlVW5waW4pIHtcblx0XHRcdGlmIChfcGluICYmIF9jb250cm9sbGVyKSB7XG5cdFx0XHRcdHZhclxuXHRcdFx0XHRjb250YWluZXJJbmZvID0gX2NvbnRyb2xsZXIuaW5mbygpLFxuXHRcdFx0XHRcdHBpblRhcmdldCA9IF9waW5PcHRpb25zLnNwYWNlci5maXJzdENoaWxkOyAvLyBtYXkgYmUgcGluIGVsZW1lbnQgb3IgYW5vdGhlciBzcGFjZXIsIGlmIGNhc2NhZGluZyBwaW5zXG5cdFx0XHRcdGlmICghZm9yY2VVbnBpbiAmJiBfc3RhdGUgPT09IFNDRU5FX1NUQVRFX0RVUklORykgeyAvLyBkdXJpbmcgc2NlbmUgb3IgaWYgZHVyYXRpb24gaXMgMCBhbmQgd2UgYXJlIHBhc3QgdGhlIHRyaWdnZXJcblx0XHRcdFx0XHQvLyBwaW5uZWQgc3RhdGVcblx0XHRcdFx0XHRpZiAoX3V0aWwuY3NzKHBpblRhcmdldCwgXCJwb3NpdGlvblwiKSAhPSBcImZpeGVkXCIpIHtcblx0XHRcdFx0XHRcdC8vIGNoYW5nZSBzdGF0ZSBiZWZvcmUgdXBkYXRpbmcgcGluIHNwYWNlciAocG9zaXRpb24gY2hhbmdlcyBkdWUgdG8gZml4ZWQgY29sbGFwc2luZyBtaWdodCBvY2N1ci4pXG5cdFx0XHRcdFx0XHRfdXRpbC5jc3MocGluVGFyZ2V0LCB7XG5cdFx0XHRcdFx0XHRcdFwicG9zaXRpb25cIjogXCJmaXhlZFwiXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdC8vIHVwZGF0ZSBwaW4gc3BhY2VyXG5cdFx0XHRcdFx0XHR1cGRhdGVQaW5EaW1lbnNpb25zKCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0dmFyXG5cdFx0XHRcdFx0Zml4ZWRQb3MgPSBfdXRpbC5nZXQub2Zmc2V0KF9waW5PcHRpb25zLnNwYWNlciwgdHJ1ZSksXG5cdFx0XHRcdFx0XHQvLyBnZXQgdmlld3BvcnQgcG9zaXRpb24gb2Ygc3BhY2VyXG5cdFx0XHRcdFx0XHRzY3JvbGxEaXN0YW5jZSA9IF9vcHRpb25zLnJldmVyc2UgfHwgX29wdGlvbnMuZHVyYXRpb24gPT09IDAgPyBjb250YWluZXJJbmZvLnNjcm9sbFBvcyAtIF9zY3JvbGxPZmZzZXQuc3RhcnQgLy8gcXVpY2tlclxuXHRcdFx0XHRcdFx0OiBNYXRoLnJvdW5kKF9wcm9ncmVzcyAqIF9vcHRpb25zLmR1cmF0aW9uICogMTApIC8gMTA7IC8vIGlmIG5vIHJldmVyc2UgYW5kIGR1cmluZyBwaW4gdGhlIHBvc2l0aW9uIG5lZWRzIHRvIGJlIHJlY2FsY3VsYXRlZCB1c2luZyB0aGUgcHJvZ3Jlc3Ncblx0XHRcdFx0XHQvLyBhZGQgc2Nyb2xsRGlzdGFuY2Vcblx0XHRcdFx0XHRmaXhlZFBvc1tjb250YWluZXJJbmZvLnZlcnRpY2FsID8gXCJ0b3BcIiA6IFwibGVmdFwiXSArPSBzY3JvbGxEaXN0YW5jZTtcblxuXHRcdFx0XHRcdC8vIHNldCBuZXcgdmFsdWVzXG5cdFx0XHRcdFx0X3V0aWwuY3NzKF9waW5PcHRpb25zLnNwYWNlci5maXJzdENoaWxkLCB7XG5cdFx0XHRcdFx0XHR0b3A6IGZpeGVkUG9zLnRvcCxcblx0XHRcdFx0XHRcdGxlZnQ6IGZpeGVkUG9zLmxlZnRcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyB1bnBpbm5lZCBzdGF0ZVxuXHRcdFx0XHRcdHZhclxuXHRcdFx0XHRcdG5ld0NTUyA9IHtcblx0XHRcdFx0XHRcdHBvc2l0aW9uOiBfcGluT3B0aW9ucy5pbkZsb3cgPyBcInJlbGF0aXZlXCIgOiBcImFic29sdXRlXCIsXG5cdFx0XHRcdFx0XHR0b3A6IDAsXG5cdFx0XHRcdFx0XHRsZWZ0OiAwXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGNoYW5nZSA9IF91dGlsLmNzcyhwaW5UYXJnZXQsIFwicG9zaXRpb25cIikgIT0gbmV3Q1NTLnBvc2l0aW9uO1xuXG5cdFx0XHRcdFx0aWYgKCFfcGluT3B0aW9ucy5wdXNoRm9sbG93ZXJzKSB7XG5cdFx0XHRcdFx0XHRuZXdDU1NbY29udGFpbmVySW5mby52ZXJ0aWNhbCA/IFwidG9wXCIgOiBcImxlZnRcIl0gPSBfb3B0aW9ucy5kdXJhdGlvbiAqIF9wcm9ncmVzcztcblx0XHRcdFx0XHR9IGVsc2UgaWYgKF9vcHRpb25zLmR1cmF0aW9uID4gMCkgeyAvLyBvbmx5IGNvbmNlcm5zIHNjZW5lcyB3aXRoIGR1cmF0aW9uXG5cdFx0XHRcdFx0XHRpZiAoX3N0YXRlID09PSBTQ0VORV9TVEFURV9BRlRFUiAmJiBwYXJzZUZsb2F0KF91dGlsLmNzcyhfcGluT3B0aW9ucy5zcGFjZXIsIFwicGFkZGluZy10b3BcIikpID09PSAwKSB7XG5cdFx0XHRcdFx0XHRcdGNoYW5nZSA9IHRydWU7IC8vIGlmIGluIGFmdGVyIHN0YXRlIGJ1dCBoYXZlbnQgdXBkYXRlZCBzcGFjZXIgeWV0IChqdW1wZWQgcGFzdCBwaW4pXG5cdFx0XHRcdFx0XHR9IGVsc2UgaWYgKF9zdGF0ZSA9PT0gU0NFTkVfU1RBVEVfQkVGT1JFICYmIHBhcnNlRmxvYXQoX3V0aWwuY3NzKF9waW5PcHRpb25zLnNwYWNlciwgXCJwYWRkaW5nLWJvdHRvbVwiKSkgPT09IDApIHsgLy8gYmVmb3JlXG5cdFx0XHRcdFx0XHRcdGNoYW5nZSA9IHRydWU7IC8vIGp1bXBlZCBwYXN0IGZpeGVkIHN0YXRlIHVwd2FyZCBkaXJlY3Rpb25cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gc2V0IG5ldyB2YWx1ZXNcblx0XHRcdFx0XHRfdXRpbC5jc3MocGluVGFyZ2V0LCBuZXdDU1MpO1xuXHRcdFx0XHRcdGlmIChjaGFuZ2UpIHtcblx0XHRcdFx0XHRcdC8vIHVwZGF0ZSBwaW4gc3BhY2VyIGlmIHN0YXRlIGNoYW5nZWRcblx0XHRcdFx0XHRcdHVwZGF0ZVBpbkRpbWVuc2lvbnMoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogVXBkYXRlIHRoZSBwaW4gc3BhY2VyIGFuZC9vciBlbGVtZW50IHNpemUuXG5cdFx0ICogVGhlIHNpemUgb2YgdGhlIHNwYWNlciBuZWVkcyB0byBiZSB1cGRhdGVkIHdoZW5ldmVyIHRoZSBkdXJhdGlvbiBvZiB0aGUgc2NlbmUgY2hhbmdlcywgaWYgaXQgaXMgdG8gcHVzaCBkb3duIGZvbGxvd2luZyBlbGVtZW50cy5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciB1cGRhdGVQaW5EaW1lbnNpb25zID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKF9waW4gJiYgX2NvbnRyb2xsZXIgJiYgX3Bpbk9wdGlvbnMuaW5GbG93KSB7IC8vIG5vIHNwYWNlcnJlc2l6ZSwgaWYgb3JpZ2luYWwgcG9zaXRpb24gaXMgYWJzb2x1dGVcblx0XHRcdFx0dmFyXG5cdFx0XHRcdGFmdGVyID0gKF9zdGF0ZSA9PT0gU0NFTkVfU1RBVEVfQUZURVIpLFxuXHRcdFx0XHRcdGJlZm9yZSA9IChfc3RhdGUgPT09IFNDRU5FX1NUQVRFX0JFRk9SRSksXG5cdFx0XHRcdFx0ZHVyaW5nID0gKF9zdGF0ZSA9PT0gU0NFTkVfU1RBVEVfRFVSSU5HKSxcblx0XHRcdFx0XHR2ZXJ0aWNhbCA9IF9jb250cm9sbGVyLmluZm8oXCJ2ZXJ0aWNhbFwiKSxcblx0XHRcdFx0XHRwaW5UYXJnZXQgPSBfcGluT3B0aW9ucy5zcGFjZXIuZmlyc3RDaGlsZCxcblx0XHRcdFx0XHQvLyB1c3VhbGx5IHRoZSBwaW5lZCBlbGVtZW50IGJ1dCBjYW4gYWxzbyBiZSBhbm90aGVyIHNwYWNlciAoY2FzY2FkZWQgcGlucylcblx0XHRcdFx0XHRtYXJnaW5Db2xsYXBzZSA9IF91dGlsLmlzTWFyZ2luQ29sbGFwc2VUeXBlKF91dGlsLmNzcyhfcGluT3B0aW9ucy5zcGFjZXIsIFwiZGlzcGxheVwiKSksXG5cdFx0XHRcdFx0Y3NzID0ge307XG5cblx0XHRcdFx0Ly8gc2V0IG5ldyBzaXplXG5cdFx0XHRcdC8vIGlmIHJlbHNpemU6IHNwYWNlciAtPiBwaW4gfCBlbHNlOiBwaW4gLT4gc3BhY2VyXG5cdFx0XHRcdGlmIChfcGluT3B0aW9ucy5yZWxTaXplLndpZHRoIHx8IF9waW5PcHRpb25zLnJlbFNpemUuYXV0b0Z1bGxXaWR0aCkge1xuXHRcdFx0XHRcdGlmIChkdXJpbmcpIHtcblx0XHRcdFx0XHRcdF91dGlsLmNzcyhfcGluLCB7XG5cdFx0XHRcdFx0XHRcdFwid2lkdGhcIjogX3V0aWwuZ2V0LndpZHRoKF9waW5PcHRpb25zLnNwYWNlcilcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRfdXRpbC5jc3MoX3Bpbiwge1xuXHRcdFx0XHRcdFx0XHRcIndpZHRoXCI6IFwiMTAwJVwiXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gbWlud2lkdGggaXMgbmVlZGVkIGZvciBjYXNjYWRlZCBwaW5zLlxuXHRcdFx0XHRcdGNzc1tcIm1pbi13aWR0aFwiXSA9IF91dGlsLmdldC53aWR0aCh2ZXJ0aWNhbCA/IF9waW4gOiBwaW5UYXJnZXQsIHRydWUsIHRydWUpO1xuXHRcdFx0XHRcdGNzcy53aWR0aCA9IGR1cmluZyA/IGNzc1tcIm1pbi13aWR0aFwiXSA6IFwiYXV0b1wiO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChfcGluT3B0aW9ucy5yZWxTaXplLmhlaWdodCkge1xuXHRcdFx0XHRcdGlmIChkdXJpbmcpIHtcblx0XHRcdFx0XHRcdC8vIHRoZSBvbmx5IHBhZGRpbmcgdGhlIHNwYWNlciBzaG91bGQgZXZlciBpbmNsdWRlIGlzIHRoZSBkdXJhdGlvbiAoaWYgcHVzaEZvbGxvd2VycyA9IHRydWUpLCBzbyB3ZSBuZWVkIHRvIHN1YnN0cmFjdCB0aGF0LlxuXHRcdFx0XHRcdFx0X3V0aWwuY3NzKF9waW4sIHtcblx0XHRcdFx0XHRcdFx0XCJoZWlnaHRcIjogX3V0aWwuZ2V0LmhlaWdodChfcGluT3B0aW9ucy5zcGFjZXIpIC0gKF9waW5PcHRpb25zLnB1c2hGb2xsb3dlcnMgPyBfb3B0aW9ucy5kdXJhdGlvbiA6IDApXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0X3V0aWwuY3NzKF9waW4sIHtcblx0XHRcdFx0XHRcdFx0XCJoZWlnaHRcIjogXCIxMDAlXCJcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBtYXJnaW4gaXMgb25seSBpbmNsdWRlZCBpZiBpdCdzIGEgY2FzY2FkZWQgcGluIHRvIHJlc29sdmUgYW4gSUU5IGJ1Z1xuXHRcdFx0XHRcdGNzc1tcIm1pbi1oZWlnaHRcIl0gPSBfdXRpbC5nZXQuaGVpZ2h0KHZlcnRpY2FsID8gcGluVGFyZ2V0IDogX3BpbiwgdHJ1ZSwgIW1hcmdpbkNvbGxhcHNlKTsgLy8gbmVlZGVkIGZvciBjYXNjYWRpbmcgcGluc1xuXHRcdFx0XHRcdGNzcy5oZWlnaHQgPSBkdXJpbmcgPyBjc3NbXCJtaW4taGVpZ2h0XCJdIDogXCJhdXRvXCI7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBhZGQgc3BhY2UgZm9yIGR1cmF0aW9uIGlmIHB1c2hGb2xsb3dlcnMgaXMgdHJ1ZVxuXHRcdFx0XHRpZiAoX3Bpbk9wdGlvbnMucHVzaEZvbGxvd2Vycykge1xuXHRcdFx0XHRcdGNzc1tcInBhZGRpbmdcIiArICh2ZXJ0aWNhbCA/IFwiVG9wXCIgOiBcIkxlZnRcIildID0gX29wdGlvbnMuZHVyYXRpb24gKiBfcHJvZ3Jlc3M7XG5cdFx0XHRcdFx0Y3NzW1wicGFkZGluZ1wiICsgKHZlcnRpY2FsID8gXCJCb3R0b21cIiA6IFwiUmlnaHRcIildID0gX29wdGlvbnMuZHVyYXRpb24gKiAoMSAtIF9wcm9ncmVzcyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0X3V0aWwuY3NzKF9waW5PcHRpb25zLnNwYWNlciwgY3NzKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogVXBkYXRlcyB0aGUgUGluIHN0YXRlIChpbiBjZXJ0YWluIHNjZW5hcmlvcylcblx0XHQgKiBJZiB0aGUgY29udHJvbGxlciBjb250YWluZXIgaXMgbm90IHRoZSBkb2N1bWVudCBhbmQgd2UgYXJlIG1pZC1waW4tcGhhc2Ugc2Nyb2xsaW5nIG9yIHJlc2l6aW5nIHRoZSBtYWluIGRvY3VtZW50IGNhbiByZXN1bHQgdG8gd3JvbmcgcGluIHBvc2l0aW9ucy5cblx0XHQgKiBTbyB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBvbiByZXNpemUgYW5kIHNjcm9sbCBvZiB0aGUgZG9jdW1lbnQuXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgdXBkYXRlUGluSW5Db250YWluZXIgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoX2NvbnRyb2xsZXIgJiYgX3BpbiAmJiBfc3RhdGUgPT09IFNDRU5FX1NUQVRFX0RVUklORyAmJiAhX2NvbnRyb2xsZXIuaW5mbyhcImlzRG9jdW1lbnRcIikpIHtcblx0XHRcdFx0dXBkYXRlUGluU3RhdGUoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogVXBkYXRlcyB0aGUgUGluIHNwYWNlciBzaXplIHN0YXRlIChpbiBjZXJ0YWluIHNjZW5hcmlvcylcblx0XHQgKiBJZiBjb250YWluZXIgaXMgcmVzaXplZCBkdXJpbmcgcGluIGFuZCByZWxhdGl2ZWx5IHNpemVkIHRoZSBzaXplIG9mIHRoZSBwaW4gbWlnaHQgbmVlZCB0byBiZSB1cGRhdGVkLi4uXG5cdFx0ICogU28gdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgb24gcmVzaXplIG9mIHRoZSBjb250YWluZXIuXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgdXBkYXRlUmVsYXRpdmVQaW5TcGFjZXIgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoX2NvbnRyb2xsZXIgJiYgX3BpbiAmJiAvLyB3ZWxsLCBkdWhcblx0XHRcdF9zdGF0ZSA9PT0gU0NFTkVfU1RBVEVfRFVSSU5HICYmIC8vIGVsZW1lbnQgaW4gcGlubmVkIHN0YXRlP1xuXHRcdFx0KCAvLyBpcyB3aWR0aCBvciBoZWlnaHQgcmVsYXRpdmVseSBzaXplZCwgYnV0IG5vdCBpbiByZWxhdGlvbiB0byBib2R5PyB0aGVuIHdlIG5lZWQgdG8gcmVjYWxjLlxuXHRcdFx0KChfcGluT3B0aW9ucy5yZWxTaXplLndpZHRoIHx8IF9waW5PcHRpb25zLnJlbFNpemUuYXV0b0Z1bGxXaWR0aCkgJiYgX3V0aWwuZ2V0LndpZHRoKHdpbmRvdykgIT0gX3V0aWwuZ2V0LndpZHRoKF9waW5PcHRpb25zLnNwYWNlci5wYXJlbnROb2RlKSkgfHwgKF9waW5PcHRpb25zLnJlbFNpemUuaGVpZ2h0ICYmIF91dGlsLmdldC5oZWlnaHQod2luZG93KSAhPSBfdXRpbC5nZXQuaGVpZ2h0KF9waW5PcHRpb25zLnNwYWNlci5wYXJlbnROb2RlKSkpKSB7XG5cdFx0XHRcdHVwZGF0ZVBpbkRpbWVuc2lvbnMoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogSXMgY2FsbGVkLCB3aGVuIHRoZSBtb3VzZXdoZWwgaXMgdXNlZCB3aGlsZSBvdmVyIGEgcGlubmVkIGVsZW1lbnQgaW5zaWRlIGEgZGl2IGNvbnRhaW5lci5cblx0XHQgKiBJZiB0aGUgc2NlbmUgaXMgaW4gZml4ZWQgc3RhdGUgc2Nyb2xsIGV2ZW50cyB3b3VsZCBiZSBjb3VudGVkIHRvd2FyZHMgdGhlIGJvZHkuIFRoaXMgZm9yd2FyZHMgdGhlIGV2ZW50IHRvIHRoZSBzY3JvbGwgY29udGFpbmVyLlxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dmFyIG9uTW91c2V3aGVlbE92ZXJQaW4gPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0aWYgKF9jb250cm9sbGVyICYmIF9waW4gJiYgX3N0YXRlID09PSBTQ0VORV9TVEFURV9EVVJJTkcgJiYgIV9jb250cm9sbGVyLmluZm8oXCJpc0RvY3VtZW50XCIpKSB7IC8vIGluIHBpbiBzdGF0ZVxuXHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdF9jb250cm9sbGVyLl9zZXRTY3JvbGxQb3MoX2NvbnRyb2xsZXIuaW5mbyhcInNjcm9sbFBvc1wiKSAtICgoZS53aGVlbERlbHRhIHx8IGVbX2NvbnRyb2xsZXIuaW5mbyhcInZlcnRpY2FsXCIpID8gXCJ3aGVlbERlbHRhWVwiIDogXCJ3aGVlbERlbHRhWFwiXSkgLyAzIHx8IC1lLmRldGFpbCAqIDMwKSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFBpbiBhbiBlbGVtZW50IGZvciB0aGUgZHVyYXRpb24gb2YgdGhlIHR3ZWVuLiAgXG5cdFx0ICogSWYgdGhlIHNjZW5lIGR1cmF0aW9uIGlzIDAgdGhlIGVsZW1lbnQgd2lsbCBvbmx5IGJlIHVucGlubmVkLCBpZiB0aGUgdXNlciBzY3JvbGxzIGJhY2sgcGFzdCB0aGUgc3RhcnQgcG9zaXRpb24uICBcblx0XHQgKiBNYWtlIHN1cmUgb25seSBvbmUgcGluIGlzIGFwcGxpZWQgdG8gYW4gZWxlbWVudCBhdCB0aGUgc2FtZSB0aW1lLlxuXHRcdCAqIEFuIGVsZW1lbnQgY2FuIGJlIHBpbm5lZCBtdWx0aXBsZSB0aW1lcywgYnV0IG9ubHkgc3VjY2Vzc2l2ZWx5LlxuXHRcdCAqIF8qKk5PVEU6KiogVGhlIG9wdGlvbiBgcHVzaEZvbGxvd2Vyc2AgaGFzIG5vIGVmZmVjdCwgd2hlbiB0aGUgc2NlbmUgZHVyYXRpb24gaXMgMC5fXG5cdFx0ICogQG1ldGhvZCBTY3JvbGxNYWdpYy5TY2VuZSNzZXRQaW5cblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIHBpbiBlbGVtZW50IGFuZCBwdXNoIGFsbCBmb2xsb3dpbmcgZWxlbWVudHMgZG93biBieSB0aGUgYW1vdW50IG9mIHRoZSBwaW4gZHVyYXRpb24uXG5cdFx0ICogc2NlbmUuc2V0UGluKFwiI3BpblwiKTtcblx0XHQgKlxuXHRcdCAqIC8vIHBpbiBlbGVtZW50IGFuZCBrZWVwaW5nIGFsbCBmb2xsb3dpbmcgZWxlbWVudHMgaW4gdGhlaXIgcGxhY2UuIFRoZSBwaW5uZWQgZWxlbWVudCB3aWxsIG1vdmUgcGFzdCB0aGVtLlxuXHRcdCAqIHNjZW5lLnNldFBpbihcIiNwaW5cIiwge3B1c2hGb2xsb3dlcnM6IGZhbHNlfSk7XG5cdFx0ICpcblx0XHQgKiBAcGFyYW0geyhzdHJpbmd8b2JqZWN0KX0gZWxlbWVudCAtIEEgU2VsZWN0b3IgdGFyZ2V0aW5nIGFuIGVsZW1lbnQgb3IgYSBET00gb2JqZWN0IHRoYXQgaXMgc3VwcG9zZWQgdG8gYmUgcGlubmVkLlxuXHRcdCAqIEBwYXJhbSB7b2JqZWN0fSBbc2V0dGluZ3NdIC0gc2V0dGluZ3MgZm9yIHRoZSBwaW5cblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IFtzZXR0aW5ncy5wdXNoRm9sbG93ZXJzPXRydWVdIC0gSWYgYHRydWVgIGZvbGxvd2luZyBlbGVtZW50cyB3aWxsIGJlIFwicHVzaGVkXCIgZG93biBmb3IgdGhlIGR1cmF0aW9uIG9mIHRoZSBwaW4sIGlmIGBmYWxzZWAgdGhlIHBpbm5lZCBlbGVtZW50IHdpbGwganVzdCBzY3JvbGwgcGFzdCB0aGVtLiAgXG5cdFx0IElnbm9yZWQsIHdoZW4gZHVyYXRpb24gaXMgYDBgLlxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nfSBbc2V0dGluZ3Muc3BhY2VyQ2xhc3M9XCJzY3JvbGxtYWdpYy1waW4tc3BhY2VyXCJdIC0gQ2xhc3NuYW1lIG9mIHRoZSBwaW4gc3BhY2VyIGVsZW1lbnQsIHdoaWNoIGlzIHVzZWQgdG8gcmVwbGFjZSB0aGUgZWxlbWVudC5cblx0XHQgKlxuXHRcdCAqIEByZXR1cm5zIHtTY2VuZX0gUGFyZW50IG9iamVjdCBmb3IgY2hhaW5pbmcuXG5cdFx0ICovXG5cdFx0dGhpcy5zZXRQaW4gPSBmdW5jdGlvbiAoZWxlbWVudCwgc2V0dGluZ3MpIHtcblx0XHRcdHZhclxuXHRcdFx0ZGVmYXVsdFNldHRpbmdzID0ge1xuXHRcdFx0XHRwdXNoRm9sbG93ZXJzOiB0cnVlLFxuXHRcdFx0XHRzcGFjZXJDbGFzczogXCJzY3JvbGxtYWdpYy1waW4tc3BhY2VyXCJcblx0XHRcdH07XG5cdFx0XHRzZXR0aW5ncyA9IF91dGlsLmV4dGVuZCh7fSwgZGVmYXVsdFNldHRpbmdzLCBzZXR0aW5ncyk7XG5cblx0XHRcdC8vIHZhbGlkYXRlIEVsZW1lbnRcblx0XHRcdGVsZW1lbnQgPSBfdXRpbC5nZXQuZWxlbWVudHMoZWxlbWVudClbMF07XG5cdFx0XHRpZiAoIWVsZW1lbnQpIHtcblx0XHRcdFx0bG9nKDEsIFwiRVJST1IgY2FsbGluZyBtZXRob2QgJ3NldFBpbigpJzogSW52YWxpZCBwaW4gZWxlbWVudCBzdXBwbGllZC5cIik7XG5cdFx0XHRcdHJldHVybiBTY2VuZTsgLy8gY2FuY2VsXG5cdFx0XHR9IGVsc2UgaWYgKF91dGlsLmNzcyhlbGVtZW50LCBcInBvc2l0aW9uXCIpID09PSBcImZpeGVkXCIpIHtcblx0XHRcdFx0bG9nKDEsIFwiRVJST1IgY2FsbGluZyBtZXRob2QgJ3NldFBpbigpJzogUGluIGRvZXMgbm90IHdvcmsgd2l0aCBlbGVtZW50cyB0aGF0IGFyZSBwb3NpdGlvbmVkICdmaXhlZCcuXCIpO1xuXHRcdFx0XHRyZXR1cm4gU2NlbmU7IC8vIGNhbmNlbFxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoX3BpbikgeyAvLyBwcmVleGlzdGluZyBwaW4/XG5cdFx0XHRcdGlmIChfcGluID09PSBlbGVtZW50KSB7XG5cdFx0XHRcdFx0Ly8gc2FtZSBwaW4gd2UgYWxyZWFkeSBoYXZlIC0+IGRvIG5vdGhpbmdcblx0XHRcdFx0XHRyZXR1cm4gU2NlbmU7IC8vIGNhbmNlbFxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIGtpbGwgb2xkIHBpblxuXHRcdFx0XHRcdFNjZW5lLnJlbW92ZVBpbigpO1xuXHRcdFx0XHR9XG5cblx0XHRcdH1cblx0XHRcdF9waW4gPSBlbGVtZW50O1xuXG5cdFx0XHR2YXJcblx0XHRcdHBhcmVudERpc3BsYXkgPSBfcGluLnBhcmVudE5vZGUuc3R5bGUuZGlzcGxheSxcblx0XHRcdFx0Ym91bmRzUGFyYW1zID0gW1widG9wXCIsIFwibGVmdFwiLCBcImJvdHRvbVwiLCBcInJpZ2h0XCIsIFwibWFyZ2luXCIsIFwibWFyZ2luTGVmdFwiLCBcIm1hcmdpblJpZ2h0XCIsIFwibWFyZ2luVG9wXCIsIFwibWFyZ2luQm90dG9tXCJdO1xuXG5cdFx0XHRfcGluLnBhcmVudE5vZGUuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgLy8gaGFjayBzdGFydCB0byBmb3JjZSBjc3MgdG8gcmV0dXJuIHN0eWxlc2hlZXQgdmFsdWVzIGluc3RlYWQgb2YgY2FsY3VsYXRlZCBweCB2YWx1ZXMuXG5cdFx0XHR2YXJcblx0XHRcdGluRmxvdyA9IF91dGlsLmNzcyhfcGluLCBcInBvc2l0aW9uXCIpICE9IFwiYWJzb2x1dGVcIixcblx0XHRcdFx0cGluQ1NTID0gX3V0aWwuY3NzKF9waW4sIGJvdW5kc1BhcmFtcy5jb25jYXQoW1wiZGlzcGxheVwiXSkpLFxuXHRcdFx0XHRzaXplQ1NTID0gX3V0aWwuY3NzKF9waW4sIFtcIndpZHRoXCIsIFwiaGVpZ2h0XCJdKTtcblx0XHRcdF9waW4ucGFyZW50Tm9kZS5zdHlsZS5kaXNwbGF5ID0gcGFyZW50RGlzcGxheTsgLy8gaGFjayBlbmQuXG5cdFx0XHRpZiAoIWluRmxvdyAmJiBzZXR0aW5ncy5wdXNoRm9sbG93ZXJzKSB7XG5cdFx0XHRcdGxvZygyLCBcIldBUk5JTkc6IElmIHRoZSBwaW5uZWQgZWxlbWVudCBpcyBwb3NpdGlvbmVkIGFic29sdXRlbHkgcHVzaEZvbGxvd2VycyB3aWxsIGJlIGRpc2FibGVkLlwiKTtcblx0XHRcdFx0c2V0dGluZ3MucHVzaEZvbGxvd2VycyA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0d2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyAvLyB3YWl0IHVudGlsIGFsbCBmaW5pc2hlZCwgYmVjYXVzZSB3aXRoIHJlc3BvbnNpdmUgZHVyYXRpb24gaXQgd2lsbCBvbmx5IGJlIHNldCBhZnRlciBzY2VuZSBpcyBhZGRlZCB0byBjb250cm9sbGVyXG5cdFx0XHRcdGlmIChfcGluICYmIF9vcHRpb25zLmR1cmF0aW9uID09PSAwICYmIHNldHRpbmdzLnB1c2hGb2xsb3dlcnMpIHtcblx0XHRcdFx0XHRsb2coMiwgXCJXQVJOSU5HOiBwdXNoRm9sbG93ZXJzID1cIiwgdHJ1ZSwgXCJoYXMgbm8gZWZmZWN0LCB3aGVuIHNjZW5lIGR1cmF0aW9uIGlzIDAuXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LCAwKTtcblxuXHRcdFx0Ly8gY3JlYXRlIHNwYWNlciBhbmQgaW5zZXJ0XG5cdFx0XHR2YXJcblx0XHRcdHNwYWNlciA9IF9waW4ucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIF9waW4pLFxuXHRcdFx0XHRzcGFjZXJDU1MgPSBfdXRpbC5leHRlbmQocGluQ1NTLCB7XG5cdFx0XHRcdFx0cG9zaXRpb246IGluRmxvdyA/IFwicmVsYXRpdmVcIiA6IFwiYWJzb2x1dGVcIixcblx0XHRcdFx0XHRib3hTaXppbmc6IFwiY29udGVudC1ib3hcIixcblx0XHRcdFx0XHRtb3pCb3hTaXppbmc6IFwiY29udGVudC1ib3hcIixcblx0XHRcdFx0XHR3ZWJraXRCb3hTaXppbmc6IFwiY29udGVudC1ib3hcIlxuXHRcdFx0XHR9KTtcblxuXHRcdFx0aWYgKCFpbkZsb3cpIHsgLy8gY29weSBzaXplIGlmIHBvc2l0aW9uZWQgYWJzb2x1dGVseSwgdG8gd29yayBmb3IgYm90dG9tL3JpZ2h0IHBvc2l0aW9uZWQgZWxlbWVudHMuXG5cdFx0XHRcdF91dGlsLmV4dGVuZChzcGFjZXJDU1MsIF91dGlsLmNzcyhfcGluLCBbXCJ3aWR0aFwiLCBcImhlaWdodFwiXSkpO1xuXHRcdFx0fVxuXG5cdFx0XHRfdXRpbC5jc3Moc3BhY2VyLCBzcGFjZXJDU1MpO1xuXHRcdFx0c3BhY2VyLnNldEF0dHJpYnV0ZShQSU5fU1BBQ0VSX0FUVFJJQlVURSwgXCJcIik7XG5cdFx0XHRfdXRpbC5hZGRDbGFzcyhzcGFjZXIsIHNldHRpbmdzLnNwYWNlckNsYXNzKTtcblxuXHRcdFx0Ly8gc2V0IHRoZSBwaW4gT3B0aW9uc1xuXHRcdFx0X3Bpbk9wdGlvbnMgPSB7XG5cdFx0XHRcdHNwYWNlcjogc3BhY2VyLFxuXHRcdFx0XHRyZWxTaXplOiB7IC8vIHNhdmUgaWYgc2l6ZSBpcyBkZWZpbmVkIHVzaW5nICUgdmFsdWVzLiBpZiBzbywgaGFuZGxlIHNwYWNlciByZXNpemUgZGlmZmVyZW50bHkuLi5cblx0XHRcdFx0XHR3aWR0aDogc2l6ZUNTUy53aWR0aC5zbGljZSgtMSkgPT09IFwiJVwiLFxuXHRcdFx0XHRcdGhlaWdodDogc2l6ZUNTUy5oZWlnaHQuc2xpY2UoLTEpID09PSBcIiVcIixcblx0XHRcdFx0XHRhdXRvRnVsbFdpZHRoOiBzaXplQ1NTLndpZHRoID09PSBcImF1dG9cIiAmJiBpbkZsb3cgJiYgX3V0aWwuaXNNYXJnaW5Db2xsYXBzZVR5cGUocGluQ1NTLmRpc3BsYXkpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHB1c2hGb2xsb3dlcnM6IHNldHRpbmdzLnB1c2hGb2xsb3dlcnMsXG5cdFx0XHRcdGluRmxvdzogaW5GbG93LFxuXHRcdFx0XHQvLyBzdG9yZXMgaWYgdGhlIGVsZW1lbnQgdGFrZXMgdXAgc3BhY2UgaW4gdGhlIGRvY3VtZW50IGZsb3dcblx0XHRcdH07XG5cblx0XHRcdGlmICghX3Bpbi5fX19vcmlnU3R5bGUpIHtcblx0XHRcdFx0X3Bpbi5fX19vcmlnU3R5bGUgPSB7fTtcblx0XHRcdFx0dmFyXG5cdFx0XHRcdHBpbklubGluZUNTUyA9IF9waW4uc3R5bGUsXG5cdFx0XHRcdFx0Y29weVN0eWxlcyA9IGJvdW5kc1BhcmFtcy5jb25jYXQoW1wid2lkdGhcIiwgXCJoZWlnaHRcIiwgXCJwb3NpdGlvblwiLCBcImJveFNpemluZ1wiLCBcIm1vekJveFNpemluZ1wiLCBcIndlYmtpdEJveFNpemluZ1wiXSk7XG5cdFx0XHRcdGNvcHlTdHlsZXMuZm9yRWFjaChmdW5jdGlvbiAodmFsKSB7XG5cdFx0XHRcdFx0X3Bpbi5fX19vcmlnU3R5bGVbdmFsXSA9IHBpbklubGluZUNTU1t2YWxdIHx8IFwiXCI7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBpZiByZWxhdGl2ZSBzaXplLCB0cmFuc2ZlciBpdCB0byBzcGFjZXIgYW5kIG1ha2UgcGluIGNhbGN1bGF0ZSBpdC4uLlxuXHRcdFx0aWYgKF9waW5PcHRpb25zLnJlbFNpemUud2lkdGgpIHtcblx0XHRcdFx0X3V0aWwuY3NzKHNwYWNlciwge1xuXHRcdFx0XHRcdHdpZHRoOiBzaXplQ1NTLndpZHRoXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0aWYgKF9waW5PcHRpb25zLnJlbFNpemUuaGVpZ2h0KSB7XG5cdFx0XHRcdF91dGlsLmNzcyhzcGFjZXIsIHtcblx0XHRcdFx0XHRoZWlnaHQ6IHNpemVDU1MuaGVpZ2h0XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBub3cgcGxhY2UgdGhlIHBpbiBlbGVtZW50IGluc2lkZSB0aGUgc3BhY2VyXHRcblx0XHRcdHNwYWNlci5hcHBlbmRDaGlsZChfcGluKTtcblx0XHRcdC8vIGFuZCBzZXQgbmV3IGNzc1xuXHRcdFx0X3V0aWwuY3NzKF9waW4sIHtcblx0XHRcdFx0cG9zaXRpb246IGluRmxvdyA/IFwicmVsYXRpdmVcIiA6IFwiYWJzb2x1dGVcIixcblx0XHRcdFx0bWFyZ2luOiBcImF1dG9cIixcblx0XHRcdFx0dG9wOiBcImF1dG9cIixcblx0XHRcdFx0bGVmdDogXCJhdXRvXCIsXG5cdFx0XHRcdGJvdHRvbTogXCJhdXRvXCIsXG5cdFx0XHRcdHJpZ2h0OiBcImF1dG9cIlxuXHRcdFx0fSk7XG5cblx0XHRcdGlmIChfcGluT3B0aW9ucy5yZWxTaXplLndpZHRoIHx8IF9waW5PcHRpb25zLnJlbFNpemUuYXV0b0Z1bGxXaWR0aCkge1xuXHRcdFx0XHRfdXRpbC5jc3MoX3Bpbiwge1xuXHRcdFx0XHRcdGJveFNpemluZzogXCJib3JkZXItYm94XCIsXG5cdFx0XHRcdFx0bW96Qm94U2l6aW5nOiBcImJvcmRlci1ib3hcIixcblx0XHRcdFx0XHR3ZWJraXRCb3hTaXppbmc6IFwiYm9yZGVyLWJveFwiXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBhZGQgbGlzdGVuZXIgdG8gZG9jdW1lbnQgdG8gdXBkYXRlIHBpbiBwb3NpdGlvbiBpbiBjYXNlIGNvbnRyb2xsZXIgaXMgbm90IHRoZSBkb2N1bWVudC5cblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB1cGRhdGVQaW5JbkNvbnRhaW5lcik7XG5cdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdXBkYXRlUGluSW5Db250YWluZXIpO1xuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHVwZGF0ZVJlbGF0aXZlUGluU3BhY2VyKTtcblx0XHRcdC8vIGFkZCBtb3VzZXdoZWVsIGxpc3RlbmVyIHRvIGNhdGNoIHNjcm9sbHMgb3ZlciBmaXhlZCBlbGVtZW50c1xuXHRcdFx0X3Bpbi5hZGRFdmVudExpc3RlbmVyKFwibW91c2V3aGVlbFwiLCBvbk1vdXNld2hlZWxPdmVyUGluKTtcblx0XHRcdF9waW4uYWRkRXZlbnRMaXN0ZW5lcihcIkRPTU1vdXNlU2Nyb2xsXCIsIG9uTW91c2V3aGVlbE92ZXJQaW4pO1xuXG5cdFx0XHRsb2coMywgXCJhZGRlZCBwaW5cIik7XG5cblx0XHRcdC8vIGZpbmFsbHkgdXBkYXRlIHRoZSBwaW4gdG8gaW5pdFxuXHRcdFx0dXBkYXRlUGluU3RhdGUoKTtcblxuXHRcdFx0cmV0dXJuIFNjZW5lO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZW1vdmUgdGhlIHBpbiBmcm9tIHRoZSBzY2VuZS5cblx0XHQgKiBAbWV0aG9kIFNjcm9sbE1hZ2ljLlNjZW5lI3JlbW92ZVBpblxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogLy8gcmVtb3ZlIHRoZSBwaW4gZnJvbSB0aGUgc2NlbmUgd2l0aG91dCByZXNldHRpbmcgaXQgKHRoZSBzcGFjZXIgaXMgbm90IHJlbW92ZWQpXG5cdFx0ICogc2NlbmUucmVtb3ZlUGluKCk7XG5cdFx0ICpcblx0XHQgKiAvLyByZW1vdmUgdGhlIHBpbiBmcm9tIHRoZSBzY2VuZSBhbmQgcmVzZXQgdGhlIHBpbiBlbGVtZW50IHRvIGl0cyBpbml0aWFsIHBvc2l0aW9uIChzcGFjZXIgaXMgcmVtb3ZlZClcblx0XHQgKiBzY2VuZS5yZW1vdmVQaW4odHJ1ZSk7XG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IFtyZXNldD1mYWxzZV0gLSBJZiBgZmFsc2VgIHRoZSBzcGFjZXIgd2lsbCBub3QgYmUgcmVtb3ZlZCBhbmQgdGhlIGVsZW1lbnQncyBwb3NpdGlvbiB3aWxsIG5vdCBiZSByZXNldC5cblx0XHQgKiBAcmV0dXJucyB7U2NlbmV9IFBhcmVudCBvYmplY3QgZm9yIGNoYWluaW5nLlxuXHRcdCAqL1xuXHRcdHRoaXMucmVtb3ZlUGluID0gZnVuY3Rpb24gKHJlc2V0KSB7XG5cdFx0XHRpZiAoX3Bpbikge1xuXHRcdFx0XHRpZiAoX3N0YXRlID09PSBTQ0VORV9TVEFURV9EVVJJTkcpIHtcblx0XHRcdFx0XHR1cGRhdGVQaW5TdGF0ZSh0cnVlKTsgLy8gZm9yY2UgdW5waW4gYXQgcG9zaXRpb25cblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAocmVzZXQgfHwgIV9jb250cm9sbGVyKSB7IC8vIGlmIHRoZXJlJ3Mgbm8gY29udHJvbGxlciBubyBwcm9ncmVzcyB3YXMgbWFkZSBhbnl3YXkuLi5cblx0XHRcdFx0XHR2YXIgcGluVGFyZ2V0ID0gX3Bpbk9wdGlvbnMuc3BhY2VyLmZpcnN0Q2hpbGQ7IC8vIHVzdWFsbHkgdGhlIHBpbiBlbGVtZW50LCBidXQgbWF5IGJlIGFub3RoZXIgc3BhY2VyIChjYXNjYWRlZCBwaW5zKS4uLlxuXHRcdFx0XHRcdGlmIChwaW5UYXJnZXQuaGFzQXR0cmlidXRlKFBJTl9TUEFDRVJfQVRUUklCVVRFKSkgeyAvLyBjb3B5IG1hcmdpbnMgdG8gY2hpbGQgc3BhY2VyXG5cdFx0XHRcdFx0XHR2YXJcblx0XHRcdFx0XHRcdHN0eWxlID0gX3Bpbk9wdGlvbnMuc3BhY2VyLnN0eWxlLFxuXHRcdFx0XHRcdFx0XHR2YWx1ZXMgPSBbXCJtYXJnaW5cIiwgXCJtYXJnaW5MZWZ0XCIsIFwibWFyZ2luUmlnaHRcIiwgXCJtYXJnaW5Ub3BcIiwgXCJtYXJnaW5Cb3R0b21cIl0sXG5cdFx0XHRcdFx0XHRcdG1hcmdpbnMgPSB7fTtcblx0XHRcdFx0XHRcdHZhbHVlcy5mb3JFYWNoKGZ1bmN0aW9uICh2YWwpIHtcblx0XHRcdFx0XHRcdFx0bWFyZ2luc1t2YWxdID0gc3R5bGVbdmFsXSB8fCBcIlwiO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRfdXRpbC5jc3MocGluVGFyZ2V0LCBtYXJnaW5zKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0X3Bpbk9wdGlvbnMuc3BhY2VyLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHBpblRhcmdldCwgX3Bpbk9wdGlvbnMuc3BhY2VyKTtcblx0XHRcdFx0XHRfcGluT3B0aW9ucy5zcGFjZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChfcGluT3B0aW9ucy5zcGFjZXIpO1xuXHRcdFx0XHRcdGlmICghX3Bpbi5wYXJlbnROb2RlLmhhc0F0dHJpYnV0ZShQSU5fU1BBQ0VSX0FUVFJJQlVURSkpIHsgLy8gaWYgaXQncyB0aGUgbGFzdCBwaW4gZm9yIHRoaXMgZWxlbWVudCAtPiByZXN0b3JlIGlubGluZSBzdHlsZXNcblx0XHRcdFx0XHRcdC8vIFRPRE86IG9ubHkgY29ycmVjdGx5IHNldCBmb3IgZmlyc3QgcGluICh3aGVuIGNhc2NhZGluZykgLSBob3cgdG8gZml4P1xuXHRcdFx0XHRcdFx0X3V0aWwuY3NzKF9waW4sIF9waW4uX19fb3JpZ1N0eWxlKTtcblx0XHRcdFx0XHRcdGRlbGV0ZSBfcGluLl9fX29yaWdTdHlsZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHVwZGF0ZVBpbkluQ29udGFpbmVyKTtcblx0XHRcdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHVwZGF0ZVBpbkluQ29udGFpbmVyKTtcblx0XHRcdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHVwZGF0ZVJlbGF0aXZlUGluU3BhY2VyKTtcblx0XHRcdFx0X3Bpbi5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2V3aGVlbFwiLCBvbk1vdXNld2hlZWxPdmVyUGluKTtcblx0XHRcdFx0X3Bpbi5yZW1vdmVFdmVudExpc3RlbmVyKFwiRE9NTW91c2VTY3JvbGxcIiwgb25Nb3VzZXdoZWVsT3ZlclBpbik7XG5cdFx0XHRcdF9waW4gPSB1bmRlZmluZWQ7XG5cdFx0XHRcdGxvZygzLCBcInJlbW92ZWQgcGluIChyZXNldDogXCIgKyAocmVzZXQgPyBcInRydWVcIiA6IFwiZmFsc2VcIikgKyBcIilcIik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gU2NlbmU7XG5cdFx0fTtcblxuXG5cdFx0dmFyXG5cdFx0X2Nzc0NsYXNzZXMsIF9jc3NDbGFzc0VsZW1zID0gW107XG5cblx0XHRTY2VuZS5vbihcImRlc3Ryb3kuaW50ZXJuYWxcIiwgZnVuY3Rpb24gKGUpIHtcblx0XHRcdFNjZW5lLnJlbW92ZUNsYXNzVG9nZ2xlKGUucmVzZXQpO1xuXHRcdH0pO1xuXHRcdC8qKlxuXHRcdCAqIERlZmluZSBhIGNzcyBjbGFzcyBtb2RpZmljYXRpb24gd2hpbGUgdGhlIHNjZW5lIGlzIGFjdGl2ZS4gIFxuXHRcdCAqIFdoZW4gdGhlIHNjZW5lIHRyaWdnZXJzIHRoZSBjbGFzc2VzIHdpbGwgYmUgYWRkZWQgdG8gdGhlIHN1cHBsaWVkIGVsZW1lbnQgYW5kIHJlbW92ZWQsIHdoZW4gdGhlIHNjZW5lIGlzIG92ZXIuXG5cdFx0ICogSWYgdGhlIHNjZW5lIGR1cmF0aW9uIGlzIDAgdGhlIGNsYXNzZXMgd2lsbCBvbmx5IGJlIHJlbW92ZWQgaWYgdGhlIHVzZXIgc2Nyb2xscyBiYWNrIHBhc3QgdGhlIHN0YXJ0IHBvc2l0aW9uLlxuXHRcdCAqIEBtZXRob2QgU2Nyb2xsTWFnaWMuU2NlbmUjc2V0Q2xhc3NUb2dnbGVcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIGFkZCB0aGUgY2xhc3MgJ215Y2xhc3MnIHRvIHRoZSBlbGVtZW50IHdpdGggdGhlIGlkICdteS1lbGVtJyBmb3IgdGhlIGR1cmF0aW9uIG9mIHRoZSBzY2VuZVxuXHRcdCAqIHNjZW5lLnNldENsYXNzVG9nZ2xlKFwiI215LWVsZW1cIiwgXCJteWNsYXNzXCIpO1xuXHRcdCAqXG5cdFx0ICogLy8gYWRkIG11bHRpcGxlIGNsYXNzZXMgdG8gbXVsdGlwbGUgZWxlbWVudHMgZGVmaW5lZCBieSB0aGUgc2VsZWN0b3IgJy5jbGFzc0NoYW5nZSdcblx0XHQgKiBzY2VuZS5zZXRDbGFzc1RvZ2dsZShcIi5jbGFzc0NoYW5nZVwiLCBcImNsYXNzMSBjbGFzczIgY2xhc3MzXCIpO1xuXHRcdCAqXG5cdFx0ICogQHBhcmFtIHsoc3RyaW5nfG9iamVjdCl9IGVsZW1lbnQgLSBBIFNlbGVjdG9yIHRhcmdldGluZyBvbmUgb3IgbW9yZSBlbGVtZW50cyBvciBhIERPTSBvYmplY3QgdGhhdCBpcyBzdXBwb3NlZCB0byBiZSBtb2RpZmllZC5cblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NlcyAtIE9uZSBvciBtb3JlIENsYXNzbmFtZXMgKHNlcGFyYXRlZCBieSBzcGFjZSkgdGhhdCBzaG91bGQgYmUgYWRkZWQgdG8gdGhlIGVsZW1lbnQgZHVyaW5nIHRoZSBzY2VuZS5cblx0XHQgKlxuXHRcdCAqIEByZXR1cm5zIHtTY2VuZX0gUGFyZW50IG9iamVjdCBmb3IgY2hhaW5pbmcuXG5cdFx0ICovXG5cdFx0dGhpcy5zZXRDbGFzc1RvZ2dsZSA9IGZ1bmN0aW9uIChlbGVtZW50LCBjbGFzc2VzKSB7XG5cdFx0XHR2YXIgZWxlbXMgPSBfdXRpbC5nZXQuZWxlbWVudHMoZWxlbWVudCk7XG5cdFx0XHRpZiAoZWxlbXMubGVuZ3RoID09PSAwIHx8ICFfdXRpbC50eXBlLlN0cmluZyhjbGFzc2VzKSkge1xuXHRcdFx0XHRsb2coMSwgXCJFUlJPUiBjYWxsaW5nIG1ldGhvZCAnc2V0Q2xhc3NUb2dnbGUoKSc6IEludmFsaWQgXCIgKyAoZWxlbXMubGVuZ3RoID09PSAwID8gXCJlbGVtZW50XCIgOiBcImNsYXNzZXNcIikgKyBcIiBzdXBwbGllZC5cIik7XG5cdFx0XHRcdHJldHVybiBTY2VuZTtcblx0XHRcdH1cblx0XHRcdGlmIChfY3NzQ2xhc3NFbGVtcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdC8vIHJlbW92ZSBvbGQgb25lc1xuXHRcdFx0XHRTY2VuZS5yZW1vdmVDbGFzc1RvZ2dsZSgpO1xuXHRcdFx0fVxuXHRcdFx0X2Nzc0NsYXNzZXMgPSBjbGFzc2VzO1xuXHRcdFx0X2Nzc0NsYXNzRWxlbXMgPSBlbGVtcztcblx0XHRcdFNjZW5lLm9uKFwiZW50ZXIuaW50ZXJuYWxfY2xhc3MgbGVhdmUuaW50ZXJuYWxfY2xhc3NcIiwgZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0dmFyIHRvZ2dsZSA9IGUudHlwZSA9PT0gXCJlbnRlclwiID8gX3V0aWwuYWRkQ2xhc3MgOiBfdXRpbC5yZW1vdmVDbGFzcztcblx0XHRcdFx0X2Nzc0NsYXNzRWxlbXMuZm9yRWFjaChmdW5jdGlvbiAoZWxlbSwga2V5KSB7XG5cdFx0XHRcdFx0dG9nZ2xlKGVsZW0sIF9jc3NDbGFzc2VzKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBTY2VuZTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogUmVtb3ZlIHRoZSBjbGFzcyBiaW5kaW5nIGZyb20gdGhlIHNjZW5lLlxuXHRcdCAqIEBtZXRob2QgU2Nyb2xsTWFnaWMuU2NlbmUjcmVtb3ZlQ2xhc3NUb2dnbGVcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIHJlbW92ZSBjbGFzcyBiaW5kaW5nIGZyb20gdGhlIHNjZW5lIHdpdGhvdXQgcmVzZXRcblx0XHQgKiBzY2VuZS5yZW1vdmVDbGFzc1RvZ2dsZSgpO1xuXHRcdCAqXG5cdFx0ICogLy8gcmVtb3ZlIGNsYXNzIGJpbmRpbmcgYW5kIHJlbW92ZSB0aGUgY2hhbmdlcyBpdCBjYXVzZWRcblx0XHQgKiBzY2VuZS5yZW1vdmVDbGFzc1RvZ2dsZSh0cnVlKTtcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gW3Jlc2V0PWZhbHNlXSAtIElmIGBmYWxzZWAgYW5kIHRoZSBjbGFzc2VzIGFyZSBjdXJyZW50bHkgYWN0aXZlLCB0aGV5IHdpbGwgcmVtYWluIG9uIHRoZSBlbGVtZW50LiBJZiBgdHJ1ZWAgdGhleSB3aWxsIGJlIHJlbW92ZWQuXG5cdFx0ICogQHJldHVybnMge1NjZW5lfSBQYXJlbnQgb2JqZWN0IGZvciBjaGFpbmluZy5cblx0XHQgKi9cblx0XHR0aGlzLnJlbW92ZUNsYXNzVG9nZ2xlID0gZnVuY3Rpb24gKHJlc2V0KSB7XG5cdFx0XHRpZiAocmVzZXQpIHtcblx0XHRcdFx0X2Nzc0NsYXNzRWxlbXMuZm9yRWFjaChmdW5jdGlvbiAoZWxlbSwga2V5KSB7XG5cdFx0XHRcdFx0X3V0aWwucmVtb3ZlQ2xhc3MoZWxlbSwgX2Nzc0NsYXNzZXMpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdFNjZW5lLm9mZihcInN0YXJ0LmludGVybmFsX2NsYXNzIGVuZC5pbnRlcm5hbF9jbGFzc1wiKTtcblx0XHRcdF9jc3NDbGFzc2VzID0gdW5kZWZpbmVkO1xuXHRcdFx0X2Nzc0NsYXNzRWxlbXMgPSBbXTtcblx0XHRcdHJldHVybiBTY2VuZTtcblx0XHR9O1xuXG5cdFx0Ly8gSU5JVFxuXHRcdGNvbnN0cnVjdCgpO1xuXHRcdHJldHVybiBTY2VuZTtcblx0fTtcblxuXHQvLyBzdG9yZSBwYWdld2lkZSBzY2VuZSBvcHRpb25zXG5cdHZhciBTQ0VORV9PUFRJT05TID0ge1xuXHRcdGRlZmF1bHRzOiB7XG5cdFx0XHRkdXJhdGlvbjogMCxcblx0XHRcdG9mZnNldDogMCxcblx0XHRcdHRyaWdnZXJFbGVtZW50OiB1bmRlZmluZWQsXG5cdFx0XHR0cmlnZ2VySG9vazogMC41LFxuXHRcdFx0cmV2ZXJzZTogdHJ1ZSxcblx0XHRcdGxvZ2xldmVsOiAyXG5cdFx0fSxcblx0XHR2YWxpZGF0ZToge1xuXHRcdFx0b2Zmc2V0OiBmdW5jdGlvbiAodmFsKSB7XG5cdFx0XHRcdHZhbCA9IHBhcnNlRmxvYXQodmFsKTtcblx0XHRcdFx0aWYgKCFfdXRpbC50eXBlLk51bWJlcih2YWwpKSB7XG5cdFx0XHRcdFx0dGhyb3cgW1wiSW52YWxpZCB2YWx1ZSBmb3Igb3B0aW9uIFxcXCJvZmZzZXRcXFwiOlwiLCB2YWxdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB2YWw7XG5cdFx0XHR9LFxuXHRcdFx0dHJpZ2dlckVsZW1lbnQ6IGZ1bmN0aW9uICh2YWwpIHtcblx0XHRcdFx0dmFsID0gdmFsIHx8IHVuZGVmaW5lZDtcblx0XHRcdFx0aWYgKHZhbCkge1xuXHRcdFx0XHRcdHZhciBlbGVtID0gX3V0aWwuZ2V0LmVsZW1lbnRzKHZhbClbMF07XG5cdFx0XHRcdFx0aWYgKGVsZW0gJiYgZWxlbS5wYXJlbnROb2RlKSB7XG5cdFx0XHRcdFx0XHR2YWwgPSBlbGVtO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR0aHJvdyBbXCJFbGVtZW50IGRlZmluZWQgaW4gb3B0aW9uIFxcXCJ0cmlnZ2VyRWxlbWVudFxcXCIgd2FzIG5vdCBmb3VuZDpcIiwgdmFsXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHZhbDtcblx0XHRcdH0sXG5cdFx0XHR0cmlnZ2VySG9vazogZnVuY3Rpb24gKHZhbCkge1xuXHRcdFx0XHR2YXIgdHJhbnNsYXRlID0ge1xuXHRcdFx0XHRcdFwib25DZW50ZXJcIjogMC41LFxuXHRcdFx0XHRcdFwib25FbnRlclwiOiAxLFxuXHRcdFx0XHRcdFwib25MZWF2ZVwiOiAwXG5cdFx0XHRcdH07XG5cdFx0XHRcdGlmIChfdXRpbC50eXBlLk51bWJlcih2YWwpKSB7XG5cdFx0XHRcdFx0dmFsID0gTWF0aC5tYXgoMCwgTWF0aC5taW4ocGFyc2VGbG9hdCh2YWwpLCAxKSk7IC8vICBtYWtlIHN1cmUgaXRzIGJldHdlZWVuIDAgYW5kIDFcblx0XHRcdFx0fSBlbHNlIGlmICh2YWwgaW4gdHJhbnNsYXRlKSB7XG5cdFx0XHRcdFx0dmFsID0gdHJhbnNsYXRlW3ZhbF07XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhyb3cgW1wiSW52YWxpZCB2YWx1ZSBmb3Igb3B0aW9uIFxcXCJ0cmlnZ2VySG9va1xcXCI6IFwiLCB2YWxdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB2YWw7XG5cdFx0XHR9LFxuXHRcdFx0cmV2ZXJzZTogZnVuY3Rpb24gKHZhbCkge1xuXHRcdFx0XHRyZXR1cm4gISF2YWw7IC8vIGZvcmNlIGJvb2xlYW5cblx0XHRcdH0sXG5cdFx0XHRsb2dsZXZlbDogZnVuY3Rpb24gKHZhbCkge1xuXHRcdFx0XHR2YWwgPSBwYXJzZUludCh2YWwpO1xuXHRcdFx0XHRpZiAoIV91dGlsLnR5cGUuTnVtYmVyKHZhbCkgfHwgdmFsIDwgMCB8fCB2YWwgPiAzKSB7XG5cdFx0XHRcdFx0dGhyb3cgW1wiSW52YWxpZCB2YWx1ZSBmb3Igb3B0aW9uIFxcXCJsb2dsZXZlbFxcXCI6XCIsIHZhbF07XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHZhbDtcblx0XHRcdH1cblx0XHR9LFxuXHRcdC8vIGhvbGRlciBmb3IgIHZhbGlkYXRpb24gbWV0aG9kcy4gZHVyYXRpb24gdmFsaWRhdGlvbiBpcyBoYW5kbGVkIGluICdnZXR0ZXJzLXNldHRlcnMuanMnXG5cdFx0c2hpZnRzOiBbXCJkdXJhdGlvblwiLCBcIm9mZnNldFwiLCBcInRyaWdnZXJIb29rXCJdLFxuXHRcdC8vIGxpc3Qgb2Ygb3B0aW9ucyB0aGF0IHRyaWdnZXIgYSBgc2hpZnRgIGV2ZW50XG5cdH07XG4vKlxuICogbWV0aG9kIHVzZWQgdG8gYWRkIGFuIG9wdGlvbiB0byBTY3JvbGxNYWdpYyBTY2VuZXMuXG4gKiBUT0RPOiBET0MgKHByaXZhdGUgZm9yIGRldilcbiAqL1xuXHRTY3JvbGxNYWdpYy5TY2VuZS5hZGRPcHRpb24gPSBmdW5jdGlvbiAobmFtZSwgZGVmYXVsdFZhbHVlLCB2YWxpZGF0aW9uQ2FsbGJhY2ssIHNoaWZ0cykge1xuXHRcdGlmICghKG5hbWUgaW4gU0NFTkVfT1BUSU9OUy5kZWZhdWx0cykpIHtcblx0XHRcdFNDRU5FX09QVElPTlMuZGVmYXVsdHNbbmFtZV0gPSBkZWZhdWx0VmFsdWU7XG5cdFx0XHRTQ0VORV9PUFRJT05TLnZhbGlkYXRlW25hbWVdID0gdmFsaWRhdGlvbkNhbGxiYWNrO1xuXHRcdFx0aWYgKHNoaWZ0cykge1xuXHRcdFx0XHRTQ0VORV9PUFRJT05TLnNoaWZ0cy5wdXNoKG5hbWUpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRTY3JvbGxNYWdpYy5fdXRpbC5sb2coMSwgXCJbc3RhdGljXSBTY3JvbGxNYWdpYy5TY2VuZSAtPiBDYW5ub3QgYWRkIFNjZW5lIG9wdGlvbiAnXCIgKyBuYW1lICsgXCInLCBiZWNhdXNlIGl0IGFscmVhZHkgZXhpc3RzLlwiKTtcblx0XHR9XG5cdH07XG5cdC8vIGluc3RhbmNlIGV4dGVuc2lvbiBmdW5jdGlvbiBmb3IgcGx1Z2luc1xuXHQvLyBUT0RPOiBET0MgKHByaXZhdGUgZm9yIGRldilcblx0U2Nyb2xsTWFnaWMuU2NlbmUuZXh0ZW5kID0gZnVuY3Rpb24gKGV4dGVuc2lvbikge1xuXHRcdHZhciBvbGRDbGFzcyA9IHRoaXM7XG5cdFx0U2Nyb2xsTWFnaWMuU2NlbmUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRvbGRDbGFzcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdFx0dGhpcy4kc3VwZXIgPSBfdXRpbC5leHRlbmQoe30sIHRoaXMpOyAvLyBjb3B5IHBhcmVudCBzdGF0ZVxuXHRcdFx0cmV0dXJuIGV4dGVuc2lvbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpIHx8IHRoaXM7XG5cdFx0fTtcblx0XHRfdXRpbC5leHRlbmQoU2Nyb2xsTWFnaWMuU2NlbmUsIG9sZENsYXNzKTsgLy8gY29weSBwcm9wZXJ0aWVzXG5cdFx0U2Nyb2xsTWFnaWMuU2NlbmUucHJvdG90eXBlID0gb2xkQ2xhc3MucHJvdG90eXBlOyAvLyBjb3B5IHByb3RvdHlwZVxuXHRcdFNjcm9sbE1hZ2ljLlNjZW5lLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFNjcm9sbE1hZ2ljLlNjZW5lOyAvLyByZXN0b3JlIGNvbnN0cnVjdG9yXG5cdH07XG5cblxuXG5cdC8qKlxuXHQgKiBUT0RPOiBET0NTIChwcml2YXRlIGZvciBkZXYpXG5cdCAqIEBjbGFzc1xuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblxuXHRTY3JvbGxNYWdpYy5FdmVudCA9IGZ1bmN0aW9uICh0eXBlLCBuYW1lc3BhY2UsIHRhcmdldCwgdmFycykge1xuXHRcdHZhcnMgPSB2YXJzIHx8IHt9O1xuXHRcdGZvciAodmFyIGtleSBpbiB2YXJzKSB7XG5cdFx0XHR0aGlzW2tleV0gPSB2YXJzW2tleV07XG5cdFx0fVxuXHRcdHRoaXMudHlwZSA9IHR5cGU7XG5cdFx0dGhpcy50YXJnZXQgPSB0aGlzLmN1cnJlbnRUYXJnZXQgPSB0YXJnZXQ7XG5cdFx0dGhpcy5uYW1lc3BhY2UgPSBuYW1lc3BhY2UgfHwgJyc7XG5cdFx0dGhpcy50aW1lU3RhbXAgPSB0aGlzLnRpbWVzdGFtcCA9IERhdGUubm93KCk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cbi8qXG4gKiBUT0RPOiBET0NTIChwcml2YXRlIGZvciBkZXYpXG4gKi9cblxuXHR2YXIgX3V0aWwgPSBTY3JvbGxNYWdpYy5fdXRpbCA9IChmdW5jdGlvbiAod2luZG93KSB7XG5cdFx0dmFyIFUgPSB7fSxcblx0XHRcdGk7XG5cblx0XHQvKipcblx0XHQgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQgKiBpbnRlcm5hbCBoZWxwZXJzXG5cdFx0ICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0ICovXG5cblx0XHQvLyBwYXJzZSBmbG9hdCBhbmQgZmFsbCBiYWNrIHRvIDAuXG5cdFx0dmFyIGZsb2F0dmFsID0gZnVuY3Rpb24gKG51bWJlcikge1xuXHRcdFx0cmV0dXJuIHBhcnNlRmxvYXQobnVtYmVyKSB8fCAwO1xuXHRcdH07XG5cdFx0Ly8gZ2V0IGN1cnJlbnQgc3R5bGUgSUUgc2FmZSAob3RoZXJ3aXNlIElFIHdvdWxkIHJldHVybiBjYWxjdWxhdGVkIHZhbHVlcyBmb3IgJ2F1dG8nKVxuXHRcdHZhciBfZ2V0Q29tcHV0ZWRTdHlsZSA9IGZ1bmN0aW9uIChlbGVtKSB7XG5cdFx0XHRyZXR1cm4gZWxlbS5jdXJyZW50U3R5bGUgPyBlbGVtLmN1cnJlbnRTdHlsZSA6IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW0pO1xuXHRcdH07XG5cblx0XHQvLyBnZXQgZWxlbWVudCBkaW1lbnNpb24gKHdpZHRoIG9yIGhlaWdodClcblx0XHR2YXIgX2RpbWVuc2lvbiA9IGZ1bmN0aW9uICh3aGljaCwgZWxlbSwgb3V0ZXIsIGluY2x1ZGVNYXJnaW4pIHtcblx0XHRcdGVsZW0gPSAoZWxlbSA9PT0gZG9jdW1lbnQpID8gd2luZG93IDogZWxlbTtcblx0XHRcdGlmIChlbGVtID09PSB3aW5kb3cpIHtcblx0XHRcdFx0aW5jbHVkZU1hcmdpbiA9IGZhbHNlO1xuXHRcdFx0fSBlbHNlIGlmICghX3R5cGUuRG9tRWxlbWVudChlbGVtKSkge1xuXHRcdFx0XHRyZXR1cm4gMDtcblx0XHRcdH1cblx0XHRcdHdoaWNoID0gd2hpY2guY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB3aGljaC5zdWJzdHIoMSkudG9Mb3dlckNhc2UoKTtcblx0XHRcdHZhciBkaW1lbnNpb24gPSAob3V0ZXIgPyBlbGVtWydvZmZzZXQnICsgd2hpY2hdIHx8IGVsZW1bJ291dGVyJyArIHdoaWNoXSA6IGVsZW1bJ2NsaWVudCcgKyB3aGljaF0gfHwgZWxlbVsnaW5uZXInICsgd2hpY2hdKSB8fCAwO1xuXHRcdFx0aWYgKG91dGVyICYmIGluY2x1ZGVNYXJnaW4pIHtcblx0XHRcdFx0dmFyIHN0eWxlID0gX2dldENvbXB1dGVkU3R5bGUoZWxlbSk7XG5cdFx0XHRcdGRpbWVuc2lvbiArPSB3aGljaCA9PT0gJ0hlaWdodCcgPyBmbG9hdHZhbChzdHlsZS5tYXJnaW5Ub3ApICsgZmxvYXR2YWwoc3R5bGUubWFyZ2luQm90dG9tKSA6IGZsb2F0dmFsKHN0eWxlLm1hcmdpbkxlZnQpICsgZmxvYXR2YWwoc3R5bGUubWFyZ2luUmlnaHQpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGRpbWVuc2lvbjtcblx0XHR9O1xuXHRcdC8vIGNvbnZlcnRzICdtYXJnaW4tdG9wJyBpbnRvICdtYXJnaW5Ub3AnXG5cdFx0dmFyIF9jYW1lbENhc2UgPSBmdW5jdGlvbiAoc3RyKSB7XG5cdFx0XHRyZXR1cm4gc3RyLnJlcGxhY2UoL15bXmEtel0rKFthLXpdKS9nLCAnJDEnKS5yZXBsYWNlKC8tKFthLXpdKS9nLCBmdW5jdGlvbiAoZykge1xuXHRcdFx0XHRyZXR1cm4gZ1sxXS50b1VwcGVyQ2FzZSgpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCAqIGV4dGVybmFsIGhlbHBlcnNcblx0XHQgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQgKi9cblxuXHRcdC8vIGV4dGVuZCBvYmog4oCTIHNhbWUgYXMgalF1ZXJ5LmV4dGVuZCh7fSwgb2JqQSwgb2JqQilcblx0XHRVLmV4dGVuZCA9IGZ1bmN0aW9uIChvYmopIHtcblx0XHRcdG9iaiA9IG9iaiB8fCB7fTtcblx0XHRcdGZvciAoaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKCFhcmd1bWVudHNbaV0pIHtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRmb3IgKHZhciBrZXkgaW4gYXJndW1lbnRzW2ldKSB7XG5cdFx0XHRcdFx0aWYgKGFyZ3VtZW50c1tpXS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdFx0XHRvYmpba2V5XSA9IGFyZ3VtZW50c1tpXVtrZXldO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG9iajtcblx0XHR9O1xuXG5cdFx0Ly8gY2hlY2sgaWYgYSBjc3MgZGlzcGxheSB0eXBlIHJlc3VsdHMgaW4gbWFyZ2luLWNvbGxhcHNlIG9yIG5vdFxuXHRcdFUuaXNNYXJnaW5Db2xsYXBzZVR5cGUgPSBmdW5jdGlvbiAoc3RyKSB7XG5cdFx0XHRyZXR1cm4gW1wiYmxvY2tcIiwgXCJmbGV4XCIsIFwibGlzdC1pdGVtXCIsIFwidGFibGVcIiwgXCItd2Via2l0LWJveFwiXS5pbmRleE9mKHN0cikgPiAtMTtcblx0XHR9O1xuXG5cdFx0Ly8gaW1wbGVtZW50YXRpb24gb2YgcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG5cdFx0Ly8gYmFzZWQgb24gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vcGF1bGlyaXNoLzE1Nzk2NzFcblx0XHR2YXJcblx0XHRsYXN0VGltZSA9IDAsXG5cdFx0XHR2ZW5kb3JzID0gWydtcycsICdtb3onLCAnd2Via2l0JywgJ28nXTtcblx0XHR2YXIgX3JlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG5cdFx0dmFyIF9jYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZTtcblx0XHQvLyB0cnkgdmVuZG9yIHByZWZpeGVzIGlmIHRoZSBhYm92ZSBkb2Vzbid0IHdvcmtcblx0XHRmb3IgKGkgPSAwOyAhX3JlcXVlc3RBbmltYXRpb25GcmFtZSAmJiBpIDwgdmVuZG9ycy5sZW5ndGg7ICsraSkge1xuXHRcdFx0X3JlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2ZW5kb3JzW2ldICsgJ1JlcXVlc3RBbmltYXRpb25GcmFtZSddO1xuXHRcdFx0X2NhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93W3ZlbmRvcnNbaV0gKyAnQ2FuY2VsQW5pbWF0aW9uRnJhbWUnXSB8fCB3aW5kb3dbdmVuZG9yc1tpXSArICdDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcblx0XHR9XG5cblx0XHQvLyBmYWxsYmFja3Ncblx0XHRpZiAoIV9yZXF1ZXN0QW5pbWF0aW9uRnJhbWUpIHtcblx0XHRcdF9yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcblx0XHRcdFx0dmFyXG5cdFx0XHRcdGN1cnJUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCksXG5cdFx0XHRcdFx0dGltZVRvQ2FsbCA9IE1hdGgubWF4KDAsIDE2IC0gKGN1cnJUaW1lIC0gbGFzdFRpbWUpKSxcblx0XHRcdFx0XHRpZCA9IHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdGNhbGxiYWNrKGN1cnJUaW1lICsgdGltZVRvQ2FsbCk7XG5cdFx0XHRcdFx0fSwgdGltZVRvQ2FsbCk7XG5cdFx0XHRcdGxhc3RUaW1lID0gY3VyclRpbWUgKyB0aW1lVG9DYWxsO1xuXHRcdFx0XHRyZXR1cm4gaWQ7XG5cdFx0XHR9O1xuXHRcdH1cblx0XHRpZiAoIV9jYW5jZWxBbmltYXRpb25GcmFtZSkge1xuXHRcdFx0X2NhbmNlbEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24gKGlkKSB7XG5cdFx0XHRcdHdpbmRvdy5jbGVhclRpbWVvdXQoaWQpO1xuXHRcdFx0fTtcblx0XHR9XG5cdFx0VS5yQUYgPSBfcmVxdWVzdEFuaW1hdGlvbkZyYW1lLmJpbmQod2luZG93KTtcblx0XHRVLmNBRiA9IF9jYW5jZWxBbmltYXRpb25GcmFtZS5iaW5kKHdpbmRvdyk7XG5cblx0XHR2YXJcblx0XHRsb2dsZXZlbHMgPSBbXCJlcnJvclwiLCBcIndhcm5cIiwgXCJsb2dcIl0sXG5cdFx0XHRjb25zb2xlID0gd2luZG93LmNvbnNvbGUgfHwge307XG5cblx0XHRjb25zb2xlLmxvZyA9IGNvbnNvbGUubG9nIHx8XG5cdFx0ZnVuY3Rpb24gKCkge307IC8vIG5vIGNvbnNvbGUgbG9nLCB3ZWxsIC0gZG8gbm90aGluZyB0aGVuLi4uXG5cdFx0Ly8gbWFrZSBzdXJlIG1ldGhvZHMgZm9yIGFsbCBsZXZlbHMgZXhpc3QuXG5cdFx0Zm9yIChpID0gMDsgaSA8IGxvZ2xldmVscy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIG1ldGhvZCA9IGxvZ2xldmVsc1tpXTtcblx0XHRcdGlmICghY29uc29sZVttZXRob2RdKSB7XG5cdFx0XHRcdGNvbnNvbGVbbWV0aG9kXSA9IGNvbnNvbGUubG9nOyAvLyBwcmVmZXIgLmxvZyBvdmVyIG5vdGhpbmdcblx0XHRcdH1cblx0XHR9XG5cdFx0VS5sb2cgPSBmdW5jdGlvbiAobG9nbGV2ZWwpIHtcblx0XHRcdGlmIChsb2dsZXZlbCA+IGxvZ2xldmVscy5sZW5ndGggfHwgbG9nbGV2ZWwgPD0gMCkgbG9nbGV2ZWwgPSBsb2dsZXZlbHMubGVuZ3RoO1xuXHRcdFx0dmFyIG5vdyA9IG5ldyBEYXRlKCksXG5cdFx0XHRcdHRpbWUgPSAoXCIwXCIgKyBub3cuZ2V0SG91cnMoKSkuc2xpY2UoLTIpICsgXCI6XCIgKyAoXCIwXCIgKyBub3cuZ2V0TWludXRlcygpKS5zbGljZSgtMikgKyBcIjpcIiArIChcIjBcIiArIG5vdy5nZXRTZWNvbmRzKCkpLnNsaWNlKC0yKSArIFwiOlwiICsgKFwiMDBcIiArIG5vdy5nZXRNaWxsaXNlY29uZHMoKSkuc2xpY2UoLTMpLFxuXHRcdFx0XHRtZXRob2QgPSBsb2dsZXZlbHNbbG9nbGV2ZWwgLSAxXSxcblx0XHRcdFx0YXJncyA9IEFycmF5LnByb3RvdHlwZS5zcGxpY2UuY2FsbChhcmd1bWVudHMsIDEpLFxuXHRcdFx0XHRmdW5jID0gRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQuY2FsbChjb25zb2xlW21ldGhvZF0sIGNvbnNvbGUpO1xuXHRcdFx0YXJncy51bnNoaWZ0KHRpbWUpO1xuXHRcdFx0ZnVuYy5hcHBseShjb25zb2xlLCBhcmdzKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0ICogdHlwZSB0ZXN0aW5nXG5cdFx0ICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0ICovXG5cblx0XHR2YXIgX3R5cGUgPSBVLnR5cGUgPSBmdW5jdGlvbiAodikge1xuXHRcdFx0cmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2KS5yZXBsYWNlKC9eXFxbb2JqZWN0ICguKylcXF0kLywgXCIkMVwiKS50b0xvd2VyQ2FzZSgpO1xuXHRcdH07XG5cdFx0X3R5cGUuU3RyaW5nID0gZnVuY3Rpb24gKHYpIHtcblx0XHRcdHJldHVybiBfdHlwZSh2KSA9PT0gJ3N0cmluZyc7XG5cdFx0fTtcblx0XHRfdHlwZS5GdW5jdGlvbiA9IGZ1bmN0aW9uICh2KSB7XG5cdFx0XHRyZXR1cm4gX3R5cGUodikgPT09ICdmdW5jdGlvbic7XG5cdFx0fTtcblx0XHRfdHlwZS5BcnJheSA9IGZ1bmN0aW9uICh2KSB7XG5cdFx0XHRyZXR1cm4gQXJyYXkuaXNBcnJheSh2KTtcblx0XHR9O1xuXHRcdF90eXBlLk51bWJlciA9IGZ1bmN0aW9uICh2KSB7XG5cdFx0XHRyZXR1cm4gIV90eXBlLkFycmF5KHYpICYmICh2IC0gcGFyc2VGbG9hdCh2KSArIDEpID49IDA7XG5cdFx0fTtcblx0XHRfdHlwZS5Eb21FbGVtZW50ID0gZnVuY3Rpb24gKG8pIHtcblx0XHRcdHJldHVybiAoXG5cdFx0XHR0eXBlb2YgSFRNTEVsZW1lbnQgPT09IFwib2JqZWN0XCIgPyBvIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgOiAvL0RPTTJcblx0XHRcdG8gJiYgdHlwZW9mIG8gPT09IFwib2JqZWN0XCIgJiYgbyAhPT0gbnVsbCAmJiBvLm5vZGVUeXBlID09PSAxICYmIHR5cGVvZiBvLm5vZGVOYW1lID09PSBcInN0cmluZ1wiKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0ICogRE9NIEVsZW1lbnQgaW5mb1xuXHRcdCAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCAqL1xuXHRcdC8vIGFsd2F5cyByZXR1cm5zIGEgbGlzdCBvZiBtYXRjaGluZyBET00gZWxlbWVudHMsIGZyb20gYSBzZWxlY3RvciwgYSBET00gZWxlbWVudCBvciBhbiBsaXN0IG9mIGVsZW1lbnRzIG9yIGV2ZW4gYW4gYXJyYXkgb2Ygc2VsZWN0b3JzXG5cdFx0dmFyIF9nZXQgPSBVLmdldCA9IHt9O1xuXHRcdF9nZXQuZWxlbWVudHMgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcblx0XHRcdHZhciBhcnIgPSBbXTtcblx0XHRcdGlmIChfdHlwZS5TdHJpbmcoc2VsZWN0b3IpKSB7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0c2VsZWN0b3IgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcblx0XHRcdFx0fSBjYXRjaCAoZSkgeyAvLyBpbnZhbGlkIHNlbGVjdG9yXG5cdFx0XHRcdFx0cmV0dXJuIGFycjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKF90eXBlKHNlbGVjdG9yKSA9PT0gJ25vZGVsaXN0JyB8fCBfdHlwZS5BcnJheShzZWxlY3RvcikpIHtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIHJlZiA9IGFyci5sZW5ndGggPSBzZWxlY3Rvci5sZW5ndGg7IGkgPCByZWY7IGkrKykgeyAvLyBsaXN0IG9mIGVsZW1lbnRzXG5cdFx0XHRcdFx0dmFyIGVsZW0gPSBzZWxlY3RvcltpXTtcblx0XHRcdFx0XHRhcnJbaV0gPSBfdHlwZS5Eb21FbGVtZW50KGVsZW0pID8gZWxlbSA6IF9nZXQuZWxlbWVudHMoZWxlbSk7IC8vIGlmIG5vdCBhbiBlbGVtZW50LCB0cnkgdG8gcmVzb2x2ZSByZWN1cnNpdmVseVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKF90eXBlLkRvbUVsZW1lbnQoc2VsZWN0b3IpIHx8IHNlbGVjdG9yID09PSBkb2N1bWVudCB8fCBzZWxlY3RvciA9PT0gd2luZG93KSB7XG5cdFx0XHRcdGFyciA9IFtzZWxlY3Rvcl07IC8vIG9ubHkgdGhlIGVsZW1lbnRcblx0XHRcdH1cblx0XHRcdHJldHVybiBhcnI7XG5cdFx0fTtcblx0XHQvLyBnZXQgc2Nyb2xsIHRvcCB2YWx1ZVxuXHRcdF9nZXQuc2Nyb2xsVG9wID0gZnVuY3Rpb24gKGVsZW0pIHtcblx0XHRcdHJldHVybiAoZWxlbSAmJiB0eXBlb2YgZWxlbS5zY3JvbGxUb3AgPT09ICdudW1iZXInKSA/IGVsZW0uc2Nyb2xsVG9wIDogd2luZG93LnBhZ2VZT2Zmc2V0IHx8IDA7XG5cdFx0fTtcblx0XHQvLyBnZXQgc2Nyb2xsIGxlZnQgdmFsdWVcblx0XHRfZ2V0LnNjcm9sbExlZnQgPSBmdW5jdGlvbiAoZWxlbSkge1xuXHRcdFx0cmV0dXJuIChlbGVtICYmIHR5cGVvZiBlbGVtLnNjcm9sbExlZnQgPT09ICdudW1iZXInKSA/IGVsZW0uc2Nyb2xsTGVmdCA6IHdpbmRvdy5wYWdlWE9mZnNldCB8fCAwO1xuXHRcdH07XG5cdFx0Ly8gZ2V0IGVsZW1lbnQgaGVpZ2h0XG5cdFx0X2dldC53aWR0aCA9IGZ1bmN0aW9uIChlbGVtLCBvdXRlciwgaW5jbHVkZU1hcmdpbikge1xuXHRcdFx0cmV0dXJuIF9kaW1lbnNpb24oJ3dpZHRoJywgZWxlbSwgb3V0ZXIsIGluY2x1ZGVNYXJnaW4pO1xuXHRcdH07XG5cdFx0Ly8gZ2V0IGVsZW1lbnQgd2lkdGhcblx0XHRfZ2V0LmhlaWdodCA9IGZ1bmN0aW9uIChlbGVtLCBvdXRlciwgaW5jbHVkZU1hcmdpbikge1xuXHRcdFx0cmV0dXJuIF9kaW1lbnNpb24oJ2hlaWdodCcsIGVsZW0sIG91dGVyLCBpbmNsdWRlTWFyZ2luKTtcblx0XHR9O1xuXG5cdFx0Ly8gZ2V0IGVsZW1lbnQgcG9zaXRpb24gKG9wdGlvbmFsbHkgcmVsYXRpdmUgdG8gdmlld3BvcnQpXG5cdFx0X2dldC5vZmZzZXQgPSBmdW5jdGlvbiAoZWxlbSwgcmVsYXRpdmVUb1ZpZXdwb3J0KSB7XG5cdFx0XHR2YXIgb2Zmc2V0ID0ge1xuXHRcdFx0XHR0b3A6IDAsXG5cdFx0XHRcdGxlZnQ6IDBcblx0XHRcdH07XG5cdFx0XHRpZiAoZWxlbSAmJiBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCkgeyAvLyBjaGVjayBpZiBhdmFpbGFibGVcblx0XHRcdFx0dmFyIHJlY3QgPSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdFx0XHRvZmZzZXQudG9wID0gcmVjdC50b3A7XG5cdFx0XHRcdG9mZnNldC5sZWZ0ID0gcmVjdC5sZWZ0O1xuXHRcdFx0XHRpZiAoIXJlbGF0aXZlVG9WaWV3cG9ydCkgeyAvLyBjbGllbnRSZWN0IGlzIGJ5IGRlZmF1bHQgcmVsYXRpdmUgdG8gdmlld3BvcnQuLi5cblx0XHRcdFx0XHRvZmZzZXQudG9wICs9IF9nZXQuc2Nyb2xsVG9wKCk7XG5cdFx0XHRcdFx0b2Zmc2V0LmxlZnQgKz0gX2dldC5zY3JvbGxMZWZ0KCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiBvZmZzZXQ7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCAqIERPTSBFbGVtZW50IG1hbmlwdWxhdGlvblxuXHRcdCAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCAqL1xuXG5cdFx0VS5hZGRDbGFzcyA9IGZ1bmN0aW9uIChlbGVtLCBjbGFzc25hbWUpIHtcblx0XHRcdGlmIChjbGFzc25hbWUpIHtcblx0XHRcdFx0aWYgKGVsZW0uY2xhc3NMaXN0KSBlbGVtLmNsYXNzTGlzdC5hZGQoY2xhc3NuYW1lKTtcblx0XHRcdFx0ZWxzZSBlbGVtLmNsYXNzTmFtZSArPSAnICcgKyBjbGFzc25hbWU7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRVLnJlbW92ZUNsYXNzID0gZnVuY3Rpb24gKGVsZW0sIGNsYXNzbmFtZSkge1xuXHRcdFx0aWYgKGNsYXNzbmFtZSkge1xuXHRcdFx0XHRpZiAoZWxlbS5jbGFzc0xpc3QpIGVsZW0uY2xhc3NMaXN0LnJlbW92ZShjbGFzc25hbWUpO1xuXHRcdFx0XHRlbHNlIGVsZW0uY2xhc3NOYW1lID0gZWxlbS5jbGFzc05hbWUucmVwbGFjZShuZXcgUmVnRXhwKCcoXnxcXFxcYiknICsgY2xhc3NuYW1lLnNwbGl0KCcgJykuam9pbignfCcpICsgJyhcXFxcYnwkKScsICdnaScpLCAnICcpO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0Ly8gaWYgb3B0aW9ucyBpcyBzdHJpbmcgLT4gcmV0dXJucyBjc3MgdmFsdWVcblx0XHQvLyBpZiBvcHRpb25zIGlzIGFycmF5IC0+IHJldHVybnMgb2JqZWN0IHdpdGggY3NzIHZhbHVlIHBhaXJzXG5cdFx0Ly8gaWYgb3B0aW9ucyBpcyBvYmplY3QgLT4gc2V0IG5ldyBjc3MgdmFsdWVzXG5cdFx0VS5jc3MgPSBmdW5jdGlvbiAoZWxlbSwgb3B0aW9ucykge1xuXHRcdFx0aWYgKF90eXBlLlN0cmluZyhvcHRpb25zKSkge1xuXHRcdFx0XHRyZXR1cm4gX2dldENvbXB1dGVkU3R5bGUoZWxlbSlbX2NhbWVsQ2FzZShvcHRpb25zKV07XG5cdFx0XHR9IGVsc2UgaWYgKF90eXBlLkFycmF5KG9wdGlvbnMpKSB7XG5cdFx0XHRcdHZhclxuXHRcdFx0XHRvYmogPSB7fSxcblx0XHRcdFx0XHRzdHlsZSA9IF9nZXRDb21wdXRlZFN0eWxlKGVsZW0pO1xuXHRcdFx0XHRvcHRpb25zLmZvckVhY2goZnVuY3Rpb24gKG9wdGlvbiwga2V5KSB7XG5cdFx0XHRcdFx0b2JqW29wdGlvbl0gPSBzdHlsZVtfY2FtZWxDYXNlKG9wdGlvbildO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0cmV0dXJuIG9iajtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGZvciAodmFyIG9wdGlvbiBpbiBvcHRpb25zKSB7XG5cdFx0XHRcdFx0dmFyIHZhbCA9IG9wdGlvbnNbb3B0aW9uXTtcblx0XHRcdFx0XHRpZiAodmFsID09IHBhcnNlRmxvYXQodmFsKSkgeyAvLyBhc3N1bWUgcGl4ZWwgZm9yIHNlZW1pbmdseSBudW1lcmljYWwgdmFsdWVzXG5cdFx0XHRcdFx0XHR2YWwgKz0gJ3B4Jztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxlbS5zdHlsZVtfY2FtZWxDYXNlKG9wdGlvbildID0gdmFsO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHJldHVybiBVO1xuXHR9KHdpbmRvdyB8fCB7fSkpO1xuXG5cdFNjcm9sbE1hZ2ljLlNjZW5lLnByb3RvdHlwZS5hZGRJbmRpY2F0b3JzID0gZnVuY3Rpb24gKCkge1xuXHRcdFNjcm9sbE1hZ2ljLl91dGlsLmxvZygxLCAnKFNjcm9sbE1hZ2ljLlNjZW5lKSAtPiBFUlJPUiBjYWxsaW5nIGFkZEluZGljYXRvcnMoKSBkdWUgdG8gbWlzc2luZyBQbHVnaW4gXFwnZGVidWcuYWRkSW5kaWNhdG9yc1xcJy4gUGxlYXNlIG1ha2Ugc3VyZSB0byBpbmNsdWRlIHBsdWdpbnMvZGVidWcuYWRkSW5kaWNhdG9ycy5qcycpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cdFNjcm9sbE1hZ2ljLlNjZW5lLnByb3RvdHlwZS5yZW1vdmVJbmRpY2F0b3JzID0gZnVuY3Rpb24gKCkge1xuXHRcdFNjcm9sbE1hZ2ljLl91dGlsLmxvZygxLCAnKFNjcm9sbE1hZ2ljLlNjZW5lKSAtPiBFUlJPUiBjYWxsaW5nIHJlbW92ZUluZGljYXRvcnMoKSBkdWUgdG8gbWlzc2luZyBQbHVnaW4gXFwnZGVidWcuYWRkSW5kaWNhdG9yc1xcJy4gUGxlYXNlIG1ha2Ugc3VyZSB0byBpbmNsdWRlIHBsdWdpbnMvZGVidWcuYWRkSW5kaWNhdG9ycy5qcycpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cdFNjcm9sbE1hZ2ljLlNjZW5lLnByb3RvdHlwZS5zZXRUd2VlbiA9IGZ1bmN0aW9uICgpIHtcblx0XHRTY3JvbGxNYWdpYy5fdXRpbC5sb2coMSwgJyhTY3JvbGxNYWdpYy5TY2VuZSkgLT4gRVJST1IgY2FsbGluZyBzZXRUd2VlbigpIGR1ZSB0byBtaXNzaW5nIFBsdWdpbiBcXCdhbmltYXRpb24uZ3NhcFxcJy4gUGxlYXNlIG1ha2Ugc3VyZSB0byBpbmNsdWRlIHBsdWdpbnMvYW5pbWF0aW9uLmdzYXAuanMnKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXHRTY3JvbGxNYWdpYy5TY2VuZS5wcm90b3R5cGUucmVtb3ZlVHdlZW4gPSBmdW5jdGlvbiAoKSB7XG5cdFx0U2Nyb2xsTWFnaWMuX3V0aWwubG9nKDEsICcoU2Nyb2xsTWFnaWMuU2NlbmUpIC0+IEVSUk9SIGNhbGxpbmcgcmVtb3ZlVHdlZW4oKSBkdWUgdG8gbWlzc2luZyBQbHVnaW4gXFwnYW5pbWF0aW9uLmdzYXBcXCcuIFBsZWFzZSBtYWtlIHN1cmUgdG8gaW5jbHVkZSBwbHVnaW5zL2FuaW1hdGlvbi5nc2FwLmpzJyk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblx0U2Nyb2xsTWFnaWMuU2NlbmUucHJvdG90eXBlLnNldFZlbG9jaXR5ID0gZnVuY3Rpb24gKCkge1xuXHRcdFNjcm9sbE1hZ2ljLl91dGlsLmxvZygxLCAnKFNjcm9sbE1hZ2ljLlNjZW5lKSAtPiBFUlJPUiBjYWxsaW5nIHNldFZlbG9jaXR5KCkgZHVlIHRvIG1pc3NpbmcgUGx1Z2luIFxcJ2FuaW1hdGlvbi52ZWxvY2l0eVxcJy4gUGxlYXNlIG1ha2Ugc3VyZSB0byBpbmNsdWRlIHBsdWdpbnMvYW5pbWF0aW9uLnZlbG9jaXR5LmpzJyk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblx0U2Nyb2xsTWFnaWMuU2NlbmUucHJvdG90eXBlLnJlbW92ZVZlbG9jaXR5ID0gZnVuY3Rpb24gKCkge1xuXHRcdFNjcm9sbE1hZ2ljLl91dGlsLmxvZygxLCAnKFNjcm9sbE1hZ2ljLlNjZW5lKSAtPiBFUlJPUiBjYWxsaW5nIHJlbW92ZVZlbG9jaXR5KCkgZHVlIHRvIG1pc3NpbmcgUGx1Z2luIFxcJ2FuaW1hdGlvbi52ZWxvY2l0eVxcJy4gUGxlYXNlIG1ha2Ugc3VyZSB0byBpbmNsdWRlIHBsdWdpbnMvYW5pbWF0aW9uLnZlbG9jaXR5LmpzJyk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHRyZXR1cm4gU2Nyb2xsTWFnaWM7XG59KSk7IiwiLyohXG4gKiBTY3JvbGxNYWdpYyB2Mi4wLjYgKDIwMTgtMTAtMDgpXG4gKiBUaGUgamF2YXNjcmlwdCBsaWJyYXJ5IGZvciBtYWdpY2FsIHNjcm9sbCBpbnRlcmFjdGlvbnMuXG4gKiAoYykgMjAxOCBKYW4gUGFlcGtlIChAamFucGFlcGtlKVxuICogUHJvamVjdCBXZWJzaXRlOiBodHRwOi8vc2Nyb2xsbWFnaWMuaW9cbiAqIFxuICogQHZlcnNpb24gMi4wLjZcbiAqIEBsaWNlbnNlIER1YWwgbGljZW5zZWQgdW5kZXIgTUlUIGxpY2Vuc2UgYW5kIEdQTC5cbiAqIEBhdXRob3IgSmFuIFBhZXBrZSAtIGUtbWFpbEBqYW5wYWVwa2UuZGVcbiAqXG4gKiBAZmlsZSBEZWJ1ZyBFeHRlbnNpb24gZm9yIFNjcm9sbE1hZ2ljLlxuICovXG4vKipcbiAqIFRoaXMgcGx1Z2luIHdhcyBmb3JtZXJseSBrbm93biBhcyB0aGUgU2Nyb2xsTWFnaWMgZGVidWcgZXh0ZW5zaW9uLlxuICpcbiAqIEl0IGVuYWJsZXMgeW91IHRvIGFkZCB2aXN1YWwgaW5kaWNhdG9ycyB0byB5b3VyIHBhZ2UsIHRvIGJlIGFibGUgdG8gc2VlIGV4YWN0bHkgd2hlbiBhIHNjZW5lIGlzIHRyaWdnZXJlZC5cbiAqXG4gKiBUbyBoYXZlIGFjY2VzcyB0byB0aGlzIGV4dGVuc2lvbiwgcGxlYXNlIGluY2x1ZGUgYHBsdWdpbnMvZGVidWcuYWRkSW5kaWNhdG9ycy5qc2AuXG4gKiBAbWl4aW4gZGVidWcuYWRkSW5kaWNhdG9yc1xuICovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuXHRcdC8vIEFNRC4gUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZS5cblx0XHRkZWZpbmUoWydTY3JvbGxNYWdpYyddLCBmYWN0b3J5KTtcblx0fSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0XHQvLyBDb21tb25KU1xuXHRcdGZhY3RvcnkocmVxdWlyZSgnc2Nyb2xsbWFnaWMnKSk7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gbm8gYnJvd3NlciBnbG9iYWwgZXhwb3J0IG5lZWRlZCwganVzdCBleGVjdXRlXG5cdFx0ZmFjdG9yeShyb290LlNjcm9sbE1hZ2ljIHx8IChyb290LmpRdWVyeSAmJiByb290LmpRdWVyeS5TY3JvbGxNYWdpYykpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uIChTY3JvbGxNYWdpYykge1xuXHRcInVzZSBzdHJpY3RcIjtcblx0dmFyIE5BTUVTUEFDRSA9IFwiZGVidWcuYWRkSW5kaWNhdG9yc1wiO1xuXG5cdHZhclxuXHRjb25zb2xlID0gd2luZG93LmNvbnNvbGUgfHwge30sXG5cdFx0ZXJyID0gRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQuY2FsbChjb25zb2xlLmVycm9yIHx8IGNvbnNvbGUubG9nIHx8XG5cdFx0ZnVuY3Rpb24gKCkge30sIGNvbnNvbGUpO1xuXHRpZiAoIVNjcm9sbE1hZ2ljKSB7XG5cdFx0ZXJyKFwiKFwiICsgTkFNRVNQQUNFICsgXCIpIC0+IEVSUk9SOiBUaGUgU2Nyb2xsTWFnaWMgbWFpbiBtb2R1bGUgY291bGQgbm90IGJlIGZvdW5kLiBQbGVhc2UgbWFrZSBzdXJlIGl0J3MgbG9hZGVkIGJlZm9yZSB0aGlzIHBsdWdpbiBvciB1c2UgYW4gYXN5bmNocm9ub3VzIGxvYWRlciBsaWtlIHJlcXVpcmVqcy5cIik7XG5cdH1cblxuXHQvLyBwbHVnaW4gc2V0dGluZ3Ncblx0dmFyXG5cdEZPTlRfU0laRSA9IFwiMC44NWVtXCIsXG5cdFx0WklOREVYID0gXCI5OTk5XCIsXG5cdFx0RURHRV9PRkZTRVQgPSAxNTsgLy8gbWluaW11bSBlZGdlIGRpc3RhbmNlLCBhZGRlZCB0byBpbmRlbnRhdGlvblxuXG5cdC8vIG92ZXJhbGwgdmFyc1xuXHR2YXJcblx0X3V0aWwgPSBTY3JvbGxNYWdpYy5fdXRpbCxcblx0XHRfYXV0b2luZGV4ID0gMDtcblxuXG5cblx0U2Nyb2xsTWFnaWMuU2NlbmUuZXh0ZW5kKGZ1bmN0aW9uICgpIHtcblx0XHR2YXJcblx0XHRTY2VuZSA9IHRoaXMsXG5cdFx0XHRfaW5kaWNhdG9yO1xuXG5cdFx0dmFyIGxvZyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChTY2VuZS5fbG9nKSB7IC8vIG5vdCBhdmFpbGFibGUsIHdoZW4gbWFpbiBzb3VyY2UgbWluaWZpZWRcblx0XHRcdFx0QXJyYXkucHJvdG90eXBlLnNwbGljZS5jYWxsKGFyZ3VtZW50cywgMSwgMCwgXCIoXCIgKyBOQU1FU1BBQ0UgKyBcIilcIiwgXCItPlwiKTtcblx0XHRcdFx0U2NlbmUuX2xvZy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBBZGQgdmlzdWFsIGluZGljYXRvcnMgZm9yIGEgU2Nyb2xsTWFnaWMuU2NlbmUuICBcblx0XHQgKiBAbWVtYmVyb2YhIGRlYnVnLmFkZEluZGljYXRvcnMjXG5cdFx0ICpcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIGFkZCBiYXNpYyBpbmRpY2F0b3JzXG5cdFx0ICogc2NlbmUuYWRkSW5kaWNhdG9ycygpXG5cdFx0ICpcblx0XHQgKiAvLyBwYXNzaW5nIG9wdGlvbnNcblx0XHQgKiBzY2VuZS5hZGRJbmRpY2F0b3JzKHtuYW1lOiBcInBpbiBzY2VuZVwiLCBjb2xvckVuZDogXCIjRkZGRkZGXCJ9KTtcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gLSBBbiBvYmplY3QgY29udGFpbmluZyBvbmUgb3IgbW9yZSBvcHRpb25zIGZvciB0aGUgaW5kaWNhdG9ycy5cblx0XHQgKiBAcGFyYW0geyhzdHJpbmd8b2JqZWN0KX0gW29wdGlvbnMucGFyZW50PXVuZGVmaW5lZF0gLSBBIHNlbGVjdG9yLCBET00gT2JqZWN0IG9yIGEgalF1ZXJ5IG9iamVjdCB0aGF0IHRoZSBpbmRpY2F0b3JzIHNob3VsZCBiZSBhZGRlZCB0by4gIFxuXHRcdCBJZiB1bmRlZmluZWQsIHRoZSBjb250cm9sbGVyJ3MgY29udGFpbmVyIHdpbGwgYmUgdXNlZC5cblx0XHQgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMubmFtZT1cIlwiXSAtIFRoaXMgc3RyaW5nIHdpbGwgYmUgZGlzcGxheWVkIGF0IHRoZSBzdGFydCBhbmQgZW5kIGluZGljYXRvcnMgb2YgdGhlIHNjZW5lIGZvciBpZGVudGlmaWNhdGlvbiBwdXJwb3Nlcy4gSWYgbm8gbmFtZSBpcyBzdXBwbGllZCBhbiBhdXRvbWF0aWMgaW5kZXggd2lsbCBiZSB1c2VkLlxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5pbmRlbnQ9MF0gLSBBZGRpdGlvbmFsIHBvc2l0aW9uIG9mZnNldCBmb3IgdGhlIGluZGljYXRvcnMgKHVzZWZ1bCwgd2hlbiBoYXZpbmcgbXVsdGlwbGUgc2NlbmVzIHN0YXJ0aW5nIGF0IHRoZSBzYW1lIHBvc2l0aW9uKS5cblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY29sb3JTdGFydD1ncmVlbl0gLSBDU1MgY29sb3IgZGVmaW5pdGlvbiBmb3IgdGhlIHN0YXJ0IGluZGljYXRvci5cblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY29sb3JFbmQ9cmVkXSAtIENTUyBjb2xvciBkZWZpbml0aW9uIGZvciB0aGUgZW5kIGluZGljYXRvci5cblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY29sb3JUcmlnZ2VyPWJsdWVdIC0gQ1NTIGNvbG9yIGRlZmluaXRpb24gZm9yIHRoZSB0cmlnZ2VyIGluZGljYXRvci5cblx0XHQgKi9cblx0XHRTY2VuZS5hZGRJbmRpY2F0b3JzID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcblx0XHRcdGlmICghX2luZGljYXRvcikge1xuXHRcdFx0XHR2YXJcblx0XHRcdFx0REVGQVVMVF9PUFRJT05TID0ge1xuXHRcdFx0XHRcdG5hbWU6IFwiXCIsXG5cdFx0XHRcdFx0aW5kZW50OiAwLFxuXHRcdFx0XHRcdHBhcmVudDogdW5kZWZpbmVkLFxuXHRcdFx0XHRcdGNvbG9yU3RhcnQ6IFwiZ3JlZW5cIixcblx0XHRcdFx0XHRjb2xvckVuZDogXCJyZWRcIixcblx0XHRcdFx0XHRjb2xvclRyaWdnZXI6IFwiYmx1ZVwiLFxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdG9wdGlvbnMgPSBfdXRpbC5leHRlbmQoe30sIERFRkFVTFRfT1BUSU9OUywgb3B0aW9ucyk7XG5cblx0XHRcdFx0X2F1dG9pbmRleCsrO1xuXHRcdFx0XHRfaW5kaWNhdG9yID0gbmV3IEluZGljYXRvcihTY2VuZSwgb3B0aW9ucyk7XG5cblx0XHRcdFx0U2NlbmUub24oXCJhZGQucGx1Z2luX2FkZEluZGljYXRvcnNcIiwgX2luZGljYXRvci5hZGQpO1xuXHRcdFx0XHRTY2VuZS5vbihcInJlbW92ZS5wbHVnaW5fYWRkSW5kaWNhdG9yc1wiLCBfaW5kaWNhdG9yLnJlbW92ZSk7XG5cdFx0XHRcdFNjZW5lLm9uKFwiZGVzdHJveS5wbHVnaW5fYWRkSW5kaWNhdG9yc1wiLCBTY2VuZS5yZW1vdmVJbmRpY2F0b3JzKTtcblxuXHRcdFx0XHQvLyBpdCB0aGUgc2NlbmUgYWxyZWFkeSBoYXMgYSBjb250cm9sbGVyIHdlIGNhbiBzdGFydCByaWdodCBhd2F5LlxuXHRcdFx0XHRpZiAoU2NlbmUuY29udHJvbGxlcigpKSB7XG5cdFx0XHRcdFx0X2luZGljYXRvci5hZGQoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIFNjZW5lO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZW1vdmVzIHZpc3VhbCBpbmRpY2F0b3JzIGZyb20gYSBTY3JvbGxNYWdpYy5TY2VuZS5cblx0XHQgKiBAbWVtYmVyb2YhIGRlYnVnLmFkZEluZGljYXRvcnMjXG5cdFx0ICpcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIHJlbW92ZSBwcmV2aW91c2x5IGFkZGVkIGluZGljYXRvcnNcblx0XHQgKiBzY2VuZS5yZW1vdmVJbmRpY2F0b3JzKClcblx0XHQgKlxuXHRcdCAqL1xuXHRcdFNjZW5lLnJlbW92ZUluZGljYXRvcnMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoX2luZGljYXRvcikge1xuXHRcdFx0XHRfaW5kaWNhdG9yLnJlbW92ZSgpO1xuXHRcdFx0XHR0aGlzLm9mZihcIioucGx1Z2luX2FkZEluZGljYXRvcnNcIik7XG5cdFx0XHRcdF9pbmRpY2F0b3IgPSB1bmRlZmluZWQ7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gU2NlbmU7XG5cdFx0fTtcblxuXHR9KTtcblxuXG4vKlxuXHQgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdCAqIEV4dGVuc2lvbiBmb3IgY29udHJvbGxlciB0byBzdG9yZSBhbmQgdXBkYXRlIHJlbGF0ZWQgaW5kaWNhdG9yc1xuXHQgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdCAqL1xuXHQvLyBhZGQgb3B0aW9uIHRvIGdsb2JhbGx5IGF1dG8tYWRkIGluZGljYXRvcnMgdG8gc2NlbmVzXG5cdC8qKlxuXHQgKiBFdmVyeSBTY3JvbGxNYWdpYy5Db250cm9sbGVyIGluc3RhbmNlIG5vdyBhY2NlcHRzIGFuIGFkZGl0aW9uYWwgb3B0aW9uLiAgXG5cdCAqIFNlZSB7QGxpbmsgU2Nyb2xsTWFnaWMuQ29udHJvbGxlcn0gZm9yIGEgY29tcGxldGUgbGlzdCBvZiB0aGUgc3RhbmRhcmQgb3B0aW9ucy5cblx0ICogQG1lbWJlcm9mISBkZWJ1Zy5hZGRJbmRpY2F0b3JzI1xuXHQgKiBAbWV0aG9kIG5ldyBTY3JvbGxNYWdpYy5Db250cm9sbGVyKG9wdGlvbnMpXG5cdCAqIEBleGFtcGxlXG5cdCAqIC8vIG1ha2UgYSBjb250cm9sbGVyIGFuZCBhZGQgaW5kaWNhdG9ycyB0byBhbGwgc2NlbmVzIGF0dGFjaGVkXG5cdCAqIHZhciBjb250cm9sbGVyID0gbmV3IFNjcm9sbE1hZ2ljLkNvbnRyb2xsZXIoe2FkZEluZGljYXRvcnM6IHRydWV9KTtcblx0ICogLy8gdGhpcyBzY2VuZSB3aWxsIGF1dG9tYXRpY2FsbHkgaGF2ZSBpbmRpY2F0b3JzIGFkZGVkIHRvIGl0XG5cdCAqIG5ldyBTY3JvbGxNYWdpYy5TY2VuZSgpXG5cdCAqICAgICAgICAgICAgICAgIC5hZGRUbyhjb250cm9sbGVyKTtcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSAtIE9wdGlvbnMgZm9yIHRoZSBDb250cm9sbGVyLlxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmFkZEluZGljYXRvcnM9ZmFsc2VdIC0gSWYgc2V0IHRvIGB0cnVlYCBldmVyeSBzY2VuZSB0aGF0IGlzIGFkZGVkIHRvIHRoZSBjb250cm9sbGVyIHdpbGwgYXV0b21hdGljYWxseSBnZXQgaW5kaWNhdG9ycyBhZGRlZCB0byBpdC5cblx0ICovXG5cdFNjcm9sbE1hZ2ljLkNvbnRyb2xsZXIuYWRkT3B0aW9uKFwiYWRkSW5kaWNhdG9yc1wiLCBmYWxzZSk7XG5cdC8vIGV4dGVuZCBDb250cm9sbGVyXG5cdFNjcm9sbE1hZ2ljLkNvbnRyb2xsZXIuZXh0ZW5kKGZ1bmN0aW9uICgpIHtcblx0XHR2YXJcblx0XHRDb250cm9sbGVyID0gdGhpcyxcblx0XHRcdF9pbmZvID0gQ29udHJvbGxlci5pbmZvKCksXG5cdFx0XHRfY29udGFpbmVyID0gX2luZm8uY29udGFpbmVyLFxuXHRcdFx0X2lzRG9jdW1lbnQgPSBfaW5mby5pc0RvY3VtZW50LFxuXHRcdFx0X3ZlcnRpY2FsID0gX2luZm8udmVydGljYWwsXG5cdFx0XHRfaW5kaWNhdG9ycyA9IHsgLy8gY29udGFpbmVyIGZvciBhbGwgaW5kaWNhdG9ycyBhbmQgbWV0aG9kc1xuXHRcdFx0XHRncm91cHM6IFtdXG5cdFx0XHR9O1xuXG5cdFx0dmFyIGxvZyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChDb250cm9sbGVyLl9sb2cpIHsgLy8gbm90IGF2YWlsYWJsZSwgd2hlbiBtYWluIHNvdXJjZSBtaW5pZmllZFxuXHRcdFx0XHRBcnJheS5wcm90b3R5cGUuc3BsaWNlLmNhbGwoYXJndW1lbnRzLCAxLCAwLCBcIihcIiArIE5BTUVTUEFDRSArIFwiKVwiLCBcIi0+XCIpO1xuXHRcdFx0XHRDb250cm9sbGVyLl9sb2cuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdGlmIChDb250cm9sbGVyLl9pbmRpY2F0b3JzKSB7XG5cdFx0XHRsb2coMiwgXCJXQVJOSU5HOiBTY2VuZSBhbHJlYWR5IGhhcyBhIHByb3BlcnR5ICdfaW5kaWNhdG9ycycsIHdoaWNoIHdpbGwgYmUgb3ZlcndyaXR0ZW4gYnkgcGx1Z2luLlwiKTtcblx0XHR9XG5cblx0XHQvLyBhZGQgaW5kaWNhdG9ycyBjb250YWluZXJcblx0XHR0aGlzLl9pbmRpY2F0b3JzID0gX2luZGljYXRvcnM7XG4vKlxuXHRcdFx0bmVlZGVkIHVwZGF0ZXM6XG5cdFx0XHQrKysrKysrKysrKysrKytcblx0XHRcdHN0YXJ0L2VuZCBwb3NpdGlvbiBvbiBzY2VuZSBzaGlmdCAoaGFuZGxlZCBpbiBJbmRpY2F0b3IgY2xhc3MpXG5cdFx0XHR0cmlnZ2VyIHBhcmFtZXRlcnMgb24gdHJpZ2dlckhvb2sgdmFsdWUgY2hhbmdlIChoYW5kbGVkIGluIEluZGljYXRvciBjbGFzcylcblx0XHRcdGJvdW5kcyBwb3NpdGlvbiBvbiBjb250YWluZXIgc2Nyb2xsIG9yIHJlc2l6ZSAodG8ga2VlcCBhbGlnbm1lbnQgdG8gYm90dG9tL3JpZ2h0KVxuXHRcdFx0dHJpZ2dlciBwb3NpdGlvbiBvbiBjb250YWluZXIgcmVzaXplLCB3aW5kb3cgcmVzaXplIChpZiBjb250YWluZXIgaXNuJ3QgZG9jdW1lbnQpIGFuZCB3aW5kb3cgc2Nyb2xsIChpZiBjb250YWluZXIgaXNuJ3QgZG9jdW1lbnQpXG5cdFx0Ki9cblxuXHRcdC8vIGV2ZW50IGhhbmRsZXIgZm9yIHdoZW4gYXNzb2NpYXRlZCBib3VuZHMgbWFya2VycyBuZWVkIHRvIGJlIHJlcG9zaXRpb25lZFxuXHRcdHZhciBoYW5kbGVCb3VuZHNQb3NpdGlvbkNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdF9pbmRpY2F0b3JzLnVwZGF0ZUJvdW5kc1Bvc2l0aW9ucygpO1xuXHRcdH07XG5cblx0XHQvLyBldmVudCBoYW5kbGVyIGZvciB3aGVuIGFzc29jaWF0ZWQgdHJpZ2dlciBncm91cHMgbmVlZCB0byBiZSByZXBvc2l0aW9uZWRcblx0XHR2YXIgaGFuZGxlVHJpZ2dlclBvc2l0aW9uQ2hhbmdlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0X2luZGljYXRvcnMudXBkYXRlVHJpZ2dlckdyb3VwUG9zaXRpb25zKCk7XG5cdFx0fTtcblxuXHRcdF9jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCBoYW5kbGVUcmlnZ2VyUG9zaXRpb25DaGFuZ2UpO1xuXHRcdGlmICghX2lzRG9jdW1lbnQpIHtcblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIGhhbmRsZVRyaWdnZXJQb3NpdGlvbkNoYW5nZSk7XG5cdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInNjcm9sbFwiLCBoYW5kbGVUcmlnZ2VyUG9zaXRpb25DaGFuZ2UpO1xuXHRcdH1cblx0XHQvLyB1cGRhdGUgYWxsIHJlbGF0ZWQgYm91bmRzIGNvbnRhaW5lcnNcblx0XHRfY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgaGFuZGxlQm91bmRzUG9zaXRpb25DaGFuZ2UpO1xuXHRcdF9jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInNjcm9sbFwiLCBoYW5kbGVCb3VuZHNQb3NpdGlvbkNoYW5nZSk7XG5cblxuXHRcdC8vIHVwZGF0ZXMgdGhlIHBvc2l0aW9uIG9mIHRoZSBib3VuZHMgY29udGFpbmVyIHRvIGFsaWduZWQgdG8gdGhlIHJpZ2h0IGZvciB2ZXJ0aWNhbCBjb250YWluZXJzIGFuZCB0byB0aGUgYm90dG9tIGZvciBob3Jpem9udGFsXG5cdFx0dGhpcy5faW5kaWNhdG9ycy51cGRhdGVCb3VuZHNQb3NpdGlvbnMgPSBmdW5jdGlvbiAoc3BlY2lmaWNJbmRpY2F0b3IpIHtcblx0XHRcdHZhciAvLyBjb25zdGFudCBmb3IgYWxsIGJvdW5kc1xuXHRcdFx0Z3JvdXBzID0gc3BlY2lmaWNJbmRpY2F0b3IgPyBbX3V0aWwuZXh0ZW5kKHt9LCBzcGVjaWZpY0luZGljYXRvci50cmlnZ2VyR3JvdXAsIHtcblx0XHRcdFx0bWVtYmVyczogW3NwZWNpZmljSW5kaWNhdG9yXVxuXHRcdFx0fSldIDogLy8gY3JlYXRlIGEgZ3JvdXAgd2l0aCBvbmx5IG9uZSBlbGVtZW50XG5cdFx0XHRfaW5kaWNhdG9ycy5ncm91cHMsXG5cdFx0XHRcdC8vIHVzZSBhbGxcblx0XHRcdFx0ZyA9IGdyb3Vwcy5sZW5ndGgsXG5cdFx0XHRcdGNzcyA9IHt9LFxuXHRcdFx0XHRwYXJhbVBvcyA9IF92ZXJ0aWNhbCA/IFwibGVmdFwiIDogXCJ0b3BcIixcblx0XHRcdFx0cGFyYW1EaW1lbnNpb24gPSBfdmVydGljYWwgPyBcIndpZHRoXCIgOiBcImhlaWdodFwiLFxuXHRcdFx0XHRlZGdlID0gX3ZlcnRpY2FsID8gX3V0aWwuZ2V0LnNjcm9sbExlZnQoX2NvbnRhaW5lcikgKyBfdXRpbC5nZXQud2lkdGgoX2NvbnRhaW5lcikgLSBFREdFX09GRlNFVCA6IF91dGlsLmdldC5zY3JvbGxUb3AoX2NvbnRhaW5lcikgKyBfdXRpbC5nZXQuaGVpZ2h0KF9jb250YWluZXIpIC0gRURHRV9PRkZTRVQsXG5cdFx0XHRcdGIsIHRyaWdnZXJTaXplLCBncm91cDtcblx0XHRcdHdoaWxlIChnLS0pIHsgLy8gZ3JvdXAgbG9vcFxuXHRcdFx0XHRncm91cCA9IGdyb3Vwc1tnXTtcblx0XHRcdFx0YiA9IGdyb3VwLm1lbWJlcnMubGVuZ3RoO1xuXHRcdFx0XHR0cmlnZ2VyU2l6ZSA9IF91dGlsLmdldFtwYXJhbURpbWVuc2lvbl0oZ3JvdXAuZWxlbWVudC5maXJzdENoaWxkKTtcblx0XHRcdFx0d2hpbGUgKGItLSkgeyAvLyBpbmRpY2F0b3JzIGxvb3Bcblx0XHRcdFx0XHRjc3NbcGFyYW1Qb3NdID0gZWRnZSAtIHRyaWdnZXJTaXplO1xuXHRcdFx0XHRcdF91dGlsLmNzcyhncm91cC5tZW1iZXJzW2JdLmJvdW5kcywgY3NzKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvLyB1cGRhdGVzIHRoZSBwb3NpdGlvbnMgb2YgYWxsIHRyaWdnZXIgZ3JvdXBzIGF0dGFjaGVkIHRvIGEgY29udHJvbGxlciBvciBhIHNwZWNpZmljIG9uZSwgaWYgcHJvdmlkZWRcblx0XHR0aGlzLl9pbmRpY2F0b3JzLnVwZGF0ZVRyaWdnZXJHcm91cFBvc2l0aW9ucyA9IGZ1bmN0aW9uIChzcGVjaWZpY0dyb3VwKSB7XG5cdFx0XHR2YXIgLy8gY29uc3RhbnQgdmFyc1xuXHRcdFx0Z3JvdXBzID0gc3BlY2lmaWNHcm91cCA/IFtzcGVjaWZpY0dyb3VwXSA6IF9pbmRpY2F0b3JzLmdyb3Vwcyxcblx0XHRcdFx0aSA9IGdyb3Vwcy5sZW5ndGgsXG5cdFx0XHRcdGNvbnRhaW5lciA9IF9pc0RvY3VtZW50ID8gZG9jdW1lbnQuYm9keSA6IF9jb250YWluZXIsXG5cdFx0XHRcdGNvbnRhaW5lck9mZnNldCA9IF9pc0RvY3VtZW50ID8ge1xuXHRcdFx0XHRcdHRvcDogMCxcblx0XHRcdFx0XHRsZWZ0OiAwXG5cdFx0XHRcdH0gOiBfdXRpbC5nZXQub2Zmc2V0KGNvbnRhaW5lciwgdHJ1ZSksXG5cdFx0XHRcdGVkZ2UgPSBfdmVydGljYWwgPyBfdXRpbC5nZXQud2lkdGgoX2NvbnRhaW5lcikgLSBFREdFX09GRlNFVCA6IF91dGlsLmdldC5oZWlnaHQoX2NvbnRhaW5lcikgLSBFREdFX09GRlNFVCxcblx0XHRcdFx0cGFyYW1EaW1lbnNpb24gPSBfdmVydGljYWwgPyBcIndpZHRoXCIgOiBcImhlaWdodFwiLFxuXHRcdFx0XHRwYXJhbVRyYW5zZm9ybSA9IF92ZXJ0aWNhbCA/IFwiWVwiIDogXCJYXCI7XG5cdFx0XHR2YXIgLy8gY2hhbmdpbmcgdmFyc1xuXHRcdFx0Z3JvdXAsIGVsZW0sIHBvcywgZWxlbVNpemUsIHRyYW5zZm9ybTtcblx0XHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdFx0Z3JvdXAgPSBncm91cHNbaV07XG5cdFx0XHRcdGVsZW0gPSBncm91cC5lbGVtZW50O1xuXHRcdFx0XHRwb3MgPSBncm91cC50cmlnZ2VySG9vayAqIENvbnRyb2xsZXIuaW5mbyhcInNpemVcIik7XG5cdFx0XHRcdGVsZW1TaXplID0gX3V0aWwuZ2V0W3BhcmFtRGltZW5zaW9uXShlbGVtLmZpcnN0Q2hpbGQuZmlyc3RDaGlsZCk7XG5cdFx0XHRcdHRyYW5zZm9ybSA9IHBvcyA+IGVsZW1TaXplID8gXCJ0cmFuc2xhdGVcIiArIHBhcmFtVHJhbnNmb3JtICsgXCIoLTEwMCUpXCIgOiBcIlwiO1xuXG5cdFx0XHRcdF91dGlsLmNzcyhlbGVtLCB7XG5cdFx0XHRcdFx0dG9wOiBjb250YWluZXJPZmZzZXQudG9wICsgKF92ZXJ0aWNhbCA/IHBvcyA6IGVkZ2UgLSBncm91cC5tZW1iZXJzWzBdLm9wdGlvbnMuaW5kZW50KSxcblx0XHRcdFx0XHRsZWZ0OiBjb250YWluZXJPZmZzZXQubGVmdCArIChfdmVydGljYWwgPyBlZGdlIC0gZ3JvdXAubWVtYmVyc1swXS5vcHRpb25zLmluZGVudCA6IHBvcylcblx0XHRcdFx0fSk7XG5cdFx0XHRcdF91dGlsLmNzcyhlbGVtLmZpcnN0Q2hpbGQuZmlyc3RDaGlsZCwge1xuXHRcdFx0XHRcdFwiLW1zLXRyYW5zZm9ybVwiOiB0cmFuc2Zvcm0sXG5cdFx0XHRcdFx0XCItd2Via2l0LXRyYW5zZm9ybVwiOiB0cmFuc2Zvcm0sXG5cdFx0XHRcdFx0XCJ0cmFuc2Zvcm1cIjogdHJhbnNmb3JtXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvLyB1cGRhdGVzIHRoZSBsYWJlbCBmb3IgdGhlIGdyb3VwIHRvIGNvbnRhaW4gdGhlIG5hbWUsIGlmIGl0IG9ubHkgaGFzIG9uZSBtZW1iZXJcblx0XHR0aGlzLl9pbmRpY2F0b3JzLnVwZGF0ZVRyaWdnZXJHcm91cExhYmVsID0gZnVuY3Rpb24gKGdyb3VwKSB7XG5cdFx0XHR2YXJcblx0XHRcdHRleHQgPSBcInRyaWdnZXJcIiArIChncm91cC5tZW1iZXJzLmxlbmd0aCA+IDEgPyBcIlwiIDogXCIgXCIgKyBncm91cC5tZW1iZXJzWzBdLm9wdGlvbnMubmFtZSksXG5cdFx0XHRcdGVsZW0gPSBncm91cC5lbGVtZW50LmZpcnN0Q2hpbGQuZmlyc3RDaGlsZCxcblx0XHRcdFx0ZG9VcGRhdGUgPSBlbGVtLnRleHRDb250ZW50ICE9PSB0ZXh0O1xuXHRcdFx0aWYgKGRvVXBkYXRlKSB7XG5cdFx0XHRcdGVsZW0udGV4dENvbnRlbnQgPSB0ZXh0O1xuXHRcdFx0XHRpZiAoX3ZlcnRpY2FsKSB7IC8vIGJvdW5kcyBwb3NpdGlvbiBpcyBkZXBlbmRlbnQgb24gdGV4dCBsZW5ndGgsIHNvIHVwZGF0ZVxuXHRcdFx0XHRcdF9pbmRpY2F0b3JzLnVwZGF0ZUJvdW5kc1Bvc2l0aW9ucygpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8vIGFkZCBpbmRpY2F0b3JzIGlmIGdsb2JhbCBvcHRpb24gaXMgc2V0XG5cdFx0dGhpcy5hZGRTY2VuZSA9IGZ1bmN0aW9uIChuZXdTY2VuZSkge1xuXG5cdFx0XHRpZiAodGhpcy5fb3B0aW9ucy5hZGRJbmRpY2F0b3JzICYmIG5ld1NjZW5lIGluc3RhbmNlb2YgU2Nyb2xsTWFnaWMuU2NlbmUgJiYgbmV3U2NlbmUuY29udHJvbGxlcigpID09PSBDb250cm9sbGVyKSB7XG5cdFx0XHRcdG5ld1NjZW5lLmFkZEluZGljYXRvcnMoKTtcblx0XHRcdH1cblx0XHRcdC8vIGNhbGwgb3JpZ2luYWwgZGVzdHJveSBtZXRob2Rcblx0XHRcdHRoaXMuJHN1cGVyLmFkZFNjZW5lLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0fTtcblxuXHRcdC8vIHJlbW92ZSBhbGwgcHJldmlvdXNseSBzZXQgbGlzdGVuZXJzIG9uIGRlc3Ryb3lcblx0XHR0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRfY29udGFpbmVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgaGFuZGxlVHJpZ2dlclBvc2l0aW9uQ2hhbmdlKTtcblx0XHRcdGlmICghX2lzRG9jdW1lbnQpIHtcblx0XHRcdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgaGFuZGxlVHJpZ2dlclBvc2l0aW9uQ2hhbmdlKTtcblx0XHRcdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJzY3JvbGxcIiwgaGFuZGxlVHJpZ2dlclBvc2l0aW9uQ2hhbmdlKTtcblx0XHRcdH1cblx0XHRcdF9jb250YWluZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCBoYW5kbGVCb3VuZHNQb3NpdGlvbkNoYW5nZSk7XG5cdFx0XHRfY29udGFpbmVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJzY3JvbGxcIiwgaGFuZGxlQm91bmRzUG9zaXRpb25DaGFuZ2UpO1xuXHRcdFx0Ly8gY2FsbCBvcmlnaW5hbCBkZXN0cm95IG1ldGhvZFxuXHRcdFx0dGhpcy4kc3VwZXIuZGVzdHJveS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdH07XG5cdFx0cmV0dXJuIENvbnRyb2xsZXI7XG5cblx0fSk7XG5cbi8qXG5cdCAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0ICogSW50ZXJuYWwgY2xhc3MgZm9yIHRoZSBjb25zdHJ1Y3Rpb24gb2YgSW5kaWNhdG9yc1xuXHQgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdCAqL1xuXHR2YXIgSW5kaWNhdG9yID0gZnVuY3Rpb24gKFNjZW5lLCBvcHRpb25zKSB7XG5cdFx0dmFyXG5cdFx0SW5kaWNhdG9yID0gdGhpcyxcblx0XHRcdF9lbGVtQm91bmRzID0gVFBMLmJvdW5kcygpLFxuXHRcdFx0X2VsZW1TdGFydCA9IFRQTC5zdGFydChvcHRpb25zLmNvbG9yU3RhcnQpLFxuXHRcdFx0X2VsZW1FbmQgPSBUUEwuZW5kKG9wdGlvbnMuY29sb3JFbmQpLFxuXHRcdFx0X2JvdW5kc0NvbnRhaW5lciA9IG9wdGlvbnMucGFyZW50ICYmIF91dGlsLmdldC5lbGVtZW50cyhvcHRpb25zLnBhcmVudClbMF0sXG5cdFx0XHRfdmVydGljYWwsIF9jdHJsO1xuXG5cdFx0dmFyIGxvZyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChTY2VuZS5fbG9nKSB7IC8vIG5vdCBhdmFpbGFibGUsIHdoZW4gbWFpbiBzb3VyY2UgbWluaWZpZWRcblx0XHRcdFx0QXJyYXkucHJvdG90eXBlLnNwbGljZS5jYWxsKGFyZ3VtZW50cywgMSwgMCwgXCIoXCIgKyBOQU1FU1BBQ0UgKyBcIilcIiwgXCItPlwiKTtcblx0XHRcdFx0U2NlbmUuX2xvZy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRvcHRpb25zLm5hbWUgPSBvcHRpb25zLm5hbWUgfHwgX2F1dG9pbmRleDtcblxuXHRcdC8vIHByZXBhcmUgYm91bmRzIGVsZW1lbnRzXG5cdFx0X2VsZW1TdGFydC5maXJzdENoaWxkLnRleHRDb250ZW50ICs9IFwiIFwiICsgb3B0aW9ucy5uYW1lO1xuXHRcdF9lbGVtRW5kLnRleHRDb250ZW50ICs9IFwiIFwiICsgb3B0aW9ucy5uYW1lO1xuXHRcdF9lbGVtQm91bmRzLmFwcGVuZENoaWxkKF9lbGVtU3RhcnQpO1xuXHRcdF9lbGVtQm91bmRzLmFwcGVuZENoaWxkKF9lbGVtRW5kKTtcblxuXHRcdC8vIHNldCBwdWJsaWMgdmFyaWFibGVzXG5cdFx0SW5kaWNhdG9yLm9wdGlvbnMgPSBvcHRpb25zO1xuXHRcdEluZGljYXRvci5ib3VuZHMgPSBfZWxlbUJvdW5kcztcblx0XHQvLyB3aWxsIGJlIHNldCBsYXRlclxuXHRcdEluZGljYXRvci50cmlnZ2VyR3JvdXAgPSB1bmRlZmluZWQ7XG5cblx0XHQvLyBhZGQgaW5kaWNhdG9ycyB0byBET01cblx0XHR0aGlzLmFkZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdF9jdHJsID0gU2NlbmUuY29udHJvbGxlcigpO1xuXHRcdFx0X3ZlcnRpY2FsID0gX2N0cmwuaW5mbyhcInZlcnRpY2FsXCIpO1xuXG5cdFx0XHR2YXIgaXNEb2N1bWVudCA9IF9jdHJsLmluZm8oXCJpc0RvY3VtZW50XCIpO1xuXG5cdFx0XHRpZiAoIV9ib3VuZHNDb250YWluZXIpIHtcblx0XHRcdFx0Ly8gbm8gcGFyZW50IHN1cHBsaWVkIG9yIGRvZXNudCBleGlzdFxuXHRcdFx0XHRfYm91bmRzQ29udGFpbmVyID0gaXNEb2N1bWVudCA/IGRvY3VtZW50LmJvZHkgOiBfY3RybC5pbmZvKFwiY29udGFpbmVyXCIpOyAvLyBjaGVjayBpZiB3aW5kb3cvZG9jdW1lbnQgKHRoZW4gdXNlIGJvZHkpXG5cdFx0XHR9XG5cdFx0XHRpZiAoIWlzRG9jdW1lbnQgJiYgX3V0aWwuY3NzKF9ib3VuZHNDb250YWluZXIsIFwicG9zaXRpb25cIikgPT09ICdzdGF0aWMnKSB7XG5cdFx0XHRcdC8vIHBvc2l0aW9uIG1vZGUgbmVlZGVkIGZvciBjb3JyZWN0IHBvc2l0aW9uaW5nIG9mIGluZGljYXRvcnNcblx0XHRcdFx0X3V0aWwuY3NzKF9ib3VuZHNDb250YWluZXIsIHtcblx0XHRcdFx0XHRwb3NpdGlvbjogXCJyZWxhdGl2ZVwiXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBhZGQgbGlzdGVuZXJzIGZvciB1cGRhdGVzXG5cdFx0XHRTY2VuZS5vbihcImNoYW5nZS5wbHVnaW5fYWRkSW5kaWNhdG9yc1wiLCBoYW5kbGVUcmlnZ2VyUGFyYW1zQ2hhbmdlKTtcblx0XHRcdFNjZW5lLm9uKFwic2hpZnQucGx1Z2luX2FkZEluZGljYXRvcnNcIiwgaGFuZGxlQm91bmRzUGFyYW1zQ2hhbmdlKTtcblxuXHRcdFx0Ly8gdXBkYXRlcyB0cmlnZ2VyICYgYm91bmRzICh3aWxsIGFkZCBlbGVtZW50cyBpZiBuZWVkZWQpXG5cdFx0XHR1cGRhdGVUcmlnZ2VyR3JvdXAoKTtcblx0XHRcdHVwZGF0ZUJvdW5kcygpO1xuXG5cdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgLy8gZG8gYWZ0ZXIgYWxsIGV4ZWN1dGlvbiBpcyBmaW5pc2hlZCBvdGhlcndpc2Ugc29tZXRpbWVzIHNpemUgY2FsY3VsYXRpb25zIGFyZSBvZmZcblx0XHRcdFx0X2N0cmwuX2luZGljYXRvcnMudXBkYXRlQm91bmRzUG9zaXRpb25zKEluZGljYXRvcik7XG5cdFx0XHR9LCAwKTtcblxuXHRcdFx0bG9nKDMsIFwiYWRkZWQgaW5kaWNhdG9yc1wiKTtcblx0XHR9O1xuXG5cdFx0Ly8gcmVtb3ZlIGluZGljYXRvcnMgZnJvbSBET01cblx0XHR0aGlzLnJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChJbmRpY2F0b3IudHJpZ2dlckdyb3VwKSB7IC8vIGlmIG5vdCBzZXQgdGhlcmUncyBub3RoaW5nIHRvIHJlbW92ZVxuXHRcdFx0XHRTY2VuZS5vZmYoXCJjaGFuZ2UucGx1Z2luX2FkZEluZGljYXRvcnNcIiwgaGFuZGxlVHJpZ2dlclBhcmFtc0NoYW5nZSk7XG5cdFx0XHRcdFNjZW5lLm9mZihcInNoaWZ0LnBsdWdpbl9hZGRJbmRpY2F0b3JzXCIsIGhhbmRsZUJvdW5kc1BhcmFtc0NoYW5nZSk7XG5cblx0XHRcdFx0aWYgKEluZGljYXRvci50cmlnZ2VyR3JvdXAubWVtYmVycy5sZW5ndGggPiAxKSB7XG5cdFx0XHRcdFx0Ly8ganVzdCByZW1vdmUgZnJvbSBtZW1iZXJsaXN0IG9mIG9sZCBncm91cFxuXHRcdFx0XHRcdHZhciBncm91cCA9IEluZGljYXRvci50cmlnZ2VyR3JvdXA7XG5cdFx0XHRcdFx0Z3JvdXAubWVtYmVycy5zcGxpY2UoZ3JvdXAubWVtYmVycy5pbmRleE9mKEluZGljYXRvciksIDEpO1xuXHRcdFx0XHRcdF9jdHJsLl9pbmRpY2F0b3JzLnVwZGF0ZVRyaWdnZXJHcm91cExhYmVsKGdyb3VwKTtcblx0XHRcdFx0XHRfY3RybC5faW5kaWNhdG9ycy51cGRhdGVUcmlnZ2VyR3JvdXBQb3NpdGlvbnMoZ3JvdXApO1xuXHRcdFx0XHRcdEluZGljYXRvci50cmlnZ2VyR3JvdXAgPSB1bmRlZmluZWQ7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gcmVtb3ZlIGNvbXBsZXRlIGdyb3VwXG5cdFx0XHRcdFx0cmVtb3ZlVHJpZ2dlckdyb3VwKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmVtb3ZlQm91bmRzKCk7XG5cblx0XHRcdFx0bG9nKDMsIFwicmVtb3ZlZCBpbmRpY2F0b3JzXCIpO1xuXHRcdFx0fVxuXHRcdH07XG5cbi8qXG5cdFx0ICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCAqIGludGVybmFsIEV2ZW50IEhhbmRsZXJzXG5cdFx0ICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCAqL1xuXG5cdFx0Ly8gZXZlbnQgaGFuZGxlciBmb3Igd2hlbiBib3VuZHMgcGFyYW1zIGNoYW5nZVxuXHRcdHZhciBoYW5kbGVCb3VuZHNQYXJhbXNDaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR1cGRhdGVCb3VuZHMoKTtcblx0XHR9O1xuXG5cdFx0Ly8gZXZlbnQgaGFuZGxlciBmb3Igd2hlbiB0cmlnZ2VyIHBhcmFtcyBjaGFuZ2Vcblx0XHR2YXIgaGFuZGxlVHJpZ2dlclBhcmFtc0NoYW5nZSA9IGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRpZiAoZS53aGF0ID09PSBcInRyaWdnZXJIb29rXCIpIHtcblx0XHRcdFx0dXBkYXRlVHJpZ2dlckdyb3VwKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuLypcblx0XHQgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0ICogQm91bmRzIChzdGFydCAvIHN0b3ApIG1hbmFnZW1lbnRcblx0XHQgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0ICovXG5cblx0XHQvLyBhZGRzIGFuIG5ldyBib3VuZHMgZWxlbWVudHMgdG8gdGhlIGFycmF5IGFuZCB0byB0aGUgRE9NXG5cdFx0dmFyIGFkZEJvdW5kcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciB2ID0gX2N0cmwuaW5mbyhcInZlcnRpY2FsXCIpO1xuXHRcdFx0Ly8gYXBwbHkgc3R1ZmYgd2UgZGlkbid0IGtub3cgYmVmb3JlLi4uXG5cdFx0XHRfdXRpbC5jc3MoX2VsZW1TdGFydC5maXJzdENoaWxkLCB7XG5cdFx0XHRcdFwiYm9yZGVyLWJvdHRvbS13aWR0aFwiOiB2ID8gMSA6IDAsXG5cdFx0XHRcdFwiYm9yZGVyLXJpZ2h0LXdpZHRoXCI6IHYgPyAwIDogMSxcblx0XHRcdFx0XCJib3R0b21cIjogdiA/IC0xIDogb3B0aW9ucy5pbmRlbnQsXG5cdFx0XHRcdFwicmlnaHRcIjogdiA/IG9wdGlvbnMuaW5kZW50IDogLTEsXG5cdFx0XHRcdFwicGFkZGluZ1wiOiB2ID8gXCIwIDhweFwiIDogXCIycHggNHB4XCIsXG5cdFx0XHR9KTtcblx0XHRcdF91dGlsLmNzcyhfZWxlbUVuZCwge1xuXHRcdFx0XHRcImJvcmRlci10b3Atd2lkdGhcIjogdiA/IDEgOiAwLFxuXHRcdFx0XHRcImJvcmRlci1sZWZ0LXdpZHRoXCI6IHYgPyAwIDogMSxcblx0XHRcdFx0XCJ0b3BcIjogdiA/IFwiMTAwJVwiIDogXCJcIixcblx0XHRcdFx0XCJyaWdodFwiOiB2ID8gb3B0aW9ucy5pbmRlbnQgOiBcIlwiLFxuXHRcdFx0XHRcImJvdHRvbVwiOiB2ID8gXCJcIiA6IG9wdGlvbnMuaW5kZW50LFxuXHRcdFx0XHRcImxlZnRcIjogdiA/IFwiXCIgOiBcIjEwMCVcIixcblx0XHRcdFx0XCJwYWRkaW5nXCI6IHYgPyBcIjAgOHB4XCIgOiBcIjJweCA0cHhcIlxuXHRcdFx0fSk7XG5cdFx0XHQvLyBhcHBlbmRcblx0XHRcdF9ib3VuZHNDb250YWluZXIuYXBwZW5kQ2hpbGQoX2VsZW1Cb3VuZHMpO1xuXHRcdH07XG5cblx0XHQvLyByZW1vdmUgYm91bmRzIGZyb20gbGlzdCBhbmQgRE9NXG5cdFx0dmFyIHJlbW92ZUJvdW5kcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdF9lbGVtQm91bmRzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoX2VsZW1Cb3VuZHMpO1xuXHRcdH07XG5cblx0XHQvLyB1cGRhdGUgdGhlIHN0YXJ0IGFuZCBlbmQgcG9zaXRpb25zIG9mIHRoZSBzY2VuZVxuXHRcdHZhciB1cGRhdGVCb3VuZHMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoX2VsZW1Cb3VuZHMucGFyZW50Tm9kZSAhPT0gX2JvdW5kc0NvbnRhaW5lcikge1xuXHRcdFx0XHRhZGRCb3VuZHMoKTsgLy8gQWRkIEJvdW5kcyBlbGVtZW50cyAoc3RhcnQvZW5kKVxuXHRcdFx0fVxuXHRcdFx0dmFyIGNzcyA9IHt9O1xuXHRcdFx0Y3NzW192ZXJ0aWNhbCA/IFwidG9wXCIgOiBcImxlZnRcIl0gPSBTY2VuZS50cmlnZ2VyUG9zaXRpb24oKTtcblx0XHRcdGNzc1tfdmVydGljYWwgPyBcImhlaWdodFwiIDogXCJ3aWR0aFwiXSA9IFNjZW5lLmR1cmF0aW9uKCk7XG5cdFx0XHRfdXRpbC5jc3MoX2VsZW1Cb3VuZHMsIGNzcyk7XG5cdFx0XHRfdXRpbC5jc3MoX2VsZW1FbmQsIHtcblx0XHRcdFx0ZGlzcGxheTogU2NlbmUuZHVyYXRpb24oKSA+IDAgPyBcIlwiIDogXCJub25lXCJcblx0XHRcdH0pO1xuXHRcdH07XG5cbi8qXG5cdFx0ICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCAqIHRyaWdnZXIgYW5kIHRyaWdnZXIgZ3JvdXAgbWFuYWdlbWVudFxuXHRcdCAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQgKi9cblxuXHRcdC8vIGFkZHMgYW4gbmV3IHRyaWdnZXIgZ3JvdXAgdG8gdGhlIGFycmF5IGFuZCB0byB0aGUgRE9NXG5cdFx0dmFyIGFkZFRyaWdnZXJHcm91cCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciB0cmlnZ2VyRWxlbSA9IFRQTC50cmlnZ2VyKG9wdGlvbnMuY29sb3JUcmlnZ2VyKTsgLy8gbmV3IHRyaWdnZXIgZWxlbWVudFxuXHRcdFx0dmFyIGNzcyA9IHt9O1xuXHRcdFx0Y3NzW192ZXJ0aWNhbCA/IFwicmlnaHRcIiA6IFwiYm90dG9tXCJdID0gMDtcblx0XHRcdGNzc1tfdmVydGljYWwgPyBcImJvcmRlci10b3Atd2lkdGhcIiA6IFwiYm9yZGVyLWxlZnQtd2lkdGhcIl0gPSAxO1xuXHRcdFx0X3V0aWwuY3NzKHRyaWdnZXJFbGVtLmZpcnN0Q2hpbGQsIGNzcyk7XG5cdFx0XHRfdXRpbC5jc3ModHJpZ2dlckVsZW0uZmlyc3RDaGlsZC5maXJzdENoaWxkLCB7XG5cdFx0XHRcdHBhZGRpbmc6IF92ZXJ0aWNhbCA/IFwiMCA4cHggM3B4IDhweFwiIDogXCIzcHggNHB4XCJcblx0XHRcdH0pO1xuXHRcdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0cmlnZ2VyRWxlbSk7IC8vIGRpcmVjdGx5IGFkZCB0byBib2R5XG5cdFx0XHR2YXIgbmV3R3JvdXAgPSB7XG5cdFx0XHRcdHRyaWdnZXJIb29rOiBTY2VuZS50cmlnZ2VySG9vaygpLFxuXHRcdFx0XHRlbGVtZW50OiB0cmlnZ2VyRWxlbSxcblx0XHRcdFx0bWVtYmVyczogW0luZGljYXRvcl1cblx0XHRcdH07XG5cdFx0XHRfY3RybC5faW5kaWNhdG9ycy5ncm91cHMucHVzaChuZXdHcm91cCk7XG5cdFx0XHRJbmRpY2F0b3IudHJpZ2dlckdyb3VwID0gbmV3R3JvdXA7XG5cdFx0XHQvLyB1cGRhdGUgcmlnaHQgYXdheVxuXHRcdFx0X2N0cmwuX2luZGljYXRvcnMudXBkYXRlVHJpZ2dlckdyb3VwTGFiZWwobmV3R3JvdXApO1xuXHRcdFx0X2N0cmwuX2luZGljYXRvcnMudXBkYXRlVHJpZ2dlckdyb3VwUG9zaXRpb25zKG5ld0dyb3VwKTtcblx0XHR9O1xuXG5cdFx0dmFyIHJlbW92ZVRyaWdnZXJHcm91cCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdF9jdHJsLl9pbmRpY2F0b3JzLmdyb3Vwcy5zcGxpY2UoX2N0cmwuX2luZGljYXRvcnMuZ3JvdXBzLmluZGV4T2YoSW5kaWNhdG9yLnRyaWdnZXJHcm91cCksIDEpO1xuXHRcdFx0SW5kaWNhdG9yLnRyaWdnZXJHcm91cC5lbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoSW5kaWNhdG9yLnRyaWdnZXJHcm91cC5lbGVtZW50KTtcblx0XHRcdEluZGljYXRvci50cmlnZ2VyR3JvdXAgPSB1bmRlZmluZWQ7XG5cdFx0fTtcblxuXHRcdC8vIHVwZGF0ZXMgdGhlIHRyaWdnZXIgZ3JvdXAgLT4gZWl0aGVyIGpvaW4gZXhpc3Rpbmcgb3IgYWRkIG5ldyBvbmVcbi8qXHRcblx0XHQgKiBMb2dpYzpcblx0XHQgKiAxIGlmIGEgdHJpZ2dlciBncm91cCBleGlzdCwgY2hlY2sgaWYgaXQncyBpbiBzeW5jIHdpdGggU2NlbmUgc2V0dGluZ3Mg4oCTIGlmIHNvLCBub3RoaW5nIGVsc2UgbmVlZHMgdG8gaGFwcGVuXG5cdFx0ICogMiB0cnkgdG8gZmluZCBhbiBleGlzdGluZyBvbmUgdGhhdCBtYXRjaGVzIFNjZW5lIHBhcmFtZXRlcnNcblx0XHQgKiBcdCAyLjEgSWYgYSBtYXRjaCBpcyBmb3VuZCBjaGVjayBpZiBhbHJlYWR5IGFzc2lnbmVkIHRvIGFuIGV4aXN0aW5nIGdyb3VwXG5cdFx0ICpcdFx0XHQgSWYgc286XG5cdFx0ICogICAgICAgQTogaXQgd2FzIHRoZSBsYXN0IG1lbWJlciBvZiBleGlzdGluZyBncm91cCAtPiBraWxsIHdob2xlIGdyb3VwXG5cdFx0ICogICAgICAgQjogdGhlIGV4aXN0aW5nIGdyb3VwIGhhcyBvdGhlciBtZW1iZXJzIC0+IGp1c3QgcmVtb3ZlIGZyb20gbWVtYmVyIGxpc3Rcblx0XHQgKlx0IDIuMiBBc3NpZ24gdG8gbWF0Y2hpbmcgZ3JvdXBcblx0XHQgKiAzIGlmIG5vIG5ldyBtYXRjaCBjb3VsZCBiZSBmb3VuZCwgY2hlY2sgaWYgYXNzaWduZWQgdG8gZXhpc3RpbmcgZ3JvdXBcblx0XHQgKiAgIEE6IHllcywgYW5kIGl0J3MgdGhlIG9ubHkgbWVtYmVyIC0+IGp1c3QgdXBkYXRlIHBhcmFtZXRlcnMgYW5kIHBvc2l0aW9ucyBhbmQga2VlcCB1c2luZyB0aGlzIGdyb3VwXG5cdFx0ICogICBCOiB5ZXMgYnV0IHRoZXJlIGFyZSBvdGhlciBtZW1iZXJzIC0+IHJlbW92ZSBmcm9tIG1lbWJlciBsaXN0IGFuZCBjcmVhdGUgYSBuZXcgb25lXG5cdFx0ICogICBDOiBubywgc28gY3JlYXRlIGEgbmV3IG9uZVxuXHRcdCAqL1xuXHRcdHZhciB1cGRhdGVUcmlnZ2VyR3JvdXAgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXJcblx0XHRcdHRyaWdnZXJIb29rID0gU2NlbmUudHJpZ2dlckhvb2soKSxcblx0XHRcdFx0Y2xvc2VFbm91Z2ggPSAwLjAwMDE7XG5cblx0XHRcdC8vIEhhdmUgYSBncm91cCwgY2hlY2sgaWYgaXQgc3RpbGwgbWF0Y2hlc1xuXHRcdFx0aWYgKEluZGljYXRvci50cmlnZ2VyR3JvdXApIHtcblx0XHRcdFx0aWYgKE1hdGguYWJzKEluZGljYXRvci50cmlnZ2VyR3JvdXAudHJpZ2dlckhvb2sgLSB0cmlnZ2VySG9vaykgPCBjbG9zZUVub3VnaCkge1xuXHRcdFx0XHRcdC8vIF91dGlsLmxvZygwLCBcInRyaWdnZXJcIiwgb3B0aW9ucy5uYW1lLCBcIi0+XCIsIFwibm8gbmVlZCB0byBjaGFuZ2UsIHN0aWxsIGluIHN5bmNcIik7XG5cdFx0XHRcdFx0cmV0dXJuOyAvLyBhbGwgZ29vZFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHQvLyBEb24ndCBoYXZlIGEgZ3JvdXAsIGNoZWNrIGlmIGEgbWF0Y2hpbmcgb25lIGV4aXN0c1xuXHRcdFx0Ly8gX3V0aWwubG9nKDAsIFwidHJpZ2dlclwiLCBvcHRpb25zLm5hbWUsIFwiLT5cIiwgXCJvdXQgb2Ygc3luYyFcIik7XG5cdFx0XHR2YXJcblx0XHRcdGdyb3VwcyA9IF9jdHJsLl9pbmRpY2F0b3JzLmdyb3Vwcyxcblx0XHRcdFx0Z3JvdXAsIGkgPSBncm91cHMubGVuZ3RoO1xuXHRcdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0XHRncm91cCA9IGdyb3Vwc1tpXTtcblx0XHRcdFx0aWYgKE1hdGguYWJzKGdyb3VwLnRyaWdnZXJIb29rIC0gdHJpZ2dlckhvb2spIDwgY2xvc2VFbm91Z2gpIHtcblx0XHRcdFx0XHQvLyBmb3VuZCBhIG1hdGNoIVxuXHRcdFx0XHRcdC8vIF91dGlsLmxvZygwLCBcInRyaWdnZXJcIiwgb3B0aW9ucy5uYW1lLCBcIi0+XCIsIFwiZm91bmQgbWF0Y2hcIik7XG5cdFx0XHRcdFx0aWYgKEluZGljYXRvci50cmlnZ2VyR3JvdXApIHsgLy8gZG8gSSBoYXZlIGFuIG9sZCBncm91cCB0aGF0IGlzIG91dCBvZiBzeW5jP1xuXHRcdFx0XHRcdFx0aWYgKEluZGljYXRvci50cmlnZ2VyR3JvdXAubWVtYmVycy5sZW5ndGggPT09IDEpIHsgLy8gaXMgaXQgdGhlIG9ubHkgcmVtYWluaW5nIGdyb3VwP1xuXHRcdFx0XHRcdFx0XHQvLyBfdXRpbC5sb2coMCwgXCJ0cmlnZ2VyXCIsIG9wdGlvbnMubmFtZSwgXCItPlwiLCBcImtpbGxcIik7XG5cdFx0XHRcdFx0XHRcdC8vIHdhcyB0aGUgbGFzdCBtZW1iZXIsIHJlbW92ZSB0aGUgd2hvbGUgZ3JvdXBcblx0XHRcdFx0XHRcdFx0cmVtb3ZlVHJpZ2dlckdyb3VwKCk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRJbmRpY2F0b3IudHJpZ2dlckdyb3VwLm1lbWJlcnMuc3BsaWNlKEluZGljYXRvci50cmlnZ2VyR3JvdXAubWVtYmVycy5pbmRleE9mKEluZGljYXRvciksIDEpOyAvLyBqdXN0IHJlbW92ZSBmcm9tIG1lbWJlcmxpc3Qgb2Ygb2xkIGdyb3VwXG5cdFx0XHRcdFx0XHRcdF9jdHJsLl9pbmRpY2F0b3JzLnVwZGF0ZVRyaWdnZXJHcm91cExhYmVsKEluZGljYXRvci50cmlnZ2VyR3JvdXApO1xuXHRcdFx0XHRcdFx0XHRfY3RybC5faW5kaWNhdG9ycy51cGRhdGVUcmlnZ2VyR3JvdXBQb3NpdGlvbnMoSW5kaWNhdG9yLnRyaWdnZXJHcm91cCk7XG5cdFx0XHRcdFx0XHRcdC8vIF91dGlsLmxvZygwLCBcInRyaWdnZXJcIiwgb3B0aW9ucy5uYW1lLCBcIi0+XCIsIFwicmVtb3ZpbmcgZnJvbSBwcmV2aW91cyBtZW1iZXIgbGlzdFwiKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gam9pbiBuZXcgZ3JvdXBcblx0XHRcdFx0XHRncm91cC5tZW1iZXJzLnB1c2goSW5kaWNhdG9yKTtcblx0XHRcdFx0XHRJbmRpY2F0b3IudHJpZ2dlckdyb3VwID0gZ3JvdXA7XG5cdFx0XHRcdFx0X2N0cmwuX2luZGljYXRvcnMudXBkYXRlVHJpZ2dlckdyb3VwTGFiZWwoZ3JvdXApO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBhdCB0aGlzIHBvaW50IEkgYW0gb2J2aW91c2x5IG91dCBvZiBzeW5jIGFuZCBkb24ndCBtYXRjaCBhbnkgb3RoZXIgZ3JvdXBcblx0XHRcdGlmIChJbmRpY2F0b3IudHJpZ2dlckdyb3VwKSB7XG5cdFx0XHRcdGlmIChJbmRpY2F0b3IudHJpZ2dlckdyb3VwLm1lbWJlcnMubGVuZ3RoID09PSAxKSB7XG5cdFx0XHRcdFx0Ly8gX3V0aWwubG9nKDAsIFwidHJpZ2dlclwiLCBvcHRpb25zLm5hbWUsIFwiLT5cIiwgXCJ1cGRhdGluZyBleGlzdGluZ1wiKTtcblx0XHRcdFx0XHQvLyBvdXQgb2Ygc3luYyBidXQgaSdtIHRoZSBvbmx5IG1lbWJlciA9PiBqdXN0IGNoYW5nZSBhbmQgdXBkYXRlXG5cdFx0XHRcdFx0SW5kaWNhdG9yLnRyaWdnZXJHcm91cC50cmlnZ2VySG9vayA9IHRyaWdnZXJIb29rO1xuXHRcdFx0XHRcdF9jdHJsLl9pbmRpY2F0b3JzLnVwZGF0ZVRyaWdnZXJHcm91cFBvc2l0aW9ucyhJbmRpY2F0b3IudHJpZ2dlckdyb3VwKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gX3V0aWwubG9nKDAsIFwidHJpZ2dlclwiLCBvcHRpb25zLm5hbWUsIFwiLT5cIiwgXCJyZW1vdmluZyBmcm9tIHByZXZpb3VzIG1lbWJlciBsaXN0XCIpO1xuXHRcdFx0XHRcdEluZGljYXRvci50cmlnZ2VyR3JvdXAubWVtYmVycy5zcGxpY2UoSW5kaWNhdG9yLnRyaWdnZXJHcm91cC5tZW1iZXJzLmluZGV4T2YoSW5kaWNhdG9yKSwgMSk7IC8vIGp1c3QgcmVtb3ZlIGZyb20gbWVtYmVybGlzdCBvZiBvbGQgZ3JvdXBcblx0XHRcdFx0XHRfY3RybC5faW5kaWNhdG9ycy51cGRhdGVUcmlnZ2VyR3JvdXBMYWJlbChJbmRpY2F0b3IudHJpZ2dlckdyb3VwKTtcblx0XHRcdFx0XHRfY3RybC5faW5kaWNhdG9ycy51cGRhdGVUcmlnZ2VyR3JvdXBQb3NpdGlvbnMoSW5kaWNhdG9yLnRyaWdnZXJHcm91cCk7XG5cdFx0XHRcdFx0SW5kaWNhdG9yLnRyaWdnZXJHcm91cCA9IHVuZGVmaW5lZDsgLy8gbmVlZCBhIGJyYW5kIG5ldyBncm91cC4uLlxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHQvLyBfdXRpbC5sb2coMCwgXCJ0cmlnZ2VyXCIsIG9wdGlvbnMubmFtZSwgXCItPlwiLCBcImFkZCBhIG5ldyBvbmVcIik7XG5cdFx0XHQvLyBkaWQgbm90IGZpbmQgYW55IG1hdGNoLCBtYWtlIG5ldyB0cmlnZ2VyIGdyb3VwXG5cdFx0XHRhZGRUcmlnZ2VyR3JvdXAoKTtcblx0XHR9O1xuXHR9O1xuXG4vKlxuXHQgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdCAqIFRlbXBsYXRlcyBmb3IgdGhlIGluZGljYXRvcnNcblx0ICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQgKi9cblx0dmFyIFRQTCA9IHtcblx0XHRzdGFydDogZnVuY3Rpb24gKGNvbG9yKSB7XG5cdFx0XHQvLyBpbm5lciBlbGVtZW50IChmb3IgYm90dG9tIG9mZnNldCAtMSwgd2hpbGUga2VlcGluZyB0b3AgcG9zaXRpb24gMClcblx0XHRcdHZhciBpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHRpbm5lci50ZXh0Q29udGVudCA9IFwic3RhcnRcIjtcblx0XHRcdF91dGlsLmNzcyhpbm5lciwge1xuXHRcdFx0XHRwb3NpdGlvbjogXCJhYnNvbHV0ZVwiLFxuXHRcdFx0XHRvdmVyZmxvdzogXCJ2aXNpYmxlXCIsXG5cdFx0XHRcdFwiYm9yZGVyLXdpZHRoXCI6IDAsXG5cdFx0XHRcdFwiYm9yZGVyLXN0eWxlXCI6IFwic29saWRcIixcblx0XHRcdFx0Y29sb3I6IGNvbG9yLFxuXHRcdFx0XHRcImJvcmRlci1jb2xvclwiOiBjb2xvclxuXHRcdFx0fSk7XG5cdFx0XHR2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdFx0Ly8gd3JhcHBlclxuXHRcdFx0X3V0aWwuY3NzKGUsIHtcblx0XHRcdFx0cG9zaXRpb246IFwiYWJzb2x1dGVcIixcblx0XHRcdFx0b3ZlcmZsb3c6IFwidmlzaWJsZVwiLFxuXHRcdFx0XHR3aWR0aDogMCxcblx0XHRcdFx0aGVpZ2h0OiAwXG5cdFx0XHR9KTtcblx0XHRcdGUuYXBwZW5kQ2hpbGQoaW5uZXIpO1xuXHRcdFx0cmV0dXJuIGU7XG5cdFx0fSxcblx0XHRlbmQ6IGZ1bmN0aW9uIChjb2xvcikge1xuXHRcdFx0dmFyIGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHRcdGUudGV4dENvbnRlbnQgPSBcImVuZFwiO1xuXHRcdFx0X3V0aWwuY3NzKGUsIHtcblx0XHRcdFx0cG9zaXRpb246IFwiYWJzb2x1dGVcIixcblx0XHRcdFx0b3ZlcmZsb3c6IFwidmlzaWJsZVwiLFxuXHRcdFx0XHRcImJvcmRlci13aWR0aFwiOiAwLFxuXHRcdFx0XHRcImJvcmRlci1zdHlsZVwiOiBcInNvbGlkXCIsXG5cdFx0XHRcdGNvbG9yOiBjb2xvcixcblx0XHRcdFx0XCJib3JkZXItY29sb3JcIjogY29sb3Jcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIGU7XG5cdFx0fSxcblx0XHRib3VuZHM6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0XHRfdXRpbC5jc3MoZSwge1xuXHRcdFx0XHRwb3NpdGlvbjogXCJhYnNvbHV0ZVwiLFxuXHRcdFx0XHRvdmVyZmxvdzogXCJ2aXNpYmxlXCIsXG5cdFx0XHRcdFwid2hpdGUtc3BhY2VcIjogXCJub3dyYXBcIixcblx0XHRcdFx0XCJwb2ludGVyLWV2ZW50c1wiOiBcIm5vbmVcIixcblx0XHRcdFx0XCJmb250LXNpemVcIjogRk9OVF9TSVpFXG5cdFx0XHR9KTtcblx0XHRcdGUuc3R5bGUuekluZGV4ID0gWklOREVYO1xuXHRcdFx0cmV0dXJuIGU7XG5cdFx0fSxcblx0XHR0cmlnZ2VyOiBmdW5jdGlvbiAoY29sb3IpIHtcblx0XHRcdC8vIGlubmVyIHRvIGJlIGFib3ZlIG9yIGJlbG93IGxpbmUgYnV0IGtlZXAgcG9zaXRpb25cblx0XHRcdHZhciBpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdFx0aW5uZXIudGV4dENvbnRlbnQgPSBcInRyaWdnZXJcIjtcblx0XHRcdF91dGlsLmNzcyhpbm5lciwge1xuXHRcdFx0XHRwb3NpdGlvbjogXCJyZWxhdGl2ZVwiLFxuXHRcdFx0fSk7XG5cdFx0XHQvLyBpbm5lciB3cmFwcGVyIGZvciByaWdodDogMCBhbmQgbWFpbiBlbGVtZW50IGhhcyBubyBzaXplXG5cdFx0XHR2YXIgdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdFx0X3V0aWwuY3NzKHcsIHtcblx0XHRcdFx0cG9zaXRpb246IFwiYWJzb2x1dGVcIixcblx0XHRcdFx0b3ZlcmZsb3c6IFwidmlzaWJsZVwiLFxuXHRcdFx0XHRcImJvcmRlci13aWR0aFwiOiAwLFxuXHRcdFx0XHRcImJvcmRlci1zdHlsZVwiOiBcInNvbGlkXCIsXG5cdFx0XHRcdGNvbG9yOiBjb2xvcixcblx0XHRcdFx0XCJib3JkZXItY29sb3JcIjogY29sb3Jcblx0XHRcdH0pO1xuXHRcdFx0dy5hcHBlbmRDaGlsZChpbm5lcik7XG5cdFx0XHQvLyB3cmFwcGVyXG5cdFx0XHR2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdFx0X3V0aWwuY3NzKGUsIHtcblx0XHRcdFx0cG9zaXRpb246IFwiZml4ZWRcIixcblx0XHRcdFx0b3ZlcmZsb3c6IFwidmlzaWJsZVwiLFxuXHRcdFx0XHRcIndoaXRlLXNwYWNlXCI6IFwibm93cmFwXCIsXG5cdFx0XHRcdFwicG9pbnRlci1ldmVudHNcIjogXCJub25lXCIsXG5cdFx0XHRcdFwiZm9udC1zaXplXCI6IEZPTlRfU0laRVxuXHRcdFx0fSk7XG5cdFx0XHRlLnN0eWxlLnpJbmRleCA9IFpJTkRFWDtcblx0XHRcdGUuYXBwZW5kQ2hpbGQodyk7XG5cdFx0XHRyZXR1cm4gZTtcblx0XHR9LFxuXHR9O1xuXG59KSk7Il19
