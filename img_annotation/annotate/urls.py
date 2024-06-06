"""img_annotation URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path
from . import views
from . import tag_views

urlpatterns = [
    path('home/', views.serve_homepage, name='annotateHome'),
    path('annotateImage/', views.serve_image_files, name='annotateImage'),
    #path('view/', views.view_files, name='view'),
    #path('transcribe/', views.transcribe, name='transcribe'),
    path('transcribeBlock/', views.transcribe_block, name='transcribeBlock'),
    #path('mark_lines/<str:user_name>/', views.mark_lines, name='mark_lines'),
    #path('type_lines/<str:user_name>/', views.type_lines, name='type_lines'),
    path('check', views.check_homepage, name='check_files'),
    path('upload', views.upload_file, name='upload_file'),
    path('enter/<str:user_name>/', views.enter, name='enter_block'),
    #path('editDistance', views.view_edit_distance, name='view_edit_distance'),  
    path('tagImage', tag_views.tag_image, name='tag_image'), 
    path('starttagging', tag_views.tag_home, name='tag_home'),  
    path('tag/<str:user_name>/', tag_views.tag, name='tag'), 
    path('checktags', tag_views.check_tags, name='check_tags'), 
]

