<?
require_once('categories.php');
?>

// Return an array of Category Objects
var categories = new Array();
categories = getJSCategories();

// Create an array of category panels
var categoryPages = new Array();
for(var i = 0; i < categories.length; i++ ) {
	
	categoryPages[i] = new Ext.Component({
		id: i,
		iconCls: 'favorites',	
		title: categories[i].getName(),
		items: cardPanel
	});
	
}


Ext.setup({
    glossOnIcon: false,
    onReady: function() {
    
		// Setting up Categories Panel
		var categoryPanel = new Ext.TabPanel({
		    ui: 'dark',
		    fullscreen: true,
		    tabBar: {
	            dock: 'bottom',
	            layout: {
	                pack: 'center'
	            }
	        },        
	        animation: {
	            type: 'slide',
	            cover: false
	        },	    
		    
		    items: categoryPages
		});
    } 
});