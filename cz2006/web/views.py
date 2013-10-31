from django.core.urlresolvers import reverse
from django.http import HttpResponse, Http404, HttpResponseRedirect
from django.shortcuts import render, get_object_or_404
from django.template import RequestContext, loader

from web.interface.stall import handle_upload


# index
def index(request):
    # this really is an alias for customer
    return customer(request)

# ofs
def ofs(request):
    return render(request, 'ofs/ofs.html',{})

# stall
def stall(request):
	return render(request, 'stall/stall.html',{})

def stall_upimg(request):
    return handle_upload(request)
	

# customer
def customer(request):
	return render(request, 'customer/customer.html',{})

def payment(request):
    return render(request, 'customer/payment.html', {})

# yunqing's test stuff
def yqtest(request):
    return render(request, 'yqtest/jsonpage.html', {})
# yangliu's test stuff
def yltest(request):
    return render(request, 'yltest/jsonpage.html', {})

# all interface views have been moved to web/interface/interface.py
