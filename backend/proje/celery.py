import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proje.settings')

app = Celery('proje')

app.config_from_object('django.conf:settings', namespace='CELERY')

# discover all the tasks.py files in all apps
app.autodiscover_tasks()
