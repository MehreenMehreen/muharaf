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
import yaml

# TODO: All the indices of tasks and users are hard coded right now
# PROBLEM: Changing the order of tasks will mess up everything
# 1.6: Added Tag images module
APP_DISPALY_LABEL = "ScribeArabic 2.0"

def get_user_list():
    config_file = os.path.join(settings.STATIC_ROOT, settings.CONFIG_FILE)
    if not os.path.exists(config_file):
        return ['user_1']
    with open(config_file) as fin:
        config = yaml.safe_load(fin)
    print('config is', config)
    user_list = []
    if 'user_list' in config:
        user_list = config['user_list']
    if len(user_list) == 0:
        user_list = ['user_1']
    return user_list

USER_LIST = get_user_list()
#MEHREEN_IND = 4
#USER_LIST = ["Adrian", "Akram", "Chau-Wai", "Mehreen", "Imran", "Nisarg"]
#USER_LIST = ["Carlos", "Georges", "Adrian", "Anupam", "Mehreen", "Father_Joseph", "CarlosAI", "GeorgesAI", "Akram"]
# IMPORTANT: Don't change the order of tasks. See the todo list
ALL_TASKS = ["Annotate", "Select", "Verify", "View", "Transcribe", "transcribeBlock", "viewEditDistance"]
ALL_TASKS = ["transcribeBlock"]
ALL_TASKS_DESCRIPTION = ["Annotate from Directory", "Select Files to Annotate", 
						"Verify Annotations", "View Files in Directory", "Transcribe Files Line by Line", 
						"Transcribe Blocks of Text", "View edit distance"]


ADMIN_TASKS = ALL_TASKS[:]
ADMIN_TASKS.append('check')
ADMIN_TASKS_DESCRIPTION = ALL_TASKS_DESCRIPTION[:]
ADMIN_TASKS_DESCRIPTION.append('Check transcriptions')

STORE_LOG = True
LOG_FILE = os.path.join(settings.STATIC_ROOT, 'LOG.txt')
SUBMIT_PREFIX = "_submitted"
CHECKED_PREFIX = "_checked"
DATASETS_PATH = "datasets/"

def save_json(json_obj, jpg_filename, user_name):

   
    basename, ext = os.path.splitext(jpg_filename)
    json_file = os.path.join(settings.STATIC_ROOT, basename +\
							     '_' + "annotate" + '_' + user_name + '.json')
    # Take backup of existing json
    if os.path.exists(json_file):
    	backupname = json_file[:-4] + str(time.time()) + '.json'
    	shutil.copyfile(json_file, backupname)

    with open(json_file, 'w') as fout:
        json_dumps_str = json.dumps(json_obj, indent=2)
        print(json_dumps_str, file=fout) 
         

def get_json(json_path):
	# read file
	full_path = os.path.join(settings.STATIC_ROOT, json_path)
	line_obj = {}
	if os.path.exists(full_path):
		with open(full_path, 'r') as myfile:
			data=myfile.read()

		# parse file
		line_obj = json.loads(data)
	return line_obj

def get_json_str(full_filename, to_check_user, task):
	# read file
	path, filename = os.path.split(full_filename)
	basename, ext = os.path.splitext(filename)
	
	
	json_file_plain = basename + '.json'
	json_file_plain = os.path.join(settings.STATIC_ROOT, path, json_file_plain)
	json_file_user = basename + "_" + "annotate" + '_' +\
					 to_check_user + '.json' 

	json_file_user = os.path.join(settings.STATIC_ROOT, path, json_file_user)


	if os.path.exists(json_file_user):
		full_path = json_file_user
	else:
		full_path = json_file_plain

	
	line_obj = {}
	if os.path.exists(full_path):
		with open(full_path, 'r') as myfile:
			data=myfile.read()
		# parse file
		line_obj = json.loads(data)
	return line_obj




