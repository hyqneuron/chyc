from datetime import *
import datetime
import json
import os

from django.core.urlresolvers import reverse
from django.http import HttpResponse, Http404, HttpResponseRedirect
from django.shortcuts import render, get_object_or_404
from django.template import RequestContext, loader

from data.models import *
from web.interface.common import *
from web.interface.error import *
import web.interface.error as error_module


class stallBackend:
    # stall's get all items
    @staticmethod
    @setcm(1, [], "",
        2, "An array of menu_item table entries")
    def int_stall_get_all_menu_item(request, content):
        our_stall = get_login_stall(request)
        return case2(menu_item.objects.filter(stall=our_stall))

    # 3 fill order
    @staticmethod
    @setcm(2, ["customer_barcode", "collection"], "collection=An array of {itemid, quantity, remarks}",
        1, "")
    def int_stall_order_submit(request, content):
        # get parameters
        customer_barcode = get_attribute(content, "customer_barcode")
        collection = get_attribute(content, "collection")
        # get stall
        our_stall = get_login_stall(request)
        # get user
        try:
            cus = customer.objects.get(barcode=customer_barcode)
        except Exception:
            return error(err_barcode_invalid)
        orderitems = []
        # get order_item's from json
        try:
            for entry in collection:
                # TODO replace the id lookup with get_by_id
                item = menu_item.objects.get(id=entry['itemid'])
                quantity=entry['quantity']
                remarks= entry['remarks']
                orderitems.append(order_item(item=item, quantity=quantity, remarks=remarks))
        except Exception as e:
            return error(err_value_incorrect)
        # we have order items, call common payment function
        # place_order returns an error object
        return error(place_order_to_stall(our_stall, cus, orderitems))

        """
        # validate orderitems (see if indeed in this stall)
        try:
            for entry in orderitems:
                if item.stall != our_stall: raise Exception()
        except Exception:
            return error(err_invalid_item_submitted)
        # check balance
        balance = float(cus.balance)
        total = 0
        for entry in orderitems:
            total += entry.quantity*float(entry.item.price)
        newbalance = balance - total
        if newbalance < 0:
            return error(err_insufficient_balance)

        # get queue number
        queue_number = get_queue_number(our_stall.canteen, cus)
        # create order
        neworder = order(customer=cus, stall=our_stall, 
            queue_num=0, payment_time=datetime.now())
        valid_save(neworder)
        for entry in orderitems:
            entry.order = neworder
            valid_save(entry)
        cus.balance = newbalance
        cus.save()
        if newbalance < 5:
            return error(err_low_balance)
        return error(err_success)
        """





    # 4 manage processing order
    @staticmethod
    @setcm(1, [], "",
        3, "parent = entry in order table; children=array of entries in order_item")
    def int_stall_get_processing_queue(request, content):
        # get stall
        our_stall = get_login_stall(request)
        # get orders
        orders = order.objects.filter(stall=our_stall, is_finished=False)
        # get items inside orders
        obj = []
        for entry in orders:
            obj.append((entry, order_item.objects.filter(order=entry)))
        return case3(obj)

    @staticmethod
    @setcm(1, ["orderid"], "",
        1, "returns the modified order entry")
    def int_stall_order_complete(request, content):
        # get parameters
        orderid = get_attribute(content, "orderid")
        # get stall
        our_stall = get_login_stall(request)
        # complete it
        targetorder = get_by_id(order, orderid)
        targetorder.is_finished = True
        targetorder.finish_time = datetime.now()
        targetorder.save() # guaranteed to be valid
        # return the queue number
        return_queue_number(our_stall.canteen, targetorder.queue_num)
        return case1(targetorder)

    @staticmethod
    @setcm(1, ["orderid", "notify"], "",
        1, "returns the modified order entry")
    def int_stall_order_revoke(request, content):
        print "trying to revoke order"
        # get parameters
        orderid = get_attribute(content, "orderid")
        notify = get_attribute(content, "notify")
        print orderid
        # get stall
        our_stall = get_login_stall(request)
        # get the order and order items and customer
        targetorder = get_by_id(order, orderid)
        if targetorder.is_finished:
            return error(err_cannot_revoke)
        targetitems = targetorder.order_item_set.all()
        targetcus  = targetorder.customer
        totalPrice = calcOrderPrice(targetorder)
        # inform customer
        if notify and targetcus.hpnumber != "":
            print "trying to sms customer"
            smsItemInfo=""
            for entry in targetitems:
                smsItemInfo+=entry.item.name+" x"+str(entry.quantity)+"\n"
            smsMsg = "CaMS: your order to "+our_stall.name +" (Q no. " + str(targetorder.queue_num) +")" +" with these items has been revoked:\n" + smsItemInfo +"$"+str(totalPrice) +" dollars is refunded to your acct."
            # if msg too long
            if len(smsMsg)>=160:
                smsMsg = "CaMS: your order to "+our_stall.name +" (Q no. "+str(targetorder.queue_num)+")" +" has been revoked:\n" +"$"+str(totalPrice) +" dollars is refunded to your acct."
            # if msg still too long
            if len(smsMsg)>=160:
                smsMsg = "CaMS: your order to "+our_stall.name[:20] +" (Q no. "+str(targetorder.queue_num)+")" +" has been revoked:\n" +"$"+str(totalPrice) +" dollars is refunded to your acct."
            sendSMS(smsMsg, targetcus.hpnumber)
        # revoke
        return_queue_number(our_stall.canteen, targetorder.queue_num)
        targetcus.balance += totalPrice
        targetcus.save()
        targetorder.delete()
        for i in range(len(targetitems)-1, -1):
            targetitems[i].delete()
        # calculate total price
        return error(err_success)
            




    # 5 manage stall info
    @staticmethod
    @setcm(1, [], "name and description are optional arguments. When supplied, corresponding fields will be updated accordingly",
        1, "")
    def int_stall_edit(request, content):
        # get stall
        our_stall = get_login_stall(request)
        # get parameters
        mayset(content, our_stall, 'name')
        mayset(content, our_stall, 'description')
        valid_save(our_stall)
        return error(err_success)

    @staticmethod
    @setcm(1, 
        ["name", 'description', 'price', 'is_available', 
        'is_available_online', 'promotion', 'promotion_until'],
         "", 1, "")
    def int_stall_menu_item_add(request, content):
        # get parameters
        name = get_attribute(content, "name")
        description = get_attribute(content, "description")
        price = get_attribute(content, "price")
        is_available = get_attribute(content, "is_available")
        is_available_online = get_attribute(content, "is_available_online")
        promotion = get_attribute(content, "promotion")
        promotion_until = get_attribute(content, "promotion_until")
        # get stall
        our_stall = get_login_stall(request)
        # create item
        item = menu_item(
            stall=our_stall,
            name=name,
            description=description,
            price=price,
            is_available=is_available,
            is_available_online = is_available_online,
            is_activated = True,
            promotion = promotion,
            promotion_until = promotion_until
        )
        valid_save(item)
        return error(err_success)

    @staticmethod
    @setcm(1, ['itemid'], "Optional args: name, description, price, is_available, is_available_online, is_activated, promotion, promotion_until",
        1, "return the updated menu_item entry")
    def int_stall_menu_item_edit(request, content):
        # get parameter
        itemid = get_attribute(content, "itemid")
        # get stall
        our_stall = get_login_stall(request)
        item = get_by_id(menu_item,itemid)
        # get parameters
        mayset(content, item, 'name')
        mayset(content, item, 'description')
        mayset(content, item, 'price')
        mayset(content, item, 'is_available')
        mayset(content, item, 'is_available_online')
        mayset(content, item, 'is_activated')
        mayset(content, item, 'promotion')
        mayset(content, item, 'promotion_until')
        valid_save(item)
        return case1(item)

    #6 report
    @staticmethod
    @setcm(1,[],"",1,"yearRevenue, yearOrderSize, monthRevenue, monthOrderSize, todayRevenue, todayOrderSize")
    def int_stall_report(request, content):
        returnString = {}
        # get stall
        our_stall = get_login_stall(request)
        # operations
        orderList = order.objects.filter(stall=our_stall,is_finished=True)
        # current year Revenue
        returnString.update(calculate_year_revenue(orderList))
        # current month Revenue
        returnString.update(calculate_month_revenue(orderList))
        # today Revenue
        returnString.update(calculate_today_revenue(orderList))
        return case1_raw(returnString)


# this is the view handler for img upload
def handle_upload(request):
    # get stall
    try: our_stall = get_login_stall(request)
    except Exception: 
        return HttpResponse("You're not logged in as a stall user")
    print request.FILES 
    print request.FILES['fileToUpload'] 
    print request.POST 
    print request.POST['itemid']
    if not (request.FILES and request.FILES['fileToUpload'] and request.POST and request.POST['itemid']):
        return HttpResponse("Upload failed")

    relativepath = "/static/stall/imgs/"
    itemid = request.POST['itemid']
    relativepath += "mi"+itemid+".jpg"

    # validate item
    try: item = menu_item.objects.get(id=int(itemid))
    except Exception as e: 
        return HttpResponse("This item no longer exists")
    if item.stall != our_stall:
        return HttpResponse("You cannot edit this item as it belongs to another stall")

    # write file
    path = os.getcwd()+"/web"+relativepath
    try:
        with open(path, "w") as dest:
            for chunk in request.FILES['fileToUpload'].chunks():
                dest.write(chunk)
            #dest.write(request.FILES['fileToUpload'].read())
    except Exception:
        return HttpResponse("Failed to write file on server")
    # update database
    item.img_location = relativepath
    item.save()

    # empty response indicates success
    return HttpResponse("")
