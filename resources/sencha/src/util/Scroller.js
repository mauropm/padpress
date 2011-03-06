/**
 * @class Ext.util.Scroller
 * @extends Ext.util.Observable
 */
Ext.util.Scroller = Ext.extend(Ext.util.Observable, {
    /**
     * @cfg {Boolean/String} bounces
     * Enable bouncing during scrolling past the bounds. Defaults to true. (Which is 'both').
     * You can also specify 'vertical', 'horizontal', or 'both'
     */
    bounces: true,

    momentumResetTime: 200,

    /**
     * @cfg {Number} friction
     * The friction of the scroller.
     * By raising this value the length that momentum scrolls becomes shorter. This value is best kept
     * between 0 and 1. The default value is 0.3
     */
    friction: 0.3,
    acceleration: 20,

    /**
     * @cfg {Boolean} momentum
     * Enable momentum scrolling. Defaults to true.
     */
    momentum: true,

    /**
     * @cfg {Boolean} horizontal
     * Enable horizontal scrolling. Defaults to false.
     */
    horizontal: false,

    /**
     * @cfg {Boolean} vertical
     * Enables vertical scrolling. Defaults to true.
     */
    vertical: true,

    /**
     * @cfg {Boolean/Number/Object} snap
     * Snaps to to a grid after each scroll. Defaults to false.
     * This can either be a number in which case it will be used for both horizontal and vertical snapping.
     * You can also pass an object with x and y properties.
     * By passing true the snapping value will default to 50.
     */
    snap: false,

    /**
     * @cfg {Boolean} scrollbars
     * Turn on a visual ui indicator for scrolling. Defaults to true.
     */
    scrollbars: true,

    /**
     * @cfg {Number} fps
     * The desired fps of the deceleration. Defaults to 80.
     */
    fps: 60,

    /**
     * @cfg {Number} springTension
     * The tension of the spring that is attached to the scroller when it bounces.
     * By raising this value the bounce becomes shorter. This value is best kept
     * between 0 and 1. The default value is 0.2
     */
    springTension: 0.2,

    /**
     * @cfg {String} ui
     * The ui you want to use for this scroller. This affects the scrollbar colors.
     * Can be dark or light. Defaults to dark.
     */
    ui: 'dark',

    /**
     * @cfg {String} scrollToEasing
     * The default easing to use when calling scrollTo with animate true.
     * Defaults to cubic-bezier(0.4, .75, 0.5, .95).
     */
    scrollToEasing : 'cubic-bezier(0.4, .75, 0.5, .95)',
    /**
     * @cfg {Number} scrollToDuration
     * The default duration of the transition when calling scrollTo with animate true.
     * Defaults to 500.
     */
    scrollToDuration: 500,

    /**
     * @constructor
     * @param {Mixed} el An Ext.Element, HTMLElement or string linking to the id
     * of an Element.
     * @param {Object} config
     */
    constructor : function(el, config) {
        config = config || {};
        Ext.apply(this, config);

        this.addEvents(
            /**
             * @event scrollstart
             * @param {Ext.EventObject} e
             * @param {Ext.Scroller} this
             */
            'scrollstart',
            /**
             * @event scrollend
             * @param {Ext.Scroller} this
             */
            'scrollend',
            /**
             * @event touchstart
             * @param {Ext.EventObject} e
             * @param {Ext.Scroller} this
             */
            'touchstart',
            /**
             * @event touchend
             * @param {Ext.EventObject} e
             * @param {Ext.Scroller} this
             */
            'touchend'
        );

        Ext.util.Scroller.superclass.constructor.call(this);

        var scroller = this.scroller = Ext.get(el);

        scroller.addClass('x-scroller');
        this.parent = scroller.parent();
        this.parent.addClass('x-scroller-parent');

        this.offset = {x: 0, y: 0};

        // Set up the touch start event handler.
        // On touch start we will cancel any running transitions
        this.parent.on({
            touchstart: this.onTouchStart,
            touchend: this.onTouchEnd,
            scrollstart: this.onScrollStart,
            scrollend: this.onScrollEnd,
            scroll: this.onScroll,
            horizontal: this.horizontal,
            vertical: this.vertical,
            scope: this
        });

        if (this.bounces !== false) {
            var both = this.bounces === 'both' || this.bounces === true,
                horizontal = both || this.bounces === 'horizontal',
                vertical = both || this.bounces === 'vertical';

            this.bounces = {
                horizontal: horizontal,
                vertical: vertical
            };
        }

        this.scrollTask = new Ext.util.DelayedTask(this.handleScrollFrame, this);

        if (this.scrollbars) {
            if (this.horizontal) {
                this.scrollbarX = new Ext.util.Scroller.Scrollbar(this, 'horizontal');
            }

            if (this.vertical) {
                this.scrollbarY = new Ext.util.Scroller.Scrollbar(this, 'vertical');
            }
        }

        this.scroller.on('webkitTransitionEnd', this.onTransitionEnd, this);
    },

    // @private
    onTouchStart : function(e) {
        var scroller = this.scroller,
            style = scroller.dom.style,
            transform;

        if (Ext.platform.isAndroidOS) {
            e.browserEvent.preventDefault();
            e.browserEvent.stopPropagation();
        }

        if (e.touches.length > 1) {
            return;
        }

        this.followTouch = e.touch;

        this.omega = 1 - (this.friction / 10);

        if (this.animating) {
            // Stop the current transition.
            if (this.inTransition) {
                style.webkitTransitionDuration = '0ms';
                transform = new WebKitCSSMatrix(window.getComputedStyle(scroller.dom).webkitTransform);
                style.webkitTransform = 'translate3d(' + transform.m41 + 'px, ' + transform.m42 + 'px, 0)';

                this.offset = {
                    x: transform.m41,
                    y: transform.m42
                };
                this.inTransition = false;
            }

            this.scrollTask.cancel();

            this.snapToBounds(false);

            if (this.scrollbarX) {
                this.scrollbarX.stop();
            }
            if (this.scrollbarY) {
                this.scrollbarY.stop();
            }

            this.animating = false;
            this.fireEvent('scrollend', this, this.offset);
        }

        this.updateBounds();
        if (this.momentum) {
            this.resetMomentum(e);
        }

        this.fireEvent('touchstart', e, this);
    },

    // @private
    onScrollStart : function(e, t) {
        // This will prevent the click event to be fired during the scroll operation
        Ext.getDoc().on('click', function(e) {
            e.preventDefault();
        }, this, {single: true});

        if (e.touch != this.followTouch) {
            return;
        }

        if (this.momentum) {
            this.addMomentum(e);
        }

        this.fireEvent('scrollstart', e, this);
    },

    // @private
    onScroll : function(e, t) {
        if (e.touch != this.followTouch) {
            return;
        }

        e.stopPropagation();

        var previousDeltaX = e.previousDeltaX,
            previousDeltaY = e.previousDeltaY,
            newX = this.horizontal ? (this.offset.x + previousDeltaX) : 0,
            newY = this.vertical ? (this.offset.y + previousDeltaY) : 0,
            pos = {x: newX, y: newY},
            boundsPos = this.constrainToBounds(pos);

        // If bounces is enabled, we want to slow down the drag
        if (this.bounces) {
            if (this.bounces.horizontal) {
                if (newX < this.bounds.x) {
                    newX = this.offset.x + (previousDeltaX / 2);
                }
                else if (newX > 0) {
                    newX = this.offset.x + (previousDeltaX / 2);
                }
            }
            else {
                newX = boundsPos.x;
            }
            if (this.bounces.vertical) {
                if (newY < this.bounds.y) {
                    newY = this.offset.y + (previousDeltaY / 2);
                }
                else if (newY > 0) {
                    newY = this.offset.y + (previousDeltaY / 2);
                }
            }
            else {
                newY = boundsPos.y;
            }

            pos = {x: newX, y: newY};
        }
        else {
            pos = boundsPos;
        }

        // Perform the actual scroll
        this._scrollTo(pos);

        if (this.momentum) {
            // Add the current offset as a momentum point
            this.addMomentum(e);
        }
    },

    // @private
    onTouchEnd : function(e, t) {
        if (e.touch != this.followTouch) {
            return;
        }
        this.fireEvent('touchend', e, this);
    },

    // We are going to decelerate based on the momentum
    // @private
    onScrollEnd : function(e, t) {
        if (e.touch != this.followTouch) {
            return;
        }

        // This will clear out all momentum points that arent valid anymore
        if (this.momentum) {
            this.validateMomentum();
            if (this.momentumPoints.length > 1) {
                var momentum = this.momentumPoints,
                    offset = this.offset,
                    bounds = this.bounds,

                    // Get the first and last points that are within the momentum
                    oldestMomentum = momentum.shift(),
                    latestMomentum = momentum.pop(),

                    // The distance we have dragged within this momentum
                    distance = {
                        x: latestMomentum.offset.x - oldestMomentum.offset.x,
                        y: latestMomentum.offset.y - oldestMomentum.offset.y
                    },

                    // Determine the duration of the momentum
                    duration = (latestMomentum.time - oldestMomentum.time),

                    // Determine the deceleration velocity
                    velocity = {
                        x: distance.x / (duration / this.acceleration),
                        y: distance.y / (duration / this.acceleration)
                    };

                this.applyVelocity(velocity);
            }
        }

        // If there is no animation or deceleration going on, then make sure we are within bounds
        if (!this.animating) {
            this.snapToBounds(true);
        }

        // If the snapToBounds call above has been fired we can suddenly be animating again which
        // means the scroll has not ended yet
        if (!this.animating) {
            this.fireEvent('scrollend', this, this.offset);
        }
    },

    // @private
    onTransitionEnd : function() {
        if (this.inTransition) {
            this.scroller.dom.style.webkitTransitionDuration = '0ms';
            this.inTransition = false;
            this.fireEvent('scrollend', this, this.offset);
        }
    },

    /**
     * Scroll to a position with optional animation
     * @param {Object} pos An object with x and y scroll position
     * @param {Mixed} animate Time in ms or an animation config object
     * @param {String} easing Type of easing
     */
    scrollTo : function(pos, animate, easing) {
        this.updateBounds();

        // store the actual position in a private variable
        pos = this.constrainToBounds({x: Math.round(-pos.x), y: Math.round(-pos.y)});

        this.scrollTask.cancel();
        if (animate) {
            this.animating = true;
            this.inTransition = true;

            // We scroll using webkit transforms in combination with the translate property.
            // This is much faster then animating the top and left values
            var style = this.scroller.dom.style;
            style.webkitTransitionTimingFunction = easing || this.scrollToEasing;
            style.webkitTransitionDuration = (typeof animate == 'number') ? (animate + 'ms') : (this.scrollToDuration + 'ms');
            style.webkitTransform = 'translate3d(' + pos.x + 'px, ' + pos.y + 'px, 0)';

            this.offset = pos;

            if (this.scrollbarX) {
                this.scrollbarX.scrollTo(pos, animate, easing || this.scrollToEasing);
            }

            if (this.scrollbarY) {
                this.scrollbarY.scrollTo(pos, animate, easing || this.scrollToEasing);
            }
        }
        else {
            this._scrollTo({x: pos.x, y: pos.y});
        }
    },

    /**
     * @private
     * Handles the actual transformation to scroll
     */
    _scrollTo : function(pos) {
        this.offset = {x: Math.round(pos.x), y: Math.round(pos.y)};

        var style = this.scroller.dom.style;
        style.webkitTransitionDuration = '0ms';
        style.webkitTransform = 'translate3d(' + this.offset.x + 'px, ' + this.offset.y + 'px, 0)';

        if (this.scrollbarX) {
            this.scrollbarX.scrollTo(this.offset);
        }

        if (this.scrollbarY) {
            this.scrollbarY.scrollTo(this.offset);
        }

        this.fireEvent('scroll', this, this.offset);
    },

    /**
     * Handle scroll is being passed a velocity and based on that will decelerate etc.
     * @private
     */
    applyVelocity : function(velocity) {
        velocity = velocity || {x: 0, y: 0};

        var offset = this.offset,
            currentTime = (new Date()).getTime(),
            deceleration = this.deceleration = {
                startTime: currentTime,
                startOffset: {
                    x: offset.x,
                    y: offset.y
                },
                logFriction: Math.log(this.omega),
                startVelocity: velocity
            },
            // Constrain the current offset to the bounds
            pos = this.constrainToBounds(offset),
            bounce = this.bounce = {};

        if (this.bounces && this.bounces.horizontal && pos.x != offset.x) {
            bounce.horizontal = {
                startTime: currentTime - ((1 / this.springTension) * this.acceleration),
                startOffset: pos.x,
                startVelocity: (offset.x - pos.x) * this.springTension * Math.E
            };
            velocity.x = 0;
            this.bouncing = true;
        }

        if (this.bounces && this.bounces.vertical && pos.y != offset.y) {
            bounce.vertical = {
                startTime: currentTime - ((1 / this.springTension) * this.acceleration),
                startOffset: pos.y,
                startVelocity: (offset.y - pos.y) * this.springTension * Math.E
            };
            velocity.y = 0;
            this.bouncing = true;
        }

        this.animating = true;
        this.decelerating = true;
        this.scrollTask.delay(0);
    },

    // @private
    handleScrollFrame : function() {
        var deceleration = this.deceleration,
            bounce = this.bounce = this.bounce || {},
            offset = this.offset,

            currentTime = (new Date()).getTime(),
            deltaTime = (currentTime - deceleration.startTime),
            powFriction = Math.pow(this.omega, deltaTime / this.acceleration),

            currentVelocity = {
                x: deceleration.startVelocity.x * powFriction,
                y: deceleration.startVelocity.y * powFriction
            },

            newPos = {x: offset.x, y: offset.y},
            deltaOffset = {},
            powTime, startOffset, boundsPos;

        if (Math.abs(currentVelocity.x) < 1 && Math.abs(currentVelocity.y) < 1) {
            this.decelerating = false;
        }

        if (!bounce.horizontal && Math.abs(currentVelocity.x) >= 1) {
            deltaOffset.x = (
                (deceleration.startVelocity.x / deceleration.logFriction) -
                (deceleration.startVelocity.x * (powFriction / deceleration.logFriction))
            );
            newPos.x = deceleration.startOffset.x - deltaOffset.x;
        }

        if (!bounce.vertical && Math.abs(currentVelocity.y) >= 1) {
            deltaOffset.y = (
                (deceleration.startVelocity.y / deceleration.logFriction) -
                (deceleration.startVelocity.y * (powFriction / deceleration.logFriction))
            );
            newPos.y = deceleration.startOffset.y - deltaOffset.y;
        }

        boundsPos = this.constrainToBounds(newPos);

        if (boundsPos.x != newPos.x) {
            if (this.bounces && this.bounces.horizontal) {
                if (!bounce.horizontal) {
                    bounce.horizontal = {
                        startTime: currentTime,
                        startOffset: boundsPos.x,
                        startVelocity: currentVelocity.x
                    };
                    this.bouncing = true;
                }
            }
            else {
                newPos.x = boundsPos.x;
            }
            deceleration.startVelocity.x = 0;
        }

        if (boundsPos.y != newPos.y) {
            if (this.bounces && this.bounces.vertical) {
                if (!bounce.vertical) {
                    bounce.vertical = {
                        startTime: currentTime,
                        startOffset: boundsPos.y,
                        startVelocity: currentVelocity.y
                    };
                    this.bouncing = true;
                }
            }
            else {
                newPos.y = boundsPos.y;
            }
            deceleration.startVelocity.y = 0;
        }

        if (bounce.horizontal && bounce.horizontal.startTime != currentTime) {
            deltaTime = (currentTime - bounce.horizontal.startTime);
            powTime = (deltaTime / this.acceleration) * Math.pow(Math.E, -this.springTension * (deltaTime / this.acceleration));
            deltaOffset.x = bounce.horizontal.startVelocity * powTime;
            startOffset = bounce.horizontal.startOffset;

            if (Math.abs(deltaOffset.x) <= 1) {
                deltaOffset.x = 0;
                delete bounce.horizontal;
            }
            newPos.x = startOffset + deltaOffset.x;
        }

        if (bounce.vertical && bounce.vertical.startTime != currentTime) {
            deltaTime = (currentTime - bounce.vertical.startTime);
            powTime = (deltaTime / this.acceleration) * Math.pow(Math.E, -this.springTension * (deltaTime / this.acceleration));
            deltaOffset.y = bounce.vertical.startVelocity * powTime;
            startOffset = bounce.vertical.startOffset;

            if (Math.abs(deltaOffset.y) <= 1) {
                deltaOffset.y = 0;
                delete bounce.vertical;
            }
            newPos.y = startOffset + deltaOffset.y;
        }

        if (!bounce.vertical && !bounce.horizontal) {
            this.bouncing = false;
        }

        if ((!this.bounces || !this.bouncing) && !this.decelerating) {
            this.animating = false;
            this.snapToBounds(false);
            this.fireEvent('scrollend', this, this.offset);
            return;
        }

        this.scrollTask.delay(1000 / this.fps);
        this._scrollTo(newPos);
    },

    // @private
    snapToBounds : function(animate, easing) {
        var pos = this.constrainToBounds(this.offset);
        if (this.snap) {
            if (this.snap === true) {
                this.snap = {
                    x: 50,
                    y: 50
                };
            }
            else if (Ext.isNumber(this.snap)) {
                this.snap = {
                    x: this.snap,
                    y: this.snap
                };
            }
            if (this.snap.y) {
                pos.y = Math.round(pos.y / this.snap.y) * this.snap.y;
            }
            if (this.snap.x) {
                pos.x = Math.round(pos.x / this.snap.x) * this.snap.x;
            }
        }

        if (pos.x != this.offset.x || pos.y != this.offset.y) {
            if (this.snap) {
                this.scrollTo({x: -pos.x, y: -pos.y}, 150, 'ease-in-out');
            }
            else if (animate) {
                this.applyVelocity();
            }
            else {
                this._scrollTo(pos);
            }
        }
    },

    // @private
    updateBounds : function() {
        this.parentSize = {
            width: this.parent.getWidth(true),
            height: this.parent.getHeight(true)
        };

        this.contentSize = {
            width: this.scroller.dom.scrollWidth,
            height: this.scroller.dom.scrollHeight
        };

        // Get the scrollable view size
        this.size = {
            width: Math.max(this.contentSize.width, this.parentSize.width),
            height: Math.max(this.contentSize.height, this.parentSize.height)
        };

        // Determine the boundaries that we can drag between
        this.bounds = {
            x: this.parentSize.width - this.size.width,
            y: this.parentSize.height - this.size.height
        };

        if (this.scrollbarX) {
            this.scrollbarX.update();
        }

        if (this.scrollbarY) {
            this.scrollbarY.update();
        }
    },

    // @private
    constrainToBounds : function(pos) {
        if (!this.bounds) {
            this.updateBounds();
        }
        return {
            x: Math.min(Math.max(this.bounds.x, pos.x), 0),
            y: Math.min(Math.max(this.bounds.y, pos.y), 0)
        };
    },

    // @private
    resetMomentum : function(e) {
        this.momentumPoints = [];
        if (e) {
            this.addMomentum(e);
        }
    },

    // @private
    addMomentum : function(e) {
        this.validateMomentum(e);
        this.momentumPoints.push({
            time: e ? e.time : (new Date()).getTime(),
            offset: {x: this.offset.x, y: this.offset.y}
        });
    },

    // @private
    validateMomentum : function(e) {
        var momentum = this.momentumPoints,
            time = e ? e.time : (new Date()).getTime();

        while (momentum.length) {
            if (time - momentum[0].time <= this.momentumResetTime) {
                break;
            }
            momentum.shift();
        }
    },

    destroy : function() {
        this.scroller.removeClass('x-scroller');
        this.parent.removeClass('x-scroller-parent');

        this.parent.un({
            touchstart: this.onTouchStart,
            touchend: this.onTouchEnd,
            scrollstart: this.onScrollStart,
            scrollend: this.onScrollEnd,
            scroll: this.onScroll,
            horizontal: this.horizontal,
            vertical: this.vertical,
            scope: this
        });

        this.scrollTask.cancel();

        if (this.scrollbars) {
            if (this.horizontal) {
                this.scrollbarX.destroy();
            }

            if (this.vertical) {
                this.scrollbaY.destroy();
            }
        }

        this.scroller.un('webkitTransitionEnd', this.onTransitionEnd, this);
    }
});

