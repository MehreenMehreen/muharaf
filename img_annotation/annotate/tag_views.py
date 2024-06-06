import sys
#sys.path.append('../coords/')
#sys.path.append('../page_xml')
#import json_to_xml as xml
from django.shortcuts import redirect
from django.http import HttpResponse
from django.template.loader import get_template 
from .models import imageFiles, directories
from django.conf import settings
import json
import os
import shutil
import time
from datetime import datetime
from pytz import timezone
from . import views
import yaml



def get_tag_list():

    config_file = os.path.join(settings.STATIC_ROOT, settings.CONFIG_FILE)
    if not os.path.exists(config_file):
        return [{}]
    with open(config_file) as fin:
        config = yaml.safe_load(fin)
    
    user_list = []
    if 'tag_dictionary' in config:
        tag_dictionary = config['tag_dictionary']
    if len(tag_dictionary) == 0:
        tag_dictionary = {}
    return tag_dictionary

views.USER_LIST = views.get_user_list()
LOG_FILE = os.path.join(settings.STATIC_ROOT, 'LOG_TAGGING.txt')
APP_DISPALY_LABEL = views.APP_DISPALY_LABEL
#TAG_TASKS = ["viewTag", "tag"]
TAG_TASKS = ["tag"]
#TAG_TASKS_DESCRIPTION = ["View tags and transcriptions", "Tag images"]
TAG_TASKS_DESCRIPTION = ["Tag images"]
DATASET_PATH = 'datasets/'
TAG_DICTIONARY = get_tag_list()


def tag_home(request):	
	IMAGES = imageFiles()
	# DEfaults	
	task = "tag"
	post_response = "1"
	dir = directories()
	dir_obj = dir.load_directories(task="tag", user=views.USER_LIST[0].lower(), include_submitted=True)
	dir_json = json.dumps(dir_obj)
	# IS this a QA session ...
	checking_flag = request.session.get('checkingMenu', 0)

	template = get_template('tagHomePage.html')
	context = {"users": views.USER_LIST,         
           "directoryList": dir_json,
           "totalFiles": dir.total_files,
           "allTasks": TAG_TASKS,
           "allTasksDescription": TAG_TASKS_DESCRIPTION, 
           "userInd": 0, 
           "taskInd": 0,
           "error": [""],
           "heading": APP_DISPALY_LABEL,
           "tag_dictionary": TAG_DICTIONARY,
           "checking": checking_flag,
           } 
	admin = request.session.get('adminTag', None)
	if admin is not None:
		context["userInd"] = admin["userInd"]
		context["taskInd"] = admin["taskInd"]
		if 'error' in admin.keys():
			context["error"] = [admin["error"]]
		
		dir_obj = dir.load_directories(task="tag", user=views.USER_LIST[context["userInd"]].lower(), 
									   include_submitted=True)
		dir_json = json.dumps(dir_obj)

		
	
	
	context["directoryList"] = dir_json
	context["totalFiles"] = dir.total_files

	if request.method == 'POST':
		post_response = request.POST
		#print('post_response', post_response)
		if "userForm" in request.POST:
			post_response = json.loads(request.POST["userForm"])
			context["userInd"] = post_response["userInd"]
			context["taskInd"] = post_response["taskInd"]
			user_name = views.USER_LIST[post_response["userInd"]].lower()
			task = TAG_TASKS[context["taskInd"]].lower()
			
			if task == "viewTag":
				dir_obj = dir.load_directories(task="viewTag")
				dir_json = json.dumps(dir_obj)	
					
				
			elif task == "tag":
						
				dir_obj = dir.load_directories(task="tag", user=user_name,
															include_submitted=True)
				dir_json = json.dumps(dir_obj)

			context["directoryList"] = dir_json
			context["toverifyList"] = dir_json
			context["totalFiles"] = dir.total_files
			context["error"] = [""]

			if "start" in post_response and post_response["start"] == 1:
				context["dir"] = post_response["dir"]
				context["filesList"] = post_response["filesList"]
				directory = os.path.join(settings.STATIC_ROOT, context["dir"])
				# Username is irrelevant here
				IMAGES.load_files_for_user(directory, user_name, task, 
								   path_to_add=context["dir"], 
							       select_files=context["filesList"])
				request.session['images'] = IMAGES.get_json_string_for_client()
				request.session['adminTag'] = {'user': user_name, 
                                 'task': task, 
								 'userInd': context["userInd"], 
								 'taskInd': context["taskInd"], 'error':"", 'heading': APP_DISPALY_LABEL,
								 'to_check_user':user_name,
	 							 'toCheckUserInd':context["userInd"],
	 							 'tagDictionary': context["tag_dictionary"]}


				#print('context', context)
				if task == "view":
					add_tag_log(request.session['adminTag'], IMAGES, 'serve_home/view')
					return redirect(view_files)	
				
				if task == "tag":
					
					add_tag_log(request.session['adminTag'], IMAGES, 'serve_home/tagBlock')
					return redirect(tag_image)
				
	
    
    # Update admin_dict only
	user_ind = context["userInd"]
	task_ind = context["taskInd"] 
	request.session['adminTag'] = {'user': views.USER_LIST[user_ind].lower(), 
                                 'task': TAG_TASKS[task_ind ].lower(), 
								 'userInd': user_ind, 
								 'taskInd': task_ind, 'error':"", 'heading': APP_DISPALY_LABEL,
								 'to_check_user':views.USER_LIST[user_ind].lower(),
	 							 'toCheckUserInd':user_ind}

	request.session['images'] = IMAGES.get_json_string_for_client()

	#print('IMAGES.get_json_string_for_client()', IMAGES.get_json_string_for_client())
	return HttpResponse(template.render(context, request))






