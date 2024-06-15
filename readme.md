 
# محرف Manuscripts of Arabic Handwriting (Muharaf) Dataset 

This repository has data and code for the paper: Muharaf: Manuscripts of handwritten Arabic Dataset
for cursive text recognition. 
[Mehreen Saeed](mehreen.mehreen@gmail.com), [Adrian Chan](adrian27513@gmail.com), [Anupam Mijar](aamijar230@gmail.com), [Joseph Moukarzel](josephmoukarzel@usek.edu.lb), [Georges Habchi](georgeshabchi@usek.edu.lb), [Carlos Younes](carlosyounes@usek.edu.lb), [Amin Elias](a.elias@lahlebanon.org), [Chau-Wai Wong](chauwai.wong@ncsu.edu), [Akram Khater](akhater@ncsu.edu)


# The Dataset
The dataset has two parts. 
- The public part of Muharaf has 1,216 images and can be downloaded from [Zenodo](https://zenodo.org/records/11492215). We distribute this dataset under the [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).
- The restricted part of Muharaf has 428 images distributed under a proprietary license. It can be downloaded by writing to [Carlos Younes](carlosyounes@usek.edu.lb) at Phoenix Center for Lebanese Studies, USEK. This part of the dataset is distributed under a proprietary license with the condition that it will not be re-distributed and only used for research purposes. 

# ScribeArabic Annotation Software
[ScribeArabic](https://github.com/MehreenMehreen/ScribeArabic) is the annotation software used to create the Muharaf Dataset. Read its [manual](https://github.com/MehreenMehreen/ScribeArabic/blob/main/manual.md) to get an idea of how it works.

# JSON to PAGE-XML Converter
The ScribeArabic software natively uses JSON files. You can conver them to PAGE-XML using the [source code provdided in the page-xml folder](https://github.com/MehreenMehreen/xml_converter).

# Page Elements Viewer
All image files accompanied by their corresponding _annotate files containing annotations, transcriptions and tagging can be viewed using the [XML viewer](https://github.com/MehreenMehreen/xml_converter) in the page-xml converter repository. 

# Start, Follow, Read &mdash; Arabic
The HTR results reported in the paper can be reproduced using the [Start, Follow, Read &mdash; Arabic code](https://github.com/MehreenMehreen/start_follow_read_arabic) System. This code is adapted from [Start, Follow, Read System](https://github.com/cwig/start_follow_read) and its [Python3 version](https://github.com/sharmaannapurna/start_follow_read_py3).

# Acknowledgements
We thank Stephen Randall Filios from Family Search for initiating discussions and providing feedback on tagging page elements in document images. 
We thank Elham Abdallah for providing support and coordinating work between NC State and USEK.
This work was supported in part by the National Endowment for the Humanities (FAIN: ZPA-283823-265 22), Family Search, and the ECE Undergraduate Research Program at NC State.