def serve_homepage(request):		
	task = "annotate"
	post_response = "1"
	dir = directories()
	dir_obj = dir.load_directories()
	dir_json = json.dumps(dir_obj)

	toverify_dir_obj = dir.load_directories(task="verify", user=USER_LIST[0].lower())
	toverify_dir_json = json.dumps(toverify_dir_obj)

	template = get_template('annotateHome.html')
	context = {"users": USER_LIST,         
           "directoryList": dir_json,
           "toverifyList": toverify_dir_json,
           "totalFiles": dir.total_files,
           "allTasks": ALL_TASKS,
           "allTasksDescription": ALL_TASKS_DESCRIPTION, 
           "userInd": 0, 
           "taskInd": 0,
           "toCheckUserInd": 0,
           "error": [""],
           "heading": APP_DISPALY_LABEL
           } 
	admin = request.session.get('admin', None)
	if admin is not None:
		context["userInd"] = admin["userInd"]
		context["toCheckUserInd"] = admin["toCheckUserInd"]
		context["taskInd"] = admin["taskInd"]
		if 'error' in admin.keys():
			context["error"] = [admin["error"]]
		dir_obj = dir.load_directories()
		dir_json = json.dumps(dir_obj)	
		toverify_dir_obj = dir.load_directories(task="verify", user=USER_LIST[context["toCheckUserInd"]].lower())
		toverify_dir_json = json.dumps(toverify_dir_obj)

		
	checking_flag = request.session.get('checkingMenu', 0)	
	checking_flag = checking_flag == 1
	if checking_flag:
		#print('.......checking_flag')
		context["allTasks"] = ADMIN_TASKS
		context["allTasksDescription"] = ADMIN_TASKS_DESCRIPTION
		dir_obj = dir.load_directories(include_submitted=True)
		dir_json = json.dumps(dir_obj)	
		toverify_dir_obj = dir.load_directories(task="verify", 
												include_submitted=True,
												user=USER_LIST[context["toCheckUserInd"]].lower())
		toverify_dir_json = json.dumps(toverify_dir_obj)


	context["directoryList"] = dir_json
	context["toverifyList"] = toverify_dir_json
	context["totalFiles"] = dir.total_files


	if request.method == 'POST':
		post_response = request.POST
		if "userForm" in request.POST:
			post_response = json.loads(request.POST["userForm"])
			context["userInd"] = post_response["userInd"]
			context["taskInd"] = post_response["taskInd"]
			context["toCheckUserInd"] = post_response["toCheckUserInd"]
			user_name = USER_LIST[post_response["userInd"]].lower()
			task = ADMIN_TASKS[context["taskInd"]].lower()
			if task == "verify":
				user_name = USER_LIST[post_response["toCheckUserInd"]].lower()
				toverify_dir_obj = dir.load_directories(task="verify", user=user_name)
				toverify_dir_json = json.dumps(toverify_dir_obj)
				
			elif task == "transcribe":
				user_name = USER_LIST[post_response["toCheckUserInd"]].lower()				
				toverify_dir_obj = dir.load_directories(task="transcribe", user=user_name)
				toverify_dir_json = json.dumps(toverify_dir_obj)
			elif task == "transcribeblock":
				context["toCheckUserInd"] = context["userInd"]
				# as to check user is not present in transcribeBlock
				user_name = USER_LIST[post_response["userInd"]].lower()
				# COmmenting: sep 26: as to check user is not present in transcribeBlock
				#user_name = USER_LIST[post_response["toCheckUserInd"]].lower()				
				toverify_dir_obj = dir.load_directories(task="transcribeblock", user=user_name)
				toverify_dir_json = json.dumps(toverify_dir_obj)
				#print(toverify_dir_obj)
			elif task == "view":
				toverify_dir_obj = dir.load_directories(task="view")
				toverify_dir_json = json.dumps(toverify_dir_obj)	
				#print(toverify_dir_obj)
			elif task == "annotate" or task == "select":
				context["toCheckUserInd"] = context["userInd"]
			elif task == "check":
				user_name = USER_LIST[post_response["toCheckUserInd"]].lower()				
				toverify_dir_obj = dir.load_directories(task="transcribe", user=user_name,
														include_submitted=True)
				toverify_dir_json = json.dumps(toverify_dir_obj)

			#print('..........', task, '******', toverify_dir_json)	

			context["directoryList"] = dir_json
			context["toverifyList"] = toverify_dir_json
			context["totalFiles"] = dir.total_files
			context["error"] = [""]

			if "start" in post_response and post_response["start"] == 1:
				context["dir"] = post_response["dir"]
				context["filesList"] = post_response["filesList"]
				IMAGES = start_serve_image_files(context, request)

				if task == "view":
					add_log(request.session['admin'], IMAGES, 'serve_home/view')
					return redirect(view_files)	
				if task == "transcribe":
					add_log(request.session['admin'], IMAGES, 'serve_home/transcribe')
					return redirect(transcribe)
				if task == "transcribeblock" or task == "check":
					#request.session['checkingMenu'] = 0
					add_log(request.session['admin'], IMAGES, 'serve_home/transcribeBlock')
					return redirect(transcribe_block)
				# otherwise serve image files	
				add_log(request.session['admin'], IMAGES, 'serve_home/serve_images')
				return redirect(serve_image_files)
	
    
    # Update admin_dict only
	user_ind = context["userInd"]
	task_ind = context["taskInd"] 
	to_check_user_ind = context["toCheckUserInd"] 
	request.session['admin'] = {'user':USER_LIST[user_ind].lower(), 
                                 'task':ADMIN_TASKS[task_ind ].lower(), 
                                 'to_check_user':USER_LIST[to_check_user_ind].lower(),
								 'userInd': user_ind, 'toCheckUserInd':to_check_user_ind, 
								 'taskInd': task_ind, 'error':"", 'heading':APP_DISPALY_LABEL}

	
	return HttpResponse(template.render(context, request))


def start_serve_image_files(context, request):
	
	user_ind = context["userInd"]
	task_ind = context["taskInd"] 
	to_check_user_ind = context["toCheckUserInd"] 
	USER = USER_LIST[user_ind].lower()
	TASK = ADMIN_TASKS[task_ind].lower()
	TO_CHECK_USER = USER_LIST[to_check_user_ind].lower()
	directory = os.path.join(settings.STATIC_ROOT, context["dir"])
	
	IMAGES = imageFiles()
	if TASK == "view":
		IMAGES.load_files(directory, prefix_to_add=context["dir"])
	else:
		IMAGES.load_files_for_user(directory, TO_CHECK_USER, TASK, 
								   path_to_add=context["dir"], 
							       select_files=context["filesList"])

	request.session['images'] = IMAGES.get_json_string_for_client()
	request.session['admin'] = {'user':USER, 'task':TASK, 'to_check_user':TO_CHECK_USER,
								 'userInd': user_ind, 'toCheckUserInd':to_check_user_ind, 
								 'taskInd': task_ind, 'error':"", 'heading':APP_DISPALY_LABEL}
	return IMAGES