def tag_image(request):

	# scroll position only important when saving. Client screen will jump to 
	# the saved scroll position
	scroll_position = {"x": 0, "y": 0}
	options = {"radius": 2, "lineWidth": 1, "zoomFactor": 1.0, "colWidth": 6}
	col_width = 6
	checking_flag = request.session.get('checkingMenu', 0)	
	
	images_json = request.session.get('images', None)
	admin = request.session.get('adminTag', None)
	
	if images_json is None or admin is None:
		
		IMAGES = imageFiles()
		add_tag_log(admin, IMAGES, 'tagBlock/serve_homepage/empty')
		return redirect(tag_home)

	IMAGES = imageFiles()
	IMAGES.load_from_json_string(images_json)
 
	template = get_template('tagBlock.html')
	if request.method == 'POST':
		if 'previous' in request.POST:
			IMAGES, admin, page_json, options = views.load_from_transcribe_block_response(request, 'previous')
			json_file = json.loads(request.POST['previous'])['json_file'];
			save_tag_json(page_json, IMAGES.get_current(), json_file)
			add_tag_log(admin, IMAGES, 'tagBlock/previous')
			filename = IMAGES.get_previous()
		elif 'next' in request.POST:
			IMAGES, admin, page_json, options = views.load_from_transcribe_block_response(request, 'next')
			json_file = json.loads(request.POST['next'])['json_file']
			save_tag_json(page_json, IMAGES.get_current(), json_file)
			add_tag_log(admin, IMAGES, 'tagBlock/next')
			filename = IMAGES.get_next()
		elif 'save' in request.POST:
			IMAGES, admin, page_json, options = views.load_from_transcribe_block_response(request, 'save')      
			json_file = json.loads(request.POST['save'])['json_file']
			save_tag_json(page_json, IMAGES.get_current(), json_file)
			add_tag_log(admin, IMAGES, 'tagBlock/save')
			json_obj = json.loads(request.POST['save'])
			scroll_position = json_obj['scroll_position']			   
		elif 'end' in request.POST:
			IMAGES, admin, page_json, options = views.load_from_transcribe_block_response(request, 'end')      
			json_file = json.loads(request.POST['end'])['json_file']
			#print('json_file', json_file)
			save_tag_json(page_json, IMAGES.get_current(), json_file)
			add_tag_log(admin, IMAGES, 'tagBlock/end')
			return redirect(tag_home)
		elif 'submit' in request.POST:
			IMAGES, admin, page_json, options = views.load_from_transcribe_block_response(request, 'submit')      
			json_file = json.loads(request.POST['submit'])['json_file']
			save_tag_json(page_json, IMAGES.get_current(), json_file)
			submit_done, return_error = submit_tagged_file(page_json, IMAGES.get_current(), admin, json_file)
			if not submit_done:
				admin['error'] = 'Error submitting: ' + return_error
				request.session['adminTag'] = admin
				request.session['images'] = IMAGES.get_json_string_for_client()
				add_tag_log(admin, IMAGES, 'tagBlock/submit/{}'.format(return_error))
				return redirect(tag_home)
			else:
				IMAGES.remove_current()
				add_tag_log(admin, IMAGES, 'tagBlock/submit'+return_error)
		elif 'checked' in request.POST:
			
			IMAGES, admin, page_json, options = views.load_from_transcribe_block_response(request, 'checked')      
			json_file = json.loads(request.POST['checked'])['json_file'];
			save_tag_json(page_json, IMAGES.get_current(), json_file)
			check_done, return_error = submit_tagged_file(page_json, IMAGES.get_current(), 
														  admin, json_file, suffix="checked")
			if not check_done:
				admin['error'] = 'Error submitting checked file: ' + return_error
				request.session['adminTag'] = admin
				request.session['images'] = IMAGES.get_json_string_for_client()
				add_tag_log(admin, IMAGES, 'tagBlock/check/{}'.format(return_error))
				return redirect(tag_home)
			else:
				IMAGES.remove_current()
				add_tag_log(admin, IMAGES, 'tagBlock/check')				

            
	if IMAGES.empty_files() == 1:
		admin['error'] = 'Reached the end. Thank you!'
		request.session['adminTag'] = admin
		request.session['images'] = IMAGES.get_json_string_for_client()
		add_tag_log(admin, IMAGES, 'tagBlock/submit/done')
		return redirect(tag_home)		


	img_file = IMAGES.get_current()


	json_dict = get_json_files_for_tagging(img_file, admin)
		
	context = {
	           "img_file": img_file,
		       "jsonList": json_dict,
		       "admin": admin,
		       "images_obj": IMAGES.get_json_string_for_client(),
		       "checking": checking_flag,
		       "scroll_position": scroll_position,
		       "options": options, 
		       "heading": APP_DISPALY_LABEL,
		       "tagDictionary": TAG_DICTIONARY,
		       "checking": request.session.get('checkingMenu', 0)
	          }
	views.add_log(admin, IMAGES, 'tagBlock/tagBlock')
	
	request.session['adminTag'] = admin
	request.session['images'] = IMAGES.get_json_string_for_client()
	return HttpResponse(template.render(context, request))

