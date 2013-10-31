from django.conf.urls import patterns, include, url

from web import views
from web.interface import interface


# most ordinary views are served through web/views.py
# interface-related views are served through web/interface/interface.py
urlpatterns = patterns('',
    # index, alias for customer
    url(r'^$', views.index, name='index'),
    # ofs
    url(r'^ofs/$', views.ofs, name='ofs'),
    # stall
    url(r'^stall/$',views.stall,name='stall'),
    url(r'^stall/upimg$',views.stall_upimg,name='stall/upimg'),
    # customer
    url(r'^customer/$', views.customer, name='customer'),
    url(r'^payment/$', views.payment, name='payment'),

    # interface urls
    url(r'^interface/int.js$', interface.interfacejs, name='int_js'),
    url(r'^interface/request/$', interface.request, name='int_request'),

    # test stuffs
    url(r'^yqtest/jsonpage/$', views.yqtest, name='yqtest'),
    url(r'^yltest/jsonpage/$', views.yltest, name='yltest'),
)