def create_dummy_admin(task="", error=""):
	user = USER_LIST[0].lower()
	user_ind = 0
	task_ind = -1
	if len(task) > 0:
		task_ind = get_index(task, ALL_TASKS)
	if task_ind == -1:
		task = ALL_TASKS[0]
		task_ind = 0

	admin = {'user':user, 'task':task, 'to_check_user':user,
	 'userInd': user_ind, 'toCheckUserInd':user_ind, 
	 'taskInd': task_ind, 'error':error}
	return admin


def serve_image_files(request):	
	images_json = request.session.get('images', None)
	admin = request.session.get('admin', None)
	
	if images_json is not None and admin is not None:
		IMAGES = imageFiles()
		IMAGES.load_from_json_string(images_json)		
	else:
		admin = create_dummy_admin(task="annotate", 
									error="Session interrupted in annotate. Please reload page")
		IMAGES = imageFiles()
		request.session['admin'] = admin
		request.session['images'] = IMAGES.get_json_string_for_client()
		add_log(admin, IMAGES, 'serve_image/serve_home/empty')
		return redirect(serve_homepage) 

	filename = IMAGES.get_current()
	line_json = None
	
	if request.method == 'POST':
		if 'Previous' in request.POST:
			IMAGES, admin, page_json = load_from_response(request, 'Previous')
			save_json(page_json, IMAGES.get_current(),
					  admin['to_check_user'])
			add_log(admin, IMAGES, 'serve_image/previous')
			filename = IMAGES.get_previous()
		elif 'Next' in request.POST:
			
			IMAGES, admin, page_json = load_from_response(request, 'Next')
			save_json(page_json, IMAGES.get_current(),
					  admin['to_check_user'])		
			add_log(admin, IMAGES, 'serve_image/next')            
			if IMAGES.is_at_end_value() == 1:				
				return redirect(serve_homepage)
			else:
				filename = IMAGES.get_next()
				
		elif 'Save' in request.POST:
			IMAGES, admin, page_json = load_from_response(request, 'Save')
			save_json(page_json, IMAGES.get_current(),
					  admin['to_check_user'])	
			add_log(admin, IMAGES, 'serve_image/save')                   
			line_json = page_json
			filename = IMAGES.get_current()	

		elif 'End' in request.POST:
			IMAGES, admin, page_json = load_from_response(request, 'End')
			save_json(page_json, IMAGES.get_current(),
					  admin['to_check_user'])	
			add_log(admin, IMAGES, 'serve_image/serve_homepage/end')
			return redirect(serve_homepage)
			
	img_file = IMAGES.get_current()	
	if len(img_file) == 0:
		if admin is None:
			admin = create_dummy_admin(task="annotate", 
										error="Session interrupted in annotate. Please reload page")
		admin['error'] = "No files found"
		add_log(admin, IMAGES, 'serve_image/serve_homepage/eror')
		request.session['admin'] = admin
		request.session['images'] = IMAGES.get_json_string_for_client()
		return redirect(serve_homepage) 

	filename = img_file
	# Is not none if save is clicked
	if line_json is None:
		line_json = get_json_str(filename, admin['to_check_user'], admin['task'])
		
	template = get_template('annotateImage.html')

	context = {"imageFile": img_file, 
	           "lines": line_json,
	           "image_width": 600,
	           "atEnd": IMAGES.is_at_end_value(),
	           "images_obj": IMAGES.get_json_string_for_client(),
	           "admin": admin, 
	           "heading": APP_DISPALY_LABEL
	           }

	request.session['admin'] = admin
	request.session['images'] = IMAGES.get_json_string_for_client()	           
	add_log(admin, IMAGES, 'serve_image/serve_image')
	return HttpResponse(template.render(context, request))

