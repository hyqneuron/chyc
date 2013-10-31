from datetime import *
import datetime
import inspect
import json
import os
import traceback

from django.core.urlresolvers import reverse
from django.http import HttpResponse, Http404, HttpResponseRedirect
from django.shortcuts import render, get_object_or_404
from django.template import RequestContext, loader

from data.models import *
from web.interface.common import *
from web.interface.customer import *
from web.interface.error import *
import web.interface.error as error_module
from web.interface.ofs import *
from web.interface.stall import *


# interface.py contains the view server of 'interfacejs' and 'request'
# it also contains the logic that generates a dictionary
#       where key = req_code 
#       and value = handler for the corresponding request
# it also contains the logic that generates interfacejs_js
#       which is the content served by interfacejs
# it automatically writes interfacejs_js to web/interface/interface.js
# previously a gen.py or gen_interface.py was used to generate interfacejs_js,
# but it has been merged into this file
# view 'interfacejs'
def interfacejs(request):
    # interfacejs_js is defined and produced towards the end of the file
    return HttpResponse(interfacejs_js)

# view 'request'
def request(request):
    global handlers
    try:
        print request.body
        received = json.loads(request.body)
        print handlers[received['req_code']].__name__
        return handlers[received['req_code']](request, received['content'])
    except cams_ex as e:
        return error(e.err_obj, e.err_msg)
    """
    except Exception as e:
        print "Unhandled Exception occured"
        print str(e)
        raise e;
        return error(err_unknown)
    """

def testrequest(handler, request, content):
    try:
        return handler(request, content)
    except cams_ex as e:
        return error(e.err_obj, e.err_msg)
    






# produce a handler dictionary
handlers = {}
req_code = 0

hd_login = inspect.getmembers(loginBackend, predicate=inspect.isfunction)
hd_info = inspect.getmembers(infoBackend, predicate=inspect.isfunction)
hd_stall = inspect.getmembers(stallBackend, predicate=inspect.isfunction)
hd_ofs = inspect.getmembers(ofsBackend, predicate=inspect.isfunction)
hd_customer = inspect.getmembers(customerBackend, predicate=inspect.isfunction)

apis = hd_info +hd_login + hd_stall + hd_ofs + hd_customer

for handler in apis:
    req_code+=1
    handler = handler[1]
    handler.req_code = req_code
    handlers[req_code] = handler

# produce interfacejs_js, which is what the 'interfacejs' view serves
interfacejs_js = """
// code generated in interface.py, and served directly through 
// interface.interfacejs

// an interface function would look like
// function int_xxx(obj, success_call, error_call=null)
// 2 types of errors may occur when you make these calls
//   a. ajax error (like cannot connect to server or page not found etc.)
//      To intercept ajax error you must override int_ajax_error_handler which
//      is defined later
//   b. app error. That means our backend has reported an err_code!=err_success
// When absolutely no error occurs, success_call is called
// When ajax error occurs, int_ajax_error_handler is called
// When app error occurs, error_call is called. If error_call is unspecified, 
// int_app_error_handler is called. You can override int_app_error_handler to
// use your own default handler, so you don't have to specify error_call
// everytime.
//
// I have supplied you with default error handlers for both errors, and you can
// take a look and write default handlers that integrate with your UI better


// default ajax failure handler
function _int_ajax_failed(xmlhttp, err, info)
{
    switch(xmlhttp.status)
    {
        case 0:
            alert("Cannot connect to server. Please check internet connection");
            break;
        case 404:
            alert("Request sent to an url that does not exist. Programmer error.");
            break;
        default:
            var errstr = "Something went wrong.\\nerrtype: "+err+"\\n";
            errstr += "info: " +info+"\\n";
            errstr += "readyState: "+xmlhttp.readyState+"\\n";
            errstr += "status: " + xmlhttp.status;
            alert(errstr);
    };
}

// default app error handler
function _int_app_failed(data) { alert(data.err_msg); }

// error handlers which you can override
var int_ajax_error_handler = _int_ajax_failed;
var int_app_error_handler = _int_app_failed;

// request maker
function _int_caller(req_code, obj, success_call, error_call)
{
    var fail_call = error_call? error_call : int_app_error_handler;
    var msg = {"req_code":req_code, "content": obj};
    $.ajax({
        url:'/interface/request/',
        type:'POST',
        data: JSON.stringify(msg),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: function(data){
            if(data.err_code != err_success)
                fail_call(data);
            else success_call(data);
        },
        // when ajax error occurs, this handler is called
        error: int_ajax_error_handler
    });
}

"""

str_func = """
function {0}(obj, success_call, error_call)
{{{2}
    _int_caller({1}, obj, success_call, error_call);
}}
"""

str_cm1 = """
    // request type {}. return type {}
    // required args: {}"""
str_cm2 = """
    // request obj: {}"""
str_cm3 = """
    // return content:{}"""
# generate interface functions
for req_code in handlers:
    # if func info is given, we generate comment string
    if handlers[req_code].__dict__.has_key("cm"):
        cmobj = handlers[req_code].cm
        if len(cmobj[0][1])>0:
            str_args = ", ".join(cmobj[0][1])
        else: str_args = "None"
        comment_str = str_cm1.format(cmobj[0][0], cmobj[1][0], str_args)
        if cmobj[0][2]:
            comment_str += str_cm2.format(cmobj[0][2])
        if cmobj[1][1]:
            comment_str += str_cm3.format(cmobj[1][1])
    else:
        comment_str = " " 
    print type(comment_str)
    print comment_str
    interfacejs_js += str_func.format(handlers[req_code].__name__,
    str(req_code), comment_str)

# generate error code
interfacejs_js += """

// errmsgs - error mesage dictionary. key = err_code and value = error message.
// for your reference only, since the proper err_msg is always returned by the server
errmsgs = []; 
"""
jstmp3 = """
{0} = {1};
errmsgs[{1}]="{2}";
"""
all_errors = [err for err in inspect.getmembers(error_module) if err[0].startswith('err_') and type(err[1]) is tuple]
for err in all_errors:
    # error name, error code, error message
    interfacejs_js += jstmp3.format(err[0], err[1][0], err[1][1])

jswriter = open(os.path.dirname(__file__)+"/interface.js", "w")
jswriter.write(interfacejs_js)
jswriter.close()
