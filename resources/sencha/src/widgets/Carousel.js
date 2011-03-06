/**
 * @class Ext.Carousel
 * @extends Ext.Panel
 * @xtype carousel
 *
 * A customized Panel which provides the ability to slide back and forth between
 * different child items.
 *
 * <pre><code>
var carousel = new Ext.Carousel({
   items: [{
       html: '&lt;h1&gt;Carousel&lt;/h1&gt;',
       cls: 'card1'
   }, {
       title: 'Tab 2',
       html: '2',
       cls: 'card2'
   }, {
       title: 'Tab 3',
       html: '3',
       cls: 'card3'
   }]
});</code></pre>
 */
Ext.Carousel = Ext.extend(Ext.Panel, {
    /**
     * @constructor
     * @param {Object} config
     * Create a new Ext.Carousel
     */

    /**
     * @cfg {String} baseCls
     * The base CSS class to apply to the Carousel's element (defaults to <code>'x-carousel'</code>).
     */
    cmpCls: 'x-carousel',

    /**
     * @cfg {Boolean} indicator
     * Provides an indicator while toggling between child items to let the user
     * know where they are in the card stack.
     */
    indicator: true,

    /**
     * @cfg {String} ui
     * Style options for Carousel. Default is 'dark'. 'light' also available.
     */
    ui: null,

    /**
     * @cfg {String} direction
     * The direction of the Carousel. Default is 'horizontal'. 'vertical' also available.
     */
    direction: 'horizontal',

    /**
     * @cfg {String} layout @hide
     */

    // @private
    initComponent: function() {
        this.layout = {
            type: 'card',
            hideInactive: false,
            sizeAllCardsOnLayout: true,
            extraCls: 'x-carousel-item',
            targetCls: 'x-carousel-scroller'
        };

        this.scroll = {
            scrollbars: false,
            bounces: true,
            momentum: false,
            horizontal: this.direction == 'horizontal' ? true : false,
            vertical: this.direction == 'horizontal' ? false : true
        };
         
        if (this.indicator) {
            var cfg = Ext.isObject(this.indicator) ? this.indicator : {};
            this.indicator = new Ext.Carousel.Indicator(Ext.apply({}, cfg, {
                direction: this.direction,
                carousel: this,
                ui: this.ui
            }));
        }

        Ext.Carousel.superclass.initComponent.call(this);

        this.on('cardswitch', this.onCardSwitch, this);
    },

    // @private
    afterRender: function() {
        Ext.Carousel.superclass.afterRender.call(this);

        this.scroller.on({
            touchend: this.onTouchEnd,
            scope: this
        });
        
        this.el.addClass(this.cmpCls + '-' + this.direction);
    },

    onCardSwitch : function(card) {
        var cardPos = {x: 0, y: 0};
        if (this.direction == 'horizontal') {
            cardPos.x = card.el.dom.offsetLeft;
        }
        else {
            cardPos.y = card.el.dom.offsetTop;
        }
        
        this.scroller.scrollTo(cardPos, 250, 'ease-out');
    },

    /**
     * Switches the next card
     */
    next: function() {
        return this.layout.next();
    },

    /**
     * Switches the previous card
     */
    prev: function() {
        return this.layout.prev();
    },

    getActiveItemOffset : function() {
        var activeItem = this.layout.getActiveItem();
        if (activeItem) {
            return activeItem.el.dom[this.direction == 'horizontal' ? 'offsetLeft' : 'offsetTop'];
        }
    },

    // @private
    onTouchEnd: function(e, scroller) {
        var activeOffset = -this.getActiveItemOffset(),
            previousDelta, deltaOffset, activePos; 

        if (this.direction == 'horizontal') {
            deltaOffset = scroller.offset.x - activeOffset;
            previousDelta = e.previousDeltaX;
            activePos = {x: -activeOffset, y: 0};
        }
        else {
            deltaOffset = scroller.offset.y - activeOffset;
            previousDelta = e.previousDeltaY;
            activePos = {x: 0, y: -activeOffset};
        }
        
        // We have gone to the right
        if (deltaOffset < 0 && Math.abs(deltaOffset) > 3 && previousDelta <= 0) {
            this.next();
        }
        // We have gone to the left
        else if (deltaOffset > 0 && Math.abs(deltaOffset) > 3 && previousDelta >= 0) {
            this.prev();
        }
        else {
            this.scroller.scrollTo(activePos, 200, 'ease-out');
        }
    }
});

Ext.reg('carousel', Ext.Carousel);

/**
 * @class Ext.Carousel.Indicator
 * @extends Ext.Component
 * @xtype carouselindicator
 * @private
 *
 * A private utility class used by Ext.Carousel to create indicators.
 */
Ext.Carousel.Indicator = Ext.extend(Ext.Component, {
    baseCls: 'x-carousel-indicator',

    initComponent: function() {
        if (this.carousel.rendered) {
            this.render(this.carousel.body);
        }
        else {
            this.carousel.on('afterrender', function() {
                this.render(this.carousel.body);
            }, this, {single: true});
        }
    },

    // @private
    onRender: function() {
        Ext.Carousel.Indicator.superclass.onRender.apply(this, arguments);

        for (var i = 0, ln = this.carousel.items.length; i < ln; i++) {
            this.createIndicator();
        }

        this.mon(this.carousel, {
            cardswitch: this.onCardSwitch,
            add: this.onCardAdd,
            remove: this.onCardRemove,
            scope: this
        });

        this.mon(this.el, {
            tap: this.onTap,
            scope: this
        });

        this.onCardSwitch(null, null, this.carousel.items.indexOf(this.carousel.layout.getActiveItem()));
        
        this.el.addClass(this.baseCls + '-' + this.direction);
    },

    // @private
    onTap: function(e, t) {
        var box = this.el.getPageBox(),
            centerX = box.left + (box.width / 2);

        if (e.pageX > centerX) {
            this.carousel.next();
        }
        else {
            this.carousel.prev();
        }
    },

    // @private
    createIndicator: function() {
        this.indicators = this.indicators || [];
        this.indicators.push(this.el.createChild({
            tag: 'span'
        }));
    },

    // @private
    onCardSwitch: function(card, old, index) {
        if (Ext.isNumber(index) && this.indicators[index]) {
            this.indicators[index].radioClass('x-carousel-indicator-active');
        }
    },

    // @private
    onCardAdd: function() {
        this.createIndicator();
    },

    // @private
    onCardRemove: function() {
        this.indicators.pop().remove();
    }
});

Ext.reg('carouselindicator', Ext.Carousel.Indicator);