def view_files(request):
	
	admin = None
	images_json = request.session.get('images', None)
	admin = request.session.get('admin', None)
	if images_json is None or admin is None:
		admin = create_dummy_admin(task="view", 
									error="Session interrupted in view. Please reload page")
		IMAGES = imageFiles()
		request.session['admin'] = admin
		request.session['images'] = IMAGES.get_json_string_for_client()
		add_log(admin, IMAGES, 'view/serve_homepage/empty')
		return redirect(serve_homepage) 

	IMAGES = imageFiles()
	IMAGES.load_from_json_string(images_json)

	template = get_template('viewTranscription.html')

	if request.method == 'POST':
		if 'previous' in request.POST:
			json_obj = json.loads(request.POST['previous'])
	
			images_json = json_obj['images_obj']
			IMAGES = imageFiles()
			IMAGES.load_from_json_string(images_json)
			admin = json_obj['admin']
			_ = IMAGES.get_previous()
			add_log(admin, IMAGES, 'view/previous')
		elif 'next' in request.POST:
			json_obj = json.loads(request.POST['next'])
	
			images_json = json_obj['images_obj']
			IMAGES = imageFiles()
			IMAGES.load_from_json_string(images_json)
			admin = json_obj['admin']
			_ = IMAGES.get_next()
			add_log(admin, IMAGES, 'view/next')
		elif 'end' in request.POST:
			json_obj = json.loads(request.POST['end'])
	
			images_json = json_obj['images_obj']
			IMAGES = imageFiles()
			IMAGES.load_from_json_string(images_json)
			add_log(admin, IMAGES, 'view/serve_homepage')
			return redirect(serve_homepage)


	img_file_1 = IMAGES.get_current()
	img_file_2 = IMAGES.get_file_2()
	

	json_file_list = IMAGES.get_json_files()
	json_file_list.sort()
	json_dict = {"fileList":json_file_list}
	
	for ind, f in enumerate(json_file_list):
	    json_obj = get_json(f)
	    json_dict[f] = json_obj
	
	
	context = {
	           "img_file_1": img_file_1,
		       "img_file_2": img_file_2,
		       "jsonList": json_dict,
		       "admin": admin,
		       "images_obj": IMAGES.get_json_string_for_client(),
		       "heading": APP_DISPALY_LABEL
	          }

	add_log(admin, IMAGES, 'view/view')   
	request.session['admin'] = admin
	request.session['images'] = IMAGES.get_json_string_for_client()	           
	return HttpResponse(template.render(context, request))

def get_json_str_and_filename(full_filename, admin):
	# read file
	path, filename = os.path.split(full_filename)
	basename, ext = os.path.splitext(filename)

	json_file = basename + "_" + "annotate" + '_' +\
					 admin['to_check_user'] + '.json' 

	full_path = os.path.join(settings.STATIC_ROOT, path, json_file)
	line_obj = {}
	if os.path.exists(full_path):

		with open(full_path, 'r') as myfile:
			data = myfile.read()

		# parse file
		line_obj = json.loads(data)

	else:
		json_file_plain = basename + '.json'
		json_file_plain = os.path.join(settings.STATIC_ROOT, path, json_file_plain)	
		if os.path.exists(json_file_plain):
			json_file = basename + '.json'
			with open(json_file_plain, 'r') as myfile:
				data = myfile.read()
				# parse file
				line_obj = json.loads(data)

	return json_file, line_obj

def load_from_response(request, name):
	json_obj = json.loads(request.POST[name])
	
	images_json = json_obj['images_obj']
	images = imageFiles()
	images.load_from_json_string(images_json)
	admin = json_obj['admin']
	page_json = json.loads(json_obj['page_json'])

	return images, admin, page_json


def load_from_transcribe_block_response(request, name):
	json_obj = json.loads(request.POST[name])
	
	images_json = json_obj['images_obj']
	images = imageFiles()
	images.load_from_json_string(images_json)
	admin = json_obj['admin']
	page_json = json.loads(json_obj['page_json'])

	options = json_obj['options']

	return images, admin, page_json, options


def submit_file(jpg_filename, admin):
	user = admin['to_check_user']
	submitted_folder = user + SUBMIT_PREFIX + '/'
	path, filename = os.path.split(jpg_filename)
	basename, ext = os.path.splitext(filename)
	# Get full json and jpg filenames
	json_file = basename + "_" + "annotate" + '_' +\
					 admin['to_check_user'] + '.json' 
	full_json_path = os.path.join(settings.STATIC_ROOT, path, json_file)				 
	full_jpg_path = os.path.join(settings.STATIC_ROOT, jpg_filename)

	# Get target path and create if it does not exist
	if user in path:
		target_path = path.replace(user, submitted_folder)
	else:
		target_path = SUBMIT_PREFIX + '/'

	full_target_path = os.path.join(settings.STATIC_ROOT, target_path)
	if not os.path.exists(full_target_path):
		os.mkdir(full_target_path)

	try:
		# Take backup of existing json
		backupname = full_json_path[:-4] + str(time.time()) + '.json.submitted'
		shutil.copyfile(full_json_path, backupname)
		# Move both jpg and json files to submitted folder
		target_json = os.path.join(full_target_path, json_file)
		target_jpg = os.path.join(full_target_path, filename)
		shutil.move(full_json_path, target_json)
		shutil.move(full_jpg_path, target_jpg)
		return True, "done"
	except Exception as e:
		return True, str(e)

def submit_checked_file(jpg_filename, admin):
	user = admin['to_check_user']
	checked_folder = user + CHECKED_PREFIX + '/'
	path, filename = os.path.split(jpg_filename)
	basename, ext = os.path.splitext(filename)
	# Get full json and jpg filenames
	json_file = basename + "_" + "annotate" + '_' +\
					 admin['to_check_user'] + '.json' 
	full_json_path = os.path.join(settings.STATIC_ROOT, path, json_file)				 
	full_jpg_path = os.path.join(settings.STATIC_ROOT, jpg_filename)

	# Get target path and create if it does not exist
	if SUBMIT_PREFIX in path:
		target_path = path.replace(SUBMIT_PREFIX, CHECKED_PREFIX)
	else:
		target_path = CHECKED_PREFIX + '/'

	full_target_path = os.path.join(settings.STATIC_ROOT, target_path)
	if not os.path.exists(full_target_path):
		os.mkdir(full_target_path)

	#print('?????, target', full_target_path)
	try:
		# Take backup of existing json
		backupname = full_json_path[:-4] + str(time.time()) + '.json.checked'
		shutil.copyfile(full_json_path, backupname)
		# Move both jpg and json files to submitted folder
		target_json = os.path.join(full_target_path, json_file)
		target_jpg = os.path.join(full_target_path, filename)
		shutil.move(full_json_path, target_json)
		shutil.move(full_jpg_path, target_jpg)
		return True, "done"
	except Exception as e:
		return True, str(e)



