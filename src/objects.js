function Category()
{
	var id = 0;
	var name = "Not Assigned";
	var posts = new Array();
	
    this.getID = function() { return id;}
    this.setID = function(someID) { id = someID; }
    
    this.getName = function() { return name;}
    this.setName = function(someName) { name = someName; }

    this.getPosts = function() { return posts;}
    this.setPosts = function(somePosts) { posts = somePosts; }
}

function Post()
{
	var id = 0;
	var title = "Not Assigned";
	var content = "Not Assigned";
	
    this.getID = function() { return id;}
    this.setID = function(someID) { id = someID; }
    
    this.getTitle = function() { return title;}
    this.setTitle = function(someTitle) { title = someTitle; }
    
    this.getContent = function() { return content;}
    this.setContent = function(someContent) { content = someContent; }  
    
}