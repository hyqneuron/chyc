
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


class customerBackend:
    @staticmethod
    @setcm(1, [], "get information of the customer who's been logged in",
            1, "return the entry of the currently logged-in customer")
    def int_cus_get_customer(request, content):
        return case1(get_login_customer(request))

    @staticmethod
    @setcm(1, ["password", "hpnumber"], "change settings for customer logged in",
            1, "return the updated entry of the currently logged-in customer, no password contained")
    def int_cus_change_settings(request, content):
        cus = get_login_customer(request)
        newpwd = get_attribute(content, "password")
        hpnumber = get_attribute(content, "hpnumber")
        if hpnumber=='' or hpnumber==None:
            hpnumber=""
        if newpwd!="":
            validate_password(newpwd)
            cus.password=newpwd
        validate_hpnumber(hpnumber)
        cus.hpnumber=hpnumber
        cus.save()
        return case1(get_login_customer(request))


    @staticmethod
    @setcm(1, [], "get cart_items of default customer cart",
            3, "return all cart_item in current customer's default cart, parent is cart_item, children is a single menu_item")
    def int_cus_get_cart(request, content):
        cus = get_login_payment(request)
        cart0 = cus.get_default_cart()
        citems = cart0.cart_item_set.all()
        combined = [(entry, [entry.item]) for entry in citems]
        return case3(combined)

    @staticmethod
    @setcm(2, ["collection"], "set cart_items of default customer cart, collection is array of cart_item entries",
            2, "return all cart_item in current customer's default cart")
    def int_cus_set_cart(request, content):
        cus = get_login_payment(request)
        cart0 = cus.get_default_cart()
        olditems = [entry for entry in cart0.cart_item_set.all()]
        collection = get_attribute(content, "collection")
        successList = []
        try:
            for entry in collection:
                item = menu_item.objects.get(id=entry['item'])
                quantity = entry['quantity']
                remarks = entry['remarks']
                newcitem = cart_item(cart=cart0, item=item, quantity=quantity, remarks=remarks)
                valid_save(newcitem)
                successList.append(newcitem)
        except Exception as e:
            for entry in successList:
                entry.delete()
            return error(err_cus_cart_failed)
        # clear previous cart items
        for entry in olditems:
            entry.delete()
        return case2(cart0.cart_item_set.all())

    @staticmethod
    @setcm(1,[],"pay for items in cart, and clear cart",
            1,"")
    def int_cus_pay(request, content):
        cus = get_login_payment(request)
        cart0 = cus.get_default_cart()
        citems = cart0.cart_item_set.all()
        if citems.count==0:
            return error(err_cus_empty_cart)
        
    @staticmethod
    @setcm(1,['canteenid'],"pay for items in cart in specific canteen, and clear those items",
            1,"")
    def int_cus_pay_canteen(request, content):
        cus = get_login_payment(request)
        canid = get_attribute(content, "canteenid")
        can = get_by_id(canteen, canid)
        cart0 = cus.get_default_cart()
        ciAll = cart0.cart_item_set.all()
        # get all cart items inside current canteen
        ciCan = [entry for entry in ciAll if entry.item.stall.canteen==can]
        ciCanSaved = ciCan[:]
        if ciCan.count==0:
            return error(err_cus_empty_cart)
        # validate customer has enough balance
        balance = float(cus.balance)
        total = 0
        for entry in ciCan:
            total += entry.quantity*float(calcItemPrice(entry.item))
        newbalance = balance - total
        if newbalance < 0:
            return error(err_insufficient_balance)

        # multiple errors might come up during payment, keep track of them
        lowBalance = False # customer's in low balance?
        errMsg = ""   # names of the failed stalls
        failure=False # if there's any failing payment?
        success=False # if there's any successful payment?
        queue_num = 0
        # group ciCan by their stalls, and place order one by one
        stalls = [] # stalls we're done for
        while len(ciCan)>0:
            # grab all items of current stall
            curStall = ciCan[0].item.stall
            cistall = [entry for entry in ciCan if entry.item.stall==curStall]
            # turn them into order_item and call payment function
            oistall = [order_item(item=ci.item, 
                        quantity=ci.quantity,
                        remarks=ci.remarks) for ci in cistall]
            # place_order returns an error object
            err = place_order_to_stall(curStall, cus, oistall)
            # if it is not success, we'd have to prepare an error message
            if err[0] != err_success[0]:
                if errMsg: errMsg+=", "
                errMsg += curStall.name
                failure = True
            else:
                success = True
                queue_num = err[2]
                # if err msg is overwritten, it's an low-balance alert
                if err[1]!=err_success[1]:
                    lowBalance = True
            # remove cistall from ciCan
            ciCan = [entry for entry in ciCan if entry.item.stall!=curStall]
        # check errors, and report back
        if not success:
            return error(err_payment_allfailed, "Payment to "+errMsg+" all failed")
        # remove all items in current canteen, and return confirmation msg
        for entry in ciCanSaved:
            entry.delete()
        msg = "Your queue number is "+ str(queue_num)
        if lowBalance:
            msg+=". Your balance is low, please topup soon"
        if failure:
            return error(err_payment_partfailed, "Payment to "+errMsg+"had failed. Payment to the other stalls were successful. "+msg)
        return error(err_success, "Payment successful. "+msg)
        


