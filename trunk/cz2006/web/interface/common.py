from django.http import HttpResponse, Http404, HttpResponseRedirect
from django.core.urlresolvers import reverse
from django.template import RequestContext, loader
from django.shortcuts import render, get_object_or_404
from data.models import *
import os
import json
import datetime
from datetime import *
from web.interface.error import *
from re import *
import re
from twilio.rest import TwilioRestClient
from sms import *
 


# convenience functions

"""
our comment for each function looks like this:
cm_int_funcname = 
(
    (1 or 2, [list of required argument names], "explanation for case2"),
    (1 or 2 or 3, "explanation for returned stuff when successful")
)
"""
def setcm(reqcase, args, reqexpl, retcase, retexpl):
    def decorate(func):
        setattr(func, "cm", (
            (reqcase, args, reqexpl),
            (retcase, retexpl)
        ))
        return func
    return decorate


def get_attribute(content, name):
    if not name in content:
        raise cams_ex(err_api, name + " is not found in API arguments")
    return content[name]

def error(err, err_msg=None):
    if err_msg != None:
        obj = {"err_code":err[0], "err_msg": err_msg}
    else:
        obj = {"err_code":err[0], "err_msg": err[1]}
    return HttpResponse(json.dumps(obj))

def case1(obj):
    content = obj.get_json_dict()
    response = {"err_code": err_success[0], "err_msg":None, "content": content}
    return HttpResponse(json.dumps(response))

def case1_raw(obj):
    response = {"err_code": err_success[0], "err_msg":None, "content": obj}
    return HttpResponse(json.dumps(response))

def case2(obj):
    content = [entry.get_json_dict() for entry in obj]
    response = {"err_code": err_success[0], "err_msg":None, "content": content}
    return HttpResponse(json.dumps(response))

def case3(obj):
    content = []
    for entry in obj:
        added = {"parent":entry[0].get_json_dict(), "children":[child.get_json_dict() for child in entry[1]]}
        content.append(added)
    response = {"err_code": err_success[0], "err_msg":None, "content": content}
    return HttpResponse(json.dumps(response))


def mayset(content, entry, key):
    if content.has_key(key): entry.__dict__[key]=content[key]

def get_login_stall(request):
    try:
        if(not request.session['logged_in'] or
            request.session['user_domain']!='stall_user'):
            raise Exception()
        return get_by_id(stall_user,request.session['user_id']).stall
    except:
        raise cams_ex(err_stall_login)

def get_login_stall_user(request):
    try:
        if(not request.session['logged_in'] or
            request.session['user_domain']!='stall_user'):
            raise Exception()
        return get_by_id(stall_user,request.session['user_id'])
    except:
        raise cams_ex(err_no_login)
    
    
def get_login_customer(request):
    try:
        if(not request.session['logged_in'] or
            request.session['user_domain']!='customer'):
            raise Exception()
        return get_by_id(customer,request.session['user_id'])
    except:
        raise cams_ex(err_no_login)

def get_login_payment(request):
    try:
        if(not request.session['logged_in'] or
            (request.session['user_domain']!='customer' and 
             request.session['user_domain']!='payment')):
            raise Exception()
        return get_by_id(customer,request.session['user_id'])
    except:
        raise cams_ex(err_no_login)

def get_login_ofs(request):
    try:
        if(not request.session['logged_in'] or
            request.session['user_domain']!='ofs_user'):
            raise Exception()
        return get_by_id(ofs_user,request.session['user_id'])
    except:
        raise cams_ex(err_no_login)

def get_login_ofs_manager(request):
    try:
        usr = get_login_ofs(request)
        if usr.usertype != ofs_user.manager:
            raise Exception()
        return get_by_id(ofs_user,request.session['user_id'])
    except:
        raise cams_ex(err_no_access_rights)

def get_by_id(cls, _id):
    try: 
        return cls.objects.get(id=_id)
    except:
        raise cams_ex(err_id_notfound, cls.__name__+" with id="+str(_id)+" cannot be found")

def valid_save(obj):
    try:
        obj.save()
    except Exception as e:
        errstr = str(e)
        if "NULL" in errstr:
            raise cams_ex(err_vali_null_contained)
        if "not unique" in errstr:
            raise cams_ex(err_vali_notunique)
        raise cams_ex(err_vali_badvalue)

def validate_barcode(barcode):
    try:
        if not re.match(r'^[0-9a-zA-Z]+$', barcode):
            raise cams_ex(err_vali_badbarcode)
    except Exception as e:
        raise cams_ex(err_vali_badbarcode)

