# Annotation Tool Manual

Once you have the server running using the [readme.md](readme.md), you can visit this url: http://localhost:8000/starttagging

The browser will open a page as shown: ![starttagging](readme_images/starttagging.png)

Once you choose the user and task (only one option), you can select a directory from the left box. The image files in the directory will appear in the right box. You can also select a set of image files on the right to annotate. Clicking the blue start button will take you to the annotation screen. If no file is selected, the annotation screen will allow the annotation and transcription of all files.

The annotation page is shown here: ![annotation](readme_images/annotation.png)

You can draw the annotations in the right window and transcribe in the left window. You can also tag page elements in the right window.

Here is some information on what each of the button do.

`Prev` and `Next` cycle through the images in the directory

`Save` to save the current image annotation

`Quit` to exit the annotation page

`Submit for Checking` to mark an image as done. Once clicked, the image and its annotation moves to a new (or existing) directory with \_submitted prefix. For example, if a user was working in the moa directory, then the files would be moved to moa_submitted.

`Tags` to toggle whether the tags for an annotation box are visible

`Draw` to create a polygon bounding area around the text line

- Click on draw and then start drawing by clicking on the page on the right
- A single click adds another control point
- Double click to finish drawing the shape (it will close automatically)
- Click on a shape to move it
- Click on a shape to `Delete` it or use the Backspace or Delete key on the keyboard
- Click the box on the top left of a shape to tag it with info such as Region_heading or Region_floating
- On the left side of the page you can see that your box creates a text box to transcribe. You can write down the text that is in the box that you drew. You can right click on the text box and change the writing direction to either left to right or right to left.

`Zoom In/Out` to zoom

`Lens` to magnify what you are hovering over

`Number` to convert the numbers in the text boxes that have been transcribed to arabic

`Line Size` to set the size of the line when you are drawing using the draw button

`Radius` to set the size of the control points when you are drawing using the draw button