# img_file name needed for directory
def save_tag_json(json_obj, img_file, json_filename):
	directory = os.path.split(img_file)[0]
	json_file = os.path.join(settings.STATIC_ROOT, directory, json_filename)
	#print('json_file', json_file)    	
    # Take backup of existing json
	if os.path.exists(json_file):
		backupname = json_file[:-4] + str(time.time()) + '.json'
		shutil.copyfile(json_file, backupname)

	with open(json_file, 'w') as fout:
		json_dumps_str = json.dumps(json_obj, indent=2)
		print(json_dumps_str, file=fout) 


def submit_tagged_file(page_json, jpg_filename, admin, json_filename, suffix="submitted"):
	user = admin['user']
	xml_written = "notDoneXML"
	
	path, filename = os.path.split(jpg_filename)
	basename, ext = os.path.splitext(filename)
	# Get full json and jpg filenames
	full_json_path = os.path.join(settings.STATIC_ROOT, path, json_filename)				 
	full_jpg_path = os.path.join(settings.STATIC_ROOT, jpg_filename)

	# Get target path and create if it does not exist
	# GEt enclosing folder name
	parent_dir, _ = os.path.split(full_jpg_path)


	full_target_path = os.path.join(settings.STATIC_ROOT, parent_dir + f'_{suffix}/')
	if not os.path.exists(full_target_path):
		os.mkdir(full_target_path)

	try:
		# Take backup of existing json
		#print('fulljson', full_json_path)
		backupname = full_json_path[:-4] + str(time.time()) + f'.json.{suffix}'
		shutil.move(full_json_path, backupname)
		
		# Save json
		target_json = os.path.join(full_target_path, json_filename)
		with open(target_json, 'w') as fout:
			json_dumps_str = json.dumps(page_json, indent=2)
			print(json_dumps_str, file=fout) 
		
		
		target_jpg = os.path.join(full_target_path, filename)
		

        # Generate the xml for the submitted file and write it
		
		#xml_written = write_xml(target_jpg, target_json)

        # Move  jpg file to submitted folder
		shutil.move(full_jpg_path, target_jpg)
        
        
		return True, xml_written + " done "
		
	except Exception as e:
		return True, xml_written + str(e)