def validate_username(username):
    try:
        if len(username)<6 or len(username)>15:
            raise cams_ex(err_vali_badusername)
        if not re.match(r'^[a-zA-Z]+[0-9a-zA-Z]+$', username):
            raise cams_ex(err_vali_badusername)
    except:
        raise cams_ex(err_vali_badusername)

def validate_password(password):
    try:
        if len(password)<6 or len(password)>15:
            raise cams_ex(err_vali_badusername)
        if not re.match(r'^[0-9a-zA-Z!_\.@#\$%\^&\*()]+$', password):
            raise cams_ex(err_vali_badpassword)
    except:
        raise cams_ex(err_vali_badpassword)

def validate_hpnumber(hpnumber):
    try:
        if hpnumber=="": return # empty is valid
        if len(hpnumber)<6 or len(hpnumber)>20:
            raise cams_ex(err_vali_badhpnumber)
        if not re.match(r'^\+[0-9]+$', hpnumber):
            raise cams_ex(err_vali_badhpnumber)
        # make sure we have at least 8 eigits
        if len(re.findall(r'[0-9]', hpnumber))<8:
            raise cams_ex(err_vali_badhpnumber)
    except:
        raise cams_ex(err_vali_badhpnumber)
    
def calcItemPrice(item):
    return item.price*item.promotion

def calcOrderPrice(order):
    orderItems = order.order_item_set.all()
    total = 0
    for item in orderItems:
        total += item.quantity * calcItemPrice(item.item)
    return total


# FIXME even though frontend does availability validation, at backend it is
# still better that we do the same. Right now it's not done
# create an order for a specific stall
def place_order_to_stall(stallobj, cusobj, orderitems):
    # validate orderitems (see if indeed in this stall)
    for entry in orderitems:
        if entry.item.stall != stallobj: 
            return err_invalid_item_submitted
    # check balance
    balance = float(cusobj.balance)
    total = 0
    for entry in orderitems:
        total += entry.quantity*float(calcItemPrice(entry.item))
    newbalance = balance - total
    if newbalance < 0:
        return err_insufficient_balance
    # get queue number
    queue_number = get_queue_number(stallobj.canteen, cusobj)
    print "Get queue number: "+str(queue_number)
    # create order
    neworder = order(customer=cusobj, stall=stallobj, 
        queue_num=queue_number, payment_time=datetime.now(), total=total)
    valid_save(neworder)
    # TODO we might or might not want to provide more detailed info regarding
    # which item is wrong, since whenever error occurs, it's an API error or
    # illegal access error. For the first case we can use debug, for the second
    # case it's best we don't give any explanation at all
    try:
        for entry in orderitems:
            if entry.remarks==None:
                entry.remarks=""
            entry.order = neworder
            entry.save()
    # if items cannot be saved, we remove the new order, return the queue
    # number, and remove the saved items one by one
    except Exception as e:
        print "failed to pay\n"+str(e)
        return_queue_number(stallobj.canteen, queue_number)
        neworder.delete()
        # if items cannot be saved, remove them all. items with id are already
        # saved. the first item without id is the first unsaved item, also the
        # problematic item
        for entry in orderitems:
            if entry.id:
                entry.delete()
            else:
                return err_invalid_item_submitted
    cusobj.balance = newbalance
    cusobj.save()
    if newbalance < 5:
        return (err_success[0],  "Balance is less than 5 dollars", queue_number)
    return (err_success[0], err_success[1], queue_number)


# queue_number logic goes here
# bad luck number is the number given when allocation fails
bad_luck_number = 9999
def get_queue_number(canobj, tuser):
    # if user has existing queue number in the canteen
    queues = canteen_queues.objects.filter(canteen=canobj, customer=tuser)
    if len(queues)==1:
        queues[0].order_count+=1
        queues[0].customer = tuser
        queues[0].save()
        return queues[0].queue_num
    # look for new queue number, oc=0
    queues = canteen_queues.objects.filter(canteen=canobj, order_count=0)
    # if no queue number available, raise exception
    if len(queues)==0:
        return bad_luck_number
    # else return the oldest queue
    queue = queues.order_by('last_time')[0]
    queue.order_count+=1
    queue.customer = tuser
    queue.save()
    return queue.queue_num

def return_queue_number(canobj, qnum):
    # check for bad luck. If qnum==badluck, the queue number is fake, we just return
    if qnum==bad_luck_number: return
    # this isn't supposed to go wrong, when it does, we debug
    queue = canteen_queues.objects.get(canteen=canobj, queue_num=qnum)
    # decrement order_count
    queue.order_count -= 1;
    # free queue if order count ==0
    if queue.order_count==0:
        queue.last_time = datetime.now()
    queue.save()