def transcribe(request):
	
	scroll_position = {"x": 0, "y": 0}
	
	checking_flag = request.session.get('checkingMenu', 0)	
	
	images_json = request.session.get('images', None)
	admin = request.session.get('admin', None)
	
	if images_json is None or admin is None:
		admin = create_dummy_admin(task="transcribe", 
									error="Session interrupted in transcribe. Please reload page")		
		IMAGES = imageFiles()
		request.session['admin'] = admin
		request.session['images'] = IMAGES.get_json_string_for_client()
		add_log(admin, IMAGES, 'transcribe/serve_homepage/empty')
		return redirect(serve_homepage) 

	IMAGES = imageFiles()
	IMAGES.load_from_json_string(images_json)	
	template = get_template('transcribe.html')

	if request.method == 'POST':

		if 'previous' in request.POST:
			IMAGES, admin, page_json = load_from_response(request, 'previous')
			save_json(page_json, IMAGES.get_current(),
					  admin['to_check_user'])
			add_log(admin, IMAGES, 'transcribe/previous')            
			filename = IMAGES.get_previous()
		elif 'next' in request.POST:
			IMAGES, admin, page_json = load_from_response(request, 'next')
			save_json(page_json, IMAGES.get_current(),
					  admin['to_check_user'])
			add_log(admin, IMAGES, 'transcribe/next')            
			filename = IMAGES.get_next()
		elif 'save' in request.POST:
			IMAGES, admin, page_json = load_from_response(request, 'save')      
			save_json(page_json, IMAGES.get_current(),
					  admin['to_check_user'])
			add_log(admin, IMAGES, 'transcribe/save')    
			json_obj = json.loads(request.POST['save'])
			scroll_position = json_obj['scroll_position']   
			
		elif 'end' in request.POST:
			IMAGES, admin, page_json = load_from_response(request, 'end')      
			save_json(page_json, IMAGES.get_current(),
					  admin['to_check_user'])
			add_log(admin, IMAGES, 'transcribe/serve_homepage')
			return redirect(serve_homepage)
		elif 'submit' in request.POST:
			IMAGES, admin, page_json = load_from_response(request, 'submit')      
			save_json(page_json, IMAGES.get_current(),
					  admin['to_check_user'])
			submit_done, return_error = submit_file(IMAGES.get_current(), admin)
			if not submit_done:
				admin['error'] = 'Error submitting: ' + return_error
				request.session['admin'] = admin
				request.session['images'] = IMAGES.get_json_string_for_client()
				add_log(admin, IMAGES, 'transcribe/submit/{}'.format(return_error))
				return redirect(serve_homepage)
			else:
				IMAGES.remove_current()
				add_log(admin, IMAGES, 'transcribe/submit'+ return_error)
		elif 'checked' in request.POST:
			IMAGES, admin, page_json = load_from_response(request, 'checked')      
			save_json(page_json, IMAGES.get_current(),
					  admin['to_check_user'])
			check_done, return_error = submit_checked_file(IMAGES.get_current(), admin)
			if not check_done:
				admin['error'] = 'Error submitting checked file: ' + return_error
				request.session['admin'] = admin
				request.session['images'] = IMAGES.get_json_string_for_client()
				add_log(admin, IMAGES, 'transcribe/check/{}'.format(return_error))
				return redirect(serve_homepage)
			else:
				IMAGES.remove_current()
				add_log(admin, IMAGES, 'transcribe/check' + return_error)				

	if IMAGES.empty_files() == 1:
		admin['error'] = 'Reached the end. Thank you!'
		request.session['admin'] = admin
		request.session['images'] = IMAGES.get_json_string_for_client()
		add_log(admin, IMAGES, 'transcribe/submit/done')
		return redirect(serve_homepage)			

	img_file_1 = IMAGES.get_current()
	img_file_2 = IMAGES.get_current()

	json_file, line_obj = get_json_str_and_filename(img_file_1, admin)
	json_dict = {"fileList":[json_file]}
	json_dict[json_file] = line_obj
	
	
	context = {
	           "img_file_1": img_file_1,
		       "img_file_2": img_file_2,
		       "jsonList": json_dict,
		       "admin": admin,
		       "images_obj": IMAGES.get_json_string_for_client(),
		       "checking": checking_flag,
		       "scroll_position": scroll_position,
		       
	          } 

	add_log(admin, IMAGES, 'transcribe/transcribe')
	request.session['admin'] = admin
	request.session['images'] = IMAGES.get_json_string_for_client()
	return HttpResponse(template.render(context, request))