# This is within a try catch block
def write_xml(jpg_file, json_file):
    try:
        
        output_xml = os.path.join(jpg_file[:-3]+'xml')
        json_page = xml.TranscriptionPage(filename=json_file, 
                                          imagefile=jpg_file)
        
        xml_obj = xml.PageXML(json_page, output_xml)   
        xml_obj.write_xml()
        return "donexml"
    except Exception as e:
        return str(e)
        

def get_json_files_with_annotator(directory, base_file):
    json_files = []
    annotators = []
    files = os.listdir(os.path.join(settings.STATIC_ROOT, directory))
    
    for f in files:
        prefix = base_file + '_annotate_'
        #print('prefix', prefix)
        if f.startswith(prefix):
            # Check if its a timestamp in filename
            partial_string = f[len(prefix):]
            ind1 = partial_string.rfind('.')
            ind2 = partial_string.find('.')
            # Possible that no annotator
            annotator = partial_string[:ind1]
            
            if (ind1 == ind2):
                json_files.append(f)
                annotators.append(annotator)

    return json_files, annotators


def get_json_files_for_tagging(img_file, admin):
	directory, file = os.path.split(img_file)
	base_file, ext = os.path.splitext(file)

	json_file_list, annotators = get_json_files_with_annotator(directory, base_file)
	json_file_list.sort()
	#print('annotators', annotators, 'json_file_list', json_file_list)
	json_dict = {"fileList":json_file_list}
	
	for ind, f in enumerate(json_file_list):
	    json_obj = views.get_json(os.path.join(directory, f))

	    json_dict[f] = {'json': json_obj, 'annotator': annotators[ind]}
	# Make empty json if no json is present    
	if len(json_file_list) == 0:
		json_filename = base_file + '_annotate_' + admin['user'] + '.json'
		json_dict = {'fileList': [json_filename], json_filename: {'json': {}, 
																  'annotator': admin['user']}}
	return json_dict


def tag(request, user_name):
    
    request.session['checkingMenu'] = 0
    user = user_name.lower()
    task = "tag"
    

    user_ind = views.get_index(user, views.USER_LIST)
    if  user_ind == -1:
        admin = views.create_dummy_admin(task="tag", 
                                    error="No user found: " + user_name)
        
        IMAGES = imageFiles()
        request.session['admin'] = admin
        request.session['images'] = IMAGES.get_json_string_for_client()
        add_tag_log(admin, IMAGES, 'tag/serve_homepage/error')
        return redirect(tag_home) 

    
    directory = os.path.join(settings.STATIC_ROOT, DATASET_PATH, user+'/')
    IMAGES = imageFiles()
    
    IMAGES.load_files_for_user(directory, user=user, task=task, 
                                path_to_add=DATASET_PATH + user + '/')    

    admin = {'user':user, 'task':"tag", 'to_check_user':user,
                                 'userInd': user_ind, 'toCheckUserInd':user_ind, 
                                 'taskInd': 0, 'error':""}    
    request.session['adminTag'] = admin
    request.session['images'] = IMAGES.get_json_string_for_client()
    request.session['checkingMenu'] = 0
    
    if IMAGES.empty_files():    
        # No images to transcribe
        admin['task'] = "tag"
        admin['taskInd'] = 0
        admin['error'] = "No images to tag"
        request.session['admin'] = admin
        
        add_tag_log(admin, IMAGES, 'tag/homepage')
        return redirect(tag_home)
                                     
    add_tag_log(admin, IMAGES, 'tag/tag')                                 
    return redirect(tag_image)       

def check_tags(request):
	request.session['checkingMenu'] = 1

	add_tag_log(None, None, "In check_tags URL")
	return redirect(tag_home)


def add_tag_log(admin, images_obj, comment=""):

    # Log eastern time ... https://pynative.com/python-timezone/
  tz = timezone('EST')
  date_time = datetime.now(tz) 
  time_str = date_time.strftime('%Y-%m-%d %H:%M:%S')
  strToWrite = time_str + ' ' + 'comment: ' + comment + '\n'
  if admin is not None:
	  strToWrite += '\t' + admin['user'] + ' ' + str(admin['userInd']) + ' ' + admin['task'] + ' ' + str(admin['taskInd'])
  else:
  	  strToWrite += "Admin none"
  if images_obj is not None:
	  strToWrite += '\t' + str(images_obj.index) + ' ' + images_obj.get_current() + '\n'
  else:
  	  strToWrite += '\t images None'
  with open(LOG_FILE, 'a') as fout:
    fout.write(strToWrite)