# Your Account Sid and Auth Token from twilio.com/user/account

def sendSMS(sms, number):
    # create client
    client = TwilioRestClient(account_sid, auth_token)
    # send
    message = client.sms.messages.create(body=sms,
        to=number,    
        from_=our_number) 
    print message.sid

    
class loginBackend:
    ### login/logout
    @staticmethod
    @setcm(1, ['username', 'password', 'domain'], "",
        1, "a dictionary with attributes of the user being logged in. password is not returned")
    def int_login(request, content):
        username = get_attribute(content, "username")
        password = get_attribute(content, "password")
        domain = get_attribute(content, "domain")
        if domain=="customer":
            usr_acc = customer
        elif domain=="ofs_user":
            usr_acc = ofs_user
        elif domain=="stall_user":
            usr_acc = stall_user
        else:
            return error(err_incorrect_domain)
        user = usr_acc.objects.filter(username=username, password=password)
        if len(user)<1:
            return error(err_incorrect_login)
        request.session['logged_in'] = True
        request.session['username'] = username
        request.session['user_id'] = user[0].id
        request.session['user_domain'] = domain

        return case1(user[0])

    @staticmethod
    @setcm(1, ['barcode'], "",
            1, "user entry")
    def int_login_payment(request, content):
        barcode = get_attribute(content, 'barcode')
        try:
            cus = customer.objects.get(barcode=barcode)
        except:
            return error(err_vali_badbarcode)
        request.session['logged_in'] = True
        request.session['username'] = cus.username
        request.session['user_id'] = cus.id
        # we use a payment domain to limit login authority
        # payment login is checked using get_login_payment()
        request.session['user_domain'] = 'payment'
        return case1(cus)
            

    @staticmethod
    @setcm(1, [], "",
        1, "table entry for customer logged in. password is not returned. If user is not logged in, err_no_login code returns")
    def int_login_check_customer(request, content):
        cust1 = get_login_customer(request)
        return case1(cust1)

    @staticmethod
    @setcm(1, [], "",
        1, "table entry for stall_user logged in. password is not returned. If user is not logged in, err_no_login code returns")
    def int_login_check_stall(request, content):
        st_usr = get_login_stall_user(request)
        return case1(st_usr)

    @staticmethod
    @setcm(1, [], "",
        1, "table entry for ofs_user logged in. password is not returned. If user is not logged in, err_no_login code returns")
    def int_login_check_ofs(request, content):
        o_usr = get_login_ofs(request)
        return case1(o_usr)

        

    @staticmethod
    @setcm(1, [], "",
        1, "")
    def int_logout(request, content):
        request.session['logged_in'] = False
        return error(err_success)


class infoBackend:
    ### get stuffs
    @staticmethod
    @setcm(1, [], "",
        2, "")
    def int_get_canteen_activated(request, content):
        return case2(canteen.objects.filter(is_activated=True))

    @staticmethod
    @setcm(1, [], "",
        2, "")
    def int_get_stall_activated(request, content):
        return case2(stall.objects.filter(is_activated=True))

    @staticmethod
    @setcm(1, ["stallid"], "",
        1, "")
    def int_get_stall(request, content):
        stallid = get_attribute(content, "stallid")
        stall1 = get_by_id(stall,stallid)
        return case1(stall1)


    @staticmethod
    @setcm(1, ["canteenid"], "",
        2, "An array of canteen table entries")
    def int_get_stall_in_canteen(request, content):
        # get parameter
        canteenid = get_attribute(content, "canteenid")
        return case2(stall.objects.filter(canteen=canteenid, is_activated=True))

    @staticmethod
    @setcm(1, ["stallid"], "",
        2, "An array of menu_item table entries")
    def int_get_menu_item_install(request, content):
        # get parameter
        stallid = get_attribute(content, "stallid")
        return case2(menu_item.objects.filter(stall=stallid, is_activated=True))

    @staticmethod
    @setcm(1, ["stallid"], "",
        2, "An array of menu_item table entries")
    def int_get_menu_item_install_online(request, content):
        # get parameter
        stallid = get_attribute(content, "stallid")
        return case2(menu_item.objects.filter(stall=stallid, is_activated=True, is_available_online=True))

    @staticmethod
    @setcm(1, ["stallid"], "",
        1, "queue_length: integer representing queue length")
    def int_get_stall_queue_length(request, content):
        # get parameter
        stallid = get_attribute(content, "stallid")
        stallobj= get_by_id(stall, stallid)
        length = len(stallobj.order_set.filter(is_finished=False))
        return case1_raw({"queue_length":length})