def transcribe_block(request, user_name="mehreen"):

	# scroll position only important when saving. Client screen will jump to 
	# the saved scroll position
	scroll_position = {"x": 0, "y": 0}
	options = {"radius": 2, "lineWidth": 1, "zoomFactor": 1.0, "colWidth": 6}
	col_width = 6
	checking_flag = request.session.get('checkingMenu', 0)	
	
	images_json = request.session.get('images', None)
	admin = request.session.get('admin', None)
	
	if images_json is None or admin is None:
		admin = create_dummy_admin(task="transcribeBlock", 
									error="Session interrupted in transcribe. Please reload page")		
		IMAGES = imageFiles()
		request.session['admin'] = admin
		request.session['images'] = IMAGES.get_json_string_for_client()
		add_log(admin, IMAGES, 'transcribeBlock/serve_homepage/empty')
		return redirect(serve_homepage) 

	IMAGES = imageFiles()
	IMAGES.load_from_json_string(images_json)
	template = get_template('transcribeBlock.html')
	if request.method == 'POST':
		if 'previous' in request.POST:
			IMAGES, admin, page_json, options = load_from_transcribe_block_response(request, 'previous')
			save_json(page_json, IMAGES.get_current(),
					  admin['to_check_user'])
			add_log(admin, IMAGES, 'transcribeBlock/previous')
			filename = IMAGES.get_previous()
		elif 'next' in request.POST:
			IMAGES, admin, page_json, options = load_from_transcribe_block_response(request, 'next')
			save_json(page_json, IMAGES.get_current(),
					  admin['to_check_user'])
			add_log(admin, IMAGES, 'transcribeBlock/next')
			filename = IMAGES.get_next()
		elif 'save' in request.POST:
			IMAGES, admin, page_json, options = load_from_transcribe_block_response(request, 'save')      
			save_json(page_json, IMAGES.get_current(),
					  admin['to_check_user'])
			add_log(admin, IMAGES, 'transcribeBlock/save')
			json_obj = json.loads(request.POST['save'])
			scroll_position = json_obj['scroll_position']			   
		elif 'end' in request.POST:
			IMAGES, admin, page_json, options = load_from_transcribe_block_response(request, 'end')      
			save_json(page_json, IMAGES.get_current(),
					  admin['to_check_user'])
			add_log(admin, IMAGES, 'transcribeBlock/end')
			return redirect(serve_homepage)
		elif 'submit' in request.POST:
			IMAGES, admin, page_json, options = load_from_transcribe_block_response(request, 'submit')      
			save_json(page_json, IMAGES.get_current(),
					  admin['to_check_user'])
			submit_done, return_error = submit_file(IMAGES.get_current(), admin)
			if not submit_done:
				admin['error'] = 'Error submitting: ' + return_error
				request.session['admin'] = admin
				request.session['images'] = IMAGES.get_json_string_for_client()
				add_log(admin, IMAGES, 'transcribeBlock/submit/{}'.format(return_error))
				return redirect(serve_homepage)
			else:
				IMAGES.remove_current()
				add_log(admin, IMAGES, 'transcribeBlock/submit '+ return_error)
		elif 'checked' in request.POST:
			IMAGES, admin, page_json, options = load_from_transcribe_block_response(request, 'checked')      
			save_json(page_json, IMAGES.get_current(),
					  admin['to_check_user'])
			check_done, return_error = submit_checked_file(IMAGES.get_current(), admin)
			if not check_done:
				admin['error'] = 'Error submitting checked file: ' + return_error
				request.session['admin'] = admin
				request.session['images'] = IMAGES.get_json_string_for_client()
				add_log(admin, IMAGES, 'transcribeBlock/check/{}'.format(return_error))
				return redirect(serve_homepage)
			else:
				IMAGES.remove_current()
				add_log(admin, IMAGES, 'transcribeBlock/check'+return_error)				

            
	if IMAGES.empty_files() == 1:
		admin['error'] = 'Reached the end. Thank you!'
		request.session['admin'] = admin
		request.session['images'] = IMAGES.get_json_string_for_client()
		add_log(admin, IMAGES, 'transcribeBlock/submit/done')
		return redirect(serve_homepage)		


	img_file_1 = IMAGES.get_current()
	img_file_2 = IMAGES.get_current()

	json_file, line_obj = get_json_str_and_filename(img_file_1, admin)
	json_dict = {"fileList":[json_file]}
	json_dict[json_file] = line_obj
	
	
	context = {
	           "img_file_1": img_file_1,
		       "img_file_2": img_file_2,
		       "jsonList": json_dict,
		       "admin": admin,
		       "images_obj": IMAGES.get_json_string_for_client(),
		       "checking": checking_flag,
		       "scroll_position": scroll_position,
		       "options": options, 
		       "heading": APP_DISPALY_LABEL
	          }
	add_log(admin, IMAGES, 'transcribe_block/transcribe_block')
	
	request.session['admin'] = admin
	request.session['images'] = IMAGES.get_json_string_for_client()
	return HttpResponse(template.render(context, request))

def get_index(item, item_list):
	for ind, i in enumerate(item_list):
		if i.lower() == item.lower():
			return ind
	return -1


