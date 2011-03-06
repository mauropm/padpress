<?
require_once('wp-blog-header.php');
?>



// Returns an array of Category Objects which contain Category Title, Category ID and Posts per Category
function getJSCategories()
{
	var categories = new Array();

	<?	
	// Get Categories from Wordpress
	$args=array(
	  'orderby' => 'name',
	  'order' => 'ASC'
	  );
	$php_categories = get_categories($args);
		
	$i = 0;
	foreach($php_categories as $category) 
	{ 
		// Create new Category Object
		echo "var categoryObject = new Category; \n";
		echo "categoryObject.setName(\"$category->name\");  \n";	
		echo "categoryObject.setID(\"$category->id\");  \n";	
		
		// Add posts to JS array
		echo "var JS_posts = new Array; \n";
		$j = 0;
		global $post;
		$myposts = get_posts('category=$i');
		foreach($myposts as $post)
		{
			// Create new Post Object
			echo "var postObject = new Post; \n";
			setup_postdata($post);
			$title = get_the_title();
			echo "postObject.setTitle(\"$title\");  \n";	
			$content = get_the_content(null, 0);
			$someContent = "This is some sample text";
			// TODO: Add actual content to post
			echo "postObject.setContent(\"$someContent\");  \n";
			
			// Add Post to array
			echo "JS_posts[$j] = postObject;  \n";
			$j++;
		}
		
		
		// Add array of posts to Category Object
		echo "categoryObject.setPosts(JS_posts);  \n";	
		echo "categories[$i] = categoryObject; \n";	
		
		// Break at 10 entries
		if(++$i==10){break;}
	} 
	?>
	
	return categories;
	
}