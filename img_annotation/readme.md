# Instructions on Running This Project

## <a name="install"></a> How to install

```bash
# clone the repo
# install the dependencies below

conda create -n scribeArabic python=3.10
conda activate scribeArabic
pip install Django pytz PyYAML
```

## Run the server

```
python manage.py runserver
```

## Run the client

Open a browser and enter the URL:

```
http://localhost:8000/starttagging
```

# About the scribeArabic software

Multiple users can work on annotating and transcribing images. However, they CANNOT work simultaneously from the same directory or on the same image file. For each user a separte annotation file is created. Hence, we recommend that each user works from their own directory.

The repository contains the code for the annotation tool used to label this dataset. The img_annotation folder contains the ScribeArabic Django app.

By default, this software is intended to transcribe Arabic pages, however, it can easily be tailored for other languages. Just change the language to the desired language in transcribeBlock.js and tagBlock.js. It can also be easily modified to label images from most of computer vision domains.

1. Clone the repository
2. Follow the [install instructions](#install)
3. Run the django server
4. Access the app using the following URLs

   1. /home: For only annotations and transcriptions. For each image a corresponding \_annotate_user would be created. Multiple users can have different annotations and transcriptions for the same file and so we recommend that each user's task images should be in a separate directory. Once the images are transcribed, they can be submitted for QA using the 'submit' button. The image and its annotation file is moved to a <user>\_submitted directory.
   2. /check: For QA. The homescreen allows the user to select a "usertoverify" and check their transcriptions. Once checked, the 'Done checking' moves the file and its annotation to the <user>\_checked directory.
   3. /enter\_<username>: This is a shortcut for annotating images. If a user is already created and a directory with the user's name exists, then this option takes the user to the image folder having the user's annotation files in that particular directory. For example enter_moa will take the user directly to the annotation screen for annotating images in moa directory.
   4. /starttagging: For adding various region tags to the images. Through this option, the users can also carry out annotation and transcriptions. It is kept separate, in case the team tagging page elements is different from the team transcribing images.
   5. /upload: Upload image files for annotation for a particular user

Documentation for the tool is here [manual.md](manual.md)