def mark_lines(request, user_name):
	
	user = user_name.lower()
	task = "annotate"

	user_ind = get_index(user, USER_LIST)
	if  user_ind == -1:
		admin = create_dummy_admin(task="annotate", 
									error="No user found: " + user_name)
		IMAGES = imageFiles()
		request.session['admin'] = admin
		request.session['images'] = IMAGES.get_json_string_for_client()
		add_log(admin, IMAGES, 'mark_lines/serve_homepage/error')
		return redirect(serve_homepage) 

	#time.sleep(10)	

	directory = os.path.join(settings.STATIC_ROOT, "datasets/", user+'/')
	IMAGES = imageFiles()
	
	IMAGES.load_files_for_user(directory, user=user, task=task, 
								path_to_add="datasets/" + user + '/')    	
	
	admin = {'user':user, 'task':"annotate", 'to_check_user':user,
								 'userInd': user_ind, 'toCheckUserInd':user_ind, 
								 'taskInd': 0, 'error':""}	

	# If no files left to annotate change the task to verify							 
	if IMAGES.empty_files() == 1:		
		task = "verify"		
		admin['task'] = "verify"
		admin['taskInd'] = 2
		IMAGES.load_files_for_user(directory, user=user, task=task, 
								   path_to_add="datasets/" + user + '/')

	request.session['admin'] = admin
	request.session['images'] = IMAGES.get_json_string_for_client()	
	request.session['checkingMenu'] = 0	
	
	add_log(admin, IMAGES, 'mark_lines/serve_image_files')
	return redirect(serve_image_files)							

# No longer used
def type_lines(request, user_name):
	
	user = user_name.lower()
	task = "transcribe"
	

	user_ind = get_index(user, USER_LIST)
	if  user_ind == -1:
		admin = create_dummy_admin(task="transcribe", 
									error="No user found: " + user_name)
		
		IMAGES = imageFiles()
		request.session['admin'] = admin
		request.session['images'] = IMAGES.get_json_string_for_client()
		add_log(admin, IMAGES, 'type_lines/serve_homepage/error')
		return redirect(serve_homepage) 

	
	directory = os.path.join(settings.STATIC_ROOT, "datasets/", user+'/')
	IMAGES = imageFiles()
	
	IMAGES.load_files_for_user(directory, user=user, task=task, 
								path_to_add="datasets/" + user + '/')    
	admin = {'user':user, 'task':"transcribe", 'to_check_user':user,
								 'userInd': user_ind, 'toCheckUserInd':user_ind, 
								 'taskInd': 4, 'error':""}	
	request.session['admin'] = admin
	request.session['images'] = IMAGES.get_json_string_for_client()
	request.session['checkingMenu'] = 0
	
	if IMAGES.empty_files():	
		# No images to transcribe
		admin['task'] = "annotate"
		admin['taskInd'] = 0
		admin['error'] = "No images to transcribe"
		request.session['admin'] = admin
		
		add_log(admin, IMAGES, 'type_lines/homepage')
		return redirect(serve_homepage)
									 
	add_log(admin, IMAGES, 'type_lines/transcribe')								 
	return redirect(transcribe)							

def enter(request, user_name):
	
	user = user_name.lower()
	task = "transcribeblock"
	

	user_ind = get_index(user, USER_LIST)
	if  user_ind == -1:
		admin = create_dummy_admin(task="transcribeblock", 
									error="No user found: " + user_name)
		
		IMAGES = imageFiles()
		request.session['admin'] = admin
		request.session['images'] = IMAGES.get_json_string_for_client()
		add_log(admin, IMAGES, 'enter/serve_homepage/error')
		return redirect(serve_homepage) 

	
	directory = os.path.join(settings.STATIC_ROOT, "datasets/", user+'/')
	IMAGES = imageFiles()
	
	IMAGES.load_files_for_user(directory, user=user, task=task, 
								path_to_add="datasets/" + user + '/')    
	admin = {'user':user, 'task':"transcribeblock", 'to_check_user':user,
								 'userInd': user_ind, 'toCheckUserInd':user_ind, 
								 'taskInd': 5, 'error':""}	
	request.session['admin'] = admin
	request.session['images'] = IMAGES.get_json_string_for_client()
	request.session['checkingMenu'] = 0
	
	if IMAGES.empty_files():	
		# No images to transcribe
		admin['task'] = "annotate"
		admin['taskInd'] = 0
		admin['error'] = "No images to transcribe"
		request.session['admin'] = admin
		
		add_log(admin, IMAGES, 'enter/homepage')
		return redirect(serve_homepage)
									 
	add_log(admin, IMAGES, 'enter/transcribeBlock')								 
	return redirect(transcribe_block)							


def check_homepage(request):

	task_ind = get_index("check", ADMIN_TASKS)
	user_ind = 0
	to_check_user_ind = 0
	task = ADMIN_TASKS[task_ind]
	admin = request.session.get('admin', None)
	if admin is not None:
		admin = request.session['admin']
		admin['task'] = ADMIN_TASKS[task_ind].lower() 
		admin['taskInd'] = task_ind
		request.session['admin'] = admin
	else:
		request.session['admin'] = {'user':USER_LIST[user_ind].lower(), 
                                 'task':ADMIN_TASKS[task_ind ].lower(), 
                                 'to_check_user':USER_LIST[to_check_user_ind].lower(),
								 'userInd': user_ind, 'toCheckUserInd':to_check_user_ind, 
								 'taskInd': task_ind, 'error':""}
	request.session['checkingMenu'] = 1
	return redirect(serve_homepage)


