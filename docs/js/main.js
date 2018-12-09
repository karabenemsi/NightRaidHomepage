(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var ScrollMagic = require('scrollmagic');

var controller = new ScrollMagic.Controller();
var scene = new ScrollMagic.Scene({
  triggerElement: '#js-trigger-header',
  triggerHook: 'onLeave',
  offset: 500
}).setClassToggle('#js-header', 'topbar').addTo(controller); // let durationScene = new ScrollMagic.Scene({
//   triggerElement: '#trigger-2',
//     triggerHook: 'onLeave',
//   duration: 1000
// }).on("enter", () => {
//   console.log('Do Something on Enter');
//   // Do something
// }).on('leave', () => {
//   // Do something
//   console.log('Do Something on leave');
// }).addIndicators()
// .addTo(controller);

},{"scrollmagic":2}],2:[function(require,module,exports){
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
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9tYWluLmpzIiwibm9kZV9tb2R1bGVzL3Njcm9sbG1hZ2ljL3Njcm9sbG1hZ2ljL3VuY29tcHJlc3NlZC9TY3JvbGxNYWdpYy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQ0EsSUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGFBQUQsQ0FBM0I7O0FBRUEsSUFBSSxVQUFVLEdBQUcsSUFBSSxXQUFXLENBQUMsVUFBaEIsRUFBakI7QUFFQSxJQUFJLEtBQUssR0FBRyxJQUFJLFdBQVcsQ0FBQyxLQUFoQixDQUFzQjtBQUNoQyxFQUFBLGNBQWMsRUFBRSxvQkFEZ0I7QUFFaEMsRUFBQSxXQUFXLEVBQUUsU0FGbUI7QUFHaEMsRUFBQSxNQUFNLEVBQUU7QUFId0IsQ0FBdEIsRUFJVCxjQUpTLENBSU0sWUFKTixFQUlvQixRQUpwQixFQUtYLEtBTFcsQ0FLTCxVQUxLLENBQVosQyxDQVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJcclxuY29uc3QgU2Nyb2xsTWFnaWMgPSByZXF1aXJlKCdzY3JvbGxtYWdpYycpO1xyXG5cclxubGV0IGNvbnRyb2xsZXIgPSBuZXcgU2Nyb2xsTWFnaWMuQ29udHJvbGxlcigpO1xyXG5cclxubGV0IHNjZW5lID0gbmV3IFNjcm9sbE1hZ2ljLlNjZW5lKHtcclxuICB0cmlnZ2VyRWxlbWVudDogJyNqcy10cmlnZ2VyLWhlYWRlcicsXHJcbiAgdHJpZ2dlckhvb2s6ICdvbkxlYXZlJyxcclxuICBvZmZzZXQ6IDUwMFxyXG59KS5zZXRDbGFzc1RvZ2dsZSgnI2pzLWhlYWRlcicsICd0b3BiYXInKVxyXG4uYWRkVG8oY29udHJvbGxlcik7XHJcblxyXG5cclxuXHJcbi8vIGxldCBkdXJhdGlvblNjZW5lID0gbmV3IFNjcm9sbE1hZ2ljLlNjZW5lKHtcclxuLy8gICB0cmlnZ2VyRWxlbWVudDogJyN0cmlnZ2VyLTInLFxyXG4vLyAgICAgdHJpZ2dlckhvb2s6ICdvbkxlYXZlJyxcclxuLy8gICBkdXJhdGlvbjogMTAwMFxyXG4vLyB9KS5vbihcImVudGVyXCIsICgpID0+IHtcclxuLy8gICBjb25zb2xlLmxvZygnRG8gU29tZXRoaW5nIG9uIEVudGVyJyk7XHJcbi8vICAgLy8gRG8gc29tZXRoaW5nXHJcbi8vIH0pLm9uKCdsZWF2ZScsICgpID0+IHtcclxuLy8gICAvLyBEbyBzb21ldGhpbmdcclxuLy8gICBjb25zb2xlLmxvZygnRG8gU29tZXRoaW5nIG9uIGxlYXZlJyk7XHJcbi8vIH0pLmFkZEluZGljYXRvcnMoKVxyXG4vLyAuYWRkVG8oY29udHJvbGxlcik7IiwiLyohXG4gKiBTY3JvbGxNYWdpYyB2Mi4wLjYgKDIwMTgtMTAtMDgpXG4gKiBUaGUgamF2YXNjcmlwdCBsaWJyYXJ5IGZvciBtYWdpY2FsIHNjcm9sbCBpbnRlcmFjdGlvbnMuXG4gKiAoYykgMjAxOCBKYW4gUGFlcGtlIChAamFucGFlcGtlKVxuICogUHJvamVjdCBXZWJzaXRlOiBodHRwOi8vc2Nyb2xsbWFnaWMuaW9cbiAqIFxuICogQHZlcnNpb24gMi4wLjZcbiAqIEBsaWNlbnNlIER1YWwgbGljZW5zZWQgdW5kZXIgTUlUIGxpY2Vuc2UgYW5kIEdQTC5cbiAqIEBhdXRob3IgSmFuIFBhZXBrZSAtIGUtbWFpbEBqYW5wYWVwa2UuZGVcbiAqXG4gKiBAZmlsZSBTY3JvbGxNYWdpYyBtYWluIGxpYnJhcnkuXG4gKi9cbi8qKlxuICogQG5hbWVzcGFjZSBTY3JvbGxNYWdpY1xuICovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuXHRcdC8vIEFNRC4gUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZS5cblx0XHRkZWZpbmUoZmFjdG9yeSk7XG5cdH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdFx0Ly8gQ29tbW9uSlNcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0fSBlbHNlIHtcblx0XHQvLyBCcm93c2VyIGdsb2JhbFxuXHRcdHJvb3QuU2Nyb2xsTWFnaWMgPSBmYWN0b3J5KCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgU2Nyb2xsTWFnaWMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0X3V0aWwubG9nKDIsICcoQ09NUEFUSUJJTElUWSBOT1RJQ0UpIC0+IEFzIG9mIFNjcm9sbE1hZ2ljIDIuMC4wIHlvdSBuZWVkIHRvIHVzZSBcXCduZXcgU2Nyb2xsTWFnaWMuQ29udHJvbGxlcigpXFwnIHRvIGNyZWF0ZSBhIG5ldyBjb250cm9sbGVyIGluc3RhbmNlLiBVc2UgXFwnbmV3IFNjcm9sbE1hZ2ljLlNjZW5lKClcXCcgdG8gaW5zdGFuY2UgYSBzY2VuZS4nKTtcblx0fTtcblxuXHRTY3JvbGxNYWdpYy52ZXJzaW9uID0gXCIyLjAuNlwiO1xuXG5cdC8vIFRPRE86IHRlbXBvcmFyeSB3b3JrYXJvdW5kIGZvciBjaHJvbWUncyBzY3JvbGwgaml0dGVyIGJ1Z1xuXHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNld2hlZWxcIiwgZnVuY3Rpb24gKCkge30pO1xuXG5cdC8vIGdsb2JhbCBjb25zdFxuXHR2YXIgUElOX1NQQUNFUl9BVFRSSUJVVEUgPSBcImRhdGEtc2Nyb2xsbWFnaWMtcGluLXNwYWNlclwiO1xuXG5cdC8qKlxuXHQgKiBUaGUgbWFpbiBjbGFzcyB0aGF0IGlzIG5lZWRlZCBvbmNlIHBlciBzY3JvbGwgY29udGFpbmVyLlxuXHQgKlxuXHQgKiBAY2xhc3Ncblx0ICpcblx0ICogQGV4YW1wbGVcblx0ICogLy8gYmFzaWMgaW5pdGlhbGl6YXRpb25cblx0ICogdmFyIGNvbnRyb2xsZXIgPSBuZXcgU2Nyb2xsTWFnaWMuQ29udHJvbGxlcigpO1xuXHQgKlxuXHQgKiAvLyBwYXNzaW5nIG9wdGlvbnNcblx0ICogdmFyIGNvbnRyb2xsZXIgPSBuZXcgU2Nyb2xsTWFnaWMuQ29udHJvbGxlcih7Y29udGFpbmVyOiBcIiNteUNvbnRhaW5lclwiLCBsb2dsZXZlbDogM30pO1xuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdIC0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgb25lIG9yIG1vcmUgb3B0aW9ucyBmb3IgdGhlIGNvbnRyb2xsZXIuXG5cdCAqIEBwYXJhbSB7KHN0cmluZ3xvYmplY3QpfSBbb3B0aW9ucy5jb250YWluZXI9d2luZG93XSAtIEEgc2VsZWN0b3IsIERPTSBvYmplY3QgdGhhdCByZWZlcmVuY2VzIHRoZSBtYWluIGNvbnRhaW5lciBmb3Igc2Nyb2xsaW5nLlxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnZlcnRpY2FsPXRydWVdIC0gU2V0cyB0aGUgc2Nyb2xsIG1vZGUgdG8gdmVydGljYWwgKGB0cnVlYCkgb3IgaG9yaXpvbnRhbCAoYGZhbHNlYCkgc2Nyb2xsaW5nLlxuXHQgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnMuZ2xvYmFsU2NlbmVPcHRpb25zPXt9XSAtIFRoZXNlIG9wdGlvbnMgd2lsbCBiZSBwYXNzZWQgdG8gZXZlcnkgU2NlbmUgdGhhdCBpcyBhZGRlZCB0byB0aGUgY29udHJvbGxlciB1c2luZyB0aGUgYWRkU2NlbmUgbWV0aG9kLiBGb3IgbW9yZSBpbmZvcm1hdGlvbiBvbiBTY2VuZSBvcHRpb25zIHNlZSB7QGxpbmsgU2Nyb2xsTWFnaWMuU2NlbmV9LlxuXHQgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMubG9nbGV2ZWw9Ml0gTG9nbGV2ZWwgZm9yIGRlYnVnZ2luZy4gTm90ZSB0aGF0IGxvZ2dpbmcgaXMgZGlzYWJsZWQgaW4gdGhlIG1pbmlmaWVkIHZlcnNpb24gb2YgU2Nyb2xsTWFnaWMuXG5cdCAqKiBgMGAgPT4gc2lsZW50XG5cdCAqKiBgMWAgPT4gZXJyb3JzXG5cdCAqKiBgMmAgPT4gZXJyb3JzLCB3YXJuaW5nc1xuXHQgKiogYDNgID0+IGVycm9ycywgd2FybmluZ3MsIGRlYnVnaW5mb1xuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnJlZnJlc2hJbnRlcnZhbD0xMDBdIC0gU29tZSBjaGFuZ2VzIGRvbid0IGNhbGwgZXZlbnRzIGJ5IGRlZmF1bHQsIGxpa2UgY2hhbmdpbmcgdGhlIGNvbnRhaW5lciBzaXplIG9yIG1vdmluZyBhIHNjZW5lIHRyaWdnZXIgZWxlbWVudC4gIFxuXHQgVGhpcyBpbnRlcnZhbCBwb2xscyB0aGVzZSBwYXJhbWV0ZXJzIHRvIGZpcmUgdGhlIG5lY2Vzc2FyeSBldmVudHMuICBcblx0IElmIHlvdSBkb24ndCB1c2UgY3VzdG9tIGNvbnRhaW5lcnMsIHRyaWdnZXIgZWxlbWVudHMgb3IgaGF2ZSBzdGF0aWMgbGF5b3V0cywgd2hlcmUgdGhlIHBvc2l0aW9ucyBvZiB0aGUgdHJpZ2dlciBlbGVtZW50cyBkb24ndCBjaGFuZ2UsIHlvdSBjYW4gc2V0IHRoaXMgdG8gMCBkaXNhYmxlIGludGVydmFsIGNoZWNraW5nIGFuZCBpbXByb3ZlIHBlcmZvcm1hbmNlLlxuXHQgKlxuXHQgKi9cblx0U2Nyb2xsTWFnaWMuQ29udHJvbGxlciA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4vKlxuXHQgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdCAqIHNldHRpbmdzXG5cdCAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0ICovXG5cdFx0dmFyXG5cdFx0TkFNRVNQQUNFID0gJ1Njcm9sbE1hZ2ljLkNvbnRyb2xsZXInLFxuXHRcdFx0U0NST0xMX0RJUkVDVElPTl9GT1JXQVJEID0gJ0ZPUldBUkQnLFxuXHRcdFx0U0NST0xMX0RJUkVDVElPTl9SRVZFUlNFID0gJ1JFVkVSU0UnLFxuXHRcdFx0U0NST0xMX0RJUkVDVElPTl9QQVVTRUQgPSAnUEFVU0VEJyxcblx0XHRcdERFRkFVTFRfT1BUSU9OUyA9IENPTlRST0xMRVJfT1BUSU9OUy5kZWZhdWx0cztcblxuLypcblx0ICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQgKiBwcml2YXRlIHZhcnNcblx0ICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQgKi9cblx0XHR2YXJcblx0XHRDb250cm9sbGVyID0gdGhpcyxcblx0XHRcdF9vcHRpb25zID0gX3V0aWwuZXh0ZW5kKHt9LCBERUZBVUxUX09QVElPTlMsIG9wdGlvbnMpLFxuXHRcdFx0X3NjZW5lT2JqZWN0cyA9IFtdLFxuXHRcdFx0X3VwZGF0ZVNjZW5lc09uTmV4dEN5Y2xlID0gZmFsc2UsXG5cdFx0XHQvLyBjYW4gYmUgYm9vbGVhbiAodHJ1ZSA9PiBhbGwgc2NlbmVzKSBvciBhbiBhcnJheSBvZiBzY2VuZXMgdG8gYmUgdXBkYXRlZFxuXHRcdFx0X3Njcm9sbFBvcyA9IDAsXG5cdFx0XHRfc2Nyb2xsRGlyZWN0aW9uID0gU0NST0xMX0RJUkVDVElPTl9QQVVTRUQsXG5cdFx0XHRfaXNEb2N1bWVudCA9IHRydWUsXG5cdFx0XHRfdmlld1BvcnRTaXplID0gMCxcblx0XHRcdF9lbmFibGVkID0gdHJ1ZSxcblx0XHRcdF91cGRhdGVUaW1lb3V0LCBfcmVmcmVzaFRpbWVvdXQ7XG5cbi8qXG5cdCAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0ICogcHJpdmF0ZSBmdW5jdGlvbnNcblx0ICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQgKi9cblxuXHRcdC8qKlxuXHRcdCAqIEludGVybmFsIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIG9mIHRoZSBTY3JvbGxNYWdpYyBDb250cm9sbGVyXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgY29uc3RydWN0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIF9vcHRpb25zKSB7XG5cdFx0XHRcdGlmICghREVGQVVMVF9PUFRJT05TLmhhc093blByb3BlcnR5KGtleSkpIHtcblx0XHRcdFx0XHRsb2coMiwgXCJXQVJOSU5HOiBVbmtub3duIG9wdGlvbiBcXFwiXCIgKyBrZXkgKyBcIlxcXCJcIik7XG5cdFx0XHRcdFx0ZGVsZXRlIF9vcHRpb25zW2tleV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdF9vcHRpb25zLmNvbnRhaW5lciA9IF91dGlsLmdldC5lbGVtZW50cyhfb3B0aW9ucy5jb250YWluZXIpWzBdO1xuXHRcdFx0Ly8gY2hlY2sgU2Nyb2xsQ29udGFpbmVyXG5cdFx0XHRpZiAoIV9vcHRpb25zLmNvbnRhaW5lcikge1xuXHRcdFx0XHRsb2coMSwgXCJFUlJPUiBjcmVhdGluZyBvYmplY3QgXCIgKyBOQU1FU1BBQ0UgKyBcIjogTm8gdmFsaWQgc2Nyb2xsIGNvbnRhaW5lciBzdXBwbGllZFwiKTtcblx0XHRcdFx0dGhyb3cgTkFNRVNQQUNFICsgXCIgaW5pdCBmYWlsZWQuXCI7IC8vIGNhbmNlbFxuXHRcdFx0fVxuXHRcdFx0X2lzRG9jdW1lbnQgPSBfb3B0aW9ucy5jb250YWluZXIgPT09IHdpbmRvdyB8fCBfb3B0aW9ucy5jb250YWluZXIgPT09IGRvY3VtZW50LmJvZHkgfHwgIWRvY3VtZW50LmJvZHkuY29udGFpbnMoX29wdGlvbnMuY29udGFpbmVyKTtcblx0XHRcdC8vIG5vcm1hbGl6ZSB0byB3aW5kb3dcblx0XHRcdGlmIChfaXNEb2N1bWVudCkge1xuXHRcdFx0XHRfb3B0aW9ucy5jb250YWluZXIgPSB3aW5kb3c7XG5cdFx0XHR9XG5cdFx0XHQvLyB1cGRhdGUgY29udGFpbmVyIHNpemUgaW1tZWRpYXRlbHlcblx0XHRcdF92aWV3UG9ydFNpemUgPSBnZXRWaWV3cG9ydFNpemUoKTtcblx0XHRcdC8vIHNldCBldmVudCBoYW5kbGVyc1xuXHRcdFx0X29wdGlvbnMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgb25DaGFuZ2UpO1xuXHRcdFx0X29wdGlvbnMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJzY3JvbGxcIiwgb25DaGFuZ2UpO1xuXG5cdFx0XHR2YXIgcmkgPSBwYXJzZUludChfb3B0aW9ucy5yZWZyZXNoSW50ZXJ2YWwsIDEwKTtcblx0XHRcdF9vcHRpb25zLnJlZnJlc2hJbnRlcnZhbCA9IF91dGlsLnR5cGUuTnVtYmVyKHJpKSA/IHJpIDogREVGQVVMVF9PUFRJT05TLnJlZnJlc2hJbnRlcnZhbDtcblx0XHRcdHNjaGVkdWxlUmVmcmVzaCgpO1xuXG5cdFx0XHRsb2coMywgXCJhZGRlZCBuZXcgXCIgKyBOQU1FU1BBQ0UgKyBcIiBjb250cm9sbGVyICh2XCIgKyBTY3JvbGxNYWdpYy52ZXJzaW9uICsgXCIpXCIpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBTY2hlZHVsZSB0aGUgbmV4dCBleGVjdXRpb24gb2YgdGhlIHJlZnJlc2ggZnVuY3Rpb25cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBzY2hlZHVsZVJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoX29wdGlvbnMucmVmcmVzaEludGVydmFsID4gMCkge1xuXHRcdFx0XHRfcmVmcmVzaFRpbWVvdXQgPSB3aW5kb3cuc2V0VGltZW91dChyZWZyZXNoLCBfb3B0aW9ucy5yZWZyZXNoSW50ZXJ2YWwpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBEZWZhdWx0IGZ1bmN0aW9uIHRvIGdldCBzY3JvbGwgcG9zIC0gb3ZlcndyaXRlYWJsZSB1c2luZyBgQ29udHJvbGxlci5zY3JvbGxQb3MobmV3RnVuY3Rpb24pYFxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dmFyIGdldFNjcm9sbFBvcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBfb3B0aW9ucy52ZXJ0aWNhbCA/IF91dGlsLmdldC5zY3JvbGxUb3AoX29wdGlvbnMuY29udGFpbmVyKSA6IF91dGlsLmdldC5zY3JvbGxMZWZ0KF9vcHRpb25zLmNvbnRhaW5lcik7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIGN1cnJlbnQgdmlld3BvcnQgU2l6ZSAod2lkdGggdm9yIGhvcml6b250YWwsIGhlaWdodCBmb3IgdmVydGljYWwpXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgZ2V0Vmlld3BvcnRTaXplID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIF9vcHRpb25zLnZlcnRpY2FsID8gX3V0aWwuZ2V0LmhlaWdodChfb3B0aW9ucy5jb250YWluZXIpIDogX3V0aWwuZ2V0LndpZHRoKF9vcHRpb25zLmNvbnRhaW5lcik7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIERlZmF1bHQgZnVuY3Rpb24gdG8gc2V0IHNjcm9sbCBwb3MgLSBvdmVyd3JpdGVhYmxlIHVzaW5nIGBDb250cm9sbGVyLnNjcm9sbFRvKG5ld0Z1bmN0aW9uKWBcblx0XHQgKiBNYWtlIGF2YWlsYWJsZSBwdWJsaWNseSBmb3IgcGlubmVkIG1vdXNld2hlZWwgd29ya2Fyb3VuZC5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBzZXRTY3JvbGxQb3MgPSB0aGlzLl9zZXRTY3JvbGxQb3MgPSBmdW5jdGlvbiAocG9zKSB7XG5cdFx0XHRpZiAoX29wdGlvbnMudmVydGljYWwpIHtcblx0XHRcdFx0aWYgKF9pc0RvY3VtZW50KSB7XG5cdFx0XHRcdFx0d2luZG93LnNjcm9sbFRvKF91dGlsLmdldC5zY3JvbGxMZWZ0KCksIHBvcyk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0X29wdGlvbnMuY29udGFpbmVyLnNjcm9sbFRvcCA9IHBvcztcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKF9pc0RvY3VtZW50KSB7XG5cdFx0XHRcdFx0d2luZG93LnNjcm9sbFRvKHBvcywgX3V0aWwuZ2V0LnNjcm9sbFRvcCgpKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRfb3B0aW9ucy5jb250YWluZXIuc2Nyb2xsTGVmdCA9IHBvcztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBIYW5kbGUgdXBkYXRlcyBpbiBjeWNsZXMgaW5zdGVhZCBvZiBvbiBzY3JvbGwgKHBlcmZvcm1hbmNlKVxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dmFyIHVwZGF0ZVNjZW5lcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChfZW5hYmxlZCAmJiBfdXBkYXRlU2NlbmVzT25OZXh0Q3ljbGUpIHtcblx0XHRcdFx0Ly8gZGV0ZXJtaW5lIHNjZW5lcyB0byB1cGRhdGVcblx0XHRcdFx0dmFyIHNjZW5lc1RvVXBkYXRlID0gX3V0aWwudHlwZS5BcnJheShfdXBkYXRlU2NlbmVzT25OZXh0Q3ljbGUpID8gX3VwZGF0ZVNjZW5lc09uTmV4dEN5Y2xlIDogX3NjZW5lT2JqZWN0cy5zbGljZSgwKTtcblx0XHRcdFx0Ly8gcmVzZXQgc2NlbmVzXG5cdFx0XHRcdF91cGRhdGVTY2VuZXNPbk5leHRDeWNsZSA9IGZhbHNlO1xuXHRcdFx0XHR2YXIgb2xkU2Nyb2xsUG9zID0gX3Njcm9sbFBvcztcblx0XHRcdFx0Ly8gdXBkYXRlIHNjcm9sbCBwb3Mgbm93IGluc3RlYWQgb2Ygb25DaGFuZ2UsIGFzIGl0IG1pZ2h0IGhhdmUgY2hhbmdlZCBzaW5jZSBzY2hlZHVsaW5nIChpLmUuIGluLWJyb3dzZXIgc21vb3RoIHNjcm9sbClcblx0XHRcdFx0X3Njcm9sbFBvcyA9IENvbnRyb2xsZXIuc2Nyb2xsUG9zKCk7XG5cdFx0XHRcdHZhciBkZWx0YVNjcm9sbCA9IF9zY3JvbGxQb3MgLSBvbGRTY3JvbGxQb3M7XG5cdFx0XHRcdGlmIChkZWx0YVNjcm9sbCAhPT0gMCkgeyAvLyBzY3JvbGwgcG9zaXRpb24gY2hhbmdlZD9cblx0XHRcdFx0XHRfc2Nyb2xsRGlyZWN0aW9uID0gKGRlbHRhU2Nyb2xsID4gMCkgPyBTQ1JPTExfRElSRUNUSU9OX0ZPUldBUkQgOiBTQ1JPTExfRElSRUNUSU9OX1JFVkVSU0U7XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gcmV2ZXJzZSBvcmRlciBvZiBzY2VuZXMgaWYgc2Nyb2xsaW5nIHJldmVyc2Vcblx0XHRcdFx0aWYgKF9zY3JvbGxEaXJlY3Rpb24gPT09IFNDUk9MTF9ESVJFQ1RJT05fUkVWRVJTRSkge1xuXHRcdFx0XHRcdHNjZW5lc1RvVXBkYXRlLnJldmVyc2UoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyB1cGRhdGUgc2NlbmVzXG5cdFx0XHRcdHNjZW5lc1RvVXBkYXRlLmZvckVhY2goZnVuY3Rpb24gKHNjZW5lLCBpbmRleCkge1xuXHRcdFx0XHRcdGxvZygzLCBcInVwZGF0aW5nIFNjZW5lIFwiICsgKGluZGV4ICsgMSkgKyBcIi9cIiArIHNjZW5lc1RvVXBkYXRlLmxlbmd0aCArIFwiIChcIiArIF9zY2VuZU9iamVjdHMubGVuZ3RoICsgXCIgdG90YWwpXCIpO1xuXHRcdFx0XHRcdHNjZW5lLnVwZGF0ZSh0cnVlKTtcblx0XHRcdFx0fSk7XG5cdFx0XHRcdGlmIChzY2VuZXNUb1VwZGF0ZS5sZW5ndGggPT09IDAgJiYgX29wdGlvbnMubG9nbGV2ZWwgPj0gMykge1xuXHRcdFx0XHRcdGxvZygzLCBcInVwZGF0aW5nIDAgU2NlbmVzIChub3RoaW5nIGFkZGVkIHRvIGNvbnRyb2xsZXIpXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIEluaXRpYWxpemVzIHJBRiBjYWxsYmFja1xuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dmFyIGRlYm91bmNlVXBkYXRlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0X3VwZGF0ZVRpbWVvdXQgPSBfdXRpbC5yQUYodXBkYXRlU2NlbmVzKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogSGFuZGxlcyBDb250YWluZXIgY2hhbmdlc1xuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dmFyIG9uQ2hhbmdlID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdGxvZygzLCBcImV2ZW50IGZpcmVkIGNhdXNpbmcgYW4gdXBkYXRlOlwiLCBlLnR5cGUpO1xuXHRcdFx0aWYgKGUudHlwZSA9PSBcInJlc2l6ZVwiKSB7XG5cdFx0XHRcdC8vIHJlc2l6ZVxuXHRcdFx0XHRfdmlld1BvcnRTaXplID0gZ2V0Vmlld3BvcnRTaXplKCk7XG5cdFx0XHRcdF9zY3JvbGxEaXJlY3Rpb24gPSBTQ1JPTExfRElSRUNUSU9OX1BBVVNFRDtcblx0XHRcdH1cblx0XHRcdC8vIHNjaGVkdWxlIHVwZGF0ZVxuXHRcdFx0aWYgKF91cGRhdGVTY2VuZXNPbk5leHRDeWNsZSAhPT0gdHJ1ZSkge1xuXHRcdFx0XHRfdXBkYXRlU2NlbmVzT25OZXh0Q3ljbGUgPSB0cnVlO1xuXHRcdFx0XHRkZWJvdW5jZVVwZGF0ZSgpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR2YXIgcmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmICghX2lzRG9jdW1lbnQpIHtcblx0XHRcdFx0Ly8gc2ltdWxhdGUgcmVzaXplIGV2ZW50LiBPbmx5IHdvcmtzIGZvciB2aWV3cG9ydCByZWxldmFudCBwYXJhbSAocGVyZm9ybWFuY2UpXG5cdFx0XHRcdGlmIChfdmlld1BvcnRTaXplICE9IGdldFZpZXdwb3J0U2l6ZSgpKSB7XG5cdFx0XHRcdFx0dmFyIHJlc2l6ZUV2ZW50O1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRyZXNpemVFdmVudCA9IG5ldyBFdmVudCgncmVzaXplJywge1xuXHRcdFx0XHRcdFx0XHRidWJibGVzOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0Y2FuY2VsYWJsZTogZmFsc2Vcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHsgLy8gc3R1cGlkIElFXG5cdFx0XHRcdFx0XHRyZXNpemVFdmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiRXZlbnRcIik7XG5cdFx0XHRcdFx0XHRyZXNpemVFdmVudC5pbml0RXZlbnQoXCJyZXNpemVcIiwgZmFsc2UsIGZhbHNlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0X29wdGlvbnMuY29udGFpbmVyLmRpc3BhdGNoRXZlbnQocmVzaXplRXZlbnQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRfc2NlbmVPYmplY3RzLmZvckVhY2goZnVuY3Rpb24gKHNjZW5lLCBpbmRleCkgeyAvLyByZWZyZXNoIGFsbCBzY2VuZXNcblx0XHRcdFx0c2NlbmUucmVmcmVzaCgpO1xuXHRcdFx0fSk7XG5cdFx0XHRzY2hlZHVsZVJlZnJlc2goKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogU2VuZCBhIGRlYnVnIG1lc3NhZ2UgdG8gdGhlIGNvbnNvbGUuXG5cdFx0ICogcHJvdmlkZWQgcHVibGljbHkgd2l0aCBfbG9nIGZvciBwbHVnaW5zXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSBsb2dsZXZlbCAtIFRoZSBsb2dsZXZlbCByZXF1aXJlZCB0byBpbml0aWF0ZSBvdXRwdXQgZm9yIHRoZSBtZXNzYWdlLlxuXHRcdCAqIEBwYXJhbSB7Li4ubWl4ZWR9IG91dHB1dCAtIE9uZSBvciBtb3JlIHZhcmlhYmxlcyB0aGF0IHNob3VsZCBiZSBwYXNzZWQgdG8gdGhlIGNvbnNvbGUuXG5cdFx0ICovXG5cdFx0dmFyIGxvZyA9IHRoaXMuX2xvZyA9IGZ1bmN0aW9uIChsb2dsZXZlbCwgb3V0cHV0KSB7XG5cdFx0XHRpZiAoX29wdGlvbnMubG9nbGV2ZWwgPj0gbG9nbGV2ZWwpIHtcblx0XHRcdFx0QXJyYXkucHJvdG90eXBlLnNwbGljZS5jYWxsKGFyZ3VtZW50cywgMSwgMCwgXCIoXCIgKyBOQU1FU1BBQ0UgKyBcIikgLT5cIik7XG5cdFx0XHRcdF91dGlsLmxvZy5hcHBseSh3aW5kb3csIGFyZ3VtZW50cyk7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHQvLyBmb3Igc2NlbmVzIHdlIGhhdmUgZ2V0dGVycyBmb3IgZWFjaCBvcHRpb24sIGJ1dCBmb3IgdGhlIGNvbnRyb2xsZXIgd2UgZG9uJ3QsIHNvIHdlIG5lZWQgdG8gbWFrZSBpdCBhdmFpbGFibGUgZXh0ZXJuYWxseSBmb3IgcGx1Z2luc1xuXHRcdHRoaXMuX29wdGlvbnMgPSBfb3B0aW9ucztcblxuXHRcdC8qKlxuXHRcdCAqIFNvcnQgc2NlbmVzIGluIGFzY2VuZGluZyBvcmRlciBvZiB0aGVpciBzdGFydCBvZmZzZXQuXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7YXJyYXl9IFNjZW5lc0FycmF5IC0gYW4gYXJyYXkgb2YgU2Nyb2xsTWFnaWMgU2NlbmVzIHRoYXQgc2hvdWxkIGJlIHNvcnRlZFxuXHRcdCAqIEByZXR1cm4ge2FycmF5fSBUaGUgc29ydGVkIGFycmF5IG9mIFNjZW5lcy5cblx0XHQgKi9cblx0XHR2YXIgc29ydFNjZW5lcyA9IGZ1bmN0aW9uIChTY2VuZXNBcnJheSkge1xuXHRcdFx0aWYgKFNjZW5lc0FycmF5Lmxlbmd0aCA8PSAxKSB7XG5cdFx0XHRcdHJldHVybiBTY2VuZXNBcnJheTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHZhciBzY2VuZXMgPSBTY2VuZXNBcnJheS5zbGljZSgwKTtcblx0XHRcdFx0c2NlbmVzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcblx0XHRcdFx0XHRyZXR1cm4gYS5zY3JvbGxPZmZzZXQoKSA+IGIuc2Nyb2xsT2Zmc2V0KCkgPyAxIDogLTE7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRyZXR1cm4gc2NlbmVzO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0ICogcHVibGljIGZ1bmN0aW9uc1xuXHRcdCAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQgKi9cblxuXHRcdC8qKlxuXHRcdCAqIEFkZCBvbmUgb3JlIG1vcmUgc2NlbmUocykgdG8gdGhlIGNvbnRyb2xsZXIuICBcblx0XHQgKiBUaGlzIGlzIHRoZSBlcXVpdmFsZW50IHRvIGBTY2VuZS5hZGRUbyhjb250cm9sbGVyKWAuXG5cdFx0ICogQHB1YmxpY1xuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogLy8gd2l0aCBhIHByZXZpb3VzbHkgZGVmaW5lZCBzY2VuZVxuXHRcdCAqIGNvbnRyb2xsZXIuYWRkU2NlbmUoc2NlbmUpO1xuXHRcdCAqXG5cdFx0ICogLy8gd2l0aCBhIG5ld2x5IGNyZWF0ZWQgc2NlbmUuXG5cdFx0ICogY29udHJvbGxlci5hZGRTY2VuZShuZXcgU2Nyb2xsTWFnaWMuU2NlbmUoe2R1cmF0aW9uIDogMH0pKTtcblx0XHQgKlxuXHRcdCAqIC8vIGFkZGluZyBtdWx0aXBsZSBzY2VuZXNcblx0XHQgKiBjb250cm9sbGVyLmFkZFNjZW5lKFtzY2VuZSwgc2NlbmUyLCBuZXcgU2Nyb2xsTWFnaWMuU2NlbmUoe2R1cmF0aW9uIDogMH0pXSk7XG5cdFx0ICpcblx0XHQgKiBAcGFyYW0geyhTY3JvbGxNYWdpYy5TY2VuZXxhcnJheSl9IG5ld1NjZW5lIC0gU2Nyb2xsTWFnaWMgU2NlbmUgb3IgQXJyYXkgb2YgU2NlbmVzIHRvIGJlIGFkZGVkIHRvIHRoZSBjb250cm9sbGVyLlxuXHRcdCAqIEByZXR1cm4ge0NvbnRyb2xsZXJ9IFBhcmVudCBvYmplY3QgZm9yIGNoYWluaW5nLlxuXHRcdCAqL1xuXHRcdHRoaXMuYWRkU2NlbmUgPSBmdW5jdGlvbiAobmV3U2NlbmUpIHtcblx0XHRcdGlmIChfdXRpbC50eXBlLkFycmF5KG5ld1NjZW5lKSkge1xuXHRcdFx0XHRuZXdTY2VuZS5mb3JFYWNoKGZ1bmN0aW9uIChzY2VuZSwgaW5kZXgpIHtcblx0XHRcdFx0XHRDb250cm9sbGVyLmFkZFNjZW5lKHNjZW5lKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2UgaWYgKG5ld1NjZW5lIGluc3RhbmNlb2YgU2Nyb2xsTWFnaWMuU2NlbmUpIHtcblx0XHRcdFx0aWYgKG5ld1NjZW5lLmNvbnRyb2xsZXIoKSAhPT0gQ29udHJvbGxlcikge1xuXHRcdFx0XHRcdG5ld1NjZW5lLmFkZFRvKENvbnRyb2xsZXIpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKF9zY2VuZU9iamVjdHMuaW5kZXhPZihuZXdTY2VuZSkgPCAwKSB7XG5cdFx0XHRcdFx0Ly8gbmV3IHNjZW5lXG5cdFx0XHRcdFx0X3NjZW5lT2JqZWN0cy5wdXNoKG5ld1NjZW5lKTsgLy8gYWRkIHRvIGFycmF5XG5cdFx0XHRcdFx0X3NjZW5lT2JqZWN0cyA9IHNvcnRTY2VuZXMoX3NjZW5lT2JqZWN0cyk7IC8vIHNvcnRcblx0XHRcdFx0XHRuZXdTY2VuZS5vbihcInNoaWZ0LmNvbnRyb2xsZXJfc29ydFwiLCBmdW5jdGlvbiAoKSB7IC8vIHJlc29ydCB3aGVuZXZlciBzY2VuZSBtb3Zlc1xuXHRcdFx0XHRcdFx0X3NjZW5lT2JqZWN0cyA9IHNvcnRTY2VuZXMoX3NjZW5lT2JqZWN0cyk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0Ly8gaW5zZXJ0IEdsb2JhbCBkZWZhdWx0cy5cblx0XHRcdFx0XHRmb3IgKHZhciBrZXkgaW4gX29wdGlvbnMuZ2xvYmFsU2NlbmVPcHRpb25zKSB7XG5cdFx0XHRcdFx0XHRpZiAobmV3U2NlbmVba2V5XSkge1xuXHRcdFx0XHRcdFx0XHRuZXdTY2VuZVtrZXldLmNhbGwobmV3U2NlbmUsIF9vcHRpb25zLmdsb2JhbFNjZW5lT3B0aW9uc1trZXldKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0bG9nKDMsIFwiYWRkaW5nIFNjZW5lIChub3cgXCIgKyBfc2NlbmVPYmplY3RzLmxlbmd0aCArIFwiIHRvdGFsKVwiKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bG9nKDEsIFwiRVJST1I6IGludmFsaWQgYXJndW1lbnQgc3VwcGxpZWQgZm9yICcuYWRkU2NlbmUoKSdcIik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gQ29udHJvbGxlcjtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogUmVtb3ZlIG9uZSBvcmUgbW9yZSBzY2VuZShzKSBmcm9tIHRoZSBjb250cm9sbGVyLiAgXG5cdFx0ICogVGhpcyBpcyB0aGUgZXF1aXZhbGVudCB0byBgU2NlbmUucmVtb3ZlKClgLlxuXHRcdCAqIEBwdWJsaWNcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIHJlbW92ZSBhIHNjZW5lIGZyb20gdGhlIGNvbnRyb2xsZXJcblx0XHQgKiBjb250cm9sbGVyLnJlbW92ZVNjZW5lKHNjZW5lKTtcblx0XHQgKlxuXHRcdCAqIC8vIHJlbW92ZSBtdWx0aXBsZSBzY2VuZXMgZnJvbSB0aGUgY29udHJvbGxlclxuXHRcdCAqIGNvbnRyb2xsZXIucmVtb3ZlU2NlbmUoW3NjZW5lLCBzY2VuZTIsIHNjZW5lM10pO1xuXHRcdCAqXG5cdFx0ICogQHBhcmFtIHsoU2Nyb2xsTWFnaWMuU2NlbmV8YXJyYXkpfSBTY2VuZSAtIFNjcm9sbE1hZ2ljIFNjZW5lIG9yIEFycmF5IG9mIFNjZW5lcyB0byBiZSByZW1vdmVkIGZyb20gdGhlIGNvbnRyb2xsZXIuXG5cdFx0ICogQHJldHVybnMge0NvbnRyb2xsZXJ9IFBhcmVudCBvYmplY3QgZm9yIGNoYWluaW5nLlxuXHRcdCAqL1xuXHRcdHRoaXMucmVtb3ZlU2NlbmUgPSBmdW5jdGlvbiAoU2NlbmUpIHtcblx0XHRcdGlmIChfdXRpbC50eXBlLkFycmF5KFNjZW5lKSkge1xuXHRcdFx0XHRTY2VuZS5mb3JFYWNoKGZ1bmN0aW9uIChzY2VuZSwgaW5kZXgpIHtcblx0XHRcdFx0XHRDb250cm9sbGVyLnJlbW92ZVNjZW5lKHNjZW5lKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2YXIgaW5kZXggPSBfc2NlbmVPYmplY3RzLmluZGV4T2YoU2NlbmUpO1xuXHRcdFx0XHRpZiAoaW5kZXggPiAtMSkge1xuXHRcdFx0XHRcdFNjZW5lLm9mZihcInNoaWZ0LmNvbnRyb2xsZXJfc29ydFwiKTtcblx0XHRcdFx0XHRfc2NlbmVPYmplY3RzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRcdFx0bG9nKDMsIFwicmVtb3ZpbmcgU2NlbmUgKG5vdyBcIiArIF9zY2VuZU9iamVjdHMubGVuZ3RoICsgXCIgbGVmdClcIik7XG5cdFx0XHRcdFx0U2NlbmUucmVtb3ZlKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiBDb250cm9sbGVyO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBVcGRhdGUgb25lIG9yZSBtb3JlIHNjZW5lKHMpIGFjY29yZGluZyB0byB0aGUgc2Nyb2xsIHBvc2l0aW9uIG9mIHRoZSBjb250YWluZXIuICBcblx0XHQgKiBUaGlzIGlzIHRoZSBlcXVpdmFsZW50IHRvIGBTY2VuZS51cGRhdGUoKWAuICBcblx0XHQgKiBUaGUgdXBkYXRlIG1ldGhvZCBjYWxjdWxhdGVzIHRoZSBzY2VuZSdzIHN0YXJ0IGFuZCBlbmQgcG9zaXRpb24gKGJhc2VkIG9uIHRoZSB0cmlnZ2VyIGVsZW1lbnQsIHRyaWdnZXIgaG9vaywgZHVyYXRpb24gYW5kIG9mZnNldCkgYW5kIGNoZWNrcyBpdCBhZ2FpbnN0IHRoZSBjdXJyZW50IHNjcm9sbCBwb3NpdGlvbiBvZiB0aGUgY29udGFpbmVyLiAgXG5cdFx0ICogSXQgdGhlbiB1cGRhdGVzIHRoZSBjdXJyZW50IHNjZW5lIHN0YXRlIGFjY29yZGluZ2x5IChvciBkb2VzIG5vdGhpbmcsIGlmIHRoZSBzdGF0ZSBpcyBhbHJlYWR5IGNvcnJlY3QpIOKAkyBQaW5zIHdpbGwgYmUgc2V0IHRvIHRoZWlyIGNvcnJlY3QgcG9zaXRpb24gYW5kIHR3ZWVucyB3aWxsIGJlIHVwZGF0ZWQgdG8gdGhlaXIgY29ycmVjdCBwcm9ncmVzcy4gIFxuXHRcdCAqIF8qKk5vdGU6KiogVGhpcyBtZXRob2QgZ2V0cyBjYWxsZWQgY29uc3RhbnRseSB3aGVuZXZlciBDb250cm9sbGVyIGRldGVjdHMgYSBjaGFuZ2UuIFRoZSBvbmx5IGFwcGxpY2F0aW9uIGZvciB5b3UgaXMgaWYgeW91IGNoYW5nZSBzb21ldGhpbmcgb3V0c2lkZSBvZiB0aGUgcmVhbG0gb2YgU2Nyb2xsTWFnaWMsIGxpa2UgbW92aW5nIHRoZSB0cmlnZ2VyIG9yIGNoYW5naW5nIHR3ZWVuIHBhcmFtZXRlcnMuX1xuXHRcdCAqIEBwdWJsaWNcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIHVwZGF0ZSBhIHNwZWNpZmljIHNjZW5lIG9uIG5leHQgY3ljbGVcblx0XHQgKiBjb250cm9sbGVyLnVwZGF0ZVNjZW5lKHNjZW5lKTtcblx0XHQgKlxuXHRcdCAqIC8vIHVwZGF0ZSBhIHNwZWNpZmljIHNjZW5lIGltbWVkaWF0ZWx5XG5cdFx0ICogY29udHJvbGxlci51cGRhdGVTY2VuZShzY2VuZSwgdHJ1ZSk7XG5cdFx0ICpcblx0XHQgKiAvLyB1cGRhdGUgbXVsdGlwbGUgc2NlbmVzIHNjZW5lIG9uIG5leHQgY3ljbGVcblx0XHQgKiBjb250cm9sbGVyLnVwZGF0ZVNjZW5lKFtzY2VuZTEsIHNjZW5lMiwgc2NlbmUzXSk7XG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge1Njcm9sbE1hZ2ljLlNjZW5lfSBTY2VuZSAtIFNjcm9sbE1hZ2ljIFNjZW5lIG9yIEFycmF5IG9mIFNjZW5lcyB0aGF0IGlzL2FyZSBzdXBwb3NlZCB0byBiZSB1cGRhdGVkLlxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gW2ltbWVkaWF0ZWx5PWZhbHNlXSAtIElmIGB0cnVlYCB0aGUgdXBkYXRlIHdpbGwgYmUgaW5zdGFudCwgaWYgYGZhbHNlYCBpdCB3aWxsIHdhaXQgdW50aWwgbmV4dCB1cGRhdGUgY3ljbGUuICBcblx0XHQgVGhpcyBpcyB1c2VmdWwgd2hlbiBjaGFuZ2luZyBtdWx0aXBsZSBwcm9wZXJ0aWVzIG9mIHRoZSBzY2VuZSAtIHRoaXMgd2F5IGl0IHdpbGwgb25seSBiZSB1cGRhdGVkIG9uY2UgYWxsIG5ldyBwcm9wZXJ0aWVzIGFyZSBzZXQgKHVwZGF0ZVNjZW5lcykuXG5cdFx0ICogQHJldHVybiB7Q29udHJvbGxlcn0gUGFyZW50IG9iamVjdCBmb3IgY2hhaW5pbmcuXG5cdFx0ICovXG5cdFx0dGhpcy51cGRhdGVTY2VuZSA9IGZ1bmN0aW9uIChTY2VuZSwgaW1tZWRpYXRlbHkpIHtcblx0XHRcdGlmIChfdXRpbC50eXBlLkFycmF5KFNjZW5lKSkge1xuXHRcdFx0XHRTY2VuZS5mb3JFYWNoKGZ1bmN0aW9uIChzY2VuZSwgaW5kZXgpIHtcblx0XHRcdFx0XHRDb250cm9sbGVyLnVwZGF0ZVNjZW5lKHNjZW5lLCBpbW1lZGlhdGVseSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKGltbWVkaWF0ZWx5KSB7XG5cdFx0XHRcdFx0U2NlbmUudXBkYXRlKHRydWUpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKF91cGRhdGVTY2VuZXNPbk5leHRDeWNsZSAhPT0gdHJ1ZSAmJiBTY2VuZSBpbnN0YW5jZW9mIFNjcm9sbE1hZ2ljLlNjZW5lKSB7IC8vIGlmIF91cGRhdGVTY2VuZXNPbk5leHRDeWNsZSBpcyB0cnVlLCBhbGwgY29ubmVjdGVkIHNjZW5lcyBhcmUgYWxyZWFkeSBzY2hlZHVsZWQgZm9yIHVwZGF0ZVxuXHRcdFx0XHRcdC8vIHByZXAgYXJyYXkgZm9yIG5leHQgdXBkYXRlIGN5Y2xlXG5cdFx0XHRcdFx0X3VwZGF0ZVNjZW5lc09uTmV4dEN5Y2xlID0gX3VwZGF0ZVNjZW5lc09uTmV4dEN5Y2xlIHx8IFtdO1xuXHRcdFx0XHRcdGlmIChfdXBkYXRlU2NlbmVzT25OZXh0Q3ljbGUuaW5kZXhPZihTY2VuZSkgPT0gLTEpIHtcblx0XHRcdFx0XHRcdF91cGRhdGVTY2VuZXNPbk5leHRDeWNsZS5wdXNoKFNjZW5lKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0X3VwZGF0ZVNjZW5lc09uTmV4dEN5Y2xlID0gc29ydFNjZW5lcyhfdXBkYXRlU2NlbmVzT25OZXh0Q3ljbGUpOyAvLyBzb3J0XG5cdFx0XHRcdFx0ZGVib3VuY2VVcGRhdGUoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIENvbnRyb2xsZXI7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFVwZGF0ZXMgdGhlIGNvbnRyb2xsZXIgcGFyYW1zIGFuZCBjYWxscyB1cGRhdGVTY2VuZSBvbiBldmVyeSBzY2VuZSwgdGhhdCBpcyBhdHRhY2hlZCB0byB0aGUgY29udHJvbGxlci4gIFxuXHRcdCAqIFNlZSBgQ29udHJvbGxlci51cGRhdGVTY2VuZSgpYCBmb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCB3aGF0IHRoaXMgbWVhbnMuICBcblx0XHQgKiBJbiBtb3N0IGNhc2VzIHlvdSB3aWxsIG5vdCBuZWVkIHRoaXMgZnVuY3Rpb24sIGFzIGl0IGlzIGNhbGxlZCBjb25zdGFudGx5LCB3aGVuZXZlciBTY3JvbGxNYWdpYyBkZXRlY3RzIGEgc3RhdGUgY2hhbmdlIGV2ZW50LCBsaWtlIHJlc2l6ZSBvciBzY3JvbGwuICBcblx0XHQgKiBUaGUgb25seSBhcHBsaWNhdGlvbiBmb3IgdGhpcyBtZXRob2QgaXMgd2hlbiBTY3JvbGxNYWdpYyBmYWlscyB0byBkZXRlY3QgdGhlc2UgZXZlbnRzLiAgXG5cdFx0ICogT25lIGFwcGxpY2F0aW9uIGlzIHdpdGggc29tZSBleHRlcm5hbCBzY3JvbGwgbGlicmFyaWVzIChsaWtlIGlTY3JvbGwpIHRoYXQgbW92ZSBhbiBpbnRlcm5hbCBjb250YWluZXIgdG8gYSBuZWdhdGl2ZSBvZmZzZXQgaW5zdGVhZCBvZiBhY3R1YWxseSBzY3JvbGxpbmcuIEluIHRoaXMgY2FzZSB0aGUgdXBkYXRlIG9uIHRoZSBjb250cm9sbGVyIG5lZWRzIHRvIGJlIGNhbGxlZCB3aGVuZXZlciB0aGUgY2hpbGQgY29udGFpbmVyJ3MgcG9zaXRpb24gY2hhbmdlcy5cblx0XHQgKiBGb3IgdGhpcyBjYXNlIHRoZXJlIHdpbGwgYWxzbyBiZSB0aGUgbmVlZCB0byBwcm92aWRlIGEgY3VzdG9tIGZ1bmN0aW9uIHRvIGNhbGN1bGF0ZSB0aGUgY29ycmVjdCBzY3JvbGwgcG9zaXRpb24uIFNlZSBgQ29udHJvbGxlci5zY3JvbGxQb3MoKWAgZm9yIGRldGFpbHMuXG5cdFx0ICogQHB1YmxpY1xuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogLy8gdXBkYXRlIHRoZSBjb250cm9sbGVyIG9uIG5leHQgY3ljbGUgKHNhdmVzIHBlcmZvcm1hbmNlIGR1ZSB0byBlbGltaW5hdGlvbiBvZiByZWR1bmRhbnQgdXBkYXRlcylcblx0XHQgKiBjb250cm9sbGVyLnVwZGF0ZSgpO1xuXHRcdCAqXG5cdFx0ICogLy8gdXBkYXRlIHRoZSBjb250cm9sbGVyIGltbWVkaWF0ZWx5XG5cdFx0ICogY29udHJvbGxlci51cGRhdGUodHJ1ZSk7XG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IFtpbW1lZGlhdGVseT1mYWxzZV0gLSBJZiBgdHJ1ZWAgdGhlIHVwZGF0ZSB3aWxsIGJlIGluc3RhbnQsIGlmIGBmYWxzZWAgaXQgd2lsbCB3YWl0IHVudGlsIG5leHQgdXBkYXRlIGN5Y2xlIChiZXR0ZXIgcGVyZm9ybWFuY2UpXG5cdFx0ICogQHJldHVybiB7Q29udHJvbGxlcn0gUGFyZW50IG9iamVjdCBmb3IgY2hhaW5pbmcuXG5cdFx0ICovXG5cdFx0dGhpcy51cGRhdGUgPSBmdW5jdGlvbiAoaW1tZWRpYXRlbHkpIHtcblx0XHRcdG9uQ2hhbmdlKHtcblx0XHRcdFx0dHlwZTogXCJyZXNpemVcIlxuXHRcdFx0fSk7IC8vIHdpbGwgdXBkYXRlIHNpemUgYW5kIHNldCBfdXBkYXRlU2NlbmVzT25OZXh0Q3ljbGUgdG8gdHJ1ZVxuXHRcdFx0aWYgKGltbWVkaWF0ZWx5KSB7XG5cdFx0XHRcdHVwZGF0ZVNjZW5lcygpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIENvbnRyb2xsZXI7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFNjcm9sbCB0byBhIG51bWVyaWMgc2Nyb2xsIG9mZnNldCwgYSBET00gZWxlbWVudCwgdGhlIHN0YXJ0IG9mIGEgc2NlbmUgb3IgcHJvdmlkZSBhbiBhbHRlcm5hdGUgbWV0aG9kIGZvciBzY3JvbGxpbmcuICBcblx0XHQgKiBGb3IgdmVydGljYWwgY29udHJvbGxlcnMgaXQgd2lsbCBjaGFuZ2UgdGhlIHRvcCBzY3JvbGwgb2Zmc2V0IGFuZCBmb3IgaG9yaXpvbnRhbCBhcHBsaWNhdGlvbnMgaXQgd2lsbCBjaGFuZ2UgdGhlIGxlZnQgb2Zmc2V0LlxuXHRcdCAqIEBwdWJsaWNcblx0XHQgKlxuXHRcdCAqIEBzaW5jZSAxLjEuMFxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogLy8gc2Nyb2xsIHRvIGFuIG9mZnNldCBvZiAxMDBcblx0XHQgKiBjb250cm9sbGVyLnNjcm9sbFRvKDEwMCk7XG5cdFx0ICpcblx0XHQgKiAvLyBzY3JvbGwgdG8gYSBET00gZWxlbWVudFxuXHRcdCAqIGNvbnRyb2xsZXIuc2Nyb2xsVG8oXCIjYW5jaG9yXCIpO1xuXHRcdCAqXG5cdFx0ICogLy8gc2Nyb2xsIHRvIHRoZSBiZWdpbm5pbmcgb2YgYSBzY2VuZVxuXHRcdCAqIHZhciBzY2VuZSA9IG5ldyBTY3JvbGxNYWdpYy5TY2VuZSh7b2Zmc2V0OiAyMDB9KTtcblx0XHQgKiBjb250cm9sbGVyLnNjcm9sbFRvKHNjZW5lKTtcblx0XHQgKlxuXHRcdCAqIC8vIGRlZmluZSBhIG5ldyBzY3JvbGwgcG9zaXRpb24gbW9kaWZpY2F0aW9uIGZ1bmN0aW9uIChqUXVlcnkgYW5pbWF0ZSBpbnN0ZWFkIG9mIGp1bXApXG5cdFx0ICogY29udHJvbGxlci5zY3JvbGxUbyhmdW5jdGlvbiAobmV3U2Nyb2xsUG9zKSB7XG5cdFx0ICpcdCQoXCJodG1sLCBib2R5XCIpLmFuaW1hdGUoe3Njcm9sbFRvcDogbmV3U2Nyb2xsUG9zfSk7XG5cdFx0ICogfSk7XG5cdFx0ICogY29udHJvbGxlci5zY3JvbGxUbygxMDApOyAvLyBjYWxsIGFzIHVzdWFsLCBidXQgdGhlIG5ldyBmdW5jdGlvbiB3aWxsIGJlIHVzZWQgaW5zdGVhZFxuXHRcdCAqXG5cdFx0ICogLy8gZGVmaW5lIGEgbmV3IHNjcm9sbCBmdW5jdGlvbiB3aXRoIGFuIGFkZGl0aW9uYWwgcGFyYW1ldGVyXG5cdFx0ICogY29udHJvbGxlci5zY3JvbGxUbyhmdW5jdGlvbiAobmV3U2Nyb2xsUG9zLCBtZXNzYWdlKSB7XG5cdFx0ICogIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xuXHRcdCAqXHQkKHRoaXMpLmFuaW1hdGUoe3Njcm9sbFRvcDogbmV3U2Nyb2xsUG9zfSk7XG5cdFx0ICogfSk7XG5cdFx0ICogLy8gY2FsbCBhcyB1c3VhbCwgYnV0IHN1cHBseSBhbiBleHRyYSBwYXJhbWV0ZXIgdG8gdGhlIGRlZmluZWQgY3VzdG9tIGZ1bmN0aW9uXG5cdFx0ICogY29udHJvbGxlci5zY3JvbGxUbygxMDAsIFwibXkgbWVzc2FnZVwiKTtcblx0XHQgKlxuXHRcdCAqIC8vIGRlZmluZSBhIG5ldyBzY3JvbGwgZnVuY3Rpb24gd2l0aCBhbiBhZGRpdGlvbmFsIHBhcmFtZXRlciBjb250YWluaW5nIG11bHRpcGxlIHZhcmlhYmxlc1xuXHRcdCAqIGNvbnRyb2xsZXIuc2Nyb2xsVG8oZnVuY3Rpb24gKG5ld1Njcm9sbFBvcywgb3B0aW9ucykge1xuXHRcdCAqICBzb21lR2xvYmFsVmFyID0gb3B0aW9ucy5hICsgb3B0aW9ucy5iO1xuXHRcdCAqXHQkKHRoaXMpLmFuaW1hdGUoe3Njcm9sbFRvcDogbmV3U2Nyb2xsUG9zfSk7XG5cdFx0ICogfSk7XG5cdFx0ICogLy8gY2FsbCBhcyB1c3VhbCwgYnV0IHN1cHBseSBhbiBleHRyYSBwYXJhbWV0ZXIgY29udGFpbmluZyBtdWx0aXBsZSBvcHRpb25zXG5cdFx0ICogY29udHJvbGxlci5zY3JvbGxUbygxMDAsIHthOiAxLCBiOiAyfSk7XG5cdFx0ICpcblx0XHQgKiAvLyBkZWZpbmUgYSBuZXcgc2Nyb2xsIGZ1bmN0aW9uIHdpdGggYSBjYWxsYmFjayBzdXBwbGllZCBhcyBhbiBhZGRpdGlvbmFsIHBhcmFtZXRlclxuXHRcdCAqIGNvbnRyb2xsZXIuc2Nyb2xsVG8oZnVuY3Rpb24gKG5ld1Njcm9sbFBvcywgY2FsbGJhY2spIHtcblx0XHQgKlx0JCh0aGlzKS5hbmltYXRlKHtzY3JvbGxUb3A6IG5ld1Njcm9sbFBvc30sIDQwMCwgXCJzd2luZ1wiLCBjYWxsYmFjayk7XG5cdFx0ICogfSk7XG5cdFx0ICogLy8gY2FsbCBhcyB1c3VhbCwgYnV0IHN1cHBseSBhbiBleHRyYSBwYXJhbWV0ZXIsIHdoaWNoIGlzIHVzZWQgYXMgYSBjYWxsYmFjayBpbiB0aGUgcHJldmlvdXNseSBkZWZpbmVkIGN1c3RvbSBzY3JvbGwgZnVuY3Rpb25cblx0XHQgKiBjb250cm9sbGVyLnNjcm9sbFRvKDEwMCwgZnVuY3Rpb24oKSB7XG5cdFx0ICpcdGNvbnNvbGUubG9nKFwic2Nyb2xsIGhhcyBmaW5pc2hlZC5cIik7XG5cdFx0ICogfSk7XG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge21peGVkfSBzY3JvbGxUYXJnZXQgLSBUaGUgc3VwcGxpZWQgYXJndW1lbnQgY2FuIGJlIG9uZSBvZiB0aGVzZSB0eXBlczpcblx0XHQgKiAxLiBgbnVtYmVyYCAtPiBUaGUgY29udGFpbmVyIHdpbGwgc2Nyb2xsIHRvIHRoaXMgbmV3IHNjcm9sbCBvZmZzZXQuXG5cdFx0ICogMi4gYHN0cmluZ2Agb3IgYG9iamVjdGAgLT4gQ2FuIGJlIGEgc2VsZWN0b3Igb3IgYSBET00gb2JqZWN0LiAgXG5cdFx0ICogIFRoZSBjb250YWluZXIgd2lsbCBzY3JvbGwgdG8gdGhlIHBvc2l0aW9uIG9mIHRoaXMgZWxlbWVudC5cblx0XHQgKiAzLiBgU2Nyb2xsTWFnaWMgU2NlbmVgIC0+IFRoZSBjb250YWluZXIgd2lsbCBzY3JvbGwgdG8gdGhlIHN0YXJ0IG9mIHRoaXMgc2NlbmUuXG5cdFx0ICogNC4gYGZ1bmN0aW9uYCAtPiBUaGlzIGZ1bmN0aW9uIHdpbGwgYmUgdXNlZCBmb3IgZnV0dXJlIHNjcm9sbCBwb3NpdGlvbiBtb2RpZmljYXRpb25zLiAgXG5cdFx0ICogIFRoaXMgcHJvdmlkZXMgYSB3YXkgZm9yIHlvdSB0byBjaGFuZ2UgdGhlIGJlaGF2aW91ciBvZiBzY3JvbGxpbmcgYW5kIGFkZGluZyBuZXcgYmVoYXZpb3VyIGxpa2UgYW5pbWF0aW9uLiBUaGUgZnVuY3Rpb24gcmVjZWl2ZXMgdGhlIG5ldyBzY3JvbGwgcG9zaXRpb24gYXMgYSBwYXJhbWV0ZXIgYW5kIGEgcmVmZXJlbmNlIHRvIHRoZSBjb250YWluZXIgZWxlbWVudCB1c2luZyBgdGhpc2AuICBcblx0XHQgKiAgSXQgbWF5IGFsc28gb3B0aW9uYWxseSByZWNlaXZlIGFuIG9wdGlvbmFsIGFkZGl0aW9uYWwgcGFyYW1ldGVyIChzZWUgYmVsb3cpICBcblx0XHQgKiAgXyoqTk9URToqKiAgXG5cdFx0ICogIEFsbCBvdGhlciBvcHRpb25zIHdpbGwgc3RpbGwgd29yayBhcyBleHBlY3RlZCwgdXNpbmcgdGhlIG5ldyBmdW5jdGlvbiB0byBzY3JvbGwuX1xuXHRcdCAqIEBwYXJhbSB7bWl4ZWR9IFthZGRpdGlvbmFsUGFyYW1ldGVyXSAtIElmIGEgY3VzdG9tIHNjcm9sbCBmdW5jdGlvbiB3YXMgZGVmaW5lZCAoc2VlIGFib3ZlIDQuKSwgeW91IG1heSB3YW50IHRvIHN1cHBseSBhZGRpdGlvbmFsIHBhcmFtZXRlcnMgdG8gaXQsIHdoZW4gY2FsbGluZyBpdC4gWW91IGNhbiBkbyB0aGlzIHVzaW5nIHRoaXMgcGFyYW1ldGVyIOKAkyBzZWUgZXhhbXBsZXMgZm9yIGRldGFpbHMuIFBsZWFzZSBub3RlLCB0aGF0IHRoaXMgcGFyYW1ldGVyIHdpbGwgaGF2ZSBubyBlZmZlY3QsIGlmIHlvdSB1c2UgdGhlIGRlZmF1bHQgc2Nyb2xsaW5nIGZ1bmN0aW9uLlxuXHRcdCAqIEByZXR1cm5zIHtDb250cm9sbGVyfSBQYXJlbnQgb2JqZWN0IGZvciBjaGFpbmluZy5cblx0XHQgKi9cblx0XHR0aGlzLnNjcm9sbFRvID0gZnVuY3Rpb24gKHNjcm9sbFRhcmdldCwgYWRkaXRpb25hbFBhcmFtZXRlcikge1xuXHRcdFx0aWYgKF91dGlsLnR5cGUuTnVtYmVyKHNjcm9sbFRhcmdldCkpIHsgLy8gZXhjZWN1dGVcblx0XHRcdFx0c2V0U2Nyb2xsUG9zLmNhbGwoX29wdGlvbnMuY29udGFpbmVyLCBzY3JvbGxUYXJnZXQsIGFkZGl0aW9uYWxQYXJhbWV0ZXIpO1xuXHRcdFx0fSBlbHNlIGlmIChzY3JvbGxUYXJnZXQgaW5zdGFuY2VvZiBTY3JvbGxNYWdpYy5TY2VuZSkgeyAvLyBzY3JvbGwgdG8gc2NlbmVcblx0XHRcdFx0aWYgKHNjcm9sbFRhcmdldC5jb250cm9sbGVyKCkgPT09IENvbnRyb2xsZXIpIHsgLy8gY2hlY2sgaWYgdGhlIGNvbnRyb2xsZXIgaXMgYXNzb2NpYXRlZCB3aXRoIHRoaXMgc2NlbmVcblx0XHRcdFx0XHRDb250cm9sbGVyLnNjcm9sbFRvKHNjcm9sbFRhcmdldC5zY3JvbGxPZmZzZXQoKSwgYWRkaXRpb25hbFBhcmFtZXRlcik7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0bG9nKDIsIFwic2Nyb2xsVG8oKTogVGhlIHN1cHBsaWVkIHNjZW5lIGRvZXMgbm90IGJlbG9uZyB0byB0aGlzIGNvbnRyb2xsZXIuIFNjcm9sbCBjYW5jZWxsZWQuXCIsIHNjcm9sbFRhcmdldCk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAoX3V0aWwudHlwZS5GdW5jdGlvbihzY3JvbGxUYXJnZXQpKSB7IC8vIGFzc2lnbiBuZXcgc2Nyb2xsIGZ1bmN0aW9uXG5cdFx0XHRcdHNldFNjcm9sbFBvcyA9IHNjcm9sbFRhcmdldDtcblx0XHRcdH0gZWxzZSB7IC8vIHNjcm9sbCB0byBlbGVtZW50XG5cdFx0XHRcdHZhciBlbGVtID0gX3V0aWwuZ2V0LmVsZW1lbnRzKHNjcm9sbFRhcmdldClbMF07XG5cdFx0XHRcdGlmIChlbGVtKSB7XG5cdFx0XHRcdFx0Ly8gaWYgcGFyZW50IGlzIHBpbiBzcGFjZXIsIHVzZSBzcGFjZXIgcG9zaXRpb24gaW5zdGVhZCBzbyBjb3JyZWN0IHN0YXJ0IHBvc2l0aW9uIGlzIHJldHVybmVkIGZvciBwaW5uZWQgZWxlbWVudHMuXG5cdFx0XHRcdFx0d2hpbGUgKGVsZW0ucGFyZW50Tm9kZS5oYXNBdHRyaWJ1dGUoUElOX1NQQUNFUl9BVFRSSUJVVEUpKSB7XG5cdFx0XHRcdFx0XHRlbGVtID0gZWxlbS5wYXJlbnROb2RlO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHZhclxuXHRcdFx0XHRcdHBhcmFtID0gX29wdGlvbnMudmVydGljYWwgPyBcInRvcFwiIDogXCJsZWZ0XCIsXG5cdFx0XHRcdFx0XHQvLyB3aGljaCBwYXJhbSBpcyBvZiBpbnRlcmVzdCA/XG5cdFx0XHRcdFx0XHRjb250YWluZXJPZmZzZXQgPSBfdXRpbC5nZXQub2Zmc2V0KF9vcHRpb25zLmNvbnRhaW5lciksXG5cdFx0XHRcdFx0XHQvLyBjb250YWluZXIgcG9zaXRpb24gaXMgbmVlZGVkIGJlY2F1c2UgZWxlbWVudCBvZmZzZXQgaXMgcmV0dXJuZWQgaW4gcmVsYXRpb24gdG8gZG9jdW1lbnQsIG5vdCBpbiByZWxhdGlvbiB0byBjb250YWluZXIuXG5cdFx0XHRcdFx0XHRlbGVtZW50T2Zmc2V0ID0gX3V0aWwuZ2V0Lm9mZnNldChlbGVtKTtcblxuXHRcdFx0XHRcdGlmICghX2lzRG9jdW1lbnQpIHsgLy8gY29udGFpbmVyIGlzIG5vdCB0aGUgZG9jdW1lbnQgcm9vdCwgc28gc3Vic3RyYWN0IHNjcm9sbCBQb3NpdGlvbiB0byBnZXQgY29ycmVjdCB0cmlnZ2VyIGVsZW1lbnQgcG9zaXRpb24gcmVsYXRpdmUgdG8gc2Nyb2xsY29udGVudFxuXHRcdFx0XHRcdFx0Y29udGFpbmVyT2Zmc2V0W3BhcmFtXSAtPSBDb250cm9sbGVyLnNjcm9sbFBvcygpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdENvbnRyb2xsZXIuc2Nyb2xsVG8oZWxlbWVudE9mZnNldFtwYXJhbV0gLSBjb250YWluZXJPZmZzZXRbcGFyYW1dLCBhZGRpdGlvbmFsUGFyYW1ldGVyKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRsb2coMiwgXCJzY3JvbGxUbygpOiBUaGUgc3VwcGxpZWQgYXJndW1lbnQgaXMgaW52YWxpZC4gU2Nyb2xsIGNhbmNlbGxlZC5cIiwgc2Nyb2xsVGFyZ2V0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIENvbnRyb2xsZXI7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqICoqR2V0KiogdGhlIGN1cnJlbnQgc2Nyb2xsUG9zaXRpb24gb3IgKipTZXQqKiBhIG5ldyBtZXRob2QgdG8gY2FsY3VsYXRlIGl0LiAgXG5cdFx0ICogLT4gKipHRVQqKjpcblx0XHQgKiBXaGVuIHVzZWQgYXMgYSBnZXR0ZXIgdGhpcyBmdW5jdGlvbiB3aWxsIHJldHVybiB0aGUgY3VycmVudCBzY3JvbGwgcG9zaXRpb24uICBcblx0XHQgKiBUbyBnZXQgYSBjYWNoZWQgdmFsdWUgdXNlIENvbnRyb2xsZXIuaW5mbyhcInNjcm9sbFBvc1wiKSwgd2hpY2ggd2lsbCBiZSB1cGRhdGVkIGluIHRoZSB1cGRhdGUgY3ljbGUuICBcblx0XHQgKiBGb3IgdmVydGljYWwgY29udHJvbGxlcnMgaXQgd2lsbCByZXR1cm4gdGhlIHRvcCBzY3JvbGwgb2Zmc2V0IGFuZCBmb3IgaG9yaXpvbnRhbCBhcHBsaWNhdGlvbnMgaXQgd2lsbCByZXR1cm4gdGhlIGxlZnQgb2Zmc2V0LlxuXHRcdCAqXG5cdFx0ICogLT4gKipTRVQqKjpcblx0XHQgKiBXaGVuIHVzZWQgYXMgYSBzZXR0ZXIgdGhpcyBtZXRob2QgcHJvZGVzIGEgd2F5IHRvIHBlcm1hbmVudGx5IG92ZXJ3cml0ZSB0aGUgY29udHJvbGxlcidzIHNjcm9sbCBwb3NpdGlvbiBjYWxjdWxhdGlvbi4gIFxuXHRcdCAqIEEgdHlwaWNhbCB1c2VjYXNlIGlzIHdoZW4gdGhlIHNjcm9sbCBwb3NpdGlvbiBpcyBub3QgcmVmbGVjdGVkIGJ5IHRoZSBjb250YWluZXJzIHNjcm9sbFRvcCBvciBzY3JvbGxMZWZ0IHZhbHVlcywgYnV0IGZvciBleGFtcGxlIGJ5IHRoZSBpbm5lciBvZmZzZXQgb2YgYSBjaGlsZCBjb250YWluZXIuICBcblx0XHQgKiBNb3ZpbmcgYSBjaGlsZCBjb250YWluZXIgaW5zaWRlIGEgcGFyZW50IGlzIGEgY29tbW9ubHkgdXNlZCBtZXRob2QgZm9yIHNldmVyYWwgc2Nyb2xsaW5nIGZyYW1ld29ya3MsIGluY2x1ZGluZyBpU2Nyb2xsLiAgXG5cdFx0ICogQnkgcHJvdmlkaW5nIGFuIGFsdGVybmF0ZSBjYWxjdWxhdGlvbiBmdW5jdGlvbiB5b3UgY2FuIG1ha2Ugc3VyZSBTY3JvbGxNYWdpYyByZWNlaXZlcyB0aGUgY29ycmVjdCBzY3JvbGwgcG9zaXRpb24uICBcblx0XHQgKiBQbGVhc2UgYWxzbyBiZWFyIGluIG1pbmQgdGhhdCB5b3VyIGZ1bmN0aW9uIHNob3VsZCByZXR1cm4geSB2YWx1ZXMgZm9yIHZlcnRpY2FsIHNjcm9sbHMgYW4geCBmb3IgaG9yaXpvbnRhbHMuXG5cdFx0ICpcblx0XHQgKiBUbyBjaGFuZ2UgdGhlIGN1cnJlbnQgc2Nyb2xsIHBvc2l0aW9uIHBsZWFzZSB1c2UgYENvbnRyb2xsZXIuc2Nyb2xsVG8oKWAuXG5cdFx0ICogQHB1YmxpY1xuXHRcdCAqXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiAvLyBnZXQgdGhlIGN1cnJlbnQgc2Nyb2xsIFBvc2l0aW9uXG5cdFx0ICogdmFyIHNjcm9sbFBvcyA9IGNvbnRyb2xsZXIuc2Nyb2xsUG9zKCk7XG5cdFx0ICpcblx0XHQgKiAvLyBzZXQgYSBuZXcgc2Nyb2xsIHBvc2l0aW9uIGNhbGN1bGF0aW9uIG1ldGhvZFxuXHRcdCAqIGNvbnRyb2xsZXIuc2Nyb2xsUG9zKGZ1bmN0aW9uICgpIHtcblx0XHQgKlx0cmV0dXJuIHRoaXMuaW5mbyhcInZlcnRpY2FsXCIpID8gLW15Y2hpbGRjb250YWluZXIueSA6IC1teWNoaWxkY29udGFpbmVyLnhcblx0XHQgKiB9KTtcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7ZnVuY3Rpb259IFtzY3JvbGxQb3NNZXRob2RdIC0gVGhlIGZ1bmN0aW9uIHRvIGJlIHVzZWQgZm9yIHRoZSBzY3JvbGwgcG9zaXRpb24gY2FsY3VsYXRpb24gb2YgdGhlIGNvbnRhaW5lci5cblx0XHQgKiBAcmV0dXJucyB7KG51bWJlcnxDb250cm9sbGVyKX0gQ3VycmVudCBzY3JvbGwgcG9zaXRpb24gb3IgcGFyZW50IG9iamVjdCBmb3IgY2hhaW5pbmcuXG5cdFx0ICovXG5cdFx0dGhpcy5zY3JvbGxQb3MgPSBmdW5jdGlvbiAoc2Nyb2xsUG9zTWV0aG9kKSB7XG5cdFx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHsgLy8gZ2V0XG5cdFx0XHRcdHJldHVybiBnZXRTY3JvbGxQb3MuY2FsbChDb250cm9sbGVyKTtcblx0XHRcdH0gZWxzZSB7IC8vIHNldFxuXHRcdFx0XHRpZiAoX3V0aWwudHlwZS5GdW5jdGlvbihzY3JvbGxQb3NNZXRob2QpKSB7XG5cdFx0XHRcdFx0Z2V0U2Nyb2xsUG9zID0gc2Nyb2xsUG9zTWV0aG9kO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGxvZygyLCBcIlByb3ZpZGVkIHZhbHVlIGZvciBtZXRob2QgJ3Njcm9sbFBvcycgaXMgbm90IGEgZnVuY3Rpb24uIFRvIGNoYW5nZSB0aGUgY3VycmVudCBzY3JvbGwgcG9zaXRpb24gdXNlICdzY3JvbGxUbygpJy5cIik7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiBDb250cm9sbGVyO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiAqKkdldCoqIGFsbCBpbmZvcyBvciBvbmUgaW4gcGFydGljdWxhciBhYm91dCB0aGUgY29udHJvbGxlci5cblx0XHQgKiBAcHVibGljXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiAvLyByZXR1cm5zIHRoZSBjdXJyZW50IHNjcm9sbCBwb3NpdGlvbiAobnVtYmVyKVxuXHRcdCAqIHZhciBzY3JvbGxQb3MgPSBjb250cm9sbGVyLmluZm8oXCJzY3JvbGxQb3NcIik7XG5cdFx0ICpcblx0XHQgKiAvLyByZXR1cm5zIGFsbCBpbmZvcyBhcyBhbiBvYmplY3Rcblx0XHQgKiB2YXIgaW5mb3MgPSBjb250cm9sbGVyLmluZm8oKTtcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nfSBbYWJvdXRdIC0gSWYgcGFzc2VkIG9ubHkgdGhpcyBpbmZvIHdpbGwgYmUgcmV0dXJuZWQgaW5zdGVhZCBvZiBhbiBvYmplY3QgY29udGFpbmluZyBhbGwuICBcblx0XHQgVmFsaWQgb3B0aW9ucyBhcmU6XG5cdFx0ICoqIGBcInNpemVcImAgPT4gdGhlIGN1cnJlbnQgdmlld3BvcnQgc2l6ZSBvZiB0aGUgY29udGFpbmVyXG5cdFx0ICoqIGBcInZlcnRpY2FsXCJgID0+IHRydWUgaWYgdmVydGljYWwgc2Nyb2xsaW5nLCBvdGhlcndpc2UgZmFsc2Vcblx0XHQgKiogYFwic2Nyb2xsUG9zXCJgID0+IHRoZSBjdXJyZW50IHNjcm9sbCBwb3NpdGlvblxuXHRcdCAqKiBgXCJzY3JvbGxEaXJlY3Rpb25cImAgPT4gdGhlIGxhc3Qga25vd24gZGlyZWN0aW9uIG9mIHRoZSBzY3JvbGxcblx0XHQgKiogYFwiY29udGFpbmVyXCJgID0+IHRoZSBjb250YWluZXIgZWxlbWVudFxuXHRcdCAqKiBgXCJpc0RvY3VtZW50XCJgID0+IHRydWUgaWYgY29udGFpbmVyIGVsZW1lbnQgaXMgdGhlIGRvY3VtZW50LlxuXHRcdCAqIEByZXR1cm5zIHsobWl4ZWR8b2JqZWN0KX0gVGhlIHJlcXVlc3RlZCBpbmZvKHMpLlxuXHRcdCAqL1xuXHRcdHRoaXMuaW5mbyA9IGZ1bmN0aW9uIChhYm91dCkge1xuXHRcdFx0dmFyIHZhbHVlcyA9IHtcblx0XHRcdFx0c2l6ZTogX3ZpZXdQb3J0U2l6ZSxcblx0XHRcdFx0Ly8gY29udGFpbnMgaGVpZ2h0IG9yIHdpZHRoIChpbiByZWdhcmQgdG8gb3JpZW50YXRpb24pO1xuXHRcdFx0XHR2ZXJ0aWNhbDogX29wdGlvbnMudmVydGljYWwsXG5cdFx0XHRcdHNjcm9sbFBvczogX3Njcm9sbFBvcyxcblx0XHRcdFx0c2Nyb2xsRGlyZWN0aW9uOiBfc2Nyb2xsRGlyZWN0aW9uLFxuXHRcdFx0XHRjb250YWluZXI6IF9vcHRpb25zLmNvbnRhaW5lcixcblx0XHRcdFx0aXNEb2N1bWVudDogX2lzRG9jdW1lbnRcblx0XHRcdH07XG5cdFx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHsgLy8gZ2V0IGFsbCBhcyBhbiBvYmplY3Rcblx0XHRcdFx0cmV0dXJuIHZhbHVlcztcblx0XHRcdH0gZWxzZSBpZiAodmFsdWVzW2Fib3V0XSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHJldHVybiB2YWx1ZXNbYWJvdXRdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bG9nKDEsIFwiRVJST1I6IG9wdGlvbiBcXFwiXCIgKyBhYm91dCArIFwiXFxcIiBpcyBub3QgYXZhaWxhYmxlXCIpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqICoqR2V0Kiogb3IgKipTZXQqKiB0aGUgY3VycmVudCBsb2dsZXZlbCBvcHRpb24gdmFsdWUuXG5cdFx0ICogQHB1YmxpY1xuXHRcdCAqXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiAvLyBnZXQgdGhlIGN1cnJlbnQgdmFsdWVcblx0XHQgKiB2YXIgbG9nbGV2ZWwgPSBjb250cm9sbGVyLmxvZ2xldmVsKCk7XG5cdFx0ICpcblx0XHQgKiAvLyBzZXQgYSBuZXcgdmFsdWVcblx0XHQgKiBjb250cm9sbGVyLmxvZ2xldmVsKDMpO1xuXHRcdCAqXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IFtuZXdMb2dsZXZlbF0gLSBUaGUgbmV3IGxvZ2xldmVsIHNldHRpbmcgb2YgdGhlIENvbnRyb2xsZXIuIGBbMC0zXWBcblx0XHQgKiBAcmV0dXJucyB7KG51bWJlcnxDb250cm9sbGVyKX0gQ3VycmVudCBsb2dsZXZlbCBvciBwYXJlbnQgb2JqZWN0IGZvciBjaGFpbmluZy5cblx0XHQgKi9cblx0XHR0aGlzLmxvZ2xldmVsID0gZnVuY3Rpb24gKG5ld0xvZ2xldmVsKSB7XG5cdFx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHsgLy8gZ2V0XG5cdFx0XHRcdHJldHVybiBfb3B0aW9ucy5sb2dsZXZlbDtcblx0XHRcdH0gZWxzZSBpZiAoX29wdGlvbnMubG9nbGV2ZWwgIT0gbmV3TG9nbGV2ZWwpIHsgLy8gc2V0XG5cdFx0XHRcdF9vcHRpb25zLmxvZ2xldmVsID0gbmV3TG9nbGV2ZWw7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gQ29udHJvbGxlcjtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogKipHZXQqKiBvciAqKlNldCoqIHRoZSBjdXJyZW50IGVuYWJsZWQgc3RhdGUgb2YgdGhlIGNvbnRyb2xsZXIuICBcblx0XHQgKiBUaGlzIGNhbiBiZSB1c2VkIHRvIGRpc2FibGUgYWxsIFNjZW5lcyBjb25uZWN0ZWQgdG8gdGhlIGNvbnRyb2xsZXIgd2l0aG91dCBkZXN0cm95aW5nIG9yIHJlbW92aW5nIHRoZW0uXG5cdFx0ICogQHB1YmxpY1xuXHRcdCAqXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiAvLyBnZXQgdGhlIGN1cnJlbnQgdmFsdWVcblx0XHQgKiB2YXIgZW5hYmxlZCA9IGNvbnRyb2xsZXIuZW5hYmxlZCgpO1xuXHRcdCAqXG5cdFx0ICogLy8gZGlzYWJsZSB0aGUgY29udHJvbGxlclxuXHRcdCAqIGNvbnRyb2xsZXIuZW5hYmxlZChmYWxzZSk7XG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IFtuZXdTdGF0ZV0gLSBUaGUgbmV3IGVuYWJsZWQgc3RhdGUgb2YgdGhlIGNvbnRyb2xsZXIgYHRydWVgIG9yIGBmYWxzZWAuXG5cdFx0ICogQHJldHVybnMgeyhib29sZWFufENvbnRyb2xsZXIpfSBDdXJyZW50IGVuYWJsZWQgc3RhdGUgb3IgcGFyZW50IG9iamVjdCBmb3IgY2hhaW5pbmcuXG5cdFx0ICovXG5cdFx0dGhpcy5lbmFibGVkID0gZnVuY3Rpb24gKG5ld1N0YXRlKSB7XG5cdFx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHsgLy8gZ2V0XG5cdFx0XHRcdHJldHVybiBfZW5hYmxlZDtcblx0XHRcdH0gZWxzZSBpZiAoX2VuYWJsZWQgIT0gbmV3U3RhdGUpIHsgLy8gc2V0XG5cdFx0XHRcdF9lbmFibGVkID0gISEgbmV3U3RhdGU7XG5cdFx0XHRcdENvbnRyb2xsZXIudXBkYXRlU2NlbmUoX3NjZW5lT2JqZWN0cywgdHJ1ZSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gQ29udHJvbGxlcjtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogRGVzdHJveSB0aGUgQ29udHJvbGxlciwgYWxsIFNjZW5lcyBhbmQgZXZlcnl0aGluZy5cblx0XHQgKiBAcHVibGljXG5cdFx0ICpcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIHdpdGhvdXQgcmVzZXR0aW5nIHRoZSBzY2VuZXNcblx0XHQgKiBjb250cm9sbGVyID0gY29udHJvbGxlci5kZXN0cm95KCk7XG5cdFx0ICpcblx0XHQgKiAvLyB3aXRoIHNjZW5lIHJlc2V0XG5cdFx0ICogY29udHJvbGxlciA9IGNvbnRyb2xsZXIuZGVzdHJveSh0cnVlKTtcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gW3Jlc2V0U2NlbmVzPWZhbHNlXSAtIElmIGB0cnVlYCB0aGUgcGlucyBhbmQgdHdlZW5zIChpZiBleGlzdGVudCkgb2YgYWxsIHNjZW5lcyB3aWxsIGJlIHJlc2V0LlxuXHRcdCAqIEByZXR1cm5zIHtudWxsfSBOdWxsIHRvIHVuc2V0IGhhbmRsZXIgdmFyaWFibGVzLlxuXHRcdCAqL1xuXHRcdHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uIChyZXNldFNjZW5lcykge1xuXHRcdFx0d2luZG93LmNsZWFyVGltZW91dChfcmVmcmVzaFRpbWVvdXQpO1xuXHRcdFx0dmFyIGkgPSBfc2NlbmVPYmplY3RzLmxlbmd0aDtcblx0XHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdFx0X3NjZW5lT2JqZWN0c1tpXS5kZXN0cm95KHJlc2V0U2NlbmVzKTtcblx0XHRcdH1cblx0XHRcdF9vcHRpb25zLmNvbnRhaW5lci5yZW1vdmVFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIG9uQ2hhbmdlKTtcblx0XHRcdF9vcHRpb25zLmNvbnRhaW5lci5yZW1vdmVFdmVudExpc3RlbmVyKFwic2Nyb2xsXCIsIG9uQ2hhbmdlKTtcblx0XHRcdF91dGlsLmNBRihfdXBkYXRlVGltZW91dCk7XG5cdFx0XHRsb2coMywgXCJkZXN0cm95ZWQgXCIgKyBOQU1FU1BBQ0UgKyBcIiAocmVzZXQ6IFwiICsgKHJlc2V0U2NlbmVzID8gXCJ0cnVlXCIgOiBcImZhbHNlXCIpICsgXCIpXCIpO1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fTtcblxuXHRcdC8vIElOSVRcblx0XHRjb25zdHJ1Y3QoKTtcblx0XHRyZXR1cm4gQ29udHJvbGxlcjtcblx0fTtcblxuXHQvLyBzdG9yZSBwYWdld2lkZSBjb250cm9sbGVyIG9wdGlvbnNcblx0dmFyIENPTlRST0xMRVJfT1BUSU9OUyA9IHtcblx0XHRkZWZhdWx0czoge1xuXHRcdFx0Y29udGFpbmVyOiB3aW5kb3csXG5cdFx0XHR2ZXJ0aWNhbDogdHJ1ZSxcblx0XHRcdGdsb2JhbFNjZW5lT3B0aW9uczoge30sXG5cdFx0XHRsb2dsZXZlbDogMixcblx0XHRcdHJlZnJlc2hJbnRlcnZhbDogMTAwXG5cdFx0fVxuXHR9O1xuLypcbiAqIG1ldGhvZCB1c2VkIHRvIGFkZCBhbiBvcHRpb24gdG8gU2Nyb2xsTWFnaWMgU2NlbmVzLlxuICovXG5cdFNjcm9sbE1hZ2ljLkNvbnRyb2xsZXIuYWRkT3B0aW9uID0gZnVuY3Rpb24gKG5hbWUsIGRlZmF1bHRWYWx1ZSkge1xuXHRcdENPTlRST0xMRVJfT1BUSU9OUy5kZWZhdWx0c1tuYW1lXSA9IGRlZmF1bHRWYWx1ZTtcblx0fTtcblx0Ly8gaW5zdGFuY2UgZXh0ZW5zaW9uIGZ1bmN0aW9uIGZvciBwbHVnaW5zXG5cdFNjcm9sbE1hZ2ljLkNvbnRyb2xsZXIuZXh0ZW5kID0gZnVuY3Rpb24gKGV4dGVuc2lvbikge1xuXHRcdHZhciBvbGRDbGFzcyA9IHRoaXM7XG5cdFx0U2Nyb2xsTWFnaWMuQ29udHJvbGxlciA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdG9sZENsYXNzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0XHR0aGlzLiRzdXBlciA9IF91dGlsLmV4dGVuZCh7fSwgdGhpcyk7IC8vIGNvcHkgcGFyZW50IHN0YXRlXG5cdFx0XHRyZXR1cm4gZXh0ZW5zaW9uLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgfHwgdGhpcztcblx0XHR9O1xuXHRcdF91dGlsLmV4dGVuZChTY3JvbGxNYWdpYy5Db250cm9sbGVyLCBvbGRDbGFzcyk7IC8vIGNvcHkgcHJvcGVydGllc1xuXHRcdFNjcm9sbE1hZ2ljLkNvbnRyb2xsZXIucHJvdG90eXBlID0gb2xkQ2xhc3MucHJvdG90eXBlOyAvLyBjb3B5IHByb3RvdHlwZVxuXHRcdFNjcm9sbE1hZ2ljLkNvbnRyb2xsZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gU2Nyb2xsTWFnaWMuQ29udHJvbGxlcjsgLy8gcmVzdG9yZSBjb25zdHJ1Y3RvclxuXHR9O1xuXG5cblx0LyoqXG5cdCAqIEEgU2NlbmUgZGVmaW5lcyB3aGVyZSB0aGUgY29udHJvbGxlciBzaG91bGQgcmVhY3QgYW5kIGhvdy5cblx0ICpcblx0ICogQGNsYXNzXG5cdCAqXG5cdCAqIEBleGFtcGxlXG5cdCAqIC8vIGNyZWF0ZSBhIHN0YW5kYXJkIHNjZW5lIGFuZCBhZGQgaXQgdG8gYSBjb250cm9sbGVyXG5cdCAqIG5ldyBTY3JvbGxNYWdpYy5TY2VuZSgpXG5cdCAqXHRcdC5hZGRUbyhjb250cm9sbGVyKTtcblx0ICpcblx0ICogLy8gY3JlYXRlIGEgc2NlbmUgd2l0aCBjdXN0b20gb3B0aW9ucyBhbmQgYXNzaWduIGEgaGFuZGxlciB0byBpdC5cblx0ICogdmFyIHNjZW5lID0gbmV3IFNjcm9sbE1hZ2ljLlNjZW5lKHtcblx0ICogXHRcdGR1cmF0aW9uOiAxMDAsXG5cdCAqXHRcdG9mZnNldDogMjAwLFxuXHQgKlx0XHR0cmlnZ2VySG9vazogXCJvbkVudGVyXCIsXG5cdCAqXHRcdHJldmVyc2U6IGZhbHNlXG5cdCAqIH0pO1xuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdIC0gT3B0aW9ucyBmb3IgdGhlIFNjZW5lLiBUaGUgb3B0aW9ucyBjYW4gYmUgdXBkYXRlZCBhdCBhbnkgdGltZS4gIFxuXHQgSW5zdGVhZCBvZiBzZXR0aW5nIHRoZSBvcHRpb25zIGZvciBlYWNoIHNjZW5lIGluZGl2aWR1YWxseSB5b3UgY2FuIGFsc28gc2V0IHRoZW0gZ2xvYmFsbHkgaW4gdGhlIGNvbnRyb2xsZXIgYXMgdGhlIGNvbnRyb2xsZXJzIGBnbG9iYWxTY2VuZU9wdGlvbnNgIG9wdGlvbi4gVGhlIG9iamVjdCBhY2NlcHRzIHRoZSBzYW1lIHByb3BlcnRpZXMgYXMgdGhlIG9uZXMgYmVsb3cuICBcblx0IFdoZW4gYSBzY2VuZSBpcyBhZGRlZCB0byB0aGUgY29udHJvbGxlciB0aGUgb3B0aW9ucyBkZWZpbmVkIHVzaW5nIHRoZSBTY2VuZSBjb25zdHJ1Y3RvciB3aWxsIGJlIG92ZXJ3cml0dGVuIGJ5IHRob3NlIHNldCBpbiBgZ2xvYmFsU2NlbmVPcHRpb25zYC5cblx0ICogQHBhcmFtIHsobnVtYmVyfGZ1bmN0aW9uKX0gW29wdGlvbnMuZHVyYXRpb249MF0gLSBUaGUgZHVyYXRpb24gb2YgdGhlIHNjZW5lLiBcblx0IElmIGAwYCB0d2VlbnMgd2lsbCBhdXRvLXBsYXkgd2hlbiByZWFjaGluZyB0aGUgc2NlbmUgc3RhcnQgcG9pbnQsIHBpbnMgd2lsbCBiZSBwaW5uZWQgaW5kZWZpbmV0bHkgc3RhcnRpbmcgYXQgdGhlIHN0YXJ0IHBvc2l0aW9uLiAgXG5cdCBBIGZ1bmN0aW9uIHJldHVuaW5nIHRoZSBkdXJhdGlvbiB2YWx1ZSBpcyBhbHNvIHN1cHBvcnRlZC4gUGxlYXNlIHNlZSBgU2NlbmUuZHVyYXRpb24oKWAgZm9yIGRldGFpbHMuXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5vZmZzZXQ9MF0gLSBPZmZzZXQgVmFsdWUgZm9yIHRoZSBUcmlnZ2VyIFBvc2l0aW9uLiBJZiBubyB0cmlnZ2VyRWxlbWVudCBpcyBkZWZpbmVkIHRoaXMgd2lsbCBiZSB0aGUgc2Nyb2xsIGRpc3RhbmNlIGZyb20gdGhlIHN0YXJ0IG9mIHRoZSBwYWdlLCBhZnRlciB3aGljaCB0aGUgc2NlbmUgd2lsbCBzdGFydC5cblx0ICogQHBhcmFtIHsoc3RyaW5nfG9iamVjdCl9IFtvcHRpb25zLnRyaWdnZXJFbGVtZW50PW51bGxdIC0gU2VsZWN0b3Igb3IgRE9NIG9iamVjdCB0aGF0IGRlZmluZXMgdGhlIHN0YXJ0IG9mIHRoZSBzY2VuZS4gSWYgdW5kZWZpbmVkIHRoZSBzY2VuZSB3aWxsIHN0YXJ0IHJpZ2h0IGF0IHRoZSBzdGFydCBvZiB0aGUgcGFnZSAodW5sZXNzIGFuIG9mZnNldCBpcyBzZXQpLlxuXHQgKiBAcGFyYW0geyhudW1iZXJ8c3RyaW5nKX0gW29wdGlvbnMudHJpZ2dlckhvb2s9XCJvbkNlbnRlclwiXSAtIENhbiBiZSBhIG51bWJlciBiZXR3ZWVuIDAgYW5kIDEgZGVmaW5pbmcgdGhlIHBvc2l0aW9uIG9mIHRoZSB0cmlnZ2VyIEhvb2sgaW4gcmVsYXRpb24gdG8gdGhlIHZpZXdwb3J0LiAgXG5cdCBDYW4gYWxzbyBiZSBkZWZpbmVkIHVzaW5nIGEgc3RyaW5nOlxuXHQgKiogYFwib25FbnRlclwiYCA9PiBgMWBcblx0ICoqIGBcIm9uQ2VudGVyXCJgID0+IGAwLjVgXG5cdCAqKiBgXCJvbkxlYXZlXCJgID0+IGAwYFxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnJldmVyc2U9dHJ1ZV0gLSBTaG91bGQgdGhlIHNjZW5lIHJldmVyc2UsIHdoZW4gc2Nyb2xsaW5nIHVwP1xuXHQgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMubG9nbGV2ZWw9Ml0gLSBMb2dsZXZlbCBmb3IgZGVidWdnaW5nLiBOb3RlIHRoYXQgbG9nZ2luZyBpcyBkaXNhYmxlZCBpbiB0aGUgbWluaWZpZWQgdmVyc2lvbiBvZiBTY3JvbGxNYWdpYy5cblx0ICoqIGAwYCA9PiBzaWxlbnRcblx0ICoqIGAxYCA9PiBlcnJvcnNcblx0ICoqIGAyYCA9PiBlcnJvcnMsIHdhcm5pbmdzXG5cdCAqKiBgM2AgPT4gZXJyb3JzLCB3YXJuaW5ncywgZGVidWdpbmZvXG5cdCAqIFxuXHQgKi9cblx0U2Nyb2xsTWFnaWMuU2NlbmUgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuXG4vKlxuXHQgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdCAqIHNldHRpbmdzXG5cdCAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0ICovXG5cblx0XHR2YXJcblx0XHROQU1FU1BBQ0UgPSAnU2Nyb2xsTWFnaWMuU2NlbmUnLFxuXHRcdFx0U0NFTkVfU1RBVEVfQkVGT1JFID0gJ0JFRk9SRScsXG5cdFx0XHRTQ0VORV9TVEFURV9EVVJJTkcgPSAnRFVSSU5HJyxcblx0XHRcdFNDRU5FX1NUQVRFX0FGVEVSID0gJ0FGVEVSJyxcblx0XHRcdERFRkFVTFRfT1BUSU9OUyA9IFNDRU5FX09QVElPTlMuZGVmYXVsdHM7XG5cbi8qXG5cdCAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0ICogcHJpdmF0ZSB2YXJzXG5cdCAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0ICovXG5cblx0XHR2YXJcblx0XHRTY2VuZSA9IHRoaXMsXG5cdFx0XHRfb3B0aW9ucyA9IF91dGlsLmV4dGVuZCh7fSwgREVGQVVMVF9PUFRJT05TLCBvcHRpb25zKSxcblx0XHRcdF9zdGF0ZSA9IFNDRU5FX1NUQVRFX0JFRk9SRSxcblx0XHRcdF9wcm9ncmVzcyA9IDAsXG5cdFx0XHRfc2Nyb2xsT2Zmc2V0ID0ge1xuXHRcdFx0XHRzdGFydDogMCxcblx0XHRcdFx0ZW5kOiAwXG5cdFx0XHR9LFxuXHRcdFx0Ly8gcmVmbGVjdHMgdGhlIGNvbnRyb2xsZXJzJ3Mgc2Nyb2xsIHBvc2l0aW9uIGZvciB0aGUgc3RhcnQgYW5kIGVuZCBvZiB0aGUgc2NlbmUgcmVzcGVjdGl2ZWx5XG5cdFx0XHRfdHJpZ2dlclBvcyA9IDAsXG5cdFx0XHRfZW5hYmxlZCA9IHRydWUsXG5cdFx0XHRfZHVyYXRpb25VcGRhdGVNZXRob2QsIF9jb250cm9sbGVyO1xuXG5cdFx0LyoqXG5cdFx0ICogSW50ZXJuYWwgY29uc3RydWN0b3IgZnVuY3Rpb24gb2YgdGhlIFNjcm9sbE1hZ2ljIFNjZW5lXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgY29uc3RydWN0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIF9vcHRpb25zKSB7IC8vIGNoZWNrIHN1cHBsaWVkIG9wdGlvbnNcblx0XHRcdFx0aWYgKCFERUZBVUxUX09QVElPTlMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHRcdFx0XHRcdGxvZygyLCBcIldBUk5JTkc6IFVua25vd24gb3B0aW9uIFxcXCJcIiArIGtleSArIFwiXFxcIlwiKTtcblx0XHRcdFx0XHRkZWxldGUgX29wdGlvbnNba2V5XTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0Ly8gYWRkIGdldHRlcnMvc2V0dGVycyBmb3IgYWxsIHBvc3NpYmxlIG9wdGlvbnNcblx0XHRcdGZvciAodmFyIG9wdGlvbk5hbWUgaW4gREVGQVVMVF9PUFRJT05TKSB7XG5cdFx0XHRcdGFkZFNjZW5lT3B0aW9uKG9wdGlvbk5hbWUpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gdmFsaWRhdGUgYWxsIG9wdGlvbnNcblx0XHRcdHZhbGlkYXRlT3B0aW9uKCk7XG5cdFx0fTtcblxuLypcbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqIEV2ZW50IE1hbmFnZW1lbnRcbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqL1xuXG5cdFx0dmFyIF9saXN0ZW5lcnMgPSB7fTtcblx0XHQvKipcblx0XHQgKiBTY2VuZSBzdGFydCBldmVudC4gIFxuXHRcdCAqIEZpcmVzIHdoZW5ldmVyIHRoZSBzY3JvbGwgcG9zaXRpb24gaXRzIHRoZSBzdGFydGluZyBwb2ludCBvZiB0aGUgc2NlbmUuICBcblx0XHQgKiBJdCB3aWxsIGFsc28gZmlyZSB3aGVuIHNjcm9sbGluZyBiYWNrIHVwIGdvaW5nIG92ZXIgdGhlIHN0YXJ0IHBvc2l0aW9uIG9mIHRoZSBzY2VuZS4gSWYgeW91IHdhbnQgc29tZXRoaW5nIHRvIGhhcHBlbiBvbmx5IHdoZW4gc2Nyb2xsaW5nIGRvd24vcmlnaHQsIHVzZSB0aGUgc2Nyb2xsRGlyZWN0aW9uIHBhcmFtZXRlciBwYXNzZWQgdG8gdGhlIGNhbGxiYWNrLlxuXHRcdCAqXG5cdFx0ICogRm9yIGRldGFpbHMgb24gdGhpcyBldmVudCBhbmQgdGhlIG9yZGVyIGluIHdoaWNoIGl0IGlzIGZpcmVkLCBwbGVhc2UgcmV2aWV3IHRoZSB7QGxpbmsgU2NlbmUucHJvZ3Jlc3N9IG1ldGhvZC5cblx0XHQgKlxuXHRcdCAqIEBldmVudCBTY3JvbGxNYWdpYy5TY2VuZSNzdGFydFxuXHRcdCAqXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiBzY2VuZS5vbihcInN0YXJ0XCIsIGZ1bmN0aW9uIChldmVudCkge1xuXHRcdCAqIFx0Y29uc29sZS5sb2coXCJIaXQgc3RhcnQgcG9pbnQgb2Ygc2NlbmUuXCIpO1xuXHRcdCAqIH0pO1xuXHRcdCAqXG5cdFx0ICogQHByb3BlcnR5IHtvYmplY3R9IGV2ZW50IC0gVGhlIGV2ZW50IE9iamVjdCBwYXNzZWQgdG8gZWFjaCBjYWxsYmFja1xuXHRcdCAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBldmVudC50eXBlIC0gVGhlIG5hbWUgb2YgdGhlIGV2ZW50XG5cdFx0ICogQHByb3BlcnR5IHtTY2VuZX0gZXZlbnQudGFyZ2V0IC0gVGhlIFNjZW5lIG9iamVjdCB0aGF0IHRyaWdnZXJlZCB0aGlzIGV2ZW50XG5cdFx0ICogQHByb3BlcnR5IHtudW1iZXJ9IGV2ZW50LnByb2dyZXNzIC0gUmVmbGVjdHMgdGhlIGN1cnJlbnQgcHJvZ3Jlc3Mgb2YgdGhlIHNjZW5lXG5cdFx0ICogQHByb3BlcnR5IHtzdHJpbmd9IGV2ZW50LnN0YXRlIC0gVGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIHNjZW5lIGBcIkJFRk9SRVwiYCBvciBgXCJEVVJJTkdcImBcblx0XHQgKiBAcHJvcGVydHkge3N0cmluZ30gZXZlbnQuc2Nyb2xsRGlyZWN0aW9uIC0gSW5kaWNhdGVzIHdoaWNoIHdheSB3ZSBhcmUgc2Nyb2xsaW5nIGBcIlBBVVNFRFwiYCwgYFwiRk9SV0FSRFwiYCBvciBgXCJSRVZFUlNFXCJgXG5cdFx0ICovXG5cdFx0LyoqXG5cdFx0ICogU2NlbmUgZW5kIGV2ZW50LiAgXG5cdFx0ICogRmlyZXMgd2hlbmV2ZXIgdGhlIHNjcm9sbCBwb3NpdGlvbiBpdHMgdGhlIGVuZGluZyBwb2ludCBvZiB0aGUgc2NlbmUuICBcblx0XHQgKiBJdCB3aWxsIGFsc28gZmlyZSB3aGVuIHNjcm9sbGluZyBiYWNrIHVwIGZyb20gYWZ0ZXIgdGhlIHNjZW5lIGFuZCBnb2luZyBvdmVyIGl0cyBlbmQgcG9zaXRpb24uIElmIHlvdSB3YW50IHNvbWV0aGluZyB0byBoYXBwZW4gb25seSB3aGVuIHNjcm9sbGluZyBkb3duL3JpZ2h0LCB1c2UgdGhlIHNjcm9sbERpcmVjdGlvbiBwYXJhbWV0ZXIgcGFzc2VkIHRvIHRoZSBjYWxsYmFjay5cblx0XHQgKlxuXHRcdCAqIEZvciBkZXRhaWxzIG9uIHRoaXMgZXZlbnQgYW5kIHRoZSBvcmRlciBpbiB3aGljaCBpdCBpcyBmaXJlZCwgcGxlYXNlIHJldmlldyB0aGUge0BsaW5rIFNjZW5lLnByb2dyZXNzfSBtZXRob2QuXG5cdFx0ICpcblx0XHQgKiBAZXZlbnQgU2Nyb2xsTWFnaWMuU2NlbmUjZW5kXG5cdFx0ICpcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIHNjZW5lLm9uKFwiZW5kXCIsIGZ1bmN0aW9uIChldmVudCkge1xuXHRcdCAqIFx0Y29uc29sZS5sb2coXCJIaXQgZW5kIHBvaW50IG9mIHNjZW5lLlwiKTtcblx0XHQgKiB9KTtcblx0XHQgKlxuXHRcdCAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBldmVudCAtIFRoZSBldmVudCBPYmplY3QgcGFzc2VkIHRvIGVhY2ggY2FsbGJhY2tcblx0XHQgKiBAcHJvcGVydHkge3N0cmluZ30gZXZlbnQudHlwZSAtIFRoZSBuYW1lIG9mIHRoZSBldmVudFxuXHRcdCAqIEBwcm9wZXJ0eSB7U2NlbmV9IGV2ZW50LnRhcmdldCAtIFRoZSBTY2VuZSBvYmplY3QgdGhhdCB0cmlnZ2VyZWQgdGhpcyBldmVudFxuXHRcdCAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBldmVudC5wcm9ncmVzcyAtIFJlZmxlY3RzIHRoZSBjdXJyZW50IHByb2dyZXNzIG9mIHRoZSBzY2VuZVxuXHRcdCAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBldmVudC5zdGF0ZSAtIFRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBzY2VuZSBgXCJEVVJJTkdcImAgb3IgYFwiQUZURVJcImBcblx0XHQgKiBAcHJvcGVydHkge3N0cmluZ30gZXZlbnQuc2Nyb2xsRGlyZWN0aW9uIC0gSW5kaWNhdGVzIHdoaWNoIHdheSB3ZSBhcmUgc2Nyb2xsaW5nIGBcIlBBVVNFRFwiYCwgYFwiRk9SV0FSRFwiYCBvciBgXCJSRVZFUlNFXCJgXG5cdFx0ICovXG5cdFx0LyoqXG5cdFx0ICogU2NlbmUgZW50ZXIgZXZlbnQuICBcblx0XHQgKiBGaXJlcyB3aGVuZXZlciB0aGUgc2NlbmUgZW50ZXJzIHRoZSBcIkRVUklOR1wiIHN0YXRlLiAgXG5cdFx0ICogS2VlcCBpbiBtaW5kIHRoYXQgaXQgZG9lc24ndCBtYXR0ZXIgaWYgdGhlIHNjZW5lIHBsYXlzIGZvcndhcmQgb3IgYmFja3dhcmQ6IFRoaXMgZXZlbnQgYWx3YXlzIGZpcmVzIHdoZW4gdGhlIHNjZW5lIGVudGVycyBpdHMgYWN0aXZlIHNjcm9sbCB0aW1lZnJhbWUsIHJlZ2FyZGxlc3Mgb2YgdGhlIHNjcm9sbC1kaXJlY3Rpb24uXG5cdFx0ICpcblx0XHQgKiBGb3IgZGV0YWlscyBvbiB0aGlzIGV2ZW50IGFuZCB0aGUgb3JkZXIgaW4gd2hpY2ggaXQgaXMgZmlyZWQsIHBsZWFzZSByZXZpZXcgdGhlIHtAbGluayBTY2VuZS5wcm9ncmVzc30gbWV0aG9kLlxuXHRcdCAqXG5cdFx0ICogQGV2ZW50IFNjcm9sbE1hZ2ljLlNjZW5lI2VudGVyXG5cdFx0ICpcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIHNjZW5lLm9uKFwiZW50ZXJcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG5cdFx0ICogXHRjb25zb2xlLmxvZyhcIlNjZW5lIGVudGVyZWQuXCIpO1xuXHRcdCAqIH0pO1xuXHRcdCAqXG5cdFx0ICogQHByb3BlcnR5IHtvYmplY3R9IGV2ZW50IC0gVGhlIGV2ZW50IE9iamVjdCBwYXNzZWQgdG8gZWFjaCBjYWxsYmFja1xuXHRcdCAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBldmVudC50eXBlIC0gVGhlIG5hbWUgb2YgdGhlIGV2ZW50XG5cdFx0ICogQHByb3BlcnR5IHtTY2VuZX0gZXZlbnQudGFyZ2V0IC0gVGhlIFNjZW5lIG9iamVjdCB0aGF0IHRyaWdnZXJlZCB0aGlzIGV2ZW50XG5cdFx0ICogQHByb3BlcnR5IHtudW1iZXJ9IGV2ZW50LnByb2dyZXNzIC0gUmVmbGVjdHMgdGhlIGN1cnJlbnQgcHJvZ3Jlc3Mgb2YgdGhlIHNjZW5lXG5cdFx0ICogQHByb3BlcnR5IHtzdHJpbmd9IGV2ZW50LnN0YXRlIC0gVGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIHNjZW5lIC0gYWx3YXlzIGBcIkRVUklOR1wiYFxuXHRcdCAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBldmVudC5zY3JvbGxEaXJlY3Rpb24gLSBJbmRpY2F0ZXMgd2hpY2ggd2F5IHdlIGFyZSBzY3JvbGxpbmcgYFwiUEFVU0VEXCJgLCBgXCJGT1JXQVJEXCJgIG9yIGBcIlJFVkVSU0VcImBcblx0XHQgKi9cblx0XHQvKipcblx0XHQgKiBTY2VuZSBsZWF2ZSBldmVudC4gIFxuXHRcdCAqIEZpcmVzIHdoZW5ldmVyIHRoZSBzY2VuZSdzIHN0YXRlIGdvZXMgZnJvbSBcIkRVUklOR1wiIHRvIGVpdGhlciBcIkJFRk9SRVwiIG9yIFwiQUZURVJcIi4gIFxuXHRcdCAqIEtlZXAgaW4gbWluZCB0aGF0IGl0IGRvZXNuJ3QgbWF0dGVyIGlmIHRoZSBzY2VuZSBwbGF5cyBmb3J3YXJkIG9yIGJhY2t3YXJkOiBUaGlzIGV2ZW50IGFsd2F5cyBmaXJlcyB3aGVuIHRoZSBzY2VuZSBsZWF2ZXMgaXRzIGFjdGl2ZSBzY3JvbGwgdGltZWZyYW1lLCByZWdhcmRsZXNzIG9mIHRoZSBzY3JvbGwtZGlyZWN0aW9uLlxuXHRcdCAqXG5cdFx0ICogRm9yIGRldGFpbHMgb24gdGhpcyBldmVudCBhbmQgdGhlIG9yZGVyIGluIHdoaWNoIGl0IGlzIGZpcmVkLCBwbGVhc2UgcmV2aWV3IHRoZSB7QGxpbmsgU2NlbmUucHJvZ3Jlc3N9IG1ldGhvZC5cblx0XHQgKlxuXHRcdCAqIEBldmVudCBTY3JvbGxNYWdpYy5TY2VuZSNsZWF2ZVxuXHRcdCAqXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiBzY2VuZS5vbihcImxlYXZlXCIsIGZ1bmN0aW9uIChldmVudCkge1xuXHRcdCAqIFx0Y29uc29sZS5sb2coXCJTY2VuZSBsZWZ0LlwiKTtcblx0XHQgKiB9KTtcblx0XHQgKlxuXHRcdCAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBldmVudCAtIFRoZSBldmVudCBPYmplY3QgcGFzc2VkIHRvIGVhY2ggY2FsbGJhY2tcblx0XHQgKiBAcHJvcGVydHkge3N0cmluZ30gZXZlbnQudHlwZSAtIFRoZSBuYW1lIG9mIHRoZSBldmVudFxuXHRcdCAqIEBwcm9wZXJ0eSB7U2NlbmV9IGV2ZW50LnRhcmdldCAtIFRoZSBTY2VuZSBvYmplY3QgdGhhdCB0cmlnZ2VyZWQgdGhpcyBldmVudFxuXHRcdCAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBldmVudC5wcm9ncmVzcyAtIFJlZmxlY3RzIHRoZSBjdXJyZW50IHByb2dyZXNzIG9mIHRoZSBzY2VuZVxuXHRcdCAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBldmVudC5zdGF0ZSAtIFRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBzY2VuZSBgXCJCRUZPUkVcImAgb3IgYFwiQUZURVJcImBcblx0XHQgKiBAcHJvcGVydHkge3N0cmluZ30gZXZlbnQuc2Nyb2xsRGlyZWN0aW9uIC0gSW5kaWNhdGVzIHdoaWNoIHdheSB3ZSBhcmUgc2Nyb2xsaW5nIGBcIlBBVVNFRFwiYCwgYFwiRk9SV0FSRFwiYCBvciBgXCJSRVZFUlNFXCJgXG5cdFx0ICovXG5cdFx0LyoqXG5cdFx0ICogU2NlbmUgdXBkYXRlIGV2ZW50LiAgXG5cdFx0ICogRmlyZXMgd2hlbmV2ZXIgdGhlIHNjZW5lIGlzIHVwZGF0ZWQgKGJ1dCBub3QgbmVjZXNzYXJpbHkgY2hhbmdlcyB0aGUgcHJvZ3Jlc3MpLlxuXHRcdCAqXG5cdFx0ICogQGV2ZW50IFNjcm9sbE1hZ2ljLlNjZW5lI3VwZGF0ZVxuXHRcdCAqXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiBzY2VuZS5vbihcInVwZGF0ZVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcblx0XHQgKiBcdGNvbnNvbGUubG9nKFwiU2NlbmUgdXBkYXRlZC5cIik7XG5cdFx0ICogfSk7XG5cdFx0ICpcblx0XHQgKiBAcHJvcGVydHkge29iamVjdH0gZXZlbnQgLSBUaGUgZXZlbnQgT2JqZWN0IHBhc3NlZCB0byBlYWNoIGNhbGxiYWNrXG5cdFx0ICogQHByb3BlcnR5IHtzdHJpbmd9IGV2ZW50LnR5cGUgLSBUaGUgbmFtZSBvZiB0aGUgZXZlbnRcblx0XHQgKiBAcHJvcGVydHkge1NjZW5lfSBldmVudC50YXJnZXQgLSBUaGUgU2NlbmUgb2JqZWN0IHRoYXQgdHJpZ2dlcmVkIHRoaXMgZXZlbnRcblx0XHQgKiBAcHJvcGVydHkge251bWJlcn0gZXZlbnQuc3RhcnRQb3MgLSBUaGUgc3RhcnRpbmcgcG9zaXRpb24gb2YgdGhlIHNjZW5lIChpbiByZWxhdGlvbiB0byB0aGUgY29uYWluZXIpXG5cdFx0ICogQHByb3BlcnR5IHtudW1iZXJ9IGV2ZW50LmVuZFBvcyAtIFRoZSBlbmRpbmcgcG9zaXRpb24gb2YgdGhlIHNjZW5lIChpbiByZWxhdGlvbiB0byB0aGUgY29uYWluZXIpXG5cdFx0ICogQHByb3BlcnR5IHtudW1iZXJ9IGV2ZW50LnNjcm9sbFBvcyAtIFRoZSBjdXJyZW50IHNjcm9sbCBwb3NpdGlvbiBvZiB0aGUgY29udGFpbmVyXG5cdFx0ICovXG5cdFx0LyoqXG5cdFx0ICogU2NlbmUgcHJvZ3Jlc3MgZXZlbnQuICBcblx0XHQgKiBGaXJlcyB3aGVuZXZlciB0aGUgcHJvZ3Jlc3Mgb2YgdGhlIHNjZW5lIGNoYW5nZXMuXG5cdFx0ICpcblx0XHQgKiBGb3IgZGV0YWlscyBvbiB0aGlzIGV2ZW50IGFuZCB0aGUgb3JkZXIgaW4gd2hpY2ggaXQgaXMgZmlyZWQsIHBsZWFzZSByZXZpZXcgdGhlIHtAbGluayBTY2VuZS5wcm9ncmVzc30gbWV0aG9kLlxuXHRcdCAqXG5cdFx0ICogQGV2ZW50IFNjcm9sbE1hZ2ljLlNjZW5lI3Byb2dyZXNzXG5cdFx0ICpcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIHNjZW5lLm9uKFwicHJvZ3Jlc3NcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG5cdFx0ICogXHRjb25zb2xlLmxvZyhcIlNjZW5lIHByb2dyZXNzIGNoYW5nZWQgdG8gXCIgKyBldmVudC5wcm9ncmVzcyk7XG5cdFx0ICogfSk7XG5cdFx0ICpcblx0XHQgKiBAcHJvcGVydHkge29iamVjdH0gZXZlbnQgLSBUaGUgZXZlbnQgT2JqZWN0IHBhc3NlZCB0byBlYWNoIGNhbGxiYWNrXG5cdFx0ICogQHByb3BlcnR5IHtzdHJpbmd9IGV2ZW50LnR5cGUgLSBUaGUgbmFtZSBvZiB0aGUgZXZlbnRcblx0XHQgKiBAcHJvcGVydHkge1NjZW5lfSBldmVudC50YXJnZXQgLSBUaGUgU2NlbmUgb2JqZWN0IHRoYXQgdHJpZ2dlcmVkIHRoaXMgZXZlbnRcblx0XHQgKiBAcHJvcGVydHkge251bWJlcn0gZXZlbnQucHJvZ3Jlc3MgLSBSZWZsZWN0cyB0aGUgY3VycmVudCBwcm9ncmVzcyBvZiB0aGUgc2NlbmVcblx0XHQgKiBAcHJvcGVydHkge3N0cmluZ30gZXZlbnQuc3RhdGUgLSBUaGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgc2NlbmUgYFwiQkVGT1JFXCJgLCBgXCJEVVJJTkdcImAgb3IgYFwiQUZURVJcImBcblx0XHQgKiBAcHJvcGVydHkge3N0cmluZ30gZXZlbnQuc2Nyb2xsRGlyZWN0aW9uIC0gSW5kaWNhdGVzIHdoaWNoIHdheSB3ZSBhcmUgc2Nyb2xsaW5nIGBcIlBBVVNFRFwiYCwgYFwiRk9SV0FSRFwiYCBvciBgXCJSRVZFUlNFXCJgXG5cdFx0ICovXG5cdFx0LyoqXG5cdFx0ICogU2NlbmUgY2hhbmdlIGV2ZW50LiAgXG5cdFx0ICogRmlyZXMgd2hlbnZldmVyIGEgcHJvcGVydHkgb2YgdGhlIHNjZW5lIGlzIGNoYW5nZWQuXG5cdFx0ICpcblx0XHQgKiBAZXZlbnQgU2Nyb2xsTWFnaWMuU2NlbmUjY2hhbmdlXG5cdFx0ICpcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIHNjZW5lLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uIChldmVudCkge1xuXHRcdCAqIFx0Y29uc29sZS5sb2coXCJTY2VuZSBQcm9wZXJ0eSBcXFwiXCIgKyBldmVudC53aGF0ICsgXCJcXFwiIGNoYW5nZWQgdG8gXCIgKyBldmVudC5uZXd2YWwpO1xuXHRcdCAqIH0pO1xuXHRcdCAqXG5cdFx0ICogQHByb3BlcnR5IHtvYmplY3R9IGV2ZW50IC0gVGhlIGV2ZW50IE9iamVjdCBwYXNzZWQgdG8gZWFjaCBjYWxsYmFja1xuXHRcdCAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBldmVudC50eXBlIC0gVGhlIG5hbWUgb2YgdGhlIGV2ZW50XG5cdFx0ICogQHByb3BlcnR5IHtTY2VuZX0gZXZlbnQudGFyZ2V0IC0gVGhlIFNjZW5lIG9iamVjdCB0aGF0IHRyaWdnZXJlZCB0aGlzIGV2ZW50XG5cdFx0ICogQHByb3BlcnR5IHtzdHJpbmd9IGV2ZW50LndoYXQgLSBJbmRpY2F0ZXMgd2hhdCB2YWx1ZSBoYXMgYmVlbiBjaGFuZ2VkXG5cdFx0ICogQHByb3BlcnR5IHttaXhlZH0gZXZlbnQubmV3dmFsIC0gVGhlIG5ldyB2YWx1ZSBvZiB0aGUgY2hhbmdlZCBwcm9wZXJ0eVxuXHRcdCAqL1xuXHRcdC8qKlxuXHRcdCAqIFNjZW5lIHNoaWZ0IGV2ZW50LiAgXG5cdFx0ICogRmlyZXMgd2hlbnZldmVyIHRoZSBzdGFydCBvciBlbmQgKipzY3JvbGwgb2Zmc2V0Kiogb2YgdGhlIHNjZW5lIGNoYW5nZS5cblx0XHQgKiBUaGlzIGhhcHBlbnMgZXhwbGljaXRlbHksIHdoZW4gb25lIG9mIHRoZXNlIHZhbHVlcyBjaGFuZ2U6IGBvZmZzZXRgLCBgZHVyYXRpb25gIG9yIGB0cmlnZ2VySG9va2AuXG5cdFx0ICogSXQgd2lsbCBmaXJlIGltcGxpY2l0bHkgd2hlbiB0aGUgYHRyaWdnZXJFbGVtZW50YCBjaGFuZ2VzLCBpZiB0aGUgbmV3IGVsZW1lbnQgaGFzIGEgZGlmZmVyZW50IHBvc2l0aW9uIChtb3N0IGNhc2VzKS5cblx0XHQgKiBJdCB3aWxsIGFsc28gZmlyZSBpbXBsaWNpdGx5IHdoZW4gdGhlIHNpemUgb2YgdGhlIGNvbnRhaW5lciBjaGFuZ2VzIGFuZCB0aGUgdHJpZ2dlckhvb2sgaXMgYW55dGhpbmcgb3RoZXIgdGhhbiBgb25MZWF2ZWAuXG5cdFx0ICpcblx0XHQgKiBAZXZlbnQgU2Nyb2xsTWFnaWMuU2NlbmUjc2hpZnRcblx0XHQgKiBAc2luY2UgMS4xLjBcblx0XHQgKlxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogc2NlbmUub24oXCJzaGlmdFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcblx0XHQgKiBcdGNvbnNvbGUubG9nKFwiU2NlbmUgbW92ZWQsIGJlY2F1c2UgdGhlIFwiICsgZXZlbnQucmVhc29uICsgXCIgaGFzIGNoYW5nZWQuKVwiKTtcblx0XHQgKiB9KTtcblx0XHQgKlxuXHRcdCAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBldmVudCAtIFRoZSBldmVudCBPYmplY3QgcGFzc2VkIHRvIGVhY2ggY2FsbGJhY2tcblx0XHQgKiBAcHJvcGVydHkge3N0cmluZ30gZXZlbnQudHlwZSAtIFRoZSBuYW1lIG9mIHRoZSBldmVudFxuXHRcdCAqIEBwcm9wZXJ0eSB7U2NlbmV9IGV2ZW50LnRhcmdldCAtIFRoZSBTY2VuZSBvYmplY3QgdGhhdCB0cmlnZ2VyZWQgdGhpcyBldmVudFxuXHRcdCAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBldmVudC5yZWFzb24gLSBJbmRpY2F0ZXMgd2h5IHRoZSBzY2VuZSBoYXMgc2hpZnRlZFxuXHRcdCAqL1xuXHRcdC8qKlxuXHRcdCAqIFNjZW5lIGRlc3Ryb3kgZXZlbnQuICBcblx0XHQgKiBGaXJlcyB3aGVudmV2ZXIgdGhlIHNjZW5lIGlzIGRlc3Ryb3llZC5cblx0XHQgKiBUaGlzIGNhbiBiZSB1c2VkIHRvIHRpZHkgdXAgY3VzdG9tIGJlaGF2aW91ciB1c2VkIGluIGV2ZW50cy5cblx0XHQgKlxuXHRcdCAqIEBldmVudCBTY3JvbGxNYWdpYy5TY2VuZSNkZXN0cm95XG5cdFx0ICogQHNpbmNlIDEuMS4wXG5cdFx0ICpcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIHNjZW5lLm9uKFwiZW50ZXJcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG5cdFx0ICogICAgICAgIC8vIGFkZCBjdXN0b20gYWN0aW9uXG5cdFx0ICogICAgICAgICQoXCIjbXktZWxlbVwiKS5sZWZ0KFwiMjAwXCIpO1xuXHRcdCAqICAgICAgfSlcblx0XHQgKiAgICAgIC5vbihcImRlc3Ryb3lcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG5cdFx0ICogICAgICAgIC8vIHJlc2V0IG15IGVsZW1lbnQgdG8gc3RhcnQgcG9zaXRpb25cblx0XHQgKiAgICAgICAgaWYgKGV2ZW50LnJlc2V0KSB7XG5cdFx0ICogICAgICAgICAgJChcIiNteS1lbGVtXCIpLmxlZnQoXCIwXCIpO1xuXHRcdCAqICAgICAgICB9XG5cdFx0ICogICAgICB9KTtcblx0XHQgKlxuXHRcdCAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBldmVudCAtIFRoZSBldmVudCBPYmplY3QgcGFzc2VkIHRvIGVhY2ggY2FsbGJhY2tcblx0XHQgKiBAcHJvcGVydHkge3N0cmluZ30gZXZlbnQudHlwZSAtIFRoZSBuYW1lIG9mIHRoZSBldmVudFxuXHRcdCAqIEBwcm9wZXJ0eSB7U2NlbmV9IGV2ZW50LnRhcmdldCAtIFRoZSBTY2VuZSBvYmplY3QgdGhhdCB0cmlnZ2VyZWQgdGhpcyBldmVudFxuXHRcdCAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gZXZlbnQucmVzZXQgLSBJbmRpY2F0ZXMgaWYgdGhlIGRlc3Ryb3kgbWV0aG9kIHdhcyBjYWxsZWQgd2l0aCByZXNldCBgdHJ1ZWAgb3IgYGZhbHNlYC5cblx0XHQgKi9cblx0XHQvKipcblx0XHQgKiBTY2VuZSBhZGQgZXZlbnQuICBcblx0XHQgKiBGaXJlcyB3aGVuIHRoZSBzY2VuZSBpcyBhZGRlZCB0byBhIGNvbnRyb2xsZXIuXG5cdFx0ICogVGhpcyBpcyBtb3N0bHkgdXNlZCBieSBwbHVnaW5zIHRvIGtub3cgdGhhdCBjaGFuZ2UgbWlnaHQgYmUgZHVlLlxuXHRcdCAqXG5cdFx0ICogQGV2ZW50IFNjcm9sbE1hZ2ljLlNjZW5lI2FkZFxuXHRcdCAqIEBzaW5jZSAyLjAuMFxuXHRcdCAqXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiBzY2VuZS5vbihcImFkZFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcblx0XHQgKiBcdGNvbnNvbGUubG9nKCdTY2VuZSB3YXMgYWRkZWQgdG8gYSBuZXcgY29udHJvbGxlci4nKTtcblx0XHQgKiB9KTtcblx0XHQgKlxuXHRcdCAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBldmVudCAtIFRoZSBldmVudCBPYmplY3QgcGFzc2VkIHRvIGVhY2ggY2FsbGJhY2tcblx0XHQgKiBAcHJvcGVydHkge3N0cmluZ30gZXZlbnQudHlwZSAtIFRoZSBuYW1lIG9mIHRoZSBldmVudFxuXHRcdCAqIEBwcm9wZXJ0eSB7U2NlbmV9IGV2ZW50LnRhcmdldCAtIFRoZSBTY2VuZSBvYmplY3QgdGhhdCB0cmlnZ2VyZWQgdGhpcyBldmVudFxuXHRcdCAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gZXZlbnQuY29udHJvbGxlciAtIFRoZSBjb250cm9sbGVyIG9iamVjdCB0aGUgc2NlbmUgd2FzIGFkZGVkIHRvLlxuXHRcdCAqL1xuXHRcdC8qKlxuXHRcdCAqIFNjZW5lIHJlbW92ZSBldmVudC4gIFxuXHRcdCAqIEZpcmVzIHdoZW4gdGhlIHNjZW5lIGlzIHJlbW92ZWQgZnJvbSBhIGNvbnRyb2xsZXIuXG5cdFx0ICogVGhpcyBpcyBtb3N0bHkgdXNlZCBieSBwbHVnaW5zIHRvIGtub3cgdGhhdCBjaGFuZ2UgbWlnaHQgYmUgZHVlLlxuXHRcdCAqXG5cdFx0ICogQGV2ZW50IFNjcm9sbE1hZ2ljLlNjZW5lI3JlbW92ZVxuXHRcdCAqIEBzaW5jZSAyLjAuMFxuXHRcdCAqXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiBzY2VuZS5vbihcInJlbW92ZVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcblx0XHQgKiBcdGNvbnNvbGUubG9nKCdTY2VuZSB3YXMgcmVtb3ZlZCBmcm9tIGl0cyBjb250cm9sbGVyLicpO1xuXHRcdCAqIH0pO1xuXHRcdCAqXG5cdFx0ICogQHByb3BlcnR5IHtvYmplY3R9IGV2ZW50IC0gVGhlIGV2ZW50IE9iamVjdCBwYXNzZWQgdG8gZWFjaCBjYWxsYmFja1xuXHRcdCAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBldmVudC50eXBlIC0gVGhlIG5hbWUgb2YgdGhlIGV2ZW50XG5cdFx0ICogQHByb3BlcnR5IHtTY2VuZX0gZXZlbnQudGFyZ2V0IC0gVGhlIFNjZW5lIG9iamVjdCB0aGF0IHRyaWdnZXJlZCB0aGlzIGV2ZW50XG5cdFx0ICovXG5cblx0XHQvKipcblx0XHQgKiBBZGQgb25lIG9yZSBtb3JlIGV2ZW50IGxpc3RlbmVyLiAgXG5cdFx0ICogVGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHdpbGwgYmUgZmlyZWQgYXQgdGhlIHJlc3BlY3RpdmUgZXZlbnQsIGFuZCBhbiBvYmplY3QgY29udGFpbmluZyByZWxldmFudCBkYXRhIHdpbGwgYmUgcGFzc2VkIHRvIHRoZSBjYWxsYmFjay5cblx0XHQgKiBAbWV0aG9kIFNjcm9sbE1hZ2ljLlNjZW5lI29uXG5cdFx0ICpcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIGZ1bmN0aW9uIGNhbGxiYWNrIChldmVudCkge1xuXHRcdCAqIFx0XHRjb25zb2xlLmxvZyhcIkV2ZW50IGZpcmVkISAoXCIgKyBldmVudC50eXBlICsgXCIpXCIpO1xuXHRcdCAqIH1cblx0XHQgKiAvLyBhZGQgbGlzdGVuZXJzXG5cdFx0ICogc2NlbmUub24oXCJjaGFuZ2UgdXBkYXRlIHByb2dyZXNzIHN0YXJ0IGVuZCBlbnRlciBsZWF2ZVwiLCBjYWxsYmFjayk7XG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gbmFtZXMgLSBUaGUgbmFtZSBvciBuYW1lcyBvZiB0aGUgZXZlbnQgdGhlIGNhbGxiYWNrIHNob3VsZCBiZSBhdHRhY2hlZCB0by5cblx0XHQgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAtIEEgZnVuY3Rpb24gdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWQsIHdoZW4gdGhlIGV2ZW50IGlzIGRpc3BhdGNoZWQuIEFuIGV2ZW50IG9iamVjdCB3aWxsIGJlIHBhc3NlZCB0byB0aGUgY2FsbGJhY2suXG5cdFx0ICogQHJldHVybnMge1NjZW5lfSBQYXJlbnQgb2JqZWN0IGZvciBjaGFpbmluZy5cblx0XHQgKi9cblx0XHR0aGlzLm9uID0gZnVuY3Rpb24gKG5hbWVzLCBjYWxsYmFjaykge1xuXHRcdFx0aWYgKF91dGlsLnR5cGUuRnVuY3Rpb24oY2FsbGJhY2spKSB7XG5cdFx0XHRcdG5hbWVzID0gbmFtZXMudHJpbSgpLnNwbGl0KCcgJyk7XG5cdFx0XHRcdG5hbWVzLmZvckVhY2goZnVuY3Rpb24gKGZ1bGxuYW1lKSB7XG5cdFx0XHRcdFx0dmFyXG5cdFx0XHRcdFx0bmFtZXBhcnRzID0gZnVsbG5hbWUuc3BsaXQoJy4nKSxcblx0XHRcdFx0XHRcdGV2ZW50bmFtZSA9IG5hbWVwYXJ0c1swXSxcblx0XHRcdFx0XHRcdG5hbWVzcGFjZSA9IG5hbWVwYXJ0c1sxXTtcblx0XHRcdFx0XHRpZiAoZXZlbnRuYW1lICE9IFwiKlwiKSB7IC8vIGRpc2FsbG93IHdpbGRjYXJkc1xuXHRcdFx0XHRcdFx0aWYgKCFfbGlzdGVuZXJzW2V2ZW50bmFtZV0pIHtcblx0XHRcdFx0XHRcdFx0X2xpc3RlbmVyc1tldmVudG5hbWVdID0gW107XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRfbGlzdGVuZXJzW2V2ZW50bmFtZV0ucHVzaCh7XG5cdFx0XHRcdFx0XHRcdG5hbWVzcGFjZTogbmFtZXNwYWNlIHx8ICcnLFxuXHRcdFx0XHRcdFx0XHRjYWxsYmFjazogY2FsbGJhY2tcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRsb2coMSwgXCJFUlJPUiB3aGVuIGNhbGxpbmcgJy5vbigpJzogU3VwcGxpZWQgY2FsbGJhY2sgZm9yICdcIiArIG5hbWVzICsgXCInIGlzIG5vdCBhIHZhbGlkIGZ1bmN0aW9uIVwiKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBTY2VuZTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogUmVtb3ZlIG9uZSBvciBtb3JlIGV2ZW50IGxpc3RlbmVyLlxuXHRcdCAqIEBtZXRob2QgU2Nyb2xsTWFnaWMuU2NlbmUjb2ZmXG5cdFx0ICpcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIGZ1bmN0aW9uIGNhbGxiYWNrIChldmVudCkge1xuXHRcdCAqIFx0XHRjb25zb2xlLmxvZyhcIkV2ZW50IGZpcmVkISAoXCIgKyBldmVudC50eXBlICsgXCIpXCIpO1xuXHRcdCAqIH1cblx0XHQgKiAvLyBhZGQgbGlzdGVuZXJzXG5cdFx0ICogc2NlbmUub24oXCJjaGFuZ2UgdXBkYXRlXCIsIGNhbGxiYWNrKTtcblx0XHQgKiAvLyByZW1vdmUgbGlzdGVuZXJzXG5cdFx0ICogc2NlbmUub2ZmKFwiY2hhbmdlIHVwZGF0ZVwiLCBjYWxsYmFjayk7XG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gbmFtZXMgLSBUaGUgbmFtZSBvciBuYW1lcyBvZiB0aGUgZXZlbnQgdGhhdCBzaG91bGQgYmUgcmVtb3ZlZC5cblx0XHQgKiBAcGFyYW0ge2Z1bmN0aW9ufSBbY2FsbGJhY2tdIC0gQSBzcGVjaWZpYyBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IHNob3VsZCBiZSByZW1vdmVkLiBJZiBub25lIGlzIHBhc3NlZCBhbGwgY2FsbGJhY2tzIHRvIHRoZSBldmVudCBsaXN0ZW5lciB3aWxsIGJlIHJlbW92ZWQuXG5cdFx0ICogQHJldHVybnMge1NjZW5lfSBQYXJlbnQgb2JqZWN0IGZvciBjaGFpbmluZy5cblx0XHQgKi9cblx0XHR0aGlzLm9mZiA9IGZ1bmN0aW9uIChuYW1lcywgY2FsbGJhY2spIHtcblx0XHRcdGlmICghbmFtZXMpIHtcblx0XHRcdFx0bG9nKDEsIFwiRVJST1I6IEludmFsaWQgZXZlbnQgbmFtZSBzdXBwbGllZC5cIik7XG5cdFx0XHRcdHJldHVybiBTY2VuZTtcblx0XHRcdH1cblx0XHRcdG5hbWVzID0gbmFtZXMudHJpbSgpLnNwbGl0KCcgJyk7XG5cdFx0XHRuYW1lcy5mb3JFYWNoKGZ1bmN0aW9uIChmdWxsbmFtZSwga2V5KSB7XG5cdFx0XHRcdHZhclxuXHRcdFx0XHRuYW1lcGFydHMgPSBmdWxsbmFtZS5zcGxpdCgnLicpLFxuXHRcdFx0XHRcdGV2ZW50bmFtZSA9IG5hbWVwYXJ0c1swXSxcblx0XHRcdFx0XHRuYW1lc3BhY2UgPSBuYW1lcGFydHNbMV0gfHwgJycsXG5cdFx0XHRcdFx0cmVtb3ZlTGlzdCA9IGV2ZW50bmFtZSA9PT0gJyonID8gT2JqZWN0LmtleXMoX2xpc3RlbmVycykgOiBbZXZlbnRuYW1lXTtcblx0XHRcdFx0cmVtb3ZlTGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChyZW1vdmUpIHtcblx0XHRcdFx0XHR2YXJcblx0XHRcdFx0XHRsaXN0ID0gX2xpc3RlbmVyc1tyZW1vdmVdIHx8IFtdLFxuXHRcdFx0XHRcdFx0aSA9IGxpc3QubGVuZ3RoO1xuXHRcdFx0XHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdFx0XHRcdHZhciBsaXN0ZW5lciA9IGxpc3RbaV07XG5cdFx0XHRcdFx0XHRpZiAobGlzdGVuZXIgJiYgKG5hbWVzcGFjZSA9PT0gbGlzdGVuZXIubmFtZXNwYWNlIHx8IG5hbWVzcGFjZSA9PT0gJyonKSAmJiAoIWNhbGxiYWNrIHx8IGNhbGxiYWNrID09IGxpc3RlbmVyLmNhbGxiYWNrKSkge1xuXHRcdFx0XHRcdFx0XHRsaXN0LnNwbGljZShpLCAxKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKCFsaXN0Lmxlbmd0aCkge1xuXHRcdFx0XHRcdFx0ZGVsZXRlIF9saXN0ZW5lcnNbcmVtb3ZlXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gU2NlbmU7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFRyaWdnZXIgYW4gZXZlbnQuXG5cdFx0ICogQG1ldGhvZCBTY3JvbGxNYWdpYy5TY2VuZSN0cmlnZ2VyXG5cdFx0ICpcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIHRoaXMudHJpZ2dlcihcImNoYW5nZVwiKTtcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGV2ZW50IHRoYXQgc2hvdWxkIGJlIHRyaWdnZXJlZC5cblx0XHQgKiBAcGFyYW0ge29iamVjdH0gW3ZhcnNdIC0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgaW5mbyB0aGF0IHNob3VsZCBiZSBwYXNzZWQgdG8gdGhlIGNhbGxiYWNrLlxuXHRcdCAqIEByZXR1cm5zIHtTY2VuZX0gUGFyZW50IG9iamVjdCBmb3IgY2hhaW5pbmcuXG5cdFx0ICovXG5cdFx0dGhpcy50cmlnZ2VyID0gZnVuY3Rpb24gKG5hbWUsIHZhcnMpIHtcblx0XHRcdGlmIChuYW1lKSB7XG5cdFx0XHRcdHZhclxuXHRcdFx0XHRuYW1lcGFydHMgPSBuYW1lLnRyaW0oKS5zcGxpdCgnLicpLFxuXHRcdFx0XHRcdGV2ZW50bmFtZSA9IG5hbWVwYXJ0c1swXSxcblx0XHRcdFx0XHRuYW1lc3BhY2UgPSBuYW1lcGFydHNbMV0sXG5cdFx0XHRcdFx0bGlzdGVuZXJzID0gX2xpc3RlbmVyc1tldmVudG5hbWVdO1xuXHRcdFx0XHRsb2coMywgJ2V2ZW50IGZpcmVkOicsIGV2ZW50bmFtZSwgdmFycyA/IFwiLT5cIiA6ICcnLCB2YXJzIHx8ICcnKTtcblx0XHRcdFx0aWYgKGxpc3RlbmVycykge1xuXHRcdFx0XHRcdGxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uIChsaXN0ZW5lciwga2V5KSB7XG5cdFx0XHRcdFx0XHRpZiAoIW5hbWVzcGFjZSB8fCBuYW1lc3BhY2UgPT09IGxpc3RlbmVyLm5hbWVzcGFjZSkge1xuXHRcdFx0XHRcdFx0XHRsaXN0ZW5lci5jYWxsYmFjay5jYWxsKFNjZW5lLCBuZXcgU2Nyb2xsTWFnaWMuRXZlbnQoZXZlbnRuYW1lLCBsaXN0ZW5lci5uYW1lc3BhY2UsIFNjZW5lLCB2YXJzKSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGxvZygxLCBcIkVSUk9SOiBJbnZhbGlkIGV2ZW50IG5hbWUgc3VwcGxpZWQuXCIpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIFNjZW5lO1xuXHRcdH07XG5cblx0XHQvLyBzZXQgZXZlbnQgbGlzdGVuZXJzXG5cdFx0U2NlbmUub24oXCJjaGFuZ2UuaW50ZXJuYWxcIiwgZnVuY3Rpb24gKGUpIHtcblx0XHRcdGlmIChlLndoYXQgIT09IFwibG9nbGV2ZWxcIiAmJiBlLndoYXQgIT09IFwidHdlZW5DaGFuZ2VzXCIpIHsgLy8gbm8gbmVlZCBmb3IgYSBzY2VuZSB1cGRhdGUgc2NlbmUgd2l0aCB0aGVzZSBvcHRpb25zLi4uXG5cdFx0XHRcdGlmIChlLndoYXQgPT09IFwidHJpZ2dlckVsZW1lbnRcIikge1xuXHRcdFx0XHRcdHVwZGF0ZVRyaWdnZXJFbGVtZW50UG9zaXRpb24oKTtcblx0XHRcdFx0fSBlbHNlIGlmIChlLndoYXQgPT09IFwicmV2ZXJzZVwiKSB7IC8vIHRoZSBvbmx5IHByb3BlcnR5IGxlZnQgdGhhdCBtYXkgaGF2ZSBhbiBpbXBhY3Qgb24gdGhlIGN1cnJlbnQgc2NlbmUgc3RhdGUuIEV2ZXJ5dGhpbmcgZWxzZSBpcyBoYW5kbGVkIGJ5IHRoZSBzaGlmdCBldmVudC5cblx0XHRcdFx0XHRTY2VuZS51cGRhdGUoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pLm9uKFwic2hpZnQuaW50ZXJuYWxcIiwgZnVuY3Rpb24gKGUpIHtcblx0XHRcdHVwZGF0ZVNjcm9sbE9mZnNldCgpO1xuXHRcdFx0U2NlbmUudXBkYXRlKCk7IC8vIHVwZGF0ZSBzY2VuZSB0byByZWZsZWN0IG5ldyBwb3NpdGlvblxuXHRcdH0pO1xuXG5cdFx0LyoqXG5cdFx0ICogU2VuZCBhIGRlYnVnIG1lc3NhZ2UgdG8gdGhlIGNvbnNvbGUuXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKiBidXQgcHJvdmlkZWQgcHVibGljbHkgd2l0aCBfbG9nIGZvciBwbHVnaW5zXG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge251bWJlcn0gbG9nbGV2ZWwgLSBUaGUgbG9nbGV2ZWwgcmVxdWlyZWQgdG8gaW5pdGlhdGUgb3V0cHV0IGZvciB0aGUgbWVzc2FnZS5cblx0XHQgKiBAcGFyYW0gey4uLm1peGVkfSBvdXRwdXQgLSBPbmUgb3IgbW9yZSB2YXJpYWJsZXMgdGhhdCBzaG91bGQgYmUgcGFzc2VkIHRvIHRoZSBjb25zb2xlLlxuXHRcdCAqL1xuXHRcdHZhciBsb2cgPSB0aGlzLl9sb2cgPSBmdW5jdGlvbiAobG9nbGV2ZWwsIG91dHB1dCkge1xuXHRcdFx0aWYgKF9vcHRpb25zLmxvZ2xldmVsID49IGxvZ2xldmVsKSB7XG5cdFx0XHRcdEFycmF5LnByb3RvdHlwZS5zcGxpY2UuY2FsbChhcmd1bWVudHMsIDEsIDAsIFwiKFwiICsgTkFNRVNQQUNFICsgXCIpIC0+XCIpO1xuXHRcdFx0XHRfdXRpbC5sb2cuYXBwbHkod2luZG93LCBhcmd1bWVudHMpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBBZGQgdGhlIHNjZW5lIHRvIGEgY29udHJvbGxlci4gIFxuXHRcdCAqIFRoaXMgaXMgdGhlIGVxdWl2YWxlbnQgdG8gYENvbnRyb2xsZXIuYWRkU2NlbmUoc2NlbmUpYC5cblx0XHQgKiBAbWV0aG9kIFNjcm9sbE1hZ2ljLlNjZW5lI2FkZFRvXG5cdFx0ICpcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIGFkZCBhIHNjZW5lIHRvIGEgU2Nyb2xsTWFnaWMgQ29udHJvbGxlclxuXHRcdCAqIHNjZW5lLmFkZFRvKGNvbnRyb2xsZXIpO1xuXHRcdCAqXG5cdFx0ICogQHBhcmFtIHtTY3JvbGxNYWdpYy5Db250cm9sbGVyfSBjb250cm9sbGVyIC0gVGhlIGNvbnRyb2xsZXIgdG8gd2hpY2ggdGhlIHNjZW5lIHNob3VsZCBiZSBhZGRlZC5cblx0XHQgKiBAcmV0dXJucyB7U2NlbmV9IFBhcmVudCBvYmplY3QgZm9yIGNoYWluaW5nLlxuXHRcdCAqL1xuXHRcdHRoaXMuYWRkVG8gPSBmdW5jdGlvbiAoY29udHJvbGxlcikge1xuXHRcdFx0aWYgKCEoY29udHJvbGxlciBpbnN0YW5jZW9mIFNjcm9sbE1hZ2ljLkNvbnRyb2xsZXIpKSB7XG5cdFx0XHRcdGxvZygxLCBcIkVSUk9SOiBzdXBwbGllZCBhcmd1bWVudCBvZiAnYWRkVG8oKScgaXMgbm90IGEgdmFsaWQgU2Nyb2xsTWFnaWMgQ29udHJvbGxlclwiKTtcblx0XHRcdH0gZWxzZSBpZiAoX2NvbnRyb2xsZXIgIT0gY29udHJvbGxlcikge1xuXHRcdFx0XHQvLyBuZXcgY29udHJvbGxlclxuXHRcdFx0XHRpZiAoX2NvbnRyb2xsZXIpIHsgLy8gd2FzIGFzc29jaWF0ZWQgdG8gYSBkaWZmZXJlbnQgY29udHJvbGxlciBiZWZvcmUsIHNvIHJlbW92ZSBpdC4uLlxuXHRcdFx0XHRcdF9jb250cm9sbGVyLnJlbW92ZVNjZW5lKFNjZW5lKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRfY29udHJvbGxlciA9IGNvbnRyb2xsZXI7XG5cdFx0XHRcdHZhbGlkYXRlT3B0aW9uKCk7XG5cdFx0XHRcdHVwZGF0ZUR1cmF0aW9uKHRydWUpO1xuXHRcdFx0XHR1cGRhdGVUcmlnZ2VyRWxlbWVudFBvc2l0aW9uKHRydWUpO1xuXHRcdFx0XHR1cGRhdGVTY3JvbGxPZmZzZXQoKTtcblx0XHRcdFx0X2NvbnRyb2xsZXIuaW5mbyhcImNvbnRhaW5lclwiKS5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBvbkNvbnRhaW5lclJlc2l6ZSk7XG5cdFx0XHRcdGNvbnRyb2xsZXIuYWRkU2NlbmUoU2NlbmUpO1xuXHRcdFx0XHRTY2VuZS50cmlnZ2VyKFwiYWRkXCIsIHtcblx0XHRcdFx0XHRjb250cm9sbGVyOiBfY29udHJvbGxlclxuXHRcdFx0XHR9KTtcblx0XHRcdFx0bG9nKDMsIFwiYWRkZWQgXCIgKyBOQU1FU1BBQ0UgKyBcIiB0byBjb250cm9sbGVyXCIpO1xuXHRcdFx0XHRTY2VuZS51cGRhdGUoKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBTY2VuZTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogKipHZXQqKiBvciAqKlNldCoqIHRoZSBjdXJyZW50IGVuYWJsZWQgc3RhdGUgb2YgdGhlIHNjZW5lLiAgXG5cdFx0ICogVGhpcyBjYW4gYmUgdXNlZCB0byBkaXNhYmxlIHRoaXMgc2NlbmUgd2l0aG91dCByZW1vdmluZyBvciBkZXN0cm95aW5nIGl0LlxuXHRcdCAqIEBtZXRob2QgU2Nyb2xsTWFnaWMuU2NlbmUjZW5hYmxlZFxuXHRcdCAqXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiAvLyBnZXQgdGhlIGN1cnJlbnQgdmFsdWVcblx0XHQgKiB2YXIgZW5hYmxlZCA9IHNjZW5lLmVuYWJsZWQoKTtcblx0XHQgKlxuXHRcdCAqIC8vIGRpc2FibGUgdGhlIHNjZW5lXG5cdFx0ICogc2NlbmUuZW5hYmxlZChmYWxzZSk7XG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IFtuZXdTdGF0ZV0gLSBUaGUgbmV3IGVuYWJsZWQgc3RhdGUgb2YgdGhlIHNjZW5lIGB0cnVlYCBvciBgZmFsc2VgLlxuXHRcdCAqIEByZXR1cm5zIHsoYm9vbGVhbnxTY2VuZSl9IEN1cnJlbnQgZW5hYmxlZCBzdGF0ZSBvciBwYXJlbnQgb2JqZWN0IGZvciBjaGFpbmluZy5cblx0XHQgKi9cblx0XHR0aGlzLmVuYWJsZWQgPSBmdW5jdGlvbiAobmV3U3RhdGUpIHtcblx0XHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgeyAvLyBnZXRcblx0XHRcdFx0cmV0dXJuIF9lbmFibGVkO1xuXHRcdFx0fSBlbHNlIGlmIChfZW5hYmxlZCAhPSBuZXdTdGF0ZSkgeyAvLyBzZXRcblx0XHRcdFx0X2VuYWJsZWQgPSAhISBuZXdTdGF0ZTtcblx0XHRcdFx0U2NlbmUudXBkYXRlKHRydWUpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIFNjZW5lO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZW1vdmUgdGhlIHNjZW5lIGZyb20gdGhlIGNvbnRyb2xsZXIuICBcblx0XHQgKiBUaGlzIGlzIHRoZSBlcXVpdmFsZW50IHRvIGBDb250cm9sbGVyLnJlbW92ZVNjZW5lKHNjZW5lKWAuXG5cdFx0ICogVGhlIHNjZW5lIHdpbGwgbm90IGJlIHVwZGF0ZWQgYW55bW9yZSB1bnRpbCB5b3UgcmVhZGQgaXQgdG8gYSBjb250cm9sbGVyLlxuXHRcdCAqIFRvIHJlbW92ZSB0aGUgcGluIG9yIHRoZSB0d2VlbiB5b3UgbmVlZCB0byBjYWxsIHJlbW92ZVR3ZWVuKCkgb3IgcmVtb3ZlUGluKCkgcmVzcGVjdGl2ZWx5LlxuXHRcdCAqIEBtZXRob2QgU2Nyb2xsTWFnaWMuU2NlbmUjcmVtb3ZlXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiAvLyByZW1vdmUgdGhlIHNjZW5lIGZyb20gaXRzIGNvbnRyb2xsZXJcblx0XHQgKiBzY2VuZS5yZW1vdmUoKTtcblx0XHQgKlxuXHRcdCAqIEByZXR1cm5zIHtTY2VuZX0gUGFyZW50IG9iamVjdCBmb3IgY2hhaW5pbmcuXG5cdFx0ICovXG5cdFx0dGhpcy5yZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoX2NvbnRyb2xsZXIpIHtcblx0XHRcdFx0X2NvbnRyb2xsZXIuaW5mbyhcImNvbnRhaW5lclwiKS5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCBvbkNvbnRhaW5lclJlc2l6ZSk7XG5cdFx0XHRcdHZhciB0bXBQYXJlbnQgPSBfY29udHJvbGxlcjtcblx0XHRcdFx0X2NvbnRyb2xsZXIgPSB1bmRlZmluZWQ7XG5cdFx0XHRcdHRtcFBhcmVudC5yZW1vdmVTY2VuZShTY2VuZSk7XG5cdFx0XHRcdFNjZW5lLnRyaWdnZXIoXCJyZW1vdmVcIik7XG5cdFx0XHRcdGxvZygzLCBcInJlbW92ZWQgXCIgKyBOQU1FU1BBQ0UgKyBcIiBmcm9tIGNvbnRyb2xsZXJcIik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gU2NlbmU7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIERlc3Ryb3kgdGhlIHNjZW5lIGFuZCBldmVyeXRoaW5nLlxuXHRcdCAqIEBtZXRob2QgU2Nyb2xsTWFnaWMuU2NlbmUjZGVzdHJveVxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogLy8gZGVzdHJveSB0aGUgc2NlbmUgd2l0aG91dCByZXNldHRpbmcgdGhlIHBpbiBhbmQgdHdlZW4gdG8gdGhlaXIgaW5pdGlhbCBwb3NpdGlvbnNcblx0XHQgKiBzY2VuZSA9IHNjZW5lLmRlc3Ryb3koKTtcblx0XHQgKlxuXHRcdCAqIC8vIGRlc3Ryb3kgdGhlIHNjZW5lIGFuZCByZXNldCB0aGUgcGluIGFuZCB0d2VlblxuXHRcdCAqIHNjZW5lID0gc2NlbmUuZGVzdHJveSh0cnVlKTtcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gW3Jlc2V0PWZhbHNlXSAtIElmIGB0cnVlYCB0aGUgcGluIGFuZCB0d2VlbiAoaWYgZXhpc3RlbnQpIHdpbGwgYmUgcmVzZXQuXG5cdFx0ICogQHJldHVybnMge251bGx9IE51bGwgdG8gdW5zZXQgaGFuZGxlciB2YXJpYWJsZXMuXG5cdFx0ICovXG5cdFx0dGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKHJlc2V0KSB7XG5cdFx0XHRTY2VuZS50cmlnZ2VyKFwiZGVzdHJveVwiLCB7XG5cdFx0XHRcdHJlc2V0OiByZXNldFxuXHRcdFx0fSk7XG5cdFx0XHRTY2VuZS5yZW1vdmUoKTtcblx0XHRcdFNjZW5lLm9mZihcIiouKlwiKTtcblx0XHRcdGxvZygzLCBcImRlc3Ryb3llZCBcIiArIE5BTUVTUEFDRSArIFwiIChyZXNldDogXCIgKyAocmVzZXQgPyBcInRydWVcIiA6IFwiZmFsc2VcIikgKyBcIilcIik7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9O1xuXG5cblx0XHQvKipcblx0XHQgKiBVcGRhdGVzIHRoZSBTY2VuZSB0byByZWZsZWN0IHRoZSBjdXJyZW50IHN0YXRlLiAgXG5cdFx0ICogVGhpcyBpcyB0aGUgZXF1aXZhbGVudCB0byBgQ29udHJvbGxlci51cGRhdGVTY2VuZShzY2VuZSwgaW1tZWRpYXRlbHkpYC4gIFxuXHRcdCAqIFRoZSB1cGRhdGUgbWV0aG9kIGNhbGN1bGF0ZXMgdGhlIHNjZW5lJ3Mgc3RhcnQgYW5kIGVuZCBwb3NpdGlvbiAoYmFzZWQgb24gdGhlIHRyaWdnZXIgZWxlbWVudCwgdHJpZ2dlciBob29rLCBkdXJhdGlvbiBhbmQgb2Zmc2V0KSBhbmQgY2hlY2tzIGl0IGFnYWluc3QgdGhlIGN1cnJlbnQgc2Nyb2xsIHBvc2l0aW9uIG9mIHRoZSBjb250YWluZXIuICBcblx0XHQgKiBJdCB0aGVuIHVwZGF0ZXMgdGhlIGN1cnJlbnQgc2NlbmUgc3RhdGUgYWNjb3JkaW5nbHkgKG9yIGRvZXMgbm90aGluZywgaWYgdGhlIHN0YXRlIGlzIGFscmVhZHkgY29ycmVjdCkg4oCTIFBpbnMgd2lsbCBiZSBzZXQgdG8gdGhlaXIgY29ycmVjdCBwb3NpdGlvbiBhbmQgdHdlZW5zIHdpbGwgYmUgdXBkYXRlZCB0byB0aGVpciBjb3JyZWN0IHByb2dyZXNzLlxuXHRcdCAqIFRoaXMgbWVhbnMgYW4gdXBkYXRlIGRvZXNuJ3QgbmVjZXNzYXJpbHkgcmVzdWx0IGluIGEgcHJvZ3Jlc3MgY2hhbmdlLiBUaGUgYHByb2dyZXNzYCBldmVudCB3aWxsIGJlIGZpcmVkIGlmIHRoZSBwcm9ncmVzcyBoYXMgaW5kZWVkIGNoYW5nZWQgYmV0d2VlbiB0aGlzIHVwZGF0ZSBhbmQgdGhlIGxhc3QuICBcblx0XHQgKiBfKipOT1RFOioqIFRoaXMgbWV0aG9kIGdldHMgY2FsbGVkIGNvbnN0YW50bHkgd2hlbmV2ZXIgU2Nyb2xsTWFnaWMgZGV0ZWN0cyBhIGNoYW5nZS4gVGhlIG9ubHkgYXBwbGljYXRpb24gZm9yIHlvdSBpcyBpZiB5b3UgY2hhbmdlIHNvbWV0aGluZyBvdXRzaWRlIG9mIHRoZSByZWFsbSBvZiBTY3JvbGxNYWdpYywgbGlrZSBtb3ZpbmcgdGhlIHRyaWdnZXIgb3IgY2hhbmdpbmcgdHdlZW4gcGFyYW1ldGVycy5fXG5cdFx0ICogQG1ldGhvZCBTY3JvbGxNYWdpYy5TY2VuZSN1cGRhdGVcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIHVwZGF0ZSB0aGUgc2NlbmUgb24gbmV4dCB0aWNrXG5cdFx0ICogc2NlbmUudXBkYXRlKCk7XG5cdFx0ICpcblx0XHQgKiAvLyB1cGRhdGUgdGhlIHNjZW5lIGltbWVkaWF0ZWx5XG5cdFx0ICogc2NlbmUudXBkYXRlKHRydWUpO1xuXHRcdCAqXG5cdFx0ICogQGZpcmVzIFNjZW5lLnVwZGF0ZVxuXHRcdCAqXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBbaW1tZWRpYXRlbHk9ZmFsc2VdIC0gSWYgYHRydWVgIHRoZSB1cGRhdGUgd2lsbCBiZSBpbnN0YW50LCBpZiBgZmFsc2VgIGl0IHdpbGwgd2FpdCB1bnRpbCBuZXh0IHVwZGF0ZSBjeWNsZSAoYmV0dGVyIHBlcmZvcm1hbmNlKS5cblx0XHQgKiBAcmV0dXJucyB7U2NlbmV9IFBhcmVudCBvYmplY3QgZm9yIGNoYWluaW5nLlxuXHRcdCAqL1xuXHRcdHRoaXMudXBkYXRlID0gZnVuY3Rpb24gKGltbWVkaWF0ZWx5KSB7XG5cdFx0XHRpZiAoX2NvbnRyb2xsZXIpIHtcblx0XHRcdFx0aWYgKGltbWVkaWF0ZWx5KSB7XG5cdFx0XHRcdFx0aWYgKF9jb250cm9sbGVyLmVuYWJsZWQoKSAmJiBfZW5hYmxlZCkge1xuXHRcdFx0XHRcdFx0dmFyXG5cdFx0XHRcdFx0XHRzY3JvbGxQb3MgPSBfY29udHJvbGxlci5pbmZvKFwic2Nyb2xsUG9zXCIpLFxuXHRcdFx0XHRcdFx0XHRuZXdQcm9ncmVzcztcblxuXHRcdFx0XHRcdFx0aWYgKF9vcHRpb25zLmR1cmF0aW9uID4gMCkge1xuXHRcdFx0XHRcdFx0XHRuZXdQcm9ncmVzcyA9IChzY3JvbGxQb3MgLSBfc2Nyb2xsT2Zmc2V0LnN0YXJ0KSAvIChfc2Nyb2xsT2Zmc2V0LmVuZCAtIF9zY3JvbGxPZmZzZXQuc3RhcnQpO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0bmV3UHJvZ3Jlc3MgPSBzY3JvbGxQb3MgPj0gX3Njcm9sbE9mZnNldC5zdGFydCA/IDEgOiAwO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRTY2VuZS50cmlnZ2VyKFwidXBkYXRlXCIsIHtcblx0XHRcdFx0XHRcdFx0c3RhcnRQb3M6IF9zY3JvbGxPZmZzZXQuc3RhcnQsXG5cdFx0XHRcdFx0XHRcdGVuZFBvczogX3Njcm9sbE9mZnNldC5lbmQsXG5cdFx0XHRcdFx0XHRcdHNjcm9sbFBvczogc2Nyb2xsUG9zXG5cdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0U2NlbmUucHJvZ3Jlc3MobmV3UHJvZ3Jlc3MpO1xuXHRcdFx0XHRcdH0gZWxzZSBpZiAoX3BpbiAmJiBfc3RhdGUgPT09IFNDRU5FX1NUQVRFX0RVUklORykge1xuXHRcdFx0XHRcdFx0dXBkYXRlUGluU3RhdGUodHJ1ZSk7IC8vIHVucGluIGluIHBvc2l0aW9uXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdF9jb250cm9sbGVyLnVwZGF0ZVNjZW5lKFNjZW5lLCBmYWxzZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiBTY2VuZTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogVXBkYXRlcyBkeW5hbWljIHNjZW5lIHZhcmlhYmxlcyBsaWtlIHRoZSB0cmlnZ2VyIGVsZW1lbnQgcG9zaXRpb24gb3IgdGhlIGR1cmF0aW9uLlxuXHRcdCAqIFRoaXMgbWV0aG9kIGlzIGF1dG9tYXRpY2FsbHkgY2FsbGVkIGluIHJlZ3VsYXIgaW50ZXJ2YWxzIGZyb20gdGhlIGNvbnRyb2xsZXIuIFNlZSB7QGxpbmsgU2Nyb2xsTWFnaWMuQ29udHJvbGxlcn0gb3B0aW9uIGByZWZyZXNoSW50ZXJ2YWxgLlxuXHRcdCAqIFxuXHRcdCAqIFlvdSBjYW4gY2FsbCBpdCB0byBtaW5pbWl6ZSBsYWcsIGZvciBleGFtcGxlIHdoZW4geW91IGludGVudGlvbmFsbHkgY2hhbmdlIHRoZSBwb3NpdGlvbiBvZiB0aGUgdHJpZ2dlckVsZW1lbnQuXG5cdFx0ICogSWYgeW91IGRvbid0IGl0IHdpbGwgc2ltcGx5IGJlIHVwZGF0ZWQgaW4gdGhlIG5leHQgcmVmcmVzaCBpbnRlcnZhbCBvZiB0aGUgY29udGFpbmVyLCB3aGljaCBpcyB1c3VhbGx5IHN1ZmZpY2llbnQuXG5cdFx0ICpcblx0XHQgKiBAbWV0aG9kIFNjcm9sbE1hZ2ljLlNjZW5lI3JlZnJlc2hcblx0XHQgKiBAc2luY2UgMS4xLjBcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIHNjZW5lID0gbmV3IFNjcm9sbE1hZ2ljLlNjZW5lKHt0cmlnZ2VyRWxlbWVudDogXCIjdHJpZ2dlclwifSk7XG5cdFx0ICogXG5cdFx0ICogLy8gY2hhbmdlIHRoZSBwb3NpdGlvbiBvZiB0aGUgdHJpZ2dlclxuXHRcdCAqICQoXCIjdHJpZ2dlclwiKS5jc3MoXCJ0b3BcIiwgNTAwKTtcblx0XHQgKiAvLyBpbW1lZGlhdGVseSBsZXQgdGhlIHNjZW5lIGtub3cgb2YgdGhpcyBjaGFuZ2Vcblx0XHQgKiBzY2VuZS5yZWZyZXNoKCk7XG5cdFx0ICpcblx0XHQgKiBAZmlyZXMge0BsaW5rIFNjZW5lLnNoaWZ0fSwgaWYgdGhlIHRyaWdnZXIgZWxlbWVudCBwb3NpdGlvbiBvciB0aGUgZHVyYXRpb24gY2hhbmdlZFxuXHRcdCAqIEBmaXJlcyB7QGxpbmsgU2NlbmUuY2hhbmdlfSwgaWYgdGhlIGR1cmF0aW9uIGNoYW5nZWRcblx0XHQgKlxuXHRcdCAqIEByZXR1cm5zIHtTY2VuZX0gUGFyZW50IG9iamVjdCBmb3IgY2hhaW5pbmcuXG5cdFx0ICovXG5cdFx0dGhpcy5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dXBkYXRlRHVyYXRpb24oKTtcblx0XHRcdHVwZGF0ZVRyaWdnZXJFbGVtZW50UG9zaXRpb24oKTtcblx0XHRcdC8vIHVwZGF0ZSB0cmlnZ2VyIGVsZW1lbnQgcG9zaXRpb25cblx0XHRcdHJldHVybiBTY2VuZTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogKipHZXQqKiBvciAqKlNldCoqIHRoZSBzY2VuZSdzIHByb2dyZXNzLiAgXG5cdFx0ICogVXN1YWxseSBpdCBzaG91bGRuJ3QgYmUgbmVjZXNzYXJ5IHRvIHVzZSB0aGlzIGFzIGEgc2V0dGVyLCBhcyBpdCBpcyBzZXQgYXV0b21hdGljYWxseSBieSBzY2VuZS51cGRhdGUoKS4gIFxuXHRcdCAqIFRoZSBvcmRlciBpbiB3aGljaCB0aGUgZXZlbnRzIGFyZSBmaXJlZCBkZXBlbmRzIG9uIHRoZSBkdXJhdGlvbiBvZiB0aGUgc2NlbmU6XG5cdFx0ICogIDEuIFNjZW5lcyB3aXRoIGBkdXJhdGlvbiA9PSAwYDogIFxuXHRcdCAqICBTY2VuZXMgdGhhdCBoYXZlIG5vIGR1cmF0aW9uIGJ5IGRlZmluaXRpb24gaGF2ZSBubyBlbmRpbmcuIFRodXMgdGhlIGBlbmRgIGV2ZW50IHdpbGwgbmV2ZXIgYmUgZmlyZWQuICBcblx0XHQgKiAgV2hlbiB0aGUgdHJpZ2dlciBwb3NpdGlvbiBvZiB0aGUgc2NlbmUgaXMgcGFzc2VkIHRoZSBldmVudHMgYXJlIGFsd2F5cyBmaXJlZCBpbiB0aGlzIG9yZGVyOiAgXG5cdFx0ICogIGBlbnRlcmAsIGBzdGFydGAsIGBwcm9ncmVzc2Agd2hlbiBzY3JvbGxpbmcgZm9yd2FyZCAgXG5cdFx0ICogIGFuZCAgXG5cdFx0ICogIGBwcm9ncmVzc2AsIGBzdGFydGAsIGBsZWF2ZWAgd2hlbiBzY3JvbGxpbmcgaW4gcmV2ZXJzZVxuXHRcdCAqICAyLiBTY2VuZXMgd2l0aCBgZHVyYXRpb24gPiAwYDogIFxuXHRcdCAqICBTY2VuZXMgd2l0aCBhIHNldCBkdXJhdGlvbiBoYXZlIGEgZGVmaW5lZCBzdGFydCBhbmQgZW5kIHBvaW50LiAgXG5cdFx0ICogIFdoZW4gc2Nyb2xsaW5nIHBhc3QgdGhlIHN0YXJ0IHBvc2l0aW9uIG9mIHRoZSBzY2VuZSBpdCB3aWxsIGZpcmUgdGhlc2UgZXZlbnRzIGluIHRoaXMgb3JkZXI6ICBcblx0XHQgKiAgYGVudGVyYCwgYHN0YXJ0YCwgYHByb2dyZXNzYCAgXG5cdFx0ICogIFdoZW4gY29udGludWluZyB0byBzY3JvbGwgYW5kIHBhc3NpbmcgdGhlIGVuZCBwb2ludCBpdCB3aWxsIGZpcmUgdGhlc2UgZXZlbnRzOiAgXG5cdFx0ICogIGBwcm9ncmVzc2AsIGBlbmRgLCBgbGVhdmVgICBcblx0XHQgKiAgV2hlbiByZXZlcnNpbmcgdGhyb3VnaCB0aGUgZW5kIHBvaW50IHRoZXNlIGV2ZW50cyBhcmUgZmlyZWQ6ICBcblx0XHQgKiAgYGVudGVyYCwgYGVuZGAsIGBwcm9ncmVzc2AgIFxuXHRcdCAqICBBbmQgd2hlbiBjb250aW51aW5nIHRvIHNjcm9sbCBwYXN0IHRoZSBzdGFydCBwb3NpdGlvbiBpbiByZXZlcnNlIGl0IHdpbGwgZmlyZTogIFxuXHRcdCAqICBgcHJvZ3Jlc3NgLCBgc3RhcnRgLCBgbGVhdmVgICBcblx0XHQgKiAgSW4gYmV0d2VlbiBzdGFydCBhbmQgZW5kIHRoZSBgcHJvZ3Jlc3NgIGV2ZW50IHdpbGwgYmUgY2FsbGVkIGNvbnN0YW50bHksIHdoZW5ldmVyIHRoZSBwcm9ncmVzcyBjaGFuZ2VzLlxuXHRcdCAqIFxuXHRcdCAqIEluIHNob3J0OiAgXG5cdFx0ICogYGVudGVyYCBldmVudHMgd2lsbCBhbHdheXMgdHJpZ2dlciAqKmJlZm9yZSoqIHRoZSBwcm9ncmVzcyB1cGRhdGUgYW5kIGBsZWF2ZWAgZW52ZW50cyB3aWxsIHRyaWdnZXIgKiphZnRlcioqIHRoZSBwcm9ncmVzcyB1cGRhdGUuICBcblx0XHQgKiBgc3RhcnRgIGFuZCBgZW5kYCB3aWxsIGFsd2F5cyB0cmlnZ2VyIGF0IHRoZWlyIHJlc3BlY3RpdmUgcG9zaXRpb24uXG5cdFx0ICogXG5cdFx0ICogUGxlYXNlIHJldmlldyB0aGUgZXZlbnQgZGVzY3JpcHRpb25zIGZvciBkZXRhaWxzIG9uIHRoZSBldmVudHMgYW5kIHRoZSBldmVudCBvYmplY3QgdGhhdCBpcyBwYXNzZWQgdG8gdGhlIGNhbGxiYWNrLlxuXHRcdCAqIFxuXHRcdCAqIEBtZXRob2QgU2Nyb2xsTWFnaWMuU2NlbmUjcHJvZ3Jlc3Ncblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIGdldCB0aGUgY3VycmVudCBzY2VuZSBwcm9ncmVzc1xuXHRcdCAqIHZhciBwcm9ncmVzcyA9IHNjZW5lLnByb2dyZXNzKCk7XG5cdFx0ICpcblx0XHQgKiAvLyBzZXQgbmV3IHNjZW5lIHByb2dyZXNzXG5cdFx0ICogc2NlbmUucHJvZ3Jlc3MoMC4zKTtcblx0XHQgKlxuXHRcdCAqIEBmaXJlcyB7QGxpbmsgU2NlbmUuZW50ZXJ9LCB3aGVuIHVzZWQgYXMgc2V0dGVyXG5cdFx0ICogQGZpcmVzIHtAbGluayBTY2VuZS5zdGFydH0sIHdoZW4gdXNlZCBhcyBzZXR0ZXJcblx0XHQgKiBAZmlyZXMge0BsaW5rIFNjZW5lLnByb2dyZXNzfSwgd2hlbiB1c2VkIGFzIHNldHRlclxuXHRcdCAqIEBmaXJlcyB7QGxpbmsgU2NlbmUuZW5kfSwgd2hlbiB1c2VkIGFzIHNldHRlclxuXHRcdCAqIEBmaXJlcyB7QGxpbmsgU2NlbmUubGVhdmV9LCB3aGVuIHVzZWQgYXMgc2V0dGVyXG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge251bWJlcn0gW3Byb2dyZXNzXSAtIFRoZSBuZXcgcHJvZ3Jlc3MgdmFsdWUgb2YgdGhlIHNjZW5lIGBbMC0xXWAuXG5cdFx0ICogQHJldHVybnMge251bWJlcn0gYGdldGAgLSAgQ3VycmVudCBzY2VuZSBwcm9ncmVzcy5cblx0XHQgKiBAcmV0dXJucyB7U2NlbmV9IGBzZXRgIC0gIFBhcmVudCBvYmplY3QgZm9yIGNoYWluaW5nLlxuXHRcdCAqL1xuXHRcdHRoaXMucHJvZ3Jlc3MgPSBmdW5jdGlvbiAocHJvZ3Jlc3MpIHtcblx0XHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgeyAvLyBnZXRcblx0XHRcdFx0cmV0dXJuIF9wcm9ncmVzcztcblx0XHRcdH0gZWxzZSB7IC8vIHNldFxuXHRcdFx0XHR2YXJcblx0XHRcdFx0ZG9VcGRhdGUgPSBmYWxzZSxcblx0XHRcdFx0XHRvbGRTdGF0ZSA9IF9zdGF0ZSxcblx0XHRcdFx0XHRzY3JvbGxEaXJlY3Rpb24gPSBfY29udHJvbGxlciA/IF9jb250cm9sbGVyLmluZm8oXCJzY3JvbGxEaXJlY3Rpb25cIikgOiAnUEFVU0VEJyxcblx0XHRcdFx0XHRyZXZlcnNlT3JGb3J3YXJkID0gX29wdGlvbnMucmV2ZXJzZSB8fCBwcm9ncmVzcyA+PSBfcHJvZ3Jlc3M7XG5cdFx0XHRcdGlmIChfb3B0aW9ucy5kdXJhdGlvbiA9PT0gMCkge1xuXHRcdFx0XHRcdC8vIHplcm8gZHVyYXRpb24gc2NlbmVzXG5cdFx0XHRcdFx0ZG9VcGRhdGUgPSBfcHJvZ3Jlc3MgIT0gcHJvZ3Jlc3M7XG5cdFx0XHRcdFx0X3Byb2dyZXNzID0gcHJvZ3Jlc3MgPCAxICYmIHJldmVyc2VPckZvcndhcmQgPyAwIDogMTtcblx0XHRcdFx0XHRfc3RhdGUgPSBfcHJvZ3Jlc3MgPT09IDAgPyBTQ0VORV9TVEFURV9CRUZPUkUgOiBTQ0VORV9TVEFURV9EVVJJTkc7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gc2NlbmVzIHdpdGggc3RhcnQgYW5kIGVuZFxuXHRcdFx0XHRcdGlmIChwcm9ncmVzcyA8IDAgJiYgX3N0YXRlICE9PSBTQ0VORV9TVEFURV9CRUZPUkUgJiYgcmV2ZXJzZU9yRm9yd2FyZCkge1xuXHRcdFx0XHRcdFx0Ly8gZ28gYmFjayB0byBpbml0aWFsIHN0YXRlXG5cdFx0XHRcdFx0XHRfcHJvZ3Jlc3MgPSAwO1xuXHRcdFx0XHRcdFx0X3N0YXRlID0gU0NFTkVfU1RBVEVfQkVGT1JFO1xuXHRcdFx0XHRcdFx0ZG9VcGRhdGUgPSB0cnVlO1xuXHRcdFx0XHRcdH0gZWxzZSBpZiAocHJvZ3Jlc3MgPj0gMCAmJiBwcm9ncmVzcyA8IDEgJiYgcmV2ZXJzZU9yRm9yd2FyZCkge1xuXHRcdFx0XHRcdFx0X3Byb2dyZXNzID0gcHJvZ3Jlc3M7XG5cdFx0XHRcdFx0XHRfc3RhdGUgPSBTQ0VORV9TVEFURV9EVVJJTkc7XG5cdFx0XHRcdFx0XHRkb1VwZGF0ZSA9IHRydWU7XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChwcm9ncmVzcyA+PSAxICYmIF9zdGF0ZSAhPT0gU0NFTkVfU1RBVEVfQUZURVIpIHtcblx0XHRcdFx0XHRcdF9wcm9ncmVzcyA9IDE7XG5cdFx0XHRcdFx0XHRfc3RhdGUgPSBTQ0VORV9TVEFURV9BRlRFUjtcblx0XHRcdFx0XHRcdGRvVXBkYXRlID0gdHJ1ZTtcblx0XHRcdFx0XHR9IGVsc2UgaWYgKF9zdGF0ZSA9PT0gU0NFTkVfU1RBVEVfRFVSSU5HICYmICFyZXZlcnNlT3JGb3J3YXJkKSB7XG5cdFx0XHRcdFx0XHR1cGRhdGVQaW5TdGF0ZSgpOyAvLyBpbiBjYXNlIHdlIHNjcm9sbGVkIGJhY2t3YXJkcyBtaWQtc2NlbmUgYW5kIHJldmVyc2UgaXMgZGlzYWJsZWQgPT4gdXBkYXRlIHRoZSBwaW4gcG9zaXRpb24sIHNvIGl0IGRvZXNuJ3QgbW92ZSBiYWNrIGFzIHdlbGwuXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChkb1VwZGF0ZSkge1xuXHRcdFx0XHRcdC8vIGZpcmUgZXZlbnRzXG5cdFx0XHRcdFx0dmFyXG5cdFx0XHRcdFx0ZXZlbnRWYXJzID0ge1xuXHRcdFx0XHRcdFx0cHJvZ3Jlc3M6IF9wcm9ncmVzcyxcblx0XHRcdFx0XHRcdHN0YXRlOiBfc3RhdGUsXG5cdFx0XHRcdFx0XHRzY3JvbGxEaXJlY3Rpb246IHNjcm9sbERpcmVjdGlvblxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRzdGF0ZUNoYW5nZWQgPSBfc3RhdGUgIT0gb2xkU3RhdGU7XG5cblx0XHRcdFx0XHR2YXIgdHJpZ2dlciA9IGZ1bmN0aW9uIChldmVudE5hbWUpIHsgLy8gdG1wIGhlbHBlciB0byBzaW1wbGlmeSBjb2RlXG5cdFx0XHRcdFx0XHRTY2VuZS50cmlnZ2VyKGV2ZW50TmFtZSwgZXZlbnRWYXJzKTtcblx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0aWYgKHN0YXRlQ2hhbmdlZCkgeyAvLyBlbnRlciBldmVudHNcblx0XHRcdFx0XHRcdGlmIChvbGRTdGF0ZSAhPT0gU0NFTkVfU1RBVEVfRFVSSU5HKSB7XG5cdFx0XHRcdFx0XHRcdHRyaWdnZXIoXCJlbnRlclwiKTtcblx0XHRcdFx0XHRcdFx0dHJpZ2dlcihvbGRTdGF0ZSA9PT0gU0NFTkVfU1RBVEVfQkVGT1JFID8gXCJzdGFydFwiIDogXCJlbmRcIik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHRyaWdnZXIoXCJwcm9ncmVzc1wiKTtcblx0XHRcdFx0XHRpZiAoc3RhdGVDaGFuZ2VkKSB7IC8vIGxlYXZlIGV2ZW50c1xuXHRcdFx0XHRcdFx0aWYgKF9zdGF0ZSAhPT0gU0NFTkVfU1RBVEVfRFVSSU5HKSB7XG5cdFx0XHRcdFx0XHRcdHRyaWdnZXIoX3N0YXRlID09PSBTQ0VORV9TVEFURV9CRUZPUkUgPyBcInN0YXJ0XCIgOiBcImVuZFwiKTtcblx0XHRcdFx0XHRcdFx0dHJpZ2dlcihcImxlYXZlXCIpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBTY2VuZTtcblx0XHRcdH1cblx0XHR9O1xuXG5cblx0XHQvKipcblx0XHQgKiBVcGRhdGUgdGhlIHN0YXJ0IGFuZCBlbmQgc2Nyb2xsT2Zmc2V0IG9mIHRoZSBjb250YWluZXIuXG5cdFx0ICogVGhlIHBvc2l0aW9ucyByZWZsZWN0IHdoYXQgdGhlIGNvbnRyb2xsZXIncyBzY3JvbGwgcG9zaXRpb24gd2lsbCBiZSBhdCB0aGUgc3RhcnQgYW5kIGVuZCByZXNwZWN0aXZlbHkuXG5cdFx0ICogSXMgY2FsbGVkLCB3aGVuOlxuXHRcdCAqICAgLSBTY2VuZSBldmVudCBcImNoYW5nZVwiIGlzIGNhbGxlZCB3aXRoOiBvZmZzZXQsIHRyaWdnZXJIb29rLCBkdXJhdGlvbiBcblx0XHQgKiAgIC0gc2Nyb2xsIGNvbnRhaW5lciBldmVudCBcInJlc2l6ZVwiIGlzIGNhbGxlZFxuXHRcdCAqICAgLSB0aGUgcG9zaXRpb24gb2YgdGhlIHRyaWdnZXJFbGVtZW50IGNoYW5nZXNcblx0XHQgKiAgIC0gdGhlIGNvbnRyb2xsZXIgY2hhbmdlcyAtPiBhZGRUbygpXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgdXBkYXRlU2Nyb2xsT2Zmc2V0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0X3Njcm9sbE9mZnNldCA9IHtcblx0XHRcdFx0c3RhcnQ6IF90cmlnZ2VyUG9zICsgX29wdGlvbnMub2Zmc2V0XG5cdFx0XHR9O1xuXHRcdFx0aWYgKF9jb250cm9sbGVyICYmIF9vcHRpb25zLnRyaWdnZXJFbGVtZW50KSB7XG5cdFx0XHRcdC8vIHRha2UgYXdheSB0cmlnZ2VySG9vayBwb3J0aW9uIHRvIGdldCByZWxhdGl2ZSB0byB0b3Bcblx0XHRcdFx0X3Njcm9sbE9mZnNldC5zdGFydCAtPSBfY29udHJvbGxlci5pbmZvKFwic2l6ZVwiKSAqIF9vcHRpb25zLnRyaWdnZXJIb29rO1xuXHRcdFx0fVxuXHRcdFx0X3Njcm9sbE9mZnNldC5lbmQgPSBfc2Nyb2xsT2Zmc2V0LnN0YXJ0ICsgX29wdGlvbnMuZHVyYXRpb247XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFVwZGF0ZXMgdGhlIGR1cmF0aW9uIGlmIHNldCB0byBhIGR5bmFtaWMgZnVuY3Rpb24uXG5cdFx0ICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIHdoZW4gdGhlIHNjZW5lIGlzIGFkZGVkIHRvIGEgY29udHJvbGxlciBhbmQgaW4gcmVndWxhciBpbnRlcnZhbHMgZnJvbSB0aGUgY29udHJvbGxlciB0aHJvdWdoIHNjZW5lLnJlZnJlc2goKS5cblx0XHQgKiBcblx0XHQgKiBAZmlyZXMge0BsaW5rIFNjZW5lLmNoYW5nZX0sIGlmIHRoZSBkdXJhdGlvbiBjaGFuZ2VkXG5cdFx0ICogQGZpcmVzIHtAbGluayBTY2VuZS5zaGlmdH0sIGlmIHRoZSBkdXJhdGlvbiBjaGFuZ2VkXG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IFtzdXBwcmVzc0V2ZW50cz1mYWxzZV0gLSBJZiB0cnVlIHRoZSBzaGlmdCBldmVudCB3aWxsIGJlIHN1cHByZXNzZWQuXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgdXBkYXRlRHVyYXRpb24gPSBmdW5jdGlvbiAoc3VwcHJlc3NFdmVudHMpIHtcblx0XHRcdC8vIHVwZGF0ZSBkdXJhdGlvblxuXHRcdFx0aWYgKF9kdXJhdGlvblVwZGF0ZU1ldGhvZCkge1xuXHRcdFx0XHR2YXIgdmFybmFtZSA9IFwiZHVyYXRpb25cIjtcblx0XHRcdFx0aWYgKGNoYW5nZU9wdGlvbih2YXJuYW1lLCBfZHVyYXRpb25VcGRhdGVNZXRob2QuY2FsbChTY2VuZSkpICYmICFzdXBwcmVzc0V2ZW50cykgeyAvLyBzZXRcblx0XHRcdFx0XHRTY2VuZS50cmlnZ2VyKFwiY2hhbmdlXCIsIHtcblx0XHRcdFx0XHRcdHdoYXQ6IHZhcm5hbWUsXG5cdFx0XHRcdFx0XHRuZXd2YWw6IF9vcHRpb25zW3Zhcm5hbWVdXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0U2NlbmUudHJpZ2dlcihcInNoaWZ0XCIsIHtcblx0XHRcdFx0XHRcdHJlYXNvbjogdmFybmFtZVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFVwZGF0ZXMgdGhlIHBvc2l0aW9uIG9mIHRoZSB0cmlnZ2VyRWxlbWVudCwgaWYgcHJlc2VudC5cblx0XHQgKiBUaGlzIG1ldGhvZCBpcyBjYWxsZWQgLi4uXG5cdFx0ICogIC0gLi4uIHdoZW4gdGhlIHRyaWdnZXJFbGVtZW50IGlzIGNoYW5nZWRcblx0XHQgKiAgLSAuLi4gd2hlbiB0aGUgc2NlbmUgaXMgYWRkZWQgdG8gYSAobmV3KSBjb250cm9sbGVyXG5cdFx0ICogIC0gLi4uIGluIHJlZ3VsYXIgaW50ZXJ2YWxzIGZyb20gdGhlIGNvbnRyb2xsZXIgdGhyb3VnaCBzY2VuZS5yZWZyZXNoKCkuXG5cdFx0ICogXG5cdFx0ICogQGZpcmVzIHtAbGluayBTY2VuZS5zaGlmdH0sIGlmIHRoZSBwb3NpdGlvbiBjaGFuZ2VkXG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IFtzdXBwcmVzc0V2ZW50cz1mYWxzZV0gLSBJZiB0cnVlIHRoZSBzaGlmdCBldmVudCB3aWxsIGJlIHN1cHByZXNzZWQuXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgdXBkYXRlVHJpZ2dlckVsZW1lbnRQb3NpdGlvbiA9IGZ1bmN0aW9uIChzdXBwcmVzc0V2ZW50cykge1xuXHRcdFx0dmFyXG5cdFx0XHRlbGVtZW50UG9zID0gMCxcblx0XHRcdFx0dGVsZW0gPSBfb3B0aW9ucy50cmlnZ2VyRWxlbWVudDtcblx0XHRcdGlmIChfY29udHJvbGxlciAmJiAodGVsZW0gfHwgX3RyaWdnZXJQb3MgPiAwKSkgeyAvLyBlaXRoZXIgYW4gZWxlbWVudCBleGlzdHMgb3Igd2FzIHJlbW92ZWQgYW5kIHRoZSB0cmlnZ2VyUG9zIGlzIHN0aWxsID4gMFxuXHRcdFx0XHRpZiAodGVsZW0pIHsgLy8gdGhlcmUgY3VycmVudGx5IGEgdHJpZ2dlckVsZW1lbnQgc2V0XG5cdFx0XHRcdFx0aWYgKHRlbGVtLnBhcmVudE5vZGUpIHsgLy8gY2hlY2sgaWYgZWxlbWVudCBpcyBzdGlsbCBhdHRhY2hlZCB0byBET01cblx0XHRcdFx0XHRcdHZhclxuXHRcdFx0XHRcdFx0Y29udHJvbGxlckluZm8gPSBfY29udHJvbGxlci5pbmZvKCksXG5cdFx0XHRcdFx0XHRcdGNvbnRhaW5lck9mZnNldCA9IF91dGlsLmdldC5vZmZzZXQoY29udHJvbGxlckluZm8uY29udGFpbmVyKSxcblx0XHRcdFx0XHRcdFx0Ly8gY29udGFpbmVyIHBvc2l0aW9uIGlzIG5lZWRlZCBiZWNhdXNlIGVsZW1lbnQgb2Zmc2V0IGlzIHJldHVybmVkIGluIHJlbGF0aW9uIHRvIGRvY3VtZW50LCBub3QgaW4gcmVsYXRpb24gdG8gY29udGFpbmVyLlxuXHRcdFx0XHRcdFx0XHRwYXJhbSA9IGNvbnRyb2xsZXJJbmZvLnZlcnRpY2FsID8gXCJ0b3BcIiA6IFwibGVmdFwiOyAvLyB3aGljaCBwYXJhbSBpcyBvZiBpbnRlcmVzdCA/XG5cdFx0XHRcdFx0XHQvLyBpZiBwYXJlbnQgaXMgc3BhY2VyLCB1c2Ugc3BhY2VyIHBvc2l0aW9uIGluc3RlYWQgc28gY29ycmVjdCBzdGFydCBwb3NpdGlvbiBpcyByZXR1cm5lZCBmb3IgcGlubmVkIGVsZW1lbnRzLlxuXHRcdFx0XHRcdFx0d2hpbGUgKHRlbGVtLnBhcmVudE5vZGUuaGFzQXR0cmlidXRlKFBJTl9TUEFDRVJfQVRUUklCVVRFKSkge1xuXHRcdFx0XHRcdFx0XHR0ZWxlbSA9IHRlbGVtLnBhcmVudE5vZGU7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHZhciBlbGVtZW50T2Zmc2V0ID0gX3V0aWwuZ2V0Lm9mZnNldCh0ZWxlbSk7XG5cblx0XHRcdFx0XHRcdGlmICghY29udHJvbGxlckluZm8uaXNEb2N1bWVudCkgeyAvLyBjb250YWluZXIgaXMgbm90IHRoZSBkb2N1bWVudCByb290LCBzbyBzdWJzdHJhY3Qgc2Nyb2xsIFBvc2l0aW9uIHRvIGdldCBjb3JyZWN0IHRyaWdnZXIgZWxlbWVudCBwb3NpdGlvbiByZWxhdGl2ZSB0byBzY3JvbGxjb250ZW50XG5cdFx0XHRcdFx0XHRcdGNvbnRhaW5lck9mZnNldFtwYXJhbV0gLT0gX2NvbnRyb2xsZXIuc2Nyb2xsUG9zKCk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGVsZW1lbnRQb3MgPSBlbGVtZW50T2Zmc2V0W3BhcmFtXSAtIGNvbnRhaW5lck9mZnNldFtwYXJhbV07XG5cblx0XHRcdFx0XHR9IGVsc2UgeyAvLyB0aGVyZSB3YXMgYW4gZWxlbWVudCwgYnV0IGl0IHdhcyByZW1vdmVkIGZyb20gRE9NXG5cdFx0XHRcdFx0XHRsb2coMiwgXCJXQVJOSU5HOiB0cmlnZ2VyRWxlbWVudCB3YXMgcmVtb3ZlZCBmcm9tIERPTSBhbmQgd2lsbCBiZSByZXNldCB0b1wiLCB1bmRlZmluZWQpO1xuXHRcdFx0XHRcdFx0U2NlbmUudHJpZ2dlckVsZW1lbnQodW5kZWZpbmVkKTsgLy8gdW5zZXQsIHNvIGEgY2hhbmdlIGV2ZW50IGlzIHRyaWdnZXJlZFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBjaGFuZ2VkID0gZWxlbWVudFBvcyAhPSBfdHJpZ2dlclBvcztcblx0XHRcdFx0X3RyaWdnZXJQb3MgPSBlbGVtZW50UG9zO1xuXHRcdFx0XHRpZiAoY2hhbmdlZCAmJiAhc3VwcHJlc3NFdmVudHMpIHtcblx0XHRcdFx0XHRTY2VuZS50cmlnZ2VyKFwic2hpZnRcIiwge1xuXHRcdFx0XHRcdFx0cmVhc29uOiBcInRyaWdnZXJFbGVtZW50UG9zaXRpb25cIlxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFRyaWdnZXIgYSBzaGlmdCBldmVudCwgd2hlbiB0aGUgY29udGFpbmVyIGlzIHJlc2l6ZWQgYW5kIHRoZSB0cmlnZ2VySG9vayBpcyA+IDEuXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgb25Db250YWluZXJSZXNpemUgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0aWYgKF9vcHRpb25zLnRyaWdnZXJIb29rID4gMCkge1xuXHRcdFx0XHRTY2VuZS50cmlnZ2VyKFwic2hpZnRcIiwge1xuXHRcdFx0XHRcdHJlYXNvbjogXCJjb250YWluZXJSZXNpemVcIlxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9O1xuXG5cblx0XHR2YXIgX3ZhbGlkYXRlID0gX3V0aWwuZXh0ZW5kKFNDRU5FX09QVElPTlMudmFsaWRhdGUsIHtcblx0XHRcdC8vIHZhbGlkYXRpb24gZm9yIGR1cmF0aW9uIGhhbmRsZWQgaW50ZXJuYWxseSBmb3IgcmVmZXJlbmNlIHRvIHByaXZhdGUgdmFyIF9kdXJhdGlvbk1ldGhvZFxuXHRcdFx0ZHVyYXRpb246IGZ1bmN0aW9uICh2YWwpIHtcblx0XHRcdFx0aWYgKF91dGlsLnR5cGUuU3RyaW5nKHZhbCkgJiYgdmFsLm1hdGNoKC9eKFxcLnxcXGQpKlxcZCslJC8pKSB7XG5cdFx0XHRcdFx0Ly8gcGVyY2VudGFnZSB2YWx1ZVxuXHRcdFx0XHRcdHZhciBwZXJjID0gcGFyc2VGbG9hdCh2YWwpIC8gMTAwO1xuXHRcdFx0XHRcdHZhbCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdHJldHVybiBfY29udHJvbGxlciA/IF9jb250cm9sbGVyLmluZm8oXCJzaXplXCIpICogcGVyYyA6IDA7XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoX3V0aWwudHlwZS5GdW5jdGlvbih2YWwpKSB7XG5cdFx0XHRcdFx0Ly8gZnVuY3Rpb25cblx0XHRcdFx0XHRfZHVyYXRpb25VcGRhdGVNZXRob2QgPSB2YWw7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdHZhbCA9IHBhcnNlRmxvYXQoX2R1cmF0aW9uVXBkYXRlTWV0aG9kKCkpO1xuXHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRcdHZhbCA9IC0xOyAvLyB3aWxsIGNhdXNlIGVycm9yIGJlbG93XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIHZhbCBoYXMgdG8gYmUgZmxvYXRcblx0XHRcdFx0dmFsID0gcGFyc2VGbG9hdCh2YWwpO1xuXHRcdFx0XHRpZiAoIV91dGlsLnR5cGUuTnVtYmVyKHZhbCkgfHwgdmFsIDwgMCkge1xuXHRcdFx0XHRcdGlmIChfZHVyYXRpb25VcGRhdGVNZXRob2QpIHtcblx0XHRcdFx0XHRcdF9kdXJhdGlvblVwZGF0ZU1ldGhvZCA9IHVuZGVmaW5lZDtcblx0XHRcdFx0XHRcdHRocm93IFtcIkludmFsaWQgcmV0dXJuIHZhbHVlIG9mIHN1cHBsaWVkIGZ1bmN0aW9uIGZvciBvcHRpb24gXFxcImR1cmF0aW9uXFxcIjpcIiwgdmFsXTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dGhyb3cgW1wiSW52YWxpZCB2YWx1ZSBmb3Igb3B0aW9uIFxcXCJkdXJhdGlvblxcXCI6XCIsIHZhbF07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB2YWw7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvKipcblx0XHQgKiBDaGVja3MgdGhlIHZhbGlkaXR5IG9mIGEgc3BlY2lmaWMgb3IgYWxsIG9wdGlvbnMgYW5kIHJlc2V0IHRvIGRlZmF1bHQgaWYgbmVjY2Vzc2FyeS5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciB2YWxpZGF0ZU9wdGlvbiA9IGZ1bmN0aW9uIChjaGVjaykge1xuXHRcdFx0Y2hlY2sgPSBhcmd1bWVudHMubGVuZ3RoID8gW2NoZWNrXSA6IE9iamVjdC5rZXlzKF92YWxpZGF0ZSk7XG5cdFx0XHRjaGVjay5mb3JFYWNoKGZ1bmN0aW9uIChvcHRpb25OYW1lLCBrZXkpIHtcblx0XHRcdFx0dmFyIHZhbHVlO1xuXHRcdFx0XHRpZiAoX3ZhbGlkYXRlW29wdGlvbk5hbWVdKSB7IC8vIHRoZXJlIGlzIGEgdmFsaWRhdGlvbiBtZXRob2QgZm9yIHRoaXMgb3B0aW9uXG5cdFx0XHRcdFx0dHJ5IHsgLy8gdmFsaWRhdGUgdmFsdWVcblx0XHRcdFx0XHRcdHZhbHVlID0gX3ZhbGlkYXRlW29wdGlvbk5hbWVdKF9vcHRpb25zW29wdGlvbk5hbWVdKTtcblx0XHRcdFx0XHR9IGNhdGNoIChlKSB7IC8vIHZhbGlkYXRpb24gZmFpbGVkIC0+IHJlc2V0IHRvIGRlZmF1bHRcblx0XHRcdFx0XHRcdHZhbHVlID0gREVGQVVMVF9PUFRJT05TW29wdGlvbk5hbWVdO1xuXHRcdFx0XHRcdFx0dmFyIGxvZ01TRyA9IF91dGlsLnR5cGUuU3RyaW5nKGUpID8gW2VdIDogZTtcblx0XHRcdFx0XHRcdGlmIChfdXRpbC50eXBlLkFycmF5KGxvZ01TRykpIHtcblx0XHRcdFx0XHRcdFx0bG9nTVNHWzBdID0gXCJFUlJPUjogXCIgKyBsb2dNU0dbMF07XG5cdFx0XHRcdFx0XHRcdGxvZ01TRy51bnNoaWZ0KDEpOyAvLyBsb2dsZXZlbCAxIGZvciBlcnJvciBtc2dcblx0XHRcdFx0XHRcdFx0bG9nLmFwcGx5KHRoaXMsIGxvZ01TRyk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRsb2coMSwgXCJFUlJPUjogUHJvYmxlbSBleGVjdXRpbmcgdmFsaWRhdGlvbiBjYWxsYmFjayBmb3Igb3B0aW9uICdcIiArIG9wdGlvbk5hbWUgKyBcIic6XCIsIGUubWVzc2FnZSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBmaW5hbGx5IHtcblx0XHRcdFx0XHRcdF9vcHRpb25zW29wdGlvbk5hbWVdID0gdmFsdWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogSGVscGVyIHVzZWQgYnkgdGhlIHNldHRlci9nZXR0ZXJzIGZvciBzY2VuZSBvcHRpb25zXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgY2hhbmdlT3B0aW9uID0gZnVuY3Rpb24gKHZhcm5hbWUsIG5ld3ZhbCkge1xuXHRcdFx0dmFyXG5cdFx0XHRjaGFuZ2VkID0gZmFsc2UsXG5cdFx0XHRcdG9sZHZhbCA9IF9vcHRpb25zW3Zhcm5hbWVdO1xuXHRcdFx0aWYgKF9vcHRpb25zW3Zhcm5hbWVdICE9IG5ld3ZhbCkge1xuXHRcdFx0XHRfb3B0aW9uc1t2YXJuYW1lXSA9IG5ld3ZhbDtcblx0XHRcdFx0dmFsaWRhdGVPcHRpb24odmFybmFtZSk7IC8vIHJlc2V0cyB0byBkZWZhdWx0IGlmIG5lY2Vzc2FyeVxuXHRcdFx0XHRjaGFuZ2VkID0gb2xkdmFsICE9IF9vcHRpb25zW3Zhcm5hbWVdO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGNoYW5nZWQ7XG5cdFx0fTtcblxuXHRcdC8vIGdlbmVyYXRlIGdldHRlcnMvc2V0dGVycyBmb3IgYWxsIG9wdGlvbnNcblx0XHR2YXIgYWRkU2NlbmVPcHRpb24gPSBmdW5jdGlvbiAob3B0aW9uTmFtZSkge1xuXHRcdFx0aWYgKCFTY2VuZVtvcHRpb25OYW1lXSkge1xuXHRcdFx0XHRTY2VuZVtvcHRpb25OYW1lXSA9IGZ1bmN0aW9uIChuZXdWYWwpIHtcblx0XHRcdFx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHsgLy8gZ2V0XG5cdFx0XHRcdFx0XHRyZXR1cm4gX29wdGlvbnNbb3B0aW9uTmFtZV07XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGlmIChvcHRpb25OYW1lID09PSBcImR1cmF0aW9uXCIpIHsgLy8gbmV3IGR1cmF0aW9uIGlzIHNldCwgc28gYW55IHByZXZpb3VzbHkgc2V0IGZ1bmN0aW9uIG11c3QgYmUgdW5zZXRcblx0XHRcdFx0XHRcdFx0X2R1cmF0aW9uVXBkYXRlTWV0aG9kID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0aWYgKGNoYW5nZU9wdGlvbihvcHRpb25OYW1lLCBuZXdWYWwpKSB7IC8vIHNldFxuXHRcdFx0XHRcdFx0XHRTY2VuZS50cmlnZ2VyKFwiY2hhbmdlXCIsIHtcblx0XHRcdFx0XHRcdFx0XHR3aGF0OiBvcHRpb25OYW1lLFxuXHRcdFx0XHRcdFx0XHRcdG5ld3ZhbDogX29wdGlvbnNbb3B0aW9uTmFtZV1cblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdGlmIChTQ0VORV9PUFRJT05TLnNoaWZ0cy5pbmRleE9mKG9wdGlvbk5hbWUpID4gLTEpIHtcblx0XHRcdFx0XHRcdFx0XHRTY2VuZS50cmlnZ2VyKFwic2hpZnRcIiwge1xuXHRcdFx0XHRcdFx0XHRcdFx0cmVhc29uOiBvcHRpb25OYW1lXG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIFNjZW5lO1xuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiAqKkdldCoqIG9yICoqU2V0KiogdGhlIGR1cmF0aW9uIG9wdGlvbiB2YWx1ZS5cblx0XHQgKiBBcyBhIHNldHRlciBpdCBhbHNvIGFjY2VwdHMgYSBmdW5jdGlvbiByZXR1cm5pbmcgYSBudW1lcmljIHZhbHVlLiAgXG5cdFx0ICogVGhpcyBpcyBwYXJ0aWN1bGFybHkgdXNlZnVsIGZvciByZXNwb25zaXZlIHNldHVwcy5cblx0XHQgKlxuXHRcdCAqIFRoZSBkdXJhdGlvbiBpcyB1cGRhdGVkIHVzaW5nIHRoZSBzdXBwbGllZCBmdW5jdGlvbiBldmVyeSB0aW1lIGBTY2VuZS5yZWZyZXNoKClgIGlzIGNhbGxlZCwgd2hpY2ggaGFwcGVucyBwZXJpb2RpY2FsbHkgZnJvbSB0aGUgY29udHJvbGxlciAoc2VlIFNjcm9sbE1hZ2ljLkNvbnRyb2xsZXIgb3B0aW9uIGByZWZyZXNoSW50ZXJ2YWxgKS4gIFxuXHRcdCAqIF8qKk5PVEU6KiogQmUgYXdhcmUgdGhhdCBpdCdzIGFuIGVhc3kgd2F5IHRvIGtpbGwgcGVyZm9ybWFuY2UsIGlmIHlvdSBzdXBwbHkgYSBmdW5jdGlvbiB0aGF0IGhhcyBoaWdoIENQVSBkZW1hbmQuICBcblx0XHQgKiBFdmVuIGZvciBzaXplIGFuZCBwb3NpdGlvbiBjYWxjdWxhdGlvbnMgaXQgaXMgcmVjb21tZW5kZWQgdG8gdXNlIGEgdmFyaWFibGUgdG8gY2FjaGUgdGhlIHZhbHVlLiAoc2VlIGV4YW1wbGUpICBcblx0XHQgKiBUaGlzIGNvdW50cyBkb3VibGUgaWYgeW91IHVzZSB0aGUgc2FtZSBmdW5jdGlvbiBmb3IgbXVsdGlwbGUgc2NlbmVzLl9cblx0XHQgKlxuXHRcdCAqIEBtZXRob2QgU2Nyb2xsTWFnaWMuU2NlbmUjZHVyYXRpb25cblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIGdldCB0aGUgY3VycmVudCBkdXJhdGlvbiB2YWx1ZVxuXHRcdCAqIHZhciBkdXJhdGlvbiA9IHNjZW5lLmR1cmF0aW9uKCk7XG5cdFx0ICpcblx0XHQgKiAvLyBzZXQgYSBuZXcgZHVyYXRpb25cblx0XHQgKiBzY2VuZS5kdXJhdGlvbigzMDApO1xuXHRcdCAqXG5cdFx0ICogLy8gdXNlIGEgZnVuY3Rpb24gdG8gYXV0b21hdGljYWxseSBhZGp1c3QgdGhlIGR1cmF0aW9uIHRvIHRoZSB3aW5kb3cgaGVpZ2h0LlxuXHRcdCAqIHZhciBkdXJhdGlvblZhbHVlQ2FjaGU7XG5cdFx0ICogZnVuY3Rpb24gZ2V0RHVyYXRpb24gKCkge1xuXHRcdCAqICAgcmV0dXJuIGR1cmF0aW9uVmFsdWVDYWNoZTtcblx0XHQgKiB9XG5cdFx0ICogZnVuY3Rpb24gdXBkYXRlRHVyYXRpb24gKGUpIHtcblx0XHQgKiAgIGR1cmF0aW9uVmFsdWVDYWNoZSA9IHdpbmRvdy5pbm5lckhlaWdodDtcblx0XHQgKiB9XG5cdFx0ICogJCh3aW5kb3cpLm9uKFwicmVzaXplXCIsIHVwZGF0ZUR1cmF0aW9uKTsgLy8gdXBkYXRlIHRoZSBkdXJhdGlvbiB3aGVuIHRoZSB3aW5kb3cgc2l6ZSBjaGFuZ2VzXG5cdFx0ICogJCh3aW5kb3cpLnRyaWdnZXJIYW5kbGVyKFwicmVzaXplXCIpOyAvLyBzZXQgdG8gaW5pdGlhbCB2YWx1ZVxuXHRcdCAqIHNjZW5lLmR1cmF0aW9uKGdldER1cmF0aW9uKTsgLy8gc3VwcGx5IGR1cmF0aW9uIG1ldGhvZFxuXHRcdCAqXG5cdFx0ICogQGZpcmVzIHtAbGluayBTY2VuZS5jaGFuZ2V9LCB3aGVuIHVzZWQgYXMgc2V0dGVyXG5cdFx0ICogQGZpcmVzIHtAbGluayBTY2VuZS5zaGlmdH0sIHdoZW4gdXNlZCBhcyBzZXR0ZXJcblx0XHQgKiBAcGFyYW0geyhudW1iZXJ8ZnVuY3Rpb24pfSBbbmV3RHVyYXRpb25dIC0gVGhlIG5ldyBkdXJhdGlvbiBvZiB0aGUgc2NlbmUuXG5cdFx0ICogQHJldHVybnMge251bWJlcn0gYGdldGAgLSAgQ3VycmVudCBzY2VuZSBkdXJhdGlvbi5cblx0XHQgKiBAcmV0dXJucyB7U2NlbmV9IGBzZXRgIC0gIFBhcmVudCBvYmplY3QgZm9yIGNoYWluaW5nLlxuXHRcdCAqL1xuXG5cdFx0LyoqXG5cdFx0ICogKipHZXQqKiBvciAqKlNldCoqIHRoZSBvZmZzZXQgb3B0aW9uIHZhbHVlLlxuXHRcdCAqIEBtZXRob2QgU2Nyb2xsTWFnaWMuU2NlbmUjb2Zmc2V0XG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiAvLyBnZXQgdGhlIGN1cnJlbnQgb2Zmc2V0XG5cdFx0ICogdmFyIG9mZnNldCA9IHNjZW5lLm9mZnNldCgpO1xuXHRcdCAqXG5cdFx0ICogLy8gc2V0IGEgbmV3IG9mZnNldFxuXHRcdCAqIHNjZW5lLm9mZnNldCgxMDApO1xuXHRcdCAqXG5cdFx0ICogQGZpcmVzIHtAbGluayBTY2VuZS5jaGFuZ2V9LCB3aGVuIHVzZWQgYXMgc2V0dGVyXG5cdFx0ICogQGZpcmVzIHtAbGluayBTY2VuZS5zaGlmdH0sIHdoZW4gdXNlZCBhcyBzZXR0ZXJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0gW25ld09mZnNldF0gLSBUaGUgbmV3IG9mZnNldCBvZiB0aGUgc2NlbmUuXG5cdFx0ICogQHJldHVybnMge251bWJlcn0gYGdldGAgLSAgQ3VycmVudCBzY2VuZSBvZmZzZXQuXG5cdFx0ICogQHJldHVybnMge1NjZW5lfSBgc2V0YCAtICBQYXJlbnQgb2JqZWN0IGZvciBjaGFpbmluZy5cblx0XHQgKi9cblxuXHRcdC8qKlxuXHRcdCAqICoqR2V0Kiogb3IgKipTZXQqKiB0aGUgdHJpZ2dlckVsZW1lbnQgb3B0aW9uIHZhbHVlLlxuXHRcdCAqIERvZXMgKipub3QqKiBmaXJlIGBTY2VuZS5zaGlmdGAsIGJlY2F1c2UgY2hhbmdpbmcgdGhlIHRyaWdnZXIgRWxlbWVudCBkb2Vzbid0IG5lY2Vzc2FyaWx5IG1lYW4gdGhlIHN0YXJ0IHBvc2l0aW9uIGNoYW5nZXMuIFRoaXMgd2lsbCBiZSBkZXRlcm1pbmVkIGluIGBTY2VuZS5yZWZyZXNoKClgLCB3aGljaCBpcyBhdXRvbWF0aWNhbGx5IHRyaWdnZXJlZC5cblx0XHQgKiBAbWV0aG9kIFNjcm9sbE1hZ2ljLlNjZW5lI3RyaWdnZXJFbGVtZW50XG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiAvLyBnZXQgdGhlIGN1cnJlbnQgdHJpZ2dlckVsZW1lbnRcblx0XHQgKiB2YXIgdHJpZ2dlckVsZW1lbnQgPSBzY2VuZS50cmlnZ2VyRWxlbWVudCgpO1xuXHRcdCAqXG5cdFx0ICogLy8gc2V0IGEgbmV3IHRyaWdnZXJFbGVtZW50IHVzaW5nIGEgc2VsZWN0b3Jcblx0XHQgKiBzY2VuZS50cmlnZ2VyRWxlbWVudChcIiN0cmlnZ2VyXCIpO1xuXHRcdCAqIC8vIHNldCBhIG5ldyB0cmlnZ2VyRWxlbWVudCB1c2luZyBhIERPTSBvYmplY3Rcblx0XHQgKiBzY2VuZS50cmlnZ2VyRWxlbWVudChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRyaWdnZXJcIikpO1xuXHRcdCAqXG5cdFx0ICogQGZpcmVzIHtAbGluayBTY2VuZS5jaGFuZ2V9LCB3aGVuIHVzZWQgYXMgc2V0dGVyXG5cdFx0ICogQHBhcmFtIHsoc3RyaW5nfG9iamVjdCl9IFtuZXdUcmlnZ2VyRWxlbWVudF0gLSBUaGUgbmV3IHRyaWdnZXIgZWxlbWVudCBmb3IgdGhlIHNjZW5lLlxuXHRcdCAqIEByZXR1cm5zIHsoc3RyaW5nfG9iamVjdCl9IGBnZXRgIC0gIEN1cnJlbnQgdHJpZ2dlckVsZW1lbnQuXG5cdFx0ICogQHJldHVybnMge1NjZW5lfSBgc2V0YCAtICBQYXJlbnQgb2JqZWN0IGZvciBjaGFpbmluZy5cblx0XHQgKi9cblxuXHRcdC8qKlxuXHRcdCAqICoqR2V0Kiogb3IgKipTZXQqKiB0aGUgdHJpZ2dlckhvb2sgb3B0aW9uIHZhbHVlLlxuXHRcdCAqIEBtZXRob2QgU2Nyb2xsTWFnaWMuU2NlbmUjdHJpZ2dlckhvb2tcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIGdldCB0aGUgY3VycmVudCB0cmlnZ2VySG9vayB2YWx1ZVxuXHRcdCAqIHZhciB0cmlnZ2VySG9vayA9IHNjZW5lLnRyaWdnZXJIb29rKCk7XG5cdFx0ICpcblx0XHQgKiAvLyBzZXQgYSBuZXcgdHJpZ2dlckhvb2sgdXNpbmcgYSBzdHJpbmdcblx0XHQgKiBzY2VuZS50cmlnZ2VySG9vayhcIm9uTGVhdmVcIik7XG5cdFx0ICogLy8gc2V0IGEgbmV3IHRyaWdnZXJIb29rIHVzaW5nIGEgbnVtYmVyXG5cdFx0ICogc2NlbmUudHJpZ2dlckhvb2soMC43KTtcblx0XHQgKlxuXHRcdCAqIEBmaXJlcyB7QGxpbmsgU2NlbmUuY2hhbmdlfSwgd2hlbiB1c2VkIGFzIHNldHRlclxuXHRcdCAqIEBmaXJlcyB7QGxpbmsgU2NlbmUuc2hpZnR9LCB3aGVuIHVzZWQgYXMgc2V0dGVyXG5cdFx0ICogQHBhcmFtIHsobnVtYmVyfHN0cmluZyl9IFtuZXdUcmlnZ2VySG9va10gLSBUaGUgbmV3IHRyaWdnZXJIb29rIG9mIHRoZSBzY2VuZS4gU2VlIHtAbGluayBTY2VuZX0gcGFyYW1ldGVyIGRlc2NyaXB0aW9uIGZvciB2YWx1ZSBvcHRpb25zLlxuXHRcdCAqIEByZXR1cm5zIHtudW1iZXJ9IGBnZXRgIC0gIEN1cnJlbnQgdHJpZ2dlckhvb2sgKEFMV0FZUyBudW1lcmljYWwpLlxuXHRcdCAqIEByZXR1cm5zIHtTY2VuZX0gYHNldGAgLSAgUGFyZW50IG9iamVjdCBmb3IgY2hhaW5pbmcuXG5cdFx0ICovXG5cblx0XHQvKipcblx0XHQgKiAqKkdldCoqIG9yICoqU2V0KiogdGhlIHJldmVyc2Ugb3B0aW9uIHZhbHVlLlxuXHRcdCAqIEBtZXRob2QgU2Nyb2xsTWFnaWMuU2NlbmUjcmV2ZXJzZVxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogLy8gZ2V0IHRoZSBjdXJyZW50IHJldmVyc2Ugb3B0aW9uXG5cdFx0ICogdmFyIHJldmVyc2UgPSBzY2VuZS5yZXZlcnNlKCk7XG5cdFx0ICpcblx0XHQgKiAvLyBzZXQgbmV3IHJldmVyc2Ugb3B0aW9uXG5cdFx0ICogc2NlbmUucmV2ZXJzZShmYWxzZSk7XG5cdFx0ICpcblx0XHQgKiBAZmlyZXMge0BsaW5rIFNjZW5lLmNoYW5nZX0sIHdoZW4gdXNlZCBhcyBzZXR0ZXJcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IFtuZXdSZXZlcnNlXSAtIFRoZSBuZXcgcmV2ZXJzZSBzZXR0aW5nIG9mIHRoZSBzY2VuZS5cblx0XHQgKiBAcmV0dXJucyB7Ym9vbGVhbn0gYGdldGAgLSAgQ3VycmVudCByZXZlcnNlIG9wdGlvbiB2YWx1ZS5cblx0XHQgKiBAcmV0dXJucyB7U2NlbmV9IGBzZXRgIC0gIFBhcmVudCBvYmplY3QgZm9yIGNoYWluaW5nLlxuXHRcdCAqL1xuXG5cdFx0LyoqXG5cdFx0ICogKipHZXQqKiBvciAqKlNldCoqIHRoZSBsb2dsZXZlbCBvcHRpb24gdmFsdWUuXG5cdFx0ICogQG1ldGhvZCBTY3JvbGxNYWdpYy5TY2VuZSNsb2dsZXZlbFxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogLy8gZ2V0IHRoZSBjdXJyZW50IGxvZ2xldmVsXG5cdFx0ICogdmFyIGxvZ2xldmVsID0gc2NlbmUubG9nbGV2ZWwoKTtcblx0XHQgKlxuXHRcdCAqIC8vIHNldCBuZXcgbG9nbGV2ZWxcblx0XHQgKiBzY2VuZS5sb2dsZXZlbCgzKTtcblx0XHQgKlxuXHRcdCAqIEBmaXJlcyB7QGxpbmsgU2NlbmUuY2hhbmdlfSwgd2hlbiB1c2VkIGFzIHNldHRlclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSBbbmV3TG9nbGV2ZWxdIC0gVGhlIG5ldyBsb2dsZXZlbCBzZXR0aW5nIG9mIHRoZSBzY2VuZS4gYFswLTNdYFxuXHRcdCAqIEByZXR1cm5zIHtudW1iZXJ9IGBnZXRgIC0gIEN1cnJlbnQgbG9nbGV2ZWwuXG5cdFx0ICogQHJldHVybnMge1NjZW5lfSBgc2V0YCAtICBQYXJlbnQgb2JqZWN0IGZvciBjaGFpbmluZy5cblx0XHQgKi9cblxuXHRcdC8qKlxuXHRcdCAqICoqR2V0KiogdGhlIGFzc29jaWF0ZWQgY29udHJvbGxlci5cblx0XHQgKiBAbWV0aG9kIFNjcm9sbE1hZ2ljLlNjZW5lI2NvbnRyb2xsZXJcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIGdldCB0aGUgY29udHJvbGxlciBvZiBhIHNjZW5lXG5cdFx0ICogdmFyIGNvbnRyb2xsZXIgPSBzY2VuZS5jb250cm9sbGVyKCk7XG5cdFx0ICpcblx0XHQgKiBAcmV0dXJucyB7U2Nyb2xsTWFnaWMuQ29udHJvbGxlcn0gUGFyZW50IGNvbnRyb2xsZXIgb3IgYHVuZGVmaW5lZGBcblx0XHQgKi9cblx0XHR0aGlzLmNvbnRyb2xsZXIgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gX2NvbnRyb2xsZXI7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqICoqR2V0KiogdGhlIGN1cnJlbnQgc3RhdGUuXG5cdFx0ICogQG1ldGhvZCBTY3JvbGxNYWdpYy5TY2VuZSNzdGF0ZVxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogLy8gZ2V0IHRoZSBjdXJyZW50IHN0YXRlXG5cdFx0ICogdmFyIHN0YXRlID0gc2NlbmUuc3RhdGUoKTtcblx0XHQgKlxuXHRcdCAqIEByZXR1cm5zIHtzdHJpbmd9IGBcIkJFRk9SRVwiYCwgYFwiRFVSSU5HXCJgIG9yIGBcIkFGVEVSXCJgXG5cdFx0ICovXG5cdFx0dGhpcy5zdGF0ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBfc3RhdGU7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqICoqR2V0KiogdGhlIGN1cnJlbnQgc2Nyb2xsIG9mZnNldCBmb3IgdGhlIHN0YXJ0IG9mIHRoZSBzY2VuZS4gIFxuXHRcdCAqIE1pbmQsIHRoYXQgdGhlIHNjcm9sbE9mZnNldCBpcyByZWxhdGVkIHRvIHRoZSBzaXplIG9mIHRoZSBjb250YWluZXIsIGlmIGB0cmlnZ2VySG9va2AgaXMgYmlnZ2VyIHRoYW4gYDBgIChvciBgXCJvbkxlYXZlXCJgKS4gIFxuXHRcdCAqIFRoaXMgbWVhbnMsIHRoYXQgcmVzaXppbmcgdGhlIGNvbnRhaW5lciBvciBjaGFuZ2luZyB0aGUgYHRyaWdnZXJIb29rYCB3aWxsIGluZmx1ZW5jZSB0aGUgc2NlbmUncyBzdGFydCBvZmZzZXQuXG5cdFx0ICogQG1ldGhvZCBTY3JvbGxNYWdpYy5TY2VuZSNzY3JvbGxPZmZzZXRcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIGdldCB0aGUgY3VycmVudCBzY3JvbGwgb2Zmc2V0IGZvciB0aGUgc3RhcnQgYW5kIGVuZCBvZiB0aGUgc2NlbmUuXG5cdFx0ICogdmFyIHN0YXJ0ID0gc2NlbmUuc2Nyb2xsT2Zmc2V0KCk7XG5cdFx0ICogdmFyIGVuZCA9IHNjZW5lLnNjcm9sbE9mZnNldCgpICsgc2NlbmUuZHVyYXRpb24oKTtcblx0XHQgKiBjb25zb2xlLmxvZyhcInRoZSBzY2VuZSBzdGFydHMgYXRcIiwgc3RhcnQsIFwiYW5kIGVuZHMgYXRcIiwgZW5kKTtcblx0XHQgKlxuXHRcdCAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSBzY3JvbGwgb2Zmc2V0IChvZiB0aGUgY29udGFpbmVyKSBhdCB3aGljaCB0aGUgc2NlbmUgd2lsbCB0cmlnZ2VyLiBZIHZhbHVlIGZvciB2ZXJ0aWNhbCBhbmQgWCB2YWx1ZSBmb3IgaG9yaXpvbnRhbCBzY3JvbGxzLlxuXHRcdCAqL1xuXHRcdHRoaXMuc2Nyb2xsT2Zmc2V0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIF9zY3JvbGxPZmZzZXQuc3RhcnQ7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqICoqR2V0KiogdGhlIHRyaWdnZXIgcG9zaXRpb24gb2YgdGhlIHNjZW5lIChpbmNsdWRpbmcgdGhlIHZhbHVlIG9mIHRoZSBgb2Zmc2V0YCBvcHRpb24pLiAgXG5cdFx0ICogQG1ldGhvZCBTY3JvbGxNYWdpYy5TY2VuZSN0cmlnZ2VyUG9zaXRpb25cblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIGdldCB0aGUgc2NlbmUncyB0cmlnZ2VyIHBvc2l0aW9uXG5cdFx0ICogdmFyIHRyaWdnZXJQb3NpdGlvbiA9IHNjZW5lLnRyaWdnZXJQb3NpdGlvbigpO1xuXHRcdCAqXG5cdFx0ICogQHJldHVybnMge251bWJlcn0gU3RhcnQgcG9zaXRpb24gb2YgdGhlIHNjZW5lLiBUb3AgcG9zaXRpb24gdmFsdWUgZm9yIHZlcnRpY2FsIGFuZCBsZWZ0IHBvc2l0aW9uIHZhbHVlIGZvciBob3Jpem9udGFsIHNjcm9sbHMuXG5cdFx0ICovXG5cdFx0dGhpcy50cmlnZ2VyUG9zaXRpb24gPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgcG9zID0gX29wdGlvbnMub2Zmc2V0OyAvLyB0aGUgb2Zmc2V0IGlzIHRoZSBiYXNpc1xuXHRcdFx0aWYgKF9jb250cm9sbGVyKSB7XG5cdFx0XHRcdC8vIGdldCB0aGUgdHJpZ2dlciBwb3NpdGlvblxuXHRcdFx0XHRpZiAoX29wdGlvbnMudHJpZ2dlckVsZW1lbnQpIHtcblx0XHRcdFx0XHQvLyBFbGVtZW50IGFzIHRyaWdnZXJcblx0XHRcdFx0XHRwb3MgKz0gX3RyaWdnZXJQb3M7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gcmV0dXJuIHRoZSBoZWlnaHQgb2YgdGhlIHRyaWdnZXJIb29rIHRvIHN0YXJ0IGF0IHRoZSBiZWdpbm5pbmdcblx0XHRcdFx0XHRwb3MgKz0gX2NvbnRyb2xsZXIuaW5mbyhcInNpemVcIikgKiBTY2VuZS50cmlnZ2VySG9vaygpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcG9zO1xuXHRcdH07XG5cblx0XHR2YXJcblx0XHRfcGluLCBfcGluT3B0aW9ucztcblxuXHRcdFNjZW5lLm9uKFwic2hpZnQuaW50ZXJuYWxcIiwgZnVuY3Rpb24gKGUpIHtcblx0XHRcdHZhciBkdXJhdGlvbkNoYW5nZWQgPSBlLnJlYXNvbiA9PT0gXCJkdXJhdGlvblwiO1xuXHRcdFx0aWYgKChfc3RhdGUgPT09IFNDRU5FX1NUQVRFX0FGVEVSICYmIGR1cmF0aW9uQ2hhbmdlZCkgfHwgKF9zdGF0ZSA9PT0gU0NFTkVfU1RBVEVfRFVSSU5HICYmIF9vcHRpb25zLmR1cmF0aW9uID09PSAwKSkge1xuXHRcdFx0XHQvLyBpZiBbZHVyYXRpb24gY2hhbmdlZCBhZnRlciBhIHNjZW5lIChpbnNpZGUgc2NlbmUgcHJvZ3Jlc3MgdXBkYXRlcyBwaW4gcG9zaXRpb24pXSBvciBbZHVyYXRpb24gaXMgMCwgd2UgYXJlIGluIHBpbiBwaGFzZSBhbmQgc29tZSBvdGhlciB2YWx1ZSBjaGFuZ2VkXS5cblx0XHRcdFx0dXBkYXRlUGluU3RhdGUoKTtcblx0XHRcdH1cblx0XHRcdGlmIChkdXJhdGlvbkNoYW5nZWQpIHtcblx0XHRcdFx0dXBkYXRlUGluRGltZW5zaW9ucygpO1xuXHRcdFx0fVxuXHRcdH0pLm9uKFwicHJvZ3Jlc3MuaW50ZXJuYWxcIiwgZnVuY3Rpb24gKGUpIHtcblx0XHRcdHVwZGF0ZVBpblN0YXRlKCk7XG5cdFx0fSkub24oXCJhZGQuaW50ZXJuYWxcIiwgZnVuY3Rpb24gKGUpIHtcblx0XHRcdHVwZGF0ZVBpbkRpbWVuc2lvbnMoKTtcblx0XHR9KS5vbihcImRlc3Ryb3kuaW50ZXJuYWxcIiwgZnVuY3Rpb24gKGUpIHtcblx0XHRcdFNjZW5lLnJlbW92ZVBpbihlLnJlc2V0KTtcblx0XHR9KTtcblx0XHQvKipcblx0XHQgKiBVcGRhdGUgdGhlIHBpbiBzdGF0ZS5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciB1cGRhdGVQaW5TdGF0ZSA9IGZ1bmN0aW9uIChmb3JjZVVucGluKSB7XG5cdFx0XHRpZiAoX3BpbiAmJiBfY29udHJvbGxlcikge1xuXHRcdFx0XHR2YXJcblx0XHRcdFx0Y29udGFpbmVySW5mbyA9IF9jb250cm9sbGVyLmluZm8oKSxcblx0XHRcdFx0XHRwaW5UYXJnZXQgPSBfcGluT3B0aW9ucy5zcGFjZXIuZmlyc3RDaGlsZDsgLy8gbWF5IGJlIHBpbiBlbGVtZW50IG9yIGFub3RoZXIgc3BhY2VyLCBpZiBjYXNjYWRpbmcgcGluc1xuXHRcdFx0XHRpZiAoIWZvcmNlVW5waW4gJiYgX3N0YXRlID09PSBTQ0VORV9TVEFURV9EVVJJTkcpIHsgLy8gZHVyaW5nIHNjZW5lIG9yIGlmIGR1cmF0aW9uIGlzIDAgYW5kIHdlIGFyZSBwYXN0IHRoZSB0cmlnZ2VyXG5cdFx0XHRcdFx0Ly8gcGlubmVkIHN0YXRlXG5cdFx0XHRcdFx0aWYgKF91dGlsLmNzcyhwaW5UYXJnZXQsIFwicG9zaXRpb25cIikgIT0gXCJmaXhlZFwiKSB7XG5cdFx0XHRcdFx0XHQvLyBjaGFuZ2Ugc3RhdGUgYmVmb3JlIHVwZGF0aW5nIHBpbiBzcGFjZXIgKHBvc2l0aW9uIGNoYW5nZXMgZHVlIHRvIGZpeGVkIGNvbGxhcHNpbmcgbWlnaHQgb2NjdXIuKVxuXHRcdFx0XHRcdFx0X3V0aWwuY3NzKHBpblRhcmdldCwge1xuXHRcdFx0XHRcdFx0XHRcInBvc2l0aW9uXCI6IFwiZml4ZWRcIlxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHQvLyB1cGRhdGUgcGluIHNwYWNlclxuXHRcdFx0XHRcdFx0dXBkYXRlUGluRGltZW5zaW9ucygpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHZhclxuXHRcdFx0XHRcdGZpeGVkUG9zID0gX3V0aWwuZ2V0Lm9mZnNldChfcGluT3B0aW9ucy5zcGFjZXIsIHRydWUpLFxuXHRcdFx0XHRcdFx0Ly8gZ2V0IHZpZXdwb3J0IHBvc2l0aW9uIG9mIHNwYWNlclxuXHRcdFx0XHRcdFx0c2Nyb2xsRGlzdGFuY2UgPSBfb3B0aW9ucy5yZXZlcnNlIHx8IF9vcHRpb25zLmR1cmF0aW9uID09PSAwID8gY29udGFpbmVySW5mby5zY3JvbGxQb3MgLSBfc2Nyb2xsT2Zmc2V0LnN0YXJ0IC8vIHF1aWNrZXJcblx0XHRcdFx0XHRcdDogTWF0aC5yb3VuZChfcHJvZ3Jlc3MgKiBfb3B0aW9ucy5kdXJhdGlvbiAqIDEwKSAvIDEwOyAvLyBpZiBubyByZXZlcnNlIGFuZCBkdXJpbmcgcGluIHRoZSBwb3NpdGlvbiBuZWVkcyB0byBiZSByZWNhbGN1bGF0ZWQgdXNpbmcgdGhlIHByb2dyZXNzXG5cdFx0XHRcdFx0Ly8gYWRkIHNjcm9sbERpc3RhbmNlXG5cdFx0XHRcdFx0Zml4ZWRQb3NbY29udGFpbmVySW5mby52ZXJ0aWNhbCA/IFwidG9wXCIgOiBcImxlZnRcIl0gKz0gc2Nyb2xsRGlzdGFuY2U7XG5cblx0XHRcdFx0XHQvLyBzZXQgbmV3IHZhbHVlc1xuXHRcdFx0XHRcdF91dGlsLmNzcyhfcGluT3B0aW9ucy5zcGFjZXIuZmlyc3RDaGlsZCwge1xuXHRcdFx0XHRcdFx0dG9wOiBmaXhlZFBvcy50b3AsXG5cdFx0XHRcdFx0XHRsZWZ0OiBmaXhlZFBvcy5sZWZ0XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gdW5waW5uZWQgc3RhdGVcblx0XHRcdFx0XHR2YXJcblx0XHRcdFx0XHRuZXdDU1MgPSB7XG5cdFx0XHRcdFx0XHRwb3NpdGlvbjogX3Bpbk9wdGlvbnMuaW5GbG93ID8gXCJyZWxhdGl2ZVwiIDogXCJhYnNvbHV0ZVwiLFxuXHRcdFx0XHRcdFx0dG9wOiAwLFxuXHRcdFx0XHRcdFx0bGVmdDogMFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRjaGFuZ2UgPSBfdXRpbC5jc3MocGluVGFyZ2V0LCBcInBvc2l0aW9uXCIpICE9IG5ld0NTUy5wb3NpdGlvbjtcblxuXHRcdFx0XHRcdGlmICghX3Bpbk9wdGlvbnMucHVzaEZvbGxvd2Vycykge1xuXHRcdFx0XHRcdFx0bmV3Q1NTW2NvbnRhaW5lckluZm8udmVydGljYWwgPyBcInRvcFwiIDogXCJsZWZ0XCJdID0gX29wdGlvbnMuZHVyYXRpb24gKiBfcHJvZ3Jlc3M7XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChfb3B0aW9ucy5kdXJhdGlvbiA+IDApIHsgLy8gb25seSBjb25jZXJucyBzY2VuZXMgd2l0aCBkdXJhdGlvblxuXHRcdFx0XHRcdFx0aWYgKF9zdGF0ZSA9PT0gU0NFTkVfU1RBVEVfQUZURVIgJiYgcGFyc2VGbG9hdChfdXRpbC5jc3MoX3Bpbk9wdGlvbnMuc3BhY2VyLCBcInBhZGRpbmctdG9wXCIpKSA9PT0gMCkge1xuXHRcdFx0XHRcdFx0XHRjaGFuZ2UgPSB0cnVlOyAvLyBpZiBpbiBhZnRlciBzdGF0ZSBidXQgaGF2ZW50IHVwZGF0ZWQgc3BhY2VyIHlldCAoanVtcGVkIHBhc3QgcGluKVxuXHRcdFx0XHRcdFx0fSBlbHNlIGlmIChfc3RhdGUgPT09IFNDRU5FX1NUQVRFX0JFRk9SRSAmJiBwYXJzZUZsb2F0KF91dGlsLmNzcyhfcGluT3B0aW9ucy5zcGFjZXIsIFwicGFkZGluZy1ib3R0b21cIikpID09PSAwKSB7IC8vIGJlZm9yZVxuXHRcdFx0XHRcdFx0XHRjaGFuZ2UgPSB0cnVlOyAvLyBqdW1wZWQgcGFzdCBmaXhlZCBzdGF0ZSB1cHdhcmQgZGlyZWN0aW9uXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIHNldCBuZXcgdmFsdWVzXG5cdFx0XHRcdFx0X3V0aWwuY3NzKHBpblRhcmdldCwgbmV3Q1NTKTtcblx0XHRcdFx0XHRpZiAoY2hhbmdlKSB7XG5cdFx0XHRcdFx0XHQvLyB1cGRhdGUgcGluIHNwYWNlciBpZiBzdGF0ZSBjaGFuZ2VkXG5cdFx0XHRcdFx0XHR1cGRhdGVQaW5EaW1lbnNpb25zKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFVwZGF0ZSB0aGUgcGluIHNwYWNlciBhbmQvb3IgZWxlbWVudCBzaXplLlxuXHRcdCAqIFRoZSBzaXplIG9mIHRoZSBzcGFjZXIgbmVlZHMgdG8gYmUgdXBkYXRlZCB3aGVuZXZlciB0aGUgZHVyYXRpb24gb2YgdGhlIHNjZW5lIGNoYW5nZXMsIGlmIGl0IGlzIHRvIHB1c2ggZG93biBmb2xsb3dpbmcgZWxlbWVudHMuXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgdXBkYXRlUGluRGltZW5zaW9ucyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChfcGluICYmIF9jb250cm9sbGVyICYmIF9waW5PcHRpb25zLmluRmxvdykgeyAvLyBubyBzcGFjZXJyZXNpemUsIGlmIG9yaWdpbmFsIHBvc2l0aW9uIGlzIGFic29sdXRlXG5cdFx0XHRcdHZhclxuXHRcdFx0XHRhZnRlciA9IChfc3RhdGUgPT09IFNDRU5FX1NUQVRFX0FGVEVSKSxcblx0XHRcdFx0XHRiZWZvcmUgPSAoX3N0YXRlID09PSBTQ0VORV9TVEFURV9CRUZPUkUpLFxuXHRcdFx0XHRcdGR1cmluZyA9IChfc3RhdGUgPT09IFNDRU5FX1NUQVRFX0RVUklORyksXG5cdFx0XHRcdFx0dmVydGljYWwgPSBfY29udHJvbGxlci5pbmZvKFwidmVydGljYWxcIiksXG5cdFx0XHRcdFx0cGluVGFyZ2V0ID0gX3Bpbk9wdGlvbnMuc3BhY2VyLmZpcnN0Q2hpbGQsXG5cdFx0XHRcdFx0Ly8gdXN1YWxseSB0aGUgcGluZWQgZWxlbWVudCBidXQgY2FuIGFsc28gYmUgYW5vdGhlciBzcGFjZXIgKGNhc2NhZGVkIHBpbnMpXG5cdFx0XHRcdFx0bWFyZ2luQ29sbGFwc2UgPSBfdXRpbC5pc01hcmdpbkNvbGxhcHNlVHlwZShfdXRpbC5jc3MoX3Bpbk9wdGlvbnMuc3BhY2VyLCBcImRpc3BsYXlcIikpLFxuXHRcdFx0XHRcdGNzcyA9IHt9O1xuXG5cdFx0XHRcdC8vIHNldCBuZXcgc2l6ZVxuXHRcdFx0XHQvLyBpZiByZWxzaXplOiBzcGFjZXIgLT4gcGluIHwgZWxzZTogcGluIC0+IHNwYWNlclxuXHRcdFx0XHRpZiAoX3Bpbk9wdGlvbnMucmVsU2l6ZS53aWR0aCB8fCBfcGluT3B0aW9ucy5yZWxTaXplLmF1dG9GdWxsV2lkdGgpIHtcblx0XHRcdFx0XHRpZiAoZHVyaW5nKSB7XG5cdFx0XHRcdFx0XHRfdXRpbC5jc3MoX3Bpbiwge1xuXHRcdFx0XHRcdFx0XHRcIndpZHRoXCI6IF91dGlsLmdldC53aWR0aChfcGluT3B0aW9ucy5zcGFjZXIpXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0X3V0aWwuY3NzKF9waW4sIHtcblx0XHRcdFx0XHRcdFx0XCJ3aWR0aFwiOiBcIjEwMCVcIlxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIG1pbndpZHRoIGlzIG5lZWRlZCBmb3IgY2FzY2FkZWQgcGlucy5cblx0XHRcdFx0XHRjc3NbXCJtaW4td2lkdGhcIl0gPSBfdXRpbC5nZXQud2lkdGgodmVydGljYWwgPyBfcGluIDogcGluVGFyZ2V0LCB0cnVlLCB0cnVlKTtcblx0XHRcdFx0XHRjc3Mud2lkdGggPSBkdXJpbmcgPyBjc3NbXCJtaW4td2lkdGhcIl0gOiBcImF1dG9cIjtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoX3Bpbk9wdGlvbnMucmVsU2l6ZS5oZWlnaHQpIHtcblx0XHRcdFx0XHRpZiAoZHVyaW5nKSB7XG5cdFx0XHRcdFx0XHQvLyB0aGUgb25seSBwYWRkaW5nIHRoZSBzcGFjZXIgc2hvdWxkIGV2ZXIgaW5jbHVkZSBpcyB0aGUgZHVyYXRpb24gKGlmIHB1c2hGb2xsb3dlcnMgPSB0cnVlKSwgc28gd2UgbmVlZCB0byBzdWJzdHJhY3QgdGhhdC5cblx0XHRcdFx0XHRcdF91dGlsLmNzcyhfcGluLCB7XG5cdFx0XHRcdFx0XHRcdFwiaGVpZ2h0XCI6IF91dGlsLmdldC5oZWlnaHQoX3Bpbk9wdGlvbnMuc3BhY2VyKSAtIChfcGluT3B0aW9ucy5wdXNoRm9sbG93ZXJzID8gX29wdGlvbnMuZHVyYXRpb24gOiAwKVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdF91dGlsLmNzcyhfcGluLCB7XG5cdFx0XHRcdFx0XHRcdFwiaGVpZ2h0XCI6IFwiMTAwJVwiXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gbWFyZ2luIGlzIG9ubHkgaW5jbHVkZWQgaWYgaXQncyBhIGNhc2NhZGVkIHBpbiB0byByZXNvbHZlIGFuIElFOSBidWdcblx0XHRcdFx0XHRjc3NbXCJtaW4taGVpZ2h0XCJdID0gX3V0aWwuZ2V0LmhlaWdodCh2ZXJ0aWNhbCA/IHBpblRhcmdldCA6IF9waW4sIHRydWUsICFtYXJnaW5Db2xsYXBzZSk7IC8vIG5lZWRlZCBmb3IgY2FzY2FkaW5nIHBpbnNcblx0XHRcdFx0XHRjc3MuaGVpZ2h0ID0gZHVyaW5nID8gY3NzW1wibWluLWhlaWdodFwiXSA6IFwiYXV0b1wiO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gYWRkIHNwYWNlIGZvciBkdXJhdGlvbiBpZiBwdXNoRm9sbG93ZXJzIGlzIHRydWVcblx0XHRcdFx0aWYgKF9waW5PcHRpb25zLnB1c2hGb2xsb3dlcnMpIHtcblx0XHRcdFx0XHRjc3NbXCJwYWRkaW5nXCIgKyAodmVydGljYWwgPyBcIlRvcFwiIDogXCJMZWZ0XCIpXSA9IF9vcHRpb25zLmR1cmF0aW9uICogX3Byb2dyZXNzO1xuXHRcdFx0XHRcdGNzc1tcInBhZGRpbmdcIiArICh2ZXJ0aWNhbCA/IFwiQm90dG9tXCIgOiBcIlJpZ2h0XCIpXSA9IF9vcHRpb25zLmR1cmF0aW9uICogKDEgLSBfcHJvZ3Jlc3MpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdF91dGlsLmNzcyhfcGluT3B0aW9ucy5zcGFjZXIsIGNzcyk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFVwZGF0ZXMgdGhlIFBpbiBzdGF0ZSAoaW4gY2VydGFpbiBzY2VuYXJpb3MpXG5cdFx0ICogSWYgdGhlIGNvbnRyb2xsZXIgY29udGFpbmVyIGlzIG5vdCB0aGUgZG9jdW1lbnQgYW5kIHdlIGFyZSBtaWQtcGluLXBoYXNlIHNjcm9sbGluZyBvciByZXNpemluZyB0aGUgbWFpbiBkb2N1bWVudCBjYW4gcmVzdWx0IHRvIHdyb25nIHBpbiBwb3NpdGlvbnMuXG5cdFx0ICogU28gdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgb24gcmVzaXplIGFuZCBzY3JvbGwgb2YgdGhlIGRvY3VtZW50LlxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dmFyIHVwZGF0ZVBpbkluQ29udGFpbmVyID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKF9jb250cm9sbGVyICYmIF9waW4gJiYgX3N0YXRlID09PSBTQ0VORV9TVEFURV9EVVJJTkcgJiYgIV9jb250cm9sbGVyLmluZm8oXCJpc0RvY3VtZW50XCIpKSB7XG5cdFx0XHRcdHVwZGF0ZVBpblN0YXRlKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFVwZGF0ZXMgdGhlIFBpbiBzcGFjZXIgc2l6ZSBzdGF0ZSAoaW4gY2VydGFpbiBzY2VuYXJpb3MpXG5cdFx0ICogSWYgY29udGFpbmVyIGlzIHJlc2l6ZWQgZHVyaW5nIHBpbiBhbmQgcmVsYXRpdmVseSBzaXplZCB0aGUgc2l6ZSBvZiB0aGUgcGluIG1pZ2h0IG5lZWQgdG8gYmUgdXBkYXRlZC4uLlxuXHRcdCAqIFNvIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIG9uIHJlc2l6ZSBvZiB0aGUgY29udGFpbmVyLlxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dmFyIHVwZGF0ZVJlbGF0aXZlUGluU3BhY2VyID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKF9jb250cm9sbGVyICYmIF9waW4gJiYgLy8gd2VsbCwgZHVoXG5cdFx0XHRfc3RhdGUgPT09IFNDRU5FX1NUQVRFX0RVUklORyAmJiAvLyBlbGVtZW50IGluIHBpbm5lZCBzdGF0ZT9cblx0XHRcdCggLy8gaXMgd2lkdGggb3IgaGVpZ2h0IHJlbGF0aXZlbHkgc2l6ZWQsIGJ1dCBub3QgaW4gcmVsYXRpb24gdG8gYm9keT8gdGhlbiB3ZSBuZWVkIHRvIHJlY2FsYy5cblx0XHRcdCgoX3Bpbk9wdGlvbnMucmVsU2l6ZS53aWR0aCB8fCBfcGluT3B0aW9ucy5yZWxTaXplLmF1dG9GdWxsV2lkdGgpICYmIF91dGlsLmdldC53aWR0aCh3aW5kb3cpICE9IF91dGlsLmdldC53aWR0aChfcGluT3B0aW9ucy5zcGFjZXIucGFyZW50Tm9kZSkpIHx8IChfcGluT3B0aW9ucy5yZWxTaXplLmhlaWdodCAmJiBfdXRpbC5nZXQuaGVpZ2h0KHdpbmRvdykgIT0gX3V0aWwuZ2V0LmhlaWdodChfcGluT3B0aW9ucy5zcGFjZXIucGFyZW50Tm9kZSkpKSkge1xuXHRcdFx0XHR1cGRhdGVQaW5EaW1lbnNpb25zKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIElzIGNhbGxlZCwgd2hlbiB0aGUgbW91c2V3aGVsIGlzIHVzZWQgd2hpbGUgb3ZlciBhIHBpbm5lZCBlbGVtZW50IGluc2lkZSBhIGRpdiBjb250YWluZXIuXG5cdFx0ICogSWYgdGhlIHNjZW5lIGlzIGluIGZpeGVkIHN0YXRlIHNjcm9sbCBldmVudHMgd291bGQgYmUgY291bnRlZCB0b3dhcmRzIHRoZSBib2R5LiBUaGlzIGZvcndhcmRzIHRoZSBldmVudCB0byB0aGUgc2Nyb2xsIGNvbnRhaW5lci5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBvbk1vdXNld2hlZWxPdmVyUGluID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdGlmIChfY29udHJvbGxlciAmJiBfcGluICYmIF9zdGF0ZSA9PT0gU0NFTkVfU1RBVEVfRFVSSU5HICYmICFfY29udHJvbGxlci5pbmZvKFwiaXNEb2N1bWVudFwiKSkgeyAvLyBpbiBwaW4gc3RhdGVcblx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRfY29udHJvbGxlci5fc2V0U2Nyb2xsUG9zKF9jb250cm9sbGVyLmluZm8oXCJzY3JvbGxQb3NcIikgLSAoKGUud2hlZWxEZWx0YSB8fCBlW19jb250cm9sbGVyLmluZm8oXCJ2ZXJ0aWNhbFwiKSA/IFwid2hlZWxEZWx0YVlcIiA6IFwid2hlZWxEZWx0YVhcIl0pIC8gMyB8fCAtZS5kZXRhaWwgKiAzMCkpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBQaW4gYW4gZWxlbWVudCBmb3IgdGhlIGR1cmF0aW9uIG9mIHRoZSB0d2Vlbi4gIFxuXHRcdCAqIElmIHRoZSBzY2VuZSBkdXJhdGlvbiBpcyAwIHRoZSBlbGVtZW50IHdpbGwgb25seSBiZSB1bnBpbm5lZCwgaWYgdGhlIHVzZXIgc2Nyb2xscyBiYWNrIHBhc3QgdGhlIHN0YXJ0IHBvc2l0aW9uLiAgXG5cdFx0ICogTWFrZSBzdXJlIG9ubHkgb25lIHBpbiBpcyBhcHBsaWVkIHRvIGFuIGVsZW1lbnQgYXQgdGhlIHNhbWUgdGltZS5cblx0XHQgKiBBbiBlbGVtZW50IGNhbiBiZSBwaW5uZWQgbXVsdGlwbGUgdGltZXMsIGJ1dCBvbmx5IHN1Y2Nlc3NpdmVseS5cblx0XHQgKiBfKipOT1RFOioqIFRoZSBvcHRpb24gYHB1c2hGb2xsb3dlcnNgIGhhcyBubyBlZmZlY3QsIHdoZW4gdGhlIHNjZW5lIGR1cmF0aW9uIGlzIDAuX1xuXHRcdCAqIEBtZXRob2QgU2Nyb2xsTWFnaWMuU2NlbmUjc2V0UGluXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiAvLyBwaW4gZWxlbWVudCBhbmQgcHVzaCBhbGwgZm9sbG93aW5nIGVsZW1lbnRzIGRvd24gYnkgdGhlIGFtb3VudCBvZiB0aGUgcGluIGR1cmF0aW9uLlxuXHRcdCAqIHNjZW5lLnNldFBpbihcIiNwaW5cIik7XG5cdFx0ICpcblx0XHQgKiAvLyBwaW4gZWxlbWVudCBhbmQga2VlcGluZyBhbGwgZm9sbG93aW5nIGVsZW1lbnRzIGluIHRoZWlyIHBsYWNlLiBUaGUgcGlubmVkIGVsZW1lbnQgd2lsbCBtb3ZlIHBhc3QgdGhlbS5cblx0XHQgKiBzY2VuZS5zZXRQaW4oXCIjcGluXCIsIHtwdXNoRm9sbG93ZXJzOiBmYWxzZX0pO1xuXHRcdCAqXG5cdFx0ICogQHBhcmFtIHsoc3RyaW5nfG9iamVjdCl9IGVsZW1lbnQgLSBBIFNlbGVjdG9yIHRhcmdldGluZyBhbiBlbGVtZW50IG9yIGEgRE9NIG9iamVjdCB0aGF0IGlzIHN1cHBvc2VkIHRvIGJlIHBpbm5lZC5cblx0XHQgKiBAcGFyYW0ge29iamVjdH0gW3NldHRpbmdzXSAtIHNldHRpbmdzIGZvciB0aGUgcGluXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBbc2V0dGluZ3MucHVzaEZvbGxvd2Vycz10cnVlXSAtIElmIGB0cnVlYCBmb2xsb3dpbmcgZWxlbWVudHMgd2lsbCBiZSBcInB1c2hlZFwiIGRvd24gZm9yIHRoZSBkdXJhdGlvbiBvZiB0aGUgcGluLCBpZiBgZmFsc2VgIHRoZSBwaW5uZWQgZWxlbWVudCB3aWxsIGp1c3Qgc2Nyb2xsIHBhc3QgdGhlbS4gIFxuXHRcdCBJZ25vcmVkLCB3aGVuIGR1cmF0aW9uIGlzIGAwYC5cblx0XHQgKiBAcGFyYW0ge3N0cmluZ30gW3NldHRpbmdzLnNwYWNlckNsYXNzPVwic2Nyb2xsbWFnaWMtcGluLXNwYWNlclwiXSAtIENsYXNzbmFtZSBvZiB0aGUgcGluIHNwYWNlciBlbGVtZW50LCB3aGljaCBpcyB1c2VkIHRvIHJlcGxhY2UgdGhlIGVsZW1lbnQuXG5cdFx0ICpcblx0XHQgKiBAcmV0dXJucyB7U2NlbmV9IFBhcmVudCBvYmplY3QgZm9yIGNoYWluaW5nLlxuXHRcdCAqL1xuXHRcdHRoaXMuc2V0UGluID0gZnVuY3Rpb24gKGVsZW1lbnQsIHNldHRpbmdzKSB7XG5cdFx0XHR2YXJcblx0XHRcdGRlZmF1bHRTZXR0aW5ncyA9IHtcblx0XHRcdFx0cHVzaEZvbGxvd2VyczogdHJ1ZSxcblx0XHRcdFx0c3BhY2VyQ2xhc3M6IFwic2Nyb2xsbWFnaWMtcGluLXNwYWNlclwiXG5cdFx0XHR9O1xuXHRcdFx0c2V0dGluZ3MgPSBfdXRpbC5leHRlbmQoe30sIGRlZmF1bHRTZXR0aW5ncywgc2V0dGluZ3MpO1xuXG5cdFx0XHQvLyB2YWxpZGF0ZSBFbGVtZW50XG5cdFx0XHRlbGVtZW50ID0gX3V0aWwuZ2V0LmVsZW1lbnRzKGVsZW1lbnQpWzBdO1xuXHRcdFx0aWYgKCFlbGVtZW50KSB7XG5cdFx0XHRcdGxvZygxLCBcIkVSUk9SIGNhbGxpbmcgbWV0aG9kICdzZXRQaW4oKSc6IEludmFsaWQgcGluIGVsZW1lbnQgc3VwcGxpZWQuXCIpO1xuXHRcdFx0XHRyZXR1cm4gU2NlbmU7IC8vIGNhbmNlbFxuXHRcdFx0fSBlbHNlIGlmIChfdXRpbC5jc3MoZWxlbWVudCwgXCJwb3NpdGlvblwiKSA9PT0gXCJmaXhlZFwiKSB7XG5cdFx0XHRcdGxvZygxLCBcIkVSUk9SIGNhbGxpbmcgbWV0aG9kICdzZXRQaW4oKSc6IFBpbiBkb2VzIG5vdCB3b3JrIHdpdGggZWxlbWVudHMgdGhhdCBhcmUgcG9zaXRpb25lZCAnZml4ZWQnLlwiKTtcblx0XHRcdFx0cmV0dXJuIFNjZW5lOyAvLyBjYW5jZWxcblx0XHRcdH1cblxuXHRcdFx0aWYgKF9waW4pIHsgLy8gcHJlZXhpc3RpbmcgcGluP1xuXHRcdFx0XHRpZiAoX3BpbiA9PT0gZWxlbWVudCkge1xuXHRcdFx0XHRcdC8vIHNhbWUgcGluIHdlIGFscmVhZHkgaGF2ZSAtPiBkbyBub3RoaW5nXG5cdFx0XHRcdFx0cmV0dXJuIFNjZW5lOyAvLyBjYW5jZWxcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBraWxsIG9sZCBwaW5cblx0XHRcdFx0XHRTY2VuZS5yZW1vdmVQaW4oKTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cdFx0XHRfcGluID0gZWxlbWVudDtcblxuXHRcdFx0dmFyXG5cdFx0XHRwYXJlbnREaXNwbGF5ID0gX3Bpbi5wYXJlbnROb2RlLnN0eWxlLmRpc3BsYXksXG5cdFx0XHRcdGJvdW5kc1BhcmFtcyA9IFtcInRvcFwiLCBcImxlZnRcIiwgXCJib3R0b21cIiwgXCJyaWdodFwiLCBcIm1hcmdpblwiLCBcIm1hcmdpbkxlZnRcIiwgXCJtYXJnaW5SaWdodFwiLCBcIm1hcmdpblRvcFwiLCBcIm1hcmdpbkJvdHRvbVwiXTtcblxuXHRcdFx0X3Bpbi5wYXJlbnROb2RlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IC8vIGhhY2sgc3RhcnQgdG8gZm9yY2UgY3NzIHRvIHJldHVybiBzdHlsZXNoZWV0IHZhbHVlcyBpbnN0ZWFkIG9mIGNhbGN1bGF0ZWQgcHggdmFsdWVzLlxuXHRcdFx0dmFyXG5cdFx0XHRpbkZsb3cgPSBfdXRpbC5jc3MoX3BpbiwgXCJwb3NpdGlvblwiKSAhPSBcImFic29sdXRlXCIsXG5cdFx0XHRcdHBpbkNTUyA9IF91dGlsLmNzcyhfcGluLCBib3VuZHNQYXJhbXMuY29uY2F0KFtcImRpc3BsYXlcIl0pKSxcblx0XHRcdFx0c2l6ZUNTUyA9IF91dGlsLmNzcyhfcGluLCBbXCJ3aWR0aFwiLCBcImhlaWdodFwiXSk7XG5cdFx0XHRfcGluLnBhcmVudE5vZGUuc3R5bGUuZGlzcGxheSA9IHBhcmVudERpc3BsYXk7IC8vIGhhY2sgZW5kLlxuXHRcdFx0aWYgKCFpbkZsb3cgJiYgc2V0dGluZ3MucHVzaEZvbGxvd2Vycykge1xuXHRcdFx0XHRsb2coMiwgXCJXQVJOSU5HOiBJZiB0aGUgcGlubmVkIGVsZW1lbnQgaXMgcG9zaXRpb25lZCBhYnNvbHV0ZWx5IHB1c2hGb2xsb3dlcnMgd2lsbCBiZSBkaXNhYmxlZC5cIik7XG5cdFx0XHRcdHNldHRpbmdzLnB1c2hGb2xsb3dlcnMgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgLy8gd2FpdCB1bnRpbCBhbGwgZmluaXNoZWQsIGJlY2F1c2Ugd2l0aCByZXNwb25zaXZlIGR1cmF0aW9uIGl0IHdpbGwgb25seSBiZSBzZXQgYWZ0ZXIgc2NlbmUgaXMgYWRkZWQgdG8gY29udHJvbGxlclxuXHRcdFx0XHRpZiAoX3BpbiAmJiBfb3B0aW9ucy5kdXJhdGlvbiA9PT0gMCAmJiBzZXR0aW5ncy5wdXNoRm9sbG93ZXJzKSB7XG5cdFx0XHRcdFx0bG9nKDIsIFwiV0FSTklORzogcHVzaEZvbGxvd2VycyA9XCIsIHRydWUsIFwiaGFzIG5vIGVmZmVjdCwgd2hlbiBzY2VuZSBkdXJhdGlvbiBpcyAwLlwiKTtcblx0XHRcdFx0fVxuXHRcdFx0fSwgMCk7XG5cblx0XHRcdC8vIGNyZWF0ZSBzcGFjZXIgYW5kIGluc2VydFxuXHRcdFx0dmFyXG5cdFx0XHRzcGFjZXIgPSBfcGluLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCBfcGluKSxcblx0XHRcdFx0c3BhY2VyQ1NTID0gX3V0aWwuZXh0ZW5kKHBpbkNTUywge1xuXHRcdFx0XHRcdHBvc2l0aW9uOiBpbkZsb3cgPyBcInJlbGF0aXZlXCIgOiBcImFic29sdXRlXCIsXG5cdFx0XHRcdFx0Ym94U2l6aW5nOiBcImNvbnRlbnQtYm94XCIsXG5cdFx0XHRcdFx0bW96Qm94U2l6aW5nOiBcImNvbnRlbnQtYm94XCIsXG5cdFx0XHRcdFx0d2Via2l0Qm94U2l6aW5nOiBcImNvbnRlbnQtYm94XCJcblx0XHRcdFx0fSk7XG5cblx0XHRcdGlmICghaW5GbG93KSB7IC8vIGNvcHkgc2l6ZSBpZiBwb3NpdGlvbmVkIGFic29sdXRlbHksIHRvIHdvcmsgZm9yIGJvdHRvbS9yaWdodCBwb3NpdGlvbmVkIGVsZW1lbnRzLlxuXHRcdFx0XHRfdXRpbC5leHRlbmQoc3BhY2VyQ1NTLCBfdXRpbC5jc3MoX3BpbiwgW1wid2lkdGhcIiwgXCJoZWlnaHRcIl0pKTtcblx0XHRcdH1cblxuXHRcdFx0X3V0aWwuY3NzKHNwYWNlciwgc3BhY2VyQ1NTKTtcblx0XHRcdHNwYWNlci5zZXRBdHRyaWJ1dGUoUElOX1NQQUNFUl9BVFRSSUJVVEUsIFwiXCIpO1xuXHRcdFx0X3V0aWwuYWRkQ2xhc3Moc3BhY2VyLCBzZXR0aW5ncy5zcGFjZXJDbGFzcyk7XG5cblx0XHRcdC8vIHNldCB0aGUgcGluIE9wdGlvbnNcblx0XHRcdF9waW5PcHRpb25zID0ge1xuXHRcdFx0XHRzcGFjZXI6IHNwYWNlcixcblx0XHRcdFx0cmVsU2l6ZTogeyAvLyBzYXZlIGlmIHNpemUgaXMgZGVmaW5lZCB1c2luZyAlIHZhbHVlcy4gaWYgc28sIGhhbmRsZSBzcGFjZXIgcmVzaXplIGRpZmZlcmVudGx5Li4uXG5cdFx0XHRcdFx0d2lkdGg6IHNpemVDU1Mud2lkdGguc2xpY2UoLTEpID09PSBcIiVcIixcblx0XHRcdFx0XHRoZWlnaHQ6IHNpemVDU1MuaGVpZ2h0LnNsaWNlKC0xKSA9PT0gXCIlXCIsXG5cdFx0XHRcdFx0YXV0b0Z1bGxXaWR0aDogc2l6ZUNTUy53aWR0aCA9PT0gXCJhdXRvXCIgJiYgaW5GbG93ICYmIF91dGlsLmlzTWFyZ2luQ29sbGFwc2VUeXBlKHBpbkNTUy5kaXNwbGF5KVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRwdXNoRm9sbG93ZXJzOiBzZXR0aW5ncy5wdXNoRm9sbG93ZXJzLFxuXHRcdFx0XHRpbkZsb3c6IGluRmxvdyxcblx0XHRcdFx0Ly8gc3RvcmVzIGlmIHRoZSBlbGVtZW50IHRha2VzIHVwIHNwYWNlIGluIHRoZSBkb2N1bWVudCBmbG93XG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAoIV9waW4uX19fb3JpZ1N0eWxlKSB7XG5cdFx0XHRcdF9waW4uX19fb3JpZ1N0eWxlID0ge307XG5cdFx0XHRcdHZhclxuXHRcdFx0XHRwaW5JbmxpbmVDU1MgPSBfcGluLnN0eWxlLFxuXHRcdFx0XHRcdGNvcHlTdHlsZXMgPSBib3VuZHNQYXJhbXMuY29uY2F0KFtcIndpZHRoXCIsIFwiaGVpZ2h0XCIsIFwicG9zaXRpb25cIiwgXCJib3hTaXppbmdcIiwgXCJtb3pCb3hTaXppbmdcIiwgXCJ3ZWJraXRCb3hTaXppbmdcIl0pO1xuXHRcdFx0XHRjb3B5U3R5bGVzLmZvckVhY2goZnVuY3Rpb24gKHZhbCkge1xuXHRcdFx0XHRcdF9waW4uX19fb3JpZ1N0eWxlW3ZhbF0gPSBwaW5JbmxpbmVDU1NbdmFsXSB8fCBcIlwiO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gaWYgcmVsYXRpdmUgc2l6ZSwgdHJhbnNmZXIgaXQgdG8gc3BhY2VyIGFuZCBtYWtlIHBpbiBjYWxjdWxhdGUgaXQuLi5cblx0XHRcdGlmIChfcGluT3B0aW9ucy5yZWxTaXplLndpZHRoKSB7XG5cdFx0XHRcdF91dGlsLmNzcyhzcGFjZXIsIHtcblx0XHRcdFx0XHR3aWR0aDogc2l6ZUNTUy53aWR0aFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdGlmIChfcGluT3B0aW9ucy5yZWxTaXplLmhlaWdodCkge1xuXHRcdFx0XHRfdXRpbC5jc3Moc3BhY2VyLCB7XG5cdFx0XHRcdFx0aGVpZ2h0OiBzaXplQ1NTLmhlaWdodFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gbm93IHBsYWNlIHRoZSBwaW4gZWxlbWVudCBpbnNpZGUgdGhlIHNwYWNlclx0XG5cdFx0XHRzcGFjZXIuYXBwZW5kQ2hpbGQoX3Bpbik7XG5cdFx0XHQvLyBhbmQgc2V0IG5ldyBjc3Ncblx0XHRcdF91dGlsLmNzcyhfcGluLCB7XG5cdFx0XHRcdHBvc2l0aW9uOiBpbkZsb3cgPyBcInJlbGF0aXZlXCIgOiBcImFic29sdXRlXCIsXG5cdFx0XHRcdG1hcmdpbjogXCJhdXRvXCIsXG5cdFx0XHRcdHRvcDogXCJhdXRvXCIsXG5cdFx0XHRcdGxlZnQ6IFwiYXV0b1wiLFxuXHRcdFx0XHRib3R0b206IFwiYXV0b1wiLFxuXHRcdFx0XHRyaWdodDogXCJhdXRvXCJcblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAoX3Bpbk9wdGlvbnMucmVsU2l6ZS53aWR0aCB8fCBfcGluT3B0aW9ucy5yZWxTaXplLmF1dG9GdWxsV2lkdGgpIHtcblx0XHRcdFx0X3V0aWwuY3NzKF9waW4sIHtcblx0XHRcdFx0XHRib3hTaXppbmc6IFwiYm9yZGVyLWJveFwiLFxuXHRcdFx0XHRcdG1vekJveFNpemluZzogXCJib3JkZXItYm94XCIsXG5cdFx0XHRcdFx0d2Via2l0Qm94U2l6aW5nOiBcImJvcmRlci1ib3hcIlxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gYWRkIGxpc3RlbmVyIHRvIGRvY3VtZW50IHRvIHVwZGF0ZSBwaW4gcG9zaXRpb24gaW4gY2FzZSBjb250cm9sbGVyIGlzIG5vdCB0aGUgZG9jdW1lbnQuXG5cdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgdXBkYXRlUGluSW5Db250YWluZXIpO1xuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHVwZGF0ZVBpbkluQ29udGFpbmVyKTtcblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB1cGRhdGVSZWxhdGl2ZVBpblNwYWNlcik7XG5cdFx0XHQvLyBhZGQgbW91c2V3aGVlbCBsaXN0ZW5lciB0byBjYXRjaCBzY3JvbGxzIG92ZXIgZml4ZWQgZWxlbWVudHNcblx0XHRcdF9waW4uYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNld2hlZWxcIiwgb25Nb3VzZXdoZWVsT3ZlclBpbik7XG5cdFx0XHRfcGluLmFkZEV2ZW50TGlzdGVuZXIoXCJET01Nb3VzZVNjcm9sbFwiLCBvbk1vdXNld2hlZWxPdmVyUGluKTtcblxuXHRcdFx0bG9nKDMsIFwiYWRkZWQgcGluXCIpO1xuXG5cdFx0XHQvLyBmaW5hbGx5IHVwZGF0ZSB0aGUgcGluIHRvIGluaXRcblx0XHRcdHVwZGF0ZVBpblN0YXRlKCk7XG5cblx0XHRcdHJldHVybiBTY2VuZTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogUmVtb3ZlIHRoZSBwaW4gZnJvbSB0aGUgc2NlbmUuXG5cdFx0ICogQG1ldGhvZCBTY3JvbGxNYWdpYy5TY2VuZSNyZW1vdmVQaW5cblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqIC8vIHJlbW92ZSB0aGUgcGluIGZyb20gdGhlIHNjZW5lIHdpdGhvdXQgcmVzZXR0aW5nIGl0ICh0aGUgc3BhY2VyIGlzIG5vdCByZW1vdmVkKVxuXHRcdCAqIHNjZW5lLnJlbW92ZVBpbigpO1xuXHRcdCAqXG5cdFx0ICogLy8gcmVtb3ZlIHRoZSBwaW4gZnJvbSB0aGUgc2NlbmUgYW5kIHJlc2V0IHRoZSBwaW4gZWxlbWVudCB0byBpdHMgaW5pdGlhbCBwb3NpdGlvbiAoc3BhY2VyIGlzIHJlbW92ZWQpXG5cdFx0ICogc2NlbmUucmVtb3ZlUGluKHRydWUpO1xuXHRcdCAqXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBbcmVzZXQ9ZmFsc2VdIC0gSWYgYGZhbHNlYCB0aGUgc3BhY2VyIHdpbGwgbm90IGJlIHJlbW92ZWQgYW5kIHRoZSBlbGVtZW50J3MgcG9zaXRpb24gd2lsbCBub3QgYmUgcmVzZXQuXG5cdFx0ICogQHJldHVybnMge1NjZW5lfSBQYXJlbnQgb2JqZWN0IGZvciBjaGFpbmluZy5cblx0XHQgKi9cblx0XHR0aGlzLnJlbW92ZVBpbiA9IGZ1bmN0aW9uIChyZXNldCkge1xuXHRcdFx0aWYgKF9waW4pIHtcblx0XHRcdFx0aWYgKF9zdGF0ZSA9PT0gU0NFTkVfU1RBVEVfRFVSSU5HKSB7XG5cdFx0XHRcdFx0dXBkYXRlUGluU3RhdGUodHJ1ZSk7IC8vIGZvcmNlIHVucGluIGF0IHBvc2l0aW9uXG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHJlc2V0IHx8ICFfY29udHJvbGxlcikgeyAvLyBpZiB0aGVyZSdzIG5vIGNvbnRyb2xsZXIgbm8gcHJvZ3Jlc3Mgd2FzIG1hZGUgYW55d2F5Li4uXG5cdFx0XHRcdFx0dmFyIHBpblRhcmdldCA9IF9waW5PcHRpb25zLnNwYWNlci5maXJzdENoaWxkOyAvLyB1c3VhbGx5IHRoZSBwaW4gZWxlbWVudCwgYnV0IG1heSBiZSBhbm90aGVyIHNwYWNlciAoY2FzY2FkZWQgcGlucykuLi5cblx0XHRcdFx0XHRpZiAocGluVGFyZ2V0Lmhhc0F0dHJpYnV0ZShQSU5fU1BBQ0VSX0FUVFJJQlVURSkpIHsgLy8gY29weSBtYXJnaW5zIHRvIGNoaWxkIHNwYWNlclxuXHRcdFx0XHRcdFx0dmFyXG5cdFx0XHRcdFx0XHRzdHlsZSA9IF9waW5PcHRpb25zLnNwYWNlci5zdHlsZSxcblx0XHRcdFx0XHRcdFx0dmFsdWVzID0gW1wibWFyZ2luXCIsIFwibWFyZ2luTGVmdFwiLCBcIm1hcmdpblJpZ2h0XCIsIFwibWFyZ2luVG9wXCIsIFwibWFyZ2luQm90dG9tXCJdLFxuXHRcdFx0XHRcdFx0XHRtYXJnaW5zID0ge307XG5cdFx0XHRcdFx0XHR2YWx1ZXMuZm9yRWFjaChmdW5jdGlvbiAodmFsKSB7XG5cdFx0XHRcdFx0XHRcdG1hcmdpbnNbdmFsXSA9IHN0eWxlW3ZhbF0gfHwgXCJcIjtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0X3V0aWwuY3NzKHBpblRhcmdldCwgbWFyZ2lucyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdF9waW5PcHRpb25zLnNwYWNlci5wYXJlbnROb2RlLmluc2VydEJlZm9yZShwaW5UYXJnZXQsIF9waW5PcHRpb25zLnNwYWNlcik7XG5cdFx0XHRcdFx0X3Bpbk9wdGlvbnMuc3BhY2VyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoX3Bpbk9wdGlvbnMuc3BhY2VyKTtcblx0XHRcdFx0XHRpZiAoIV9waW4ucGFyZW50Tm9kZS5oYXNBdHRyaWJ1dGUoUElOX1NQQUNFUl9BVFRSSUJVVEUpKSB7IC8vIGlmIGl0J3MgdGhlIGxhc3QgcGluIGZvciB0aGlzIGVsZW1lbnQgLT4gcmVzdG9yZSBpbmxpbmUgc3R5bGVzXG5cdFx0XHRcdFx0XHQvLyBUT0RPOiBvbmx5IGNvcnJlY3RseSBzZXQgZm9yIGZpcnN0IHBpbiAod2hlbiBjYXNjYWRpbmcpIC0gaG93IHRvIGZpeD9cblx0XHRcdFx0XHRcdF91dGlsLmNzcyhfcGluLCBfcGluLl9fX29yaWdTdHlsZSk7XG5cdFx0XHRcdFx0XHRkZWxldGUgX3Bpbi5fX19vcmlnU3R5bGU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB1cGRhdGVQaW5JbkNvbnRhaW5lcik7XG5cdFx0XHRcdHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCB1cGRhdGVQaW5JbkNvbnRhaW5lcik7XG5cdFx0XHRcdHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCB1cGRhdGVSZWxhdGl2ZVBpblNwYWNlcik7XG5cdFx0XHRcdF9waW4ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNld2hlZWxcIiwgb25Nb3VzZXdoZWVsT3ZlclBpbik7XG5cdFx0XHRcdF9waW4ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIkRPTU1vdXNlU2Nyb2xsXCIsIG9uTW91c2V3aGVlbE92ZXJQaW4pO1xuXHRcdFx0XHRfcGluID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRsb2coMywgXCJyZW1vdmVkIHBpbiAocmVzZXQ6IFwiICsgKHJlc2V0ID8gXCJ0cnVlXCIgOiBcImZhbHNlXCIpICsgXCIpXCIpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIFNjZW5lO1xuXHRcdH07XG5cblxuXHRcdHZhclxuXHRcdF9jc3NDbGFzc2VzLCBfY3NzQ2xhc3NFbGVtcyA9IFtdO1xuXG5cdFx0U2NlbmUub24oXCJkZXN0cm95LmludGVybmFsXCIsIGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRTY2VuZS5yZW1vdmVDbGFzc1RvZ2dsZShlLnJlc2V0KTtcblx0XHR9KTtcblx0XHQvKipcblx0XHQgKiBEZWZpbmUgYSBjc3MgY2xhc3MgbW9kaWZpY2F0aW9uIHdoaWxlIHRoZSBzY2VuZSBpcyBhY3RpdmUuICBcblx0XHQgKiBXaGVuIHRoZSBzY2VuZSB0cmlnZ2VycyB0aGUgY2xhc3NlcyB3aWxsIGJlIGFkZGVkIHRvIHRoZSBzdXBwbGllZCBlbGVtZW50IGFuZCByZW1vdmVkLCB3aGVuIHRoZSBzY2VuZSBpcyBvdmVyLlxuXHRcdCAqIElmIHRoZSBzY2VuZSBkdXJhdGlvbiBpcyAwIHRoZSBjbGFzc2VzIHdpbGwgb25seSBiZSByZW1vdmVkIGlmIHRoZSB1c2VyIHNjcm9sbHMgYmFjayBwYXN0IHRoZSBzdGFydCBwb3NpdGlvbi5cblx0XHQgKiBAbWV0aG9kIFNjcm9sbE1hZ2ljLlNjZW5lI3NldENsYXNzVG9nZ2xlXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiAvLyBhZGQgdGhlIGNsYXNzICdteWNsYXNzJyB0byB0aGUgZWxlbWVudCB3aXRoIHRoZSBpZCAnbXktZWxlbScgZm9yIHRoZSBkdXJhdGlvbiBvZiB0aGUgc2NlbmVcblx0XHQgKiBzY2VuZS5zZXRDbGFzc1RvZ2dsZShcIiNteS1lbGVtXCIsIFwibXljbGFzc1wiKTtcblx0XHQgKlxuXHRcdCAqIC8vIGFkZCBtdWx0aXBsZSBjbGFzc2VzIHRvIG11bHRpcGxlIGVsZW1lbnRzIGRlZmluZWQgYnkgdGhlIHNlbGVjdG9yICcuY2xhc3NDaGFuZ2UnXG5cdFx0ICogc2NlbmUuc2V0Q2xhc3NUb2dnbGUoXCIuY2xhc3NDaGFuZ2VcIiwgXCJjbGFzczEgY2xhc3MyIGNsYXNzM1wiKTtcblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7KHN0cmluZ3xvYmplY3QpfSBlbGVtZW50IC0gQSBTZWxlY3RvciB0YXJnZXRpbmcgb25lIG9yIG1vcmUgZWxlbWVudHMgb3IgYSBET00gb2JqZWN0IHRoYXQgaXMgc3VwcG9zZWQgdG8gYmUgbW9kaWZpZWQuXG5cdFx0ICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzZXMgLSBPbmUgb3IgbW9yZSBDbGFzc25hbWVzIChzZXBhcmF0ZWQgYnkgc3BhY2UpIHRoYXQgc2hvdWxkIGJlIGFkZGVkIHRvIHRoZSBlbGVtZW50IGR1cmluZyB0aGUgc2NlbmUuXG5cdFx0ICpcblx0XHQgKiBAcmV0dXJucyB7U2NlbmV9IFBhcmVudCBvYmplY3QgZm9yIGNoYWluaW5nLlxuXHRcdCAqL1xuXHRcdHRoaXMuc2V0Q2xhc3NUb2dnbGUgPSBmdW5jdGlvbiAoZWxlbWVudCwgY2xhc3Nlcykge1xuXHRcdFx0dmFyIGVsZW1zID0gX3V0aWwuZ2V0LmVsZW1lbnRzKGVsZW1lbnQpO1xuXHRcdFx0aWYgKGVsZW1zLmxlbmd0aCA9PT0gMCB8fCAhX3V0aWwudHlwZS5TdHJpbmcoY2xhc3NlcykpIHtcblx0XHRcdFx0bG9nKDEsIFwiRVJST1IgY2FsbGluZyBtZXRob2QgJ3NldENsYXNzVG9nZ2xlKCknOiBJbnZhbGlkIFwiICsgKGVsZW1zLmxlbmd0aCA9PT0gMCA/IFwiZWxlbWVudFwiIDogXCJjbGFzc2VzXCIpICsgXCIgc3VwcGxpZWQuXCIpO1xuXHRcdFx0XHRyZXR1cm4gU2NlbmU7XG5cdFx0XHR9XG5cdFx0XHRpZiAoX2Nzc0NsYXNzRWxlbXMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHQvLyByZW1vdmUgb2xkIG9uZXNcblx0XHRcdFx0U2NlbmUucmVtb3ZlQ2xhc3NUb2dnbGUoKTtcblx0XHRcdH1cblx0XHRcdF9jc3NDbGFzc2VzID0gY2xhc3Nlcztcblx0XHRcdF9jc3NDbGFzc0VsZW1zID0gZWxlbXM7XG5cdFx0XHRTY2VuZS5vbihcImVudGVyLmludGVybmFsX2NsYXNzIGxlYXZlLmludGVybmFsX2NsYXNzXCIsIGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRcdHZhciB0b2dnbGUgPSBlLnR5cGUgPT09IFwiZW50ZXJcIiA/IF91dGlsLmFkZENsYXNzIDogX3V0aWwucmVtb3ZlQ2xhc3M7XG5cdFx0XHRcdF9jc3NDbGFzc0VsZW1zLmZvckVhY2goZnVuY3Rpb24gKGVsZW0sIGtleSkge1xuXHRcdFx0XHRcdHRvZ2dsZShlbGVtLCBfY3NzQ2xhc3Nlcyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gU2NlbmU7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJlbW92ZSB0aGUgY2xhc3MgYmluZGluZyBmcm9tIHRoZSBzY2VuZS5cblx0XHQgKiBAbWV0aG9kIFNjcm9sbE1hZ2ljLlNjZW5lI3JlbW92ZUNsYXNzVG9nZ2xlXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiAvLyByZW1vdmUgY2xhc3MgYmluZGluZyBmcm9tIHRoZSBzY2VuZSB3aXRob3V0IHJlc2V0XG5cdFx0ICogc2NlbmUucmVtb3ZlQ2xhc3NUb2dnbGUoKTtcblx0XHQgKlxuXHRcdCAqIC8vIHJlbW92ZSBjbGFzcyBiaW5kaW5nIGFuZCByZW1vdmUgdGhlIGNoYW5nZXMgaXQgY2F1c2VkXG5cdFx0ICogc2NlbmUucmVtb3ZlQ2xhc3NUb2dnbGUodHJ1ZSk7XG5cdFx0ICpcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IFtyZXNldD1mYWxzZV0gLSBJZiBgZmFsc2VgIGFuZCB0aGUgY2xhc3NlcyBhcmUgY3VycmVudGx5IGFjdGl2ZSwgdGhleSB3aWxsIHJlbWFpbiBvbiB0aGUgZWxlbWVudC4gSWYgYHRydWVgIHRoZXkgd2lsbCBiZSByZW1vdmVkLlxuXHRcdCAqIEByZXR1cm5zIHtTY2VuZX0gUGFyZW50IG9iamVjdCBmb3IgY2hhaW5pbmcuXG5cdFx0ICovXG5cdFx0dGhpcy5yZW1vdmVDbGFzc1RvZ2dsZSA9IGZ1bmN0aW9uIChyZXNldCkge1xuXHRcdFx0aWYgKHJlc2V0KSB7XG5cdFx0XHRcdF9jc3NDbGFzc0VsZW1zLmZvckVhY2goZnVuY3Rpb24gKGVsZW0sIGtleSkge1xuXHRcdFx0XHRcdF91dGlsLnJlbW92ZUNsYXNzKGVsZW0sIF9jc3NDbGFzc2VzKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRTY2VuZS5vZmYoXCJzdGFydC5pbnRlcm5hbF9jbGFzcyBlbmQuaW50ZXJuYWxfY2xhc3NcIik7XG5cdFx0XHRfY3NzQ2xhc3NlcyA9IHVuZGVmaW5lZDtcblx0XHRcdF9jc3NDbGFzc0VsZW1zID0gW107XG5cdFx0XHRyZXR1cm4gU2NlbmU7XG5cdFx0fTtcblxuXHRcdC8vIElOSVRcblx0XHRjb25zdHJ1Y3QoKTtcblx0XHRyZXR1cm4gU2NlbmU7XG5cdH07XG5cblx0Ly8gc3RvcmUgcGFnZXdpZGUgc2NlbmUgb3B0aW9uc1xuXHR2YXIgU0NFTkVfT1BUSU9OUyA9IHtcblx0XHRkZWZhdWx0czoge1xuXHRcdFx0ZHVyYXRpb246IDAsXG5cdFx0XHRvZmZzZXQ6IDAsXG5cdFx0XHR0cmlnZ2VyRWxlbWVudDogdW5kZWZpbmVkLFxuXHRcdFx0dHJpZ2dlckhvb2s6IDAuNSxcblx0XHRcdHJldmVyc2U6IHRydWUsXG5cdFx0XHRsb2dsZXZlbDogMlxuXHRcdH0sXG5cdFx0dmFsaWRhdGU6IHtcblx0XHRcdG9mZnNldDogZnVuY3Rpb24gKHZhbCkge1xuXHRcdFx0XHR2YWwgPSBwYXJzZUZsb2F0KHZhbCk7XG5cdFx0XHRcdGlmICghX3V0aWwudHlwZS5OdW1iZXIodmFsKSkge1xuXHRcdFx0XHRcdHRocm93IFtcIkludmFsaWQgdmFsdWUgZm9yIG9wdGlvbiBcXFwib2Zmc2V0XFxcIjpcIiwgdmFsXTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdmFsO1xuXHRcdFx0fSxcblx0XHRcdHRyaWdnZXJFbGVtZW50OiBmdW5jdGlvbiAodmFsKSB7XG5cdFx0XHRcdHZhbCA9IHZhbCB8fCB1bmRlZmluZWQ7XG5cdFx0XHRcdGlmICh2YWwpIHtcblx0XHRcdFx0XHR2YXIgZWxlbSA9IF91dGlsLmdldC5lbGVtZW50cyh2YWwpWzBdO1xuXHRcdFx0XHRcdGlmIChlbGVtICYmIGVsZW0ucGFyZW50Tm9kZSkge1xuXHRcdFx0XHRcdFx0dmFsID0gZWxlbTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dGhyb3cgW1wiRWxlbWVudCBkZWZpbmVkIGluIG9wdGlvbiBcXFwidHJpZ2dlckVsZW1lbnRcXFwiIHdhcyBub3QgZm91bmQ6XCIsIHZhbF07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB2YWw7XG5cdFx0XHR9LFxuXHRcdFx0dHJpZ2dlckhvb2s6IGZ1bmN0aW9uICh2YWwpIHtcblx0XHRcdFx0dmFyIHRyYW5zbGF0ZSA9IHtcblx0XHRcdFx0XHRcIm9uQ2VudGVyXCI6IDAuNSxcblx0XHRcdFx0XHRcIm9uRW50ZXJcIjogMSxcblx0XHRcdFx0XHRcIm9uTGVhdmVcIjogMFxuXHRcdFx0XHR9O1xuXHRcdFx0XHRpZiAoX3V0aWwudHlwZS5OdW1iZXIodmFsKSkge1xuXHRcdFx0XHRcdHZhbCA9IE1hdGgubWF4KDAsIE1hdGgubWluKHBhcnNlRmxvYXQodmFsKSwgMSkpOyAvLyAgbWFrZSBzdXJlIGl0cyBiZXR3ZWVlbiAwIGFuZCAxXG5cdFx0XHRcdH0gZWxzZSBpZiAodmFsIGluIHRyYW5zbGF0ZSkge1xuXHRcdFx0XHRcdHZhbCA9IHRyYW5zbGF0ZVt2YWxdO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRocm93IFtcIkludmFsaWQgdmFsdWUgZm9yIG9wdGlvbiBcXFwidHJpZ2dlckhvb2tcXFwiOiBcIiwgdmFsXTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdmFsO1xuXHRcdFx0fSxcblx0XHRcdHJldmVyc2U6IGZ1bmN0aW9uICh2YWwpIHtcblx0XHRcdFx0cmV0dXJuICEhdmFsOyAvLyBmb3JjZSBib29sZWFuXG5cdFx0XHR9LFxuXHRcdFx0bG9nbGV2ZWw6IGZ1bmN0aW9uICh2YWwpIHtcblx0XHRcdFx0dmFsID0gcGFyc2VJbnQodmFsKTtcblx0XHRcdFx0aWYgKCFfdXRpbC50eXBlLk51bWJlcih2YWwpIHx8IHZhbCA8IDAgfHwgdmFsID4gMykge1xuXHRcdFx0XHRcdHRocm93IFtcIkludmFsaWQgdmFsdWUgZm9yIG9wdGlvbiBcXFwibG9nbGV2ZWxcXFwiOlwiLCB2YWxdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB2YWw7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHQvLyBob2xkZXIgZm9yICB2YWxpZGF0aW9uIG1ldGhvZHMuIGR1cmF0aW9uIHZhbGlkYXRpb24gaXMgaGFuZGxlZCBpbiAnZ2V0dGVycy1zZXR0ZXJzLmpzJ1xuXHRcdHNoaWZ0czogW1wiZHVyYXRpb25cIiwgXCJvZmZzZXRcIiwgXCJ0cmlnZ2VySG9va1wiXSxcblx0XHQvLyBsaXN0IG9mIG9wdGlvbnMgdGhhdCB0cmlnZ2VyIGEgYHNoaWZ0YCBldmVudFxuXHR9O1xuLypcbiAqIG1ldGhvZCB1c2VkIHRvIGFkZCBhbiBvcHRpb24gdG8gU2Nyb2xsTWFnaWMgU2NlbmVzLlxuICogVE9ETzogRE9DIChwcml2YXRlIGZvciBkZXYpXG4gKi9cblx0U2Nyb2xsTWFnaWMuU2NlbmUuYWRkT3B0aW9uID0gZnVuY3Rpb24gKG5hbWUsIGRlZmF1bHRWYWx1ZSwgdmFsaWRhdGlvbkNhbGxiYWNrLCBzaGlmdHMpIHtcblx0XHRpZiAoIShuYW1lIGluIFNDRU5FX09QVElPTlMuZGVmYXVsdHMpKSB7XG5cdFx0XHRTQ0VORV9PUFRJT05TLmRlZmF1bHRzW25hbWVdID0gZGVmYXVsdFZhbHVlO1xuXHRcdFx0U0NFTkVfT1BUSU9OUy52YWxpZGF0ZVtuYW1lXSA9IHZhbGlkYXRpb25DYWxsYmFjaztcblx0XHRcdGlmIChzaGlmdHMpIHtcblx0XHRcdFx0U0NFTkVfT1BUSU9OUy5zaGlmdHMucHVzaChuYW1lKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0U2Nyb2xsTWFnaWMuX3V0aWwubG9nKDEsIFwiW3N0YXRpY10gU2Nyb2xsTWFnaWMuU2NlbmUgLT4gQ2Fubm90IGFkZCBTY2VuZSBvcHRpb24gJ1wiICsgbmFtZSArIFwiJywgYmVjYXVzZSBpdCBhbHJlYWR5IGV4aXN0cy5cIik7XG5cdFx0fVxuXHR9O1xuXHQvLyBpbnN0YW5jZSBleHRlbnNpb24gZnVuY3Rpb24gZm9yIHBsdWdpbnNcblx0Ly8gVE9ETzogRE9DIChwcml2YXRlIGZvciBkZXYpXG5cdFNjcm9sbE1hZ2ljLlNjZW5lLmV4dGVuZCA9IGZ1bmN0aW9uIChleHRlbnNpb24pIHtcblx0XHR2YXIgb2xkQ2xhc3MgPSB0aGlzO1xuXHRcdFNjcm9sbE1hZ2ljLlNjZW5lID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0b2xkQ2xhc3MuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHRcdHRoaXMuJHN1cGVyID0gX3V0aWwuZXh0ZW5kKHt9LCB0aGlzKTsgLy8gY29weSBwYXJlbnQgc3RhdGVcblx0XHRcdHJldHVybiBleHRlbnNpb24uYXBwbHkodGhpcywgYXJndW1lbnRzKSB8fCB0aGlzO1xuXHRcdH07XG5cdFx0X3V0aWwuZXh0ZW5kKFNjcm9sbE1hZ2ljLlNjZW5lLCBvbGRDbGFzcyk7IC8vIGNvcHkgcHJvcGVydGllc1xuXHRcdFNjcm9sbE1hZ2ljLlNjZW5lLnByb3RvdHlwZSA9IG9sZENsYXNzLnByb3RvdHlwZTsgLy8gY29weSBwcm90b3R5cGVcblx0XHRTY3JvbGxNYWdpYy5TY2VuZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTY3JvbGxNYWdpYy5TY2VuZTsgLy8gcmVzdG9yZSBjb25zdHJ1Y3RvclxuXHR9O1xuXG5cblxuXHQvKipcblx0ICogVE9ETzogRE9DUyAocHJpdmF0ZSBmb3IgZGV2KVxuXHQgKiBAY2xhc3Ncblx0ICogQHByaXZhdGVcblx0ICovXG5cblx0U2Nyb2xsTWFnaWMuRXZlbnQgPSBmdW5jdGlvbiAodHlwZSwgbmFtZXNwYWNlLCB0YXJnZXQsIHZhcnMpIHtcblx0XHR2YXJzID0gdmFycyB8fCB7fTtcblx0XHRmb3IgKHZhciBrZXkgaW4gdmFycykge1xuXHRcdFx0dGhpc1trZXldID0gdmFyc1trZXldO1xuXHRcdH1cblx0XHR0aGlzLnR5cGUgPSB0eXBlO1xuXHRcdHRoaXMudGFyZ2V0ID0gdGhpcy5jdXJyZW50VGFyZ2V0ID0gdGFyZ2V0O1xuXHRcdHRoaXMubmFtZXNwYWNlID0gbmFtZXNwYWNlIHx8ICcnO1xuXHRcdHRoaXMudGltZVN0YW1wID0gdGhpcy50aW1lc3RhbXAgPSBEYXRlLm5vdygpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG4vKlxuICogVE9ETzogRE9DUyAocHJpdmF0ZSBmb3IgZGV2KVxuICovXG5cblx0dmFyIF91dGlsID0gU2Nyb2xsTWFnaWMuX3V0aWwgPSAoZnVuY3Rpb24gKHdpbmRvdykge1xuXHRcdHZhciBVID0ge30sXG5cdFx0XHRpO1xuXG5cdFx0LyoqXG5cdFx0ICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0ICogaW50ZXJuYWwgaGVscGVyc1xuXHRcdCAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCAqL1xuXG5cdFx0Ly8gcGFyc2UgZmxvYXQgYW5kIGZhbGwgYmFjayB0byAwLlxuXHRcdHZhciBmbG9hdHZhbCA9IGZ1bmN0aW9uIChudW1iZXIpIHtcblx0XHRcdHJldHVybiBwYXJzZUZsb2F0KG51bWJlcikgfHwgMDtcblx0XHR9O1xuXHRcdC8vIGdldCBjdXJyZW50IHN0eWxlIElFIHNhZmUgKG90aGVyd2lzZSBJRSB3b3VsZCByZXR1cm4gY2FsY3VsYXRlZCB2YWx1ZXMgZm9yICdhdXRvJylcblx0XHR2YXIgX2dldENvbXB1dGVkU3R5bGUgPSBmdW5jdGlvbiAoZWxlbSkge1xuXHRcdFx0cmV0dXJuIGVsZW0uY3VycmVudFN0eWxlID8gZWxlbS5jdXJyZW50U3R5bGUgOiB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKTtcblx0XHR9O1xuXG5cdFx0Ly8gZ2V0IGVsZW1lbnQgZGltZW5zaW9uICh3aWR0aCBvciBoZWlnaHQpXG5cdFx0dmFyIF9kaW1lbnNpb24gPSBmdW5jdGlvbiAod2hpY2gsIGVsZW0sIG91dGVyLCBpbmNsdWRlTWFyZ2luKSB7XG5cdFx0XHRlbGVtID0gKGVsZW0gPT09IGRvY3VtZW50KSA/IHdpbmRvdyA6IGVsZW07XG5cdFx0XHRpZiAoZWxlbSA9PT0gd2luZG93KSB7XG5cdFx0XHRcdGluY2x1ZGVNYXJnaW4gPSBmYWxzZTtcblx0XHRcdH0gZWxzZSBpZiAoIV90eXBlLkRvbUVsZW1lbnQoZWxlbSkpIHtcblx0XHRcdFx0cmV0dXJuIDA7XG5cdFx0XHR9XG5cdFx0XHR3aGljaCA9IHdoaWNoLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgd2hpY2guc3Vic3RyKDEpLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHR2YXIgZGltZW5zaW9uID0gKG91dGVyID8gZWxlbVsnb2Zmc2V0JyArIHdoaWNoXSB8fCBlbGVtWydvdXRlcicgKyB3aGljaF0gOiBlbGVtWydjbGllbnQnICsgd2hpY2hdIHx8IGVsZW1bJ2lubmVyJyArIHdoaWNoXSkgfHwgMDtcblx0XHRcdGlmIChvdXRlciAmJiBpbmNsdWRlTWFyZ2luKSB7XG5cdFx0XHRcdHZhciBzdHlsZSA9IF9nZXRDb21wdXRlZFN0eWxlKGVsZW0pO1xuXHRcdFx0XHRkaW1lbnNpb24gKz0gd2hpY2ggPT09ICdIZWlnaHQnID8gZmxvYXR2YWwoc3R5bGUubWFyZ2luVG9wKSArIGZsb2F0dmFsKHN0eWxlLm1hcmdpbkJvdHRvbSkgOiBmbG9hdHZhbChzdHlsZS5tYXJnaW5MZWZ0KSArIGZsb2F0dmFsKHN0eWxlLm1hcmdpblJpZ2h0KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBkaW1lbnNpb247XG5cdFx0fTtcblx0XHQvLyBjb252ZXJ0cyAnbWFyZ2luLXRvcCcgaW50byAnbWFyZ2luVG9wJ1xuXHRcdHZhciBfY2FtZWxDYXNlID0gZnVuY3Rpb24gKHN0cikge1xuXHRcdFx0cmV0dXJuIHN0ci5yZXBsYWNlKC9eW15hLXpdKyhbYS16XSkvZywgJyQxJykucmVwbGFjZSgvLShbYS16XSkvZywgZnVuY3Rpb24gKGcpIHtcblx0XHRcdFx0cmV0dXJuIGdbMV0udG9VcHBlckNhc2UoKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQgKiBleHRlcm5hbCBoZWxwZXJzXG5cdFx0ICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0ICovXG5cblx0XHQvLyBleHRlbmQgb2JqIOKAkyBzYW1lIGFzIGpRdWVyeS5leHRlbmQoe30sIG9iakEsIG9iakIpXG5cdFx0VS5leHRlbmQgPSBmdW5jdGlvbiAob2JqKSB7XG5cdFx0XHRvYmogPSBvYmogfHwge307XG5cdFx0XHRmb3IgKGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmICghYXJndW1lbnRzW2ldKSB7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0Zm9yICh2YXIga2V5IGluIGFyZ3VtZW50c1tpXSkge1xuXHRcdFx0XHRcdGlmIChhcmd1bWVudHNbaV0uaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHRcdFx0XHRcdFx0b2JqW2tleV0gPSBhcmd1bWVudHNbaV1ba2V5XTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiBvYmo7XG5cdFx0fTtcblxuXHRcdC8vIGNoZWNrIGlmIGEgY3NzIGRpc3BsYXkgdHlwZSByZXN1bHRzIGluIG1hcmdpbi1jb2xsYXBzZSBvciBub3Rcblx0XHRVLmlzTWFyZ2luQ29sbGFwc2VUeXBlID0gZnVuY3Rpb24gKHN0cikge1xuXHRcdFx0cmV0dXJuIFtcImJsb2NrXCIsIFwiZmxleFwiLCBcImxpc3QtaXRlbVwiLCBcInRhYmxlXCIsIFwiLXdlYmtpdC1ib3hcIl0uaW5kZXhPZihzdHIpID4gLTE7XG5cdFx0fTtcblxuXHRcdC8vIGltcGxlbWVudGF0aW9uIG9mIHJlcXVlc3RBbmltYXRpb25GcmFtZVxuXHRcdC8vIGJhc2VkIG9uIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL3BhdWxpcmlzaC8xNTc5NjcxXG5cdFx0dmFyXG5cdFx0bGFzdFRpbWUgPSAwLFxuXHRcdFx0dmVuZG9ycyA9IFsnbXMnLCAnbW96JywgJ3dlYmtpdCcsICdvJ107XG5cdFx0dmFyIF9yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuXHRcdHZhciBfY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWU7XG5cdFx0Ly8gdHJ5IHZlbmRvciBwcmVmaXhlcyBpZiB0aGUgYWJvdmUgZG9lc24ndCB3b3JrXG5cdFx0Zm9yIChpID0gMDsgIV9yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgJiYgaSA8IHZlbmRvcnMubGVuZ3RoOyArK2kpIHtcblx0XHRcdF9yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3dbdmVuZG9yc1tpXSArICdSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcblx0XHRcdF9jYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2ZW5kb3JzW2ldICsgJ0NhbmNlbEFuaW1hdGlvbkZyYW1lJ10gfHwgd2luZG93W3ZlbmRvcnNbaV0gKyAnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG5cdFx0fVxuXG5cdFx0Ly8gZmFsbGJhY2tzXG5cdFx0aWYgKCFfcmVxdWVzdEFuaW1hdGlvbkZyYW1lKSB7XG5cdFx0XHRfcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG5cdFx0XHRcdHZhclxuXHRcdFx0XHRjdXJyVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpLFxuXHRcdFx0XHRcdHRpbWVUb0NhbGwgPSBNYXRoLm1heCgwLCAxNiAtIChjdXJyVGltZSAtIGxhc3RUaW1lKSksXG5cdFx0XHRcdFx0aWQgPSB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHRjYWxsYmFjayhjdXJyVGltZSArIHRpbWVUb0NhbGwpO1xuXHRcdFx0XHRcdH0sIHRpbWVUb0NhbGwpO1xuXHRcdFx0XHRsYXN0VGltZSA9IGN1cnJUaW1lICsgdGltZVRvQ2FsbDtcblx0XHRcdFx0cmV0dXJuIGlkO1xuXHRcdFx0fTtcblx0XHR9XG5cdFx0aWYgKCFfY2FuY2VsQW5pbWF0aW9uRnJhbWUpIHtcblx0XHRcdF9jYW5jZWxBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uIChpZCkge1xuXHRcdFx0XHR3aW5kb3cuY2xlYXJUaW1lb3V0KGlkKTtcblx0XHRcdH07XG5cdFx0fVxuXHRcdFUuckFGID0gX3JlcXVlc3RBbmltYXRpb25GcmFtZS5iaW5kKHdpbmRvdyk7XG5cdFx0VS5jQUYgPSBfY2FuY2VsQW5pbWF0aW9uRnJhbWUuYmluZCh3aW5kb3cpO1xuXG5cdFx0dmFyXG5cdFx0bG9nbGV2ZWxzID0gW1wiZXJyb3JcIiwgXCJ3YXJuXCIsIFwibG9nXCJdLFxuXHRcdFx0Y29uc29sZSA9IHdpbmRvdy5jb25zb2xlIHx8IHt9O1xuXG5cdFx0Y29uc29sZS5sb2cgPSBjb25zb2xlLmxvZyB8fFxuXHRcdGZ1bmN0aW9uICgpIHt9OyAvLyBubyBjb25zb2xlIGxvZywgd2VsbCAtIGRvIG5vdGhpbmcgdGhlbi4uLlxuXHRcdC8vIG1ha2Ugc3VyZSBtZXRob2RzIGZvciBhbGwgbGV2ZWxzIGV4aXN0LlxuXHRcdGZvciAoaSA9IDA7IGkgPCBsb2dsZXZlbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBtZXRob2QgPSBsb2dsZXZlbHNbaV07XG5cdFx0XHRpZiAoIWNvbnNvbGVbbWV0aG9kXSkge1xuXHRcdFx0XHRjb25zb2xlW21ldGhvZF0gPSBjb25zb2xlLmxvZzsgLy8gcHJlZmVyIC5sb2cgb3ZlciBub3RoaW5nXG5cdFx0XHR9XG5cdFx0fVxuXHRcdFUubG9nID0gZnVuY3Rpb24gKGxvZ2xldmVsKSB7XG5cdFx0XHRpZiAobG9nbGV2ZWwgPiBsb2dsZXZlbHMubGVuZ3RoIHx8IGxvZ2xldmVsIDw9IDApIGxvZ2xldmVsID0gbG9nbGV2ZWxzLmxlbmd0aDtcblx0XHRcdHZhciBub3cgPSBuZXcgRGF0ZSgpLFxuXHRcdFx0XHR0aW1lID0gKFwiMFwiICsgbm93LmdldEhvdXJzKCkpLnNsaWNlKC0yKSArIFwiOlwiICsgKFwiMFwiICsgbm93LmdldE1pbnV0ZXMoKSkuc2xpY2UoLTIpICsgXCI6XCIgKyAoXCIwXCIgKyBub3cuZ2V0U2Vjb25kcygpKS5zbGljZSgtMikgKyBcIjpcIiArIChcIjAwXCIgKyBub3cuZ2V0TWlsbGlzZWNvbmRzKCkpLnNsaWNlKC0zKSxcblx0XHRcdFx0bWV0aG9kID0gbG9nbGV2ZWxzW2xvZ2xldmVsIC0gMV0sXG5cdFx0XHRcdGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc3BsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSxcblx0XHRcdFx0ZnVuYyA9IEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kLmNhbGwoY29uc29sZVttZXRob2RdLCBjb25zb2xlKTtcblx0XHRcdGFyZ3MudW5zaGlmdCh0aW1lKTtcblx0XHRcdGZ1bmMuYXBwbHkoY29uc29sZSwgYXJncyk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCAqIHR5cGUgdGVzdGluZ1xuXHRcdCAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCAqL1xuXG5cdFx0dmFyIF90eXBlID0gVS50eXBlID0gZnVuY3Rpb24gKHYpIHtcblx0XHRcdHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodikucmVwbGFjZSgvXlxcW29iamVjdCAoLispXFxdJC8sIFwiJDFcIikudG9Mb3dlckNhc2UoKTtcblx0XHR9O1xuXHRcdF90eXBlLlN0cmluZyA9IGZ1bmN0aW9uICh2KSB7XG5cdFx0XHRyZXR1cm4gX3R5cGUodikgPT09ICdzdHJpbmcnO1xuXHRcdH07XG5cdFx0X3R5cGUuRnVuY3Rpb24gPSBmdW5jdGlvbiAodikge1xuXHRcdFx0cmV0dXJuIF90eXBlKHYpID09PSAnZnVuY3Rpb24nO1xuXHRcdH07XG5cdFx0X3R5cGUuQXJyYXkgPSBmdW5jdGlvbiAodikge1xuXHRcdFx0cmV0dXJuIEFycmF5LmlzQXJyYXkodik7XG5cdFx0fTtcblx0XHRfdHlwZS5OdW1iZXIgPSBmdW5jdGlvbiAodikge1xuXHRcdFx0cmV0dXJuICFfdHlwZS5BcnJheSh2KSAmJiAodiAtIHBhcnNlRmxvYXQodikgKyAxKSA+PSAwO1xuXHRcdH07XG5cdFx0X3R5cGUuRG9tRWxlbWVudCA9IGZ1bmN0aW9uIChvKSB7XG5cdFx0XHRyZXR1cm4gKFxuXHRcdFx0dHlwZW9mIEhUTUxFbGVtZW50ID09PSBcIm9iamVjdFwiID8gbyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50IDogLy9ET00yXG5cdFx0XHRvICYmIHR5cGVvZiBvID09PSBcIm9iamVjdFwiICYmIG8gIT09IG51bGwgJiYgby5ub2RlVHlwZSA9PT0gMSAmJiB0eXBlb2Ygby5ub2RlTmFtZSA9PT0gXCJzdHJpbmdcIik7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCAqIERPTSBFbGVtZW50IGluZm9cblx0XHQgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQgKi9cblx0XHQvLyBhbHdheXMgcmV0dXJucyBhIGxpc3Qgb2YgbWF0Y2hpbmcgRE9NIGVsZW1lbnRzLCBmcm9tIGEgc2VsZWN0b3IsIGEgRE9NIGVsZW1lbnQgb3IgYW4gbGlzdCBvZiBlbGVtZW50cyBvciBldmVuIGFuIGFycmF5IG9mIHNlbGVjdG9yc1xuXHRcdHZhciBfZ2V0ID0gVS5nZXQgPSB7fTtcblx0XHRfZ2V0LmVsZW1lbnRzID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG5cdFx0XHR2YXIgYXJyID0gW107XG5cdFx0XHRpZiAoX3R5cGUuU3RyaW5nKHNlbGVjdG9yKSkge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdHNlbGVjdG9yID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHsgLy8gaW52YWxpZCBzZWxlY3RvclxuXHRcdFx0XHRcdHJldHVybiBhcnI7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmIChfdHlwZShzZWxlY3RvcikgPT09ICdub2RlbGlzdCcgfHwgX3R5cGUuQXJyYXkoc2VsZWN0b3IpKSB7XG5cdFx0XHRcdGZvciAodmFyIGkgPSAwLCByZWYgPSBhcnIubGVuZ3RoID0gc2VsZWN0b3IubGVuZ3RoOyBpIDwgcmVmOyBpKyspIHsgLy8gbGlzdCBvZiBlbGVtZW50c1xuXHRcdFx0XHRcdHZhciBlbGVtID0gc2VsZWN0b3JbaV07XG5cdFx0XHRcdFx0YXJyW2ldID0gX3R5cGUuRG9tRWxlbWVudChlbGVtKSA/IGVsZW0gOiBfZ2V0LmVsZW1lbnRzKGVsZW0pOyAvLyBpZiBub3QgYW4gZWxlbWVudCwgdHJ5IHRvIHJlc29sdmUgcmVjdXJzaXZlbHlcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmIChfdHlwZS5Eb21FbGVtZW50KHNlbGVjdG9yKSB8fCBzZWxlY3RvciA9PT0gZG9jdW1lbnQgfHwgc2VsZWN0b3IgPT09IHdpbmRvdykge1xuXHRcdFx0XHRhcnIgPSBbc2VsZWN0b3JdOyAvLyBvbmx5IHRoZSBlbGVtZW50XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gYXJyO1xuXHRcdH07XG5cdFx0Ly8gZ2V0IHNjcm9sbCB0b3AgdmFsdWVcblx0XHRfZ2V0LnNjcm9sbFRvcCA9IGZ1bmN0aW9uIChlbGVtKSB7XG5cdFx0XHRyZXR1cm4gKGVsZW0gJiYgdHlwZW9mIGVsZW0uc2Nyb2xsVG9wID09PSAnbnVtYmVyJykgPyBlbGVtLnNjcm9sbFRvcCA6IHdpbmRvdy5wYWdlWU9mZnNldCB8fCAwO1xuXHRcdH07XG5cdFx0Ly8gZ2V0IHNjcm9sbCBsZWZ0IHZhbHVlXG5cdFx0X2dldC5zY3JvbGxMZWZ0ID0gZnVuY3Rpb24gKGVsZW0pIHtcblx0XHRcdHJldHVybiAoZWxlbSAmJiB0eXBlb2YgZWxlbS5zY3JvbGxMZWZ0ID09PSAnbnVtYmVyJykgPyBlbGVtLnNjcm9sbExlZnQgOiB3aW5kb3cucGFnZVhPZmZzZXQgfHwgMDtcblx0XHR9O1xuXHRcdC8vIGdldCBlbGVtZW50IGhlaWdodFxuXHRcdF9nZXQud2lkdGggPSBmdW5jdGlvbiAoZWxlbSwgb3V0ZXIsIGluY2x1ZGVNYXJnaW4pIHtcblx0XHRcdHJldHVybiBfZGltZW5zaW9uKCd3aWR0aCcsIGVsZW0sIG91dGVyLCBpbmNsdWRlTWFyZ2luKTtcblx0XHR9O1xuXHRcdC8vIGdldCBlbGVtZW50IHdpZHRoXG5cdFx0X2dldC5oZWlnaHQgPSBmdW5jdGlvbiAoZWxlbSwgb3V0ZXIsIGluY2x1ZGVNYXJnaW4pIHtcblx0XHRcdHJldHVybiBfZGltZW5zaW9uKCdoZWlnaHQnLCBlbGVtLCBvdXRlciwgaW5jbHVkZU1hcmdpbik7XG5cdFx0fTtcblxuXHRcdC8vIGdldCBlbGVtZW50IHBvc2l0aW9uIChvcHRpb25hbGx5IHJlbGF0aXZlIHRvIHZpZXdwb3J0KVxuXHRcdF9nZXQub2Zmc2V0ID0gZnVuY3Rpb24gKGVsZW0sIHJlbGF0aXZlVG9WaWV3cG9ydCkge1xuXHRcdFx0dmFyIG9mZnNldCA9IHtcblx0XHRcdFx0dG9wOiAwLFxuXHRcdFx0XHRsZWZ0OiAwXG5cdFx0XHR9O1xuXHRcdFx0aWYgKGVsZW0gJiYgZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QpIHsgLy8gY2hlY2sgaWYgYXZhaWxhYmxlXG5cdFx0XHRcdHZhciByZWN0ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0XHRcdFx0b2Zmc2V0LnRvcCA9IHJlY3QudG9wO1xuXHRcdFx0XHRvZmZzZXQubGVmdCA9IHJlY3QubGVmdDtcblx0XHRcdFx0aWYgKCFyZWxhdGl2ZVRvVmlld3BvcnQpIHsgLy8gY2xpZW50UmVjdCBpcyBieSBkZWZhdWx0IHJlbGF0aXZlIHRvIHZpZXdwb3J0Li4uXG5cdFx0XHRcdFx0b2Zmc2V0LnRvcCArPSBfZ2V0LnNjcm9sbFRvcCgpO1xuXHRcdFx0XHRcdG9mZnNldC5sZWZ0ICs9IF9nZXQuc2Nyb2xsTGVmdCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gb2Zmc2V0O1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQgKiBET00gRWxlbWVudCBtYW5pcHVsYXRpb25cblx0XHQgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQgKi9cblxuXHRcdFUuYWRkQ2xhc3MgPSBmdW5jdGlvbiAoZWxlbSwgY2xhc3NuYW1lKSB7XG5cdFx0XHRpZiAoY2xhc3NuYW1lKSB7XG5cdFx0XHRcdGlmIChlbGVtLmNsYXNzTGlzdCkgZWxlbS5jbGFzc0xpc3QuYWRkKGNsYXNzbmFtZSk7XG5cdFx0XHRcdGVsc2UgZWxlbS5jbGFzc05hbWUgKz0gJyAnICsgY2xhc3NuYW1lO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0VS5yZW1vdmVDbGFzcyA9IGZ1bmN0aW9uIChlbGVtLCBjbGFzc25hbWUpIHtcblx0XHRcdGlmIChjbGFzc25hbWUpIHtcblx0XHRcdFx0aWYgKGVsZW0uY2xhc3NMaXN0KSBlbGVtLmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NuYW1lKTtcblx0XHRcdFx0ZWxzZSBlbGVtLmNsYXNzTmFtZSA9IGVsZW0uY2xhc3NOYW1lLnJlcGxhY2UobmV3IFJlZ0V4cCgnKF58XFxcXGIpJyArIGNsYXNzbmFtZS5zcGxpdCgnICcpLmpvaW4oJ3wnKSArICcoXFxcXGJ8JCknLCAnZ2knKSwgJyAnKTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdC8vIGlmIG9wdGlvbnMgaXMgc3RyaW5nIC0+IHJldHVybnMgY3NzIHZhbHVlXG5cdFx0Ly8gaWYgb3B0aW9ucyBpcyBhcnJheSAtPiByZXR1cm5zIG9iamVjdCB3aXRoIGNzcyB2YWx1ZSBwYWlyc1xuXHRcdC8vIGlmIG9wdGlvbnMgaXMgb2JqZWN0IC0+IHNldCBuZXcgY3NzIHZhbHVlc1xuXHRcdFUuY3NzID0gZnVuY3Rpb24gKGVsZW0sIG9wdGlvbnMpIHtcblx0XHRcdGlmIChfdHlwZS5TdHJpbmcob3B0aW9ucykpIHtcblx0XHRcdFx0cmV0dXJuIF9nZXRDb21wdXRlZFN0eWxlKGVsZW0pW19jYW1lbENhc2Uob3B0aW9ucyldO1xuXHRcdFx0fSBlbHNlIGlmIChfdHlwZS5BcnJheShvcHRpb25zKSkge1xuXHRcdFx0XHR2YXJcblx0XHRcdFx0b2JqID0ge30sXG5cdFx0XHRcdFx0c3R5bGUgPSBfZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKTtcblx0XHRcdFx0b3B0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChvcHRpb24sIGtleSkge1xuXHRcdFx0XHRcdG9ialtvcHRpb25dID0gc3R5bGVbX2NhbWVsQ2FzZShvcHRpb24pXTtcblx0XHRcdFx0fSk7XG5cdFx0XHRcdHJldHVybiBvYmo7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRmb3IgKHZhciBvcHRpb24gaW4gb3B0aW9ucykge1xuXHRcdFx0XHRcdHZhciB2YWwgPSBvcHRpb25zW29wdGlvbl07XG5cdFx0XHRcdFx0aWYgKHZhbCA9PSBwYXJzZUZsb2F0KHZhbCkpIHsgLy8gYXNzdW1lIHBpeGVsIGZvciBzZWVtaW5nbHkgbnVtZXJpY2FsIHZhbHVlc1xuXHRcdFx0XHRcdFx0dmFsICs9ICdweCc7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsZW0uc3R5bGVbX2NhbWVsQ2FzZShvcHRpb24pXSA9IHZhbDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRyZXR1cm4gVTtcblx0fSh3aW5kb3cgfHwge30pKTtcblxuXHRTY3JvbGxNYWdpYy5TY2VuZS5wcm90b3R5cGUuYWRkSW5kaWNhdG9ycyA9IGZ1bmN0aW9uICgpIHtcblx0XHRTY3JvbGxNYWdpYy5fdXRpbC5sb2coMSwgJyhTY3JvbGxNYWdpYy5TY2VuZSkgLT4gRVJST1IgY2FsbGluZyBhZGRJbmRpY2F0b3JzKCkgZHVlIHRvIG1pc3NpbmcgUGx1Z2luIFxcJ2RlYnVnLmFkZEluZGljYXRvcnNcXCcuIFBsZWFzZSBtYWtlIHN1cmUgdG8gaW5jbHVkZSBwbHVnaW5zL2RlYnVnLmFkZEluZGljYXRvcnMuanMnKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXHRTY3JvbGxNYWdpYy5TY2VuZS5wcm90b3R5cGUucmVtb3ZlSW5kaWNhdG9ycyA9IGZ1bmN0aW9uICgpIHtcblx0XHRTY3JvbGxNYWdpYy5fdXRpbC5sb2coMSwgJyhTY3JvbGxNYWdpYy5TY2VuZSkgLT4gRVJST1IgY2FsbGluZyByZW1vdmVJbmRpY2F0b3JzKCkgZHVlIHRvIG1pc3NpbmcgUGx1Z2luIFxcJ2RlYnVnLmFkZEluZGljYXRvcnNcXCcuIFBsZWFzZSBtYWtlIHN1cmUgdG8gaW5jbHVkZSBwbHVnaW5zL2RlYnVnLmFkZEluZGljYXRvcnMuanMnKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXHRTY3JvbGxNYWdpYy5TY2VuZS5wcm90b3R5cGUuc2V0VHdlZW4gPSBmdW5jdGlvbiAoKSB7XG5cdFx0U2Nyb2xsTWFnaWMuX3V0aWwubG9nKDEsICcoU2Nyb2xsTWFnaWMuU2NlbmUpIC0+IEVSUk9SIGNhbGxpbmcgc2V0VHdlZW4oKSBkdWUgdG8gbWlzc2luZyBQbHVnaW4gXFwnYW5pbWF0aW9uLmdzYXBcXCcuIFBsZWFzZSBtYWtlIHN1cmUgdG8gaW5jbHVkZSBwbHVnaW5zL2FuaW1hdGlvbi5nc2FwLmpzJyk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblx0U2Nyb2xsTWFnaWMuU2NlbmUucHJvdG90eXBlLnJlbW92ZVR3ZWVuID0gZnVuY3Rpb24gKCkge1xuXHRcdFNjcm9sbE1hZ2ljLl91dGlsLmxvZygxLCAnKFNjcm9sbE1hZ2ljLlNjZW5lKSAtPiBFUlJPUiBjYWxsaW5nIHJlbW92ZVR3ZWVuKCkgZHVlIHRvIG1pc3NpbmcgUGx1Z2luIFxcJ2FuaW1hdGlvbi5nc2FwXFwnLiBQbGVhc2UgbWFrZSBzdXJlIHRvIGluY2x1ZGUgcGx1Z2lucy9hbmltYXRpb24uZ3NhcC5qcycpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cdFNjcm9sbE1hZ2ljLlNjZW5lLnByb3RvdHlwZS5zZXRWZWxvY2l0eSA9IGZ1bmN0aW9uICgpIHtcblx0XHRTY3JvbGxNYWdpYy5fdXRpbC5sb2coMSwgJyhTY3JvbGxNYWdpYy5TY2VuZSkgLT4gRVJST1IgY2FsbGluZyBzZXRWZWxvY2l0eSgpIGR1ZSB0byBtaXNzaW5nIFBsdWdpbiBcXCdhbmltYXRpb24udmVsb2NpdHlcXCcuIFBsZWFzZSBtYWtlIHN1cmUgdG8gaW5jbHVkZSBwbHVnaW5zL2FuaW1hdGlvbi52ZWxvY2l0eS5qcycpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cdFNjcm9sbE1hZ2ljLlNjZW5lLnByb3RvdHlwZS5yZW1vdmVWZWxvY2l0eSA9IGZ1bmN0aW9uICgpIHtcblx0XHRTY3JvbGxNYWdpYy5fdXRpbC5sb2coMSwgJyhTY3JvbGxNYWdpYy5TY2VuZSkgLT4gRVJST1IgY2FsbGluZyByZW1vdmVWZWxvY2l0eSgpIGR1ZSB0byBtaXNzaW5nIFBsdWdpbiBcXCdhbmltYXRpb24udmVsb2NpdHlcXCcuIFBsZWFzZSBtYWtlIHN1cmUgdG8gaW5jbHVkZSBwbHVnaW5zL2FuaW1hdGlvbi52ZWxvY2l0eS5qcycpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0cmV0dXJuIFNjcm9sbE1hZ2ljO1xufSkpOyJdfQ==
