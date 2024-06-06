import os
from django.conf import settings

FILE_TYPES = ['_annotated', '_verified']

class imageFiles():
    def __init__(self):
        self.files = []
        self.index = 0 
        self.path = ""


    def load_files(self, directory='datasets', prefix_to_add=""):
        file_list = []
        path = os.path.join(settings.STATIC_ROOT, directory)
        
        dir_list = os.listdir(path)
        dir_list.sort()
        for filename in dir_list:
            # Check if both jpg and json exist
            if filename.lower().endswith('.jpg') and not 'clean' in filename:
                #json_file = filename[:-3] + 'json'
                #if json_file in dir_list:
                full_filename = os.path.join(prefix_to_add, filename)
                file_list.append(full_filename)

        self.index = 0
        self.files = file_list
        self.path = directory
        return file_list



    def load_files_for_user(self, directory, user, task, path_to_add="", select_files=""):
        if not os.path.exists(directory):
            self.files = []
            self.index = 0 
            self.path = ""
            return []

        file_list = []
        if (task == "annotate"):
            file_list = self.load_files_to_annotate(directory, prefix_to_add=path_to_add)
        elif (task == "verify"):
            file_list = self.load_files_to_verify(directory, user, prefix_to_add=path_to_add)
        elif (task == "transcribe") or (task == "check"):
            # Works the same way as verify
            file_list = self.load_files_to_verify(directory, user, prefix_to_add=path_to_add)            
        elif (task == "select"):
            # file list is already present            
            file_list = [os.path.join(path_to_add, f) for f in select_files]
        elif (task == "view"):
            file_list = self.load_files(directory, path_to_add)
            
        elif task == "transcribeblock":
            # Loads annotations of user. If no annotation file then loads the jpg file as is
            file_list = self.load_files_for_transcribe_block(directory, user, prefix_to_add=path_to_add)  
        elif task == "viewTag" or task == "tag":
            # Loads all files for tagging no matter who the user is
            if len(select_files) > 0:
                file_list = [os.path.join(path_to_add, f) for f in select_files]
            else:
                file_list = self.load_files_for_tagging(directory, prefix_to_add=path_to_add)  
        self.index = 0
        self.files = file_list
        self.path = directory
        return file_list

    def load_files_for_tagging(self, directory, prefix_to_add=""):
        file_list = []
        path = directory
        dir_list = os.listdir(path)
        dir_list.sort()
        
        for i in range(len(dir_list)):
            basename, ext = os.path.splitext(dir_list[i])           
            if ext.lower() == '.jpg':
                file_list.append(os.path.join(prefix_to_add, dir_list[i]))                
        self.index = 0
        self.files = file_list
        self.path = directory            
        return file_list          


    def load_files_to_annotate(self, directory, prefix_to_add=""):
        file_list = []
        path = directory

        dir_list = os.listdir(path)
        dir_list.sort()

        for i in range(len(dir_list)):
            basename, ext = os.path.splitext(dir_list[i])
            annotated_name_start = basename + "_annotate"
            
            if ext.lower() == '.jpg':
                annotated_list = [f for f in dir_list\
                                  if f.startswith(annotated_name_start)]
                
                json_file = basename + '.json'
                if len(annotated_list) == 0: # and json_file in dir_list:
                    file_list.append(os.path.join(prefix_to_add, dir_list[i]))

        self.index = 0
        self.files = file_list
        self.path = directory            
        return file_list  

    def load_files_to_verify(self, directory, user, prefix_to_add=""):
        file_list = []
        path = directory
        dir_list = os.listdir(path)
        dir_list.sort()
        
        for i in range(len(dir_list)):
            basename, ext = os.path.splitext(dir_list[i])
            annotated_name_start = basename + "_annotate"
            
            if ext.lower() == '.jpg':
                annotated_list = [f for f in dir_list\
                                  if f.startswith(annotated_name_start) and user in f]
                
                json_file = basename + '.json'
                if len(annotated_list) > 0: #and json_file in dir_list:
                    file_list.append(os.path.join(prefix_to_add, dir_list[i]))
        self.index = 0
        self.files = file_list
        self.path = directory            
        return file_list  

    def load_files_for_transcribe_block(self, directory, user, prefix_to_add):
        file_list = []
        path = directory
        dir_list = os.listdir(path)
        dir_list.sort()
        
        for i in range(len(dir_list)):
            basename, ext = os.path.splitext(dir_list[i])           
            if ext.lower() == '.jpg':
                file_list.append(os.path.join(prefix_to_add, dir_list[i]))                
        self.index = 0
        self.files = file_list
        self.path = directory            
        return file_list  


    def get_previous(self):
        if len(self.files) == 0:
            return ""        
        total = len(self.files)
        self.index = (self.index - 1 + total) % total
        return self.files[self.index]

    def get_next(self):
        if len(self.files) == 0:
            return ""        
        total = len(self.files)
        self.index = (self.index + 1) % total
        return self.files[self.index]

    def get_current(self):
        if len(self.files) == 0:
            return ""        
        return self.files[self.index]

    def is_at_end_value(self):
        # IF no files
        if len(self.files) == 0:
            return 1

        if self.index == len(self.files) - 1:
            return 1
        return 0    
  
    def empty_files(self):
        # IF no files
        if len(self.files) == 0:
            return True    
        return False  

    def remove_current(self):
        if len(self.files) == 0:
            return False
        self.files.pop(self.index)
        if self.index >= len(self.files):
            self.index = 0
        if len(self.files) == 0:
            self.path = ""

        return True

    # Retreive the clean file name corresponding to current file
    # If it exists, return clean file. Otherwise return the current file	
    def get_file_2(self):
        filename = self.get_current()
        prefix_to_add, filename = os.path.split(filename)
        basename, ext =  os.path.splitext(filename)
        clean_name = basename + '_clean' + ext
        #print('....clean name, self.path', clean_name, self.path)
        #print('.... prefix_to_add', prefix_to_add)

        if os.path.exists(os.path.join(self.path, clean_name)):
            return os.path.join(prefix_to_add, clean_name)

        return self.get_current()
   
    # Retreive the json file names corresponding to current file
    def get_json_files(self):
        filename = self.get_current()
        prefix_to_add, filename = os.path.split(filename)
        basename, ext =  os.path.splitext(filename)
        #print('file basename', basename)
        #print('***', self.path)
        dir_list = os.listdir(self.path)

        
        file_list = []
        for f in dir_list:
            if f.endswith('.json'):
                if f.startswith(basename + '.json'):
                    file_list.append(os.path.join(prefix_to_add, f))
                if f.startswith(basename + '_annotate'):
                    file_list.append(os.path.join(prefix_to_add, f))
                if f.startswith(basename + '_clean'):
                    file_list.append(os.path.join(prefix_to_add, f))
                if f.startswith(basename + '._sfr'):
                    file_list.append(os.path.join(prefix_to_add, f))    
        return file_list  	  

    def get_json_string_for_client(self):
        json_obj = {'file_list': self.files, 'index': self.index, 'path': self.path}    
        return json_obj
            
   	
    def load_from_json_string(self, json_obj):
        self.files = json_obj['file_list']
        self.index = json_obj['index']
        self.path = json_obj['path']
   	
    #def get_all_annotated_files(self, )        


class directories():
    def __init__(self):
        self.dirs = []
        self.total_files = 0

    def load_directories(self, root_dir=settings.STATIC_ROOT, task="annotate", 
                            user="", include_submitted=False):

        files = imageFiles()
        self.total_files = 0
        
        if os.path.isdir(root_dir):
            # First check if this is a submitted or checked directory
            # In that case don't include them
            if not include_submitted and 'submitted' in os.path.basename(root_dir):
                return []

            if not include_submitted and 'checked' in os.path.basename(root_dir):
                return []
 

            d = {'name': os.path.basename(root_dir)}
            files = imageFiles()
            f = files.load_files_for_user(directory=root_dir, user=user, task=task)
            d['files'] = f
            d['sub_directories'] = []
            sub_dir = os.listdir(root_dir)
            for sub in sub_dir:
                temp = self.load_directories(os.path.join(root_dir, sub), task, user,
                                             include_submitted)
                if len(temp) > 0:
                    d['sub_directories'].append(temp)
                    self.total_files += len(temp)
        else: 
            return []
        return d

# Beyond neural scaling laws