def add_log(admin, images_obj, comment=""):
	if not STORE_LOG:
		return
    # Log eastern time ... https://pynative.com/python-timezone/
	tz = timezone('EST')
	date_time = datetime.now(tz) 
	time_str = date_time.strftime('%Y-%m-%d %H:%M:%S')
	strToWrite = time_str + ' ' + 'comment: ' + comment + '\n'
	strToWrite += '\t' + admin['user'] + ' ' + str(admin['userInd']) + ' ' + admin['task'] + ' ' + str(admin['taskInd'])
	strToWrite += ' ' + admin['to_check_user'] + ' ' + str(admin['toCheckUserInd']) + '\n'
	strToWrite += '\t' + str(images_obj.index) + ' ' + images_obj.get_current() + '\n'

	with open(LOG_FILE, 'a') as fout:
		fout.write(strToWrite)


def upload_file(request):
	template = get_template('uploadFiles.html')
	context = {"users": USER_LIST,         
           		"error": [""],
           		"not_done": [],
           		"done": []
           	  } 

	if request.method == 'POST':
		if 'user' in request.POST:
			user = request.POST['user'].lower()
		else:
			context["error"] = "No user selected"
			return HttpResponse(template.render(context, request))

		uploaded_files = request.FILES.getlist('files')	
		directory = os.path.join(settings.STATIC_ROOT, DATASETS_PATH, user+'/')
		if not os.path.exists(directory):
			os.mkdir(directory)
		notdone_list = []
		done_list = []

		for file_item in uploaded_files:
			#print('****',file_item)
			target_filename = os.path.join(directory, file_item.name)
			# File already exists
			if os.path.exists(target_filename):
				notdone_list.append({"filename":file_item.name, "error":"File exists"})
			else:
				try:
					with open(target_filename, 'wb+') as destination:
						for chunk in file_item.chunks():
							destination.write(chunk)
					done_list.append(file_item.name)
				except Exception as e:
					notdone_list.append({"filename": file_item.name, "error": e})
			

		
		context['not_done'] = notdone_list
		context['done'] = done_list
		return HttpResponse(template.render(context, request))
	return HttpResponse(template.render(context, request))


def view_edit_distance(request):

	user = "mehreen"
	user_ind = get_index("mehreen", USER_LIST)
	task = "viewEditDistance"

	images_json = request.session.get('images', None)
	admin = request.session.get('admin', None)
	
	if images_json is None or admin is None:
		directory = os.path.join(settings.STATIC_ROOT, "datasets/", user+'/')
		IMAGES = imageFiles()
	
		IMAGES.load_files_for_user(directory, user=user, task="transcribeblock", 
								path_to_add="datasets/" + user + '/')   

	else:
		IMAGES = imageFiles()
		IMAGES.load_from_json_string(images_json)
		
	 
	admin = {'user':user, 'task':"viewEditDistance", 'to_check_user':user,
								 'userInd': user_ind, 'toCheckUserInd':user_ind, 
								 'taskInd': get_index("viewEditDistance", ALL_TASKS), 'error':""}	
	request.session['admin'] = admin
	request.session['images'] = IMAGES.get_json_string_for_client()
	request.session['checkingMenu'] = 0
	



	template = get_template('viewEditDistance.html')
	if request.method == 'POST':
		if 'previous' in request.POST:
			
			add_log(admin, IMAGES, 'viewEditDistance/previous')
			filename = IMAGES.get_previous()
		elif 'next' in request.POST:
			
			add_log(admin, IMAGES, 'viewEditDistance/next')
			filename = IMAGES.get_next()
		elif 'end' in request.POST:
			IMAGES, admin, page_json, options = load_from_transcribe_block_response(request, 'end')      
			save_json(page_json, IMAGES.get_current(),
					  admin['to_check_user'])
			add_log(admin, IMAGES, 'viewEditDistance/end')
			return redirect(serve_homepage)

            
	if IMAGES.empty_files() == 1:
		admin['error'] = 'Reached the end.'
		request.session['admin'] = admin
		request.session['images'] = IMAGES.get_json_string_for_client()
		add_log(admin, IMAGES, 'viewEditDistance/noImages')
		return redirect(serve_homepage)		


	img_file = IMAGES.get_current()


	json_file, line_obj = get_json_str_and_filename(img_file, admin)
	json_dict = {"fileList":[json_file]}
	json_dict[json_file] = line_obj
	
	
	context = {
	           "img_file": img_file,		       
		       "jsonList": json_dict,
		       "admin": admin,
		       "images_obj": IMAGES.get_json_string_for_client(),
		       "heading": APP_DISPALY_LABEL
	          }
	add_log(admin, IMAGES, 'viewEditDistance/viewEditDistance')
	
	request.session['admin'] = admin
	request.session['images'] = IMAGES.get_json_string_for_client()
	return HttpResponse(template.render(context, request))			
