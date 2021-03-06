/**
 * @class Ext.form.FormPanel
 * @extends Ext.Panel
 * @xtype form
 * Simple form panel which enables easy getting and setting of field values. Can load model instances. Example usage:
<pre><code>
var form = new Ext.form.FormPanel({
    items: [
        {
            xtype: 'textfield',
            name : 'first',
            label: 'First name'
        },
        {
            xtype: 'textfield',
            name : 'last',
            label: 'Last name'
        },
        {
            xtype: 'numberfield',
            name : 'age',
            label: 'Age'
        },
        {
            xtype: 'urlfield',
            name : 'url',
            label: 'Website'
        }
    ]
});
</code></pre>
 * Loading model instances:
<pre><code>
Ext.regModel('User', {
    fields: [
        {name: 'first', type: 'string'},
        {name: 'last',  type: 'string'},
        {name: 'age',   type: 'int'},
        {name: 'url',   type: 'string'}
    ]
});

var user = Ext.ModelMgr.create({
    first: 'Ed',
    last : 'Spencer',
    age  : 24,
    url  : 'http://extjs.com'
}, 'User');

form.load(user);
</code></pre>
 */
Ext.form.FormPanel = Ext.extend(Ext.Panel, {
    /**
     * @cfg {Boolean} standardSubmit
     * Wether or not we want to perform a standard form submit. Defaults to false/
     */
    standardSubmit: false,

    cmpCls: 'x-form',

    renderTpl: new Ext.XTemplate(
        '<form <tpl if="id">id="{id}"</tpl> class="{baseCls} {cls} {cmpCls}<tpl if="ui"> {uiBase}-{ui}</tpl>" <tpl if="style"> style="{style}"</tpl>>'+
            '<div class="{baseCls}-body"<tpl if="bodyStyle"> style="{bodyStyle}"</tpl></div>'+
        '</form>',
        {compiled: true}
    ),

    // @private
    initComponent : function() {
        this.addEvents('submit');
        Ext.form.FormPanel.superclass.initComponent.call(this);
    },

    // @private
    afterRender : function() {
        Ext.form.FormPanel.superclass.afterRender.call(this);
        this.el.on('submit', this.onSubmit, this);
    },

    // @private
    onSubmit : function(e, t) {
        if (!this.standardSubmit) {
            e.preventDefault();
        }
        this.fireEvent('submit', this, this.getValues());
    },

    /**
     * Loads a model instance into this form
     * @param {Ext.data.Model} instance The model instance
     */
    load: function(instance) {
        this.setValues(instance.data);
    },

    /**
     * Sets the values of form fields in bulk. Example usage:
<pre><code>
myForm.setValues({
    name: 'Ed',
    crazy: true,
    username: 'edspencer'
});
</code></pre>
     * @param {Object} values field name => value mapping object
     */
    setValues: function(values) {
        var fields = this.getFields(),
            length = values.length,
            name, field;

        for (name in values) {
            field = fields[name];

            if (field) {
                field.setValue(values[name]);
            }
        }
    },

    /**
     * Returns an object containing the value of each field in the form, keyed to the field's name
     * @return {Object} Object mapping field name to its value
     */
    getValues: function() {
        var fields = this.getFields(),
            length = fields.length,
            values = {},
            name;

        for (name in fields) {
            values[name] = fields[name].getValue();
        }

        return values;
    },

    /**
     * Resets all fields in the form back to their original values
     */
    reset: function() {
        var fields = this.getFields(),
            name;

        for (name in fields) {
            fields[name].reset();
        }
    },

    /**
     * @private
     * Returns all {@link Ext.Field field} instances inside this form
     * @return {Object} All field instances, mapped by field name
     */
    getFields: function() {
        var fields = {};

        var getFieldsFrom = function(item) {
            if (item.isField) {
                fields[item.name || item.id] = item;
            }

            if (item.isContainer) {
                item.items.each(getFieldsFrom);
            }
        };

        this.items.each(getFieldsFrom);

        return fields;
    }
});

Ext.reg('form', Ext.form.FormPanel);