if (Ext.platform.isAndroidOS) {
    Ext.apply(Ext.util.Scroller.prototype, {
        momentumResetTime: 600,
        friction: 0.2,
        bounces: false
    });
}

/**
 * @class Ext.util.Scroller.Scrollbar
 * @extends Object
 * @private
 */
Ext.util.Scroller.Scrollbar = Ext.extend(Object, {
    minSize: 4,
    size: 0,
    offset: 10,

    /**
     * @constructor
     * @private
     * @param {Ext.util.Scroller} scroller
     * @param {String} direction 'vertical' or 'horizontal'
     */
    constructor : function(scroller, direction) {
        this.scroller = scroller;
        this.container = scroller.parent;
        this.direction = direction;
        this.bar = this.container.createChild({
            cls: 'x-scrollbar x-scrollbar-' + direction + ' x-scrollbar-' + scroller.ui
        });
        this.hide();
    },

    destroy : function() {
        this.bar.remove();
    },

    // @private
    update : function() {
        var scroller = this.scroller,
            contentSize = scroller.contentSize,
            parentSize = scroller.parentSize,
            size = scroller.size,
            height, width;

        if (this.direction == 'vertical') {
            // make sure the scrollbar only shows when the content is higher then the parent
            if (contentSize.height > parentSize.height) {
                this.size = Math.round((parentSize.height * parentSize.height) / size.height);
                this.autoShow = true;
            }
            else {
                this.autoShow = false;
            }
        }
        else {
            if (contentSize.width > parentSize.width) {
                this.size = Math.round((parentSize.width * parentSize.width) / size.width);
                this.autoShow = true;
            }
            else {
                this.autoShow = false;
            }
        }
    },

    // @private
    scrollTo : function(pos, animate, easing) {
        var me = this,
            scroller = me.scroller,
            style = me.bar.dom.style,
            transformX = 0,
            transformY = 0,
            size = me.size,
            boundsPos = scroller.constrainToBounds(pos);

        if (!me.autoShow) {
            return;
        }

        clearTimeout(me.hideTimeout);
        me.hideTimeout = setTimeout(function() {
            me.hide();
        }, 800);

        if (me.hidden) {
            me.show();
        }

        if (me.direction == 'horizontal') {
            if (pos.x != boundsPos.x) {
                size = Math.max(size - Math.abs(pos.x - boundsPos.x), me.minSize);
                if (pos.x > boundsPos.x) {
                    transformX = boundsPos.x + me.offset;
                }
                else if (pos.x < boundsPos.x) {
                    transformX = scroller.parentSize.width - size - me.offset;
                }
            }
            else {
                transformX = ((scroller.parentSize.width - size - (me.offset * 2)) / scroller.bounds.x * scroller.offset.x) + me.offset;
            }
            style.width = size + 'px';
        }
        else {
            if (pos.y != boundsPos.y) {
                size = Math.max(size - Math.abs(pos.y - boundsPos.y), me.minSize);
                if (pos.y > boundsPos.y) {
                    transformY = boundsPos.y + me.offset;
                }
                else if (pos.y < boundsPos.y) {
                    transformY = scroller.parentSize.height - size - me.offset;
                }
            }
            else {
                transformY = ((scroller.parentSize.height - size - (me.offset * 2)) / scroller.bounds.y * scroller.offset.y) + me.offset;
            }
            style.height = size + 'px';
        }

        if (animate) {
            style.webkitTransitionDuration = (typeof animate == 'number' ? animate : scroller.scrollToDuration) + 'ms, 500ms';
            style.webkitTransitionTimingFunction = easing;
        }
        else {
            style.webkitTransitionDuration = '0ms, 500ms';
        }

        style.webkitTransform = 'translate3d(' + transformX + 'px, ' + transformY + 'px, 0px)';
    },

    /**
     * Hide the scrollbar
     * @private
     */
    hide : function() {
        this.bar.setStyle('opacity', '0');
        this.hidden = true;
    },

    /**
     * Show the scrollbar
     * @private
     */
    show : function() {
        this.bar.setStyle('opacity', '1');
        this.hidden = false;
    },

    /**
     * Stop the scrollbar animation
     * @private
     */
    stop : function() {
        var style = this.bar.dom.style,
            transform;

        style.webkitTransitionDuration = '0ms';
        transform = new WebKitCSSMatrix(window.getComputedStyle(this.bar.dom).webkitTransform);
        style.webkitTransform = 'translate3d(' + transform.m41 + 'px, ' + transform.m42 + 'px, 0)';
    }
});
