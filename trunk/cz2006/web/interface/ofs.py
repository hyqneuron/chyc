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


# number of customer entries per page
page_size = 100
def get_customer_page_count():
    return int((customer.objects.all().count()+page_size-1 )/ page_size)



class ofsBackend:
    ### OFS section ------------------------------------------
    #2. MANAGE USERS
    #----------------- ofs add users -------------------------
    @staticmethod
    @setcm(1, ["username", "barcode", "password", "usertype"], "",
        1, "return the created customer entry")
    def int_ofs_customer_add(request, content):
        get_login_ofs_manager(request)
        # get parameters
        username = get_attribute(content, "username")
        barcode = get_attribute(content, "barcode")
        password = get_attribute(content, "password")
        usertype = get_attribute(content, "usertype")
        #validate if user is already exist
        users = customer.objects.filter(username=username)
        if len(users)>0:
            return error(err_invalid_info_submitted)
        # create item
            cust1 = customer(
                username=username,
                barcode=barcode,
                password=password,
                usertype=usertype,
                balance=0.0,
                is_activated=True
            )
            valid_save(cust1)
        return case1(cust1)

    @staticmethod
    @setcm(2,["collection"],"an array of new customer list with ['username','barcode','password','usertype']",
           1,"")
    def int_ofs_customer_mass_add(request, content):
        get_login_ofs_manager(request)
        #get parameters
        newcuslist = get_attribute(content, "collection")
        # we need to reverse action if we run into error. save the successful ones
        # for deletion later
        success = []
        suc_num = 0
        try:
            for entry in newcuslist:
                cus1 = customer(
                    username=entry['username'],
                    barcode=entry['barcode'],
                    password=entry['password'],
                    usertype=entry['usertype'],
                    balance=0.0,
                    is_activated=True
                )
                # validate entry
                validate_username(cus1.username)
                validate_barcode (cus1.barcode)
                validate_password(cus1.password)
                valid_save(cus1)
                success.append(cus1)
                suc_num += 1
        except Exception as e:
            print str(e)
            for entry in success:
                entry.delete()
            errinfo = ""
            if isinstance(e, cams_ex):
                errinfo = e.getErrMsg()
            msg = "Mass creation failed. "  + newcuslist[suc_num]["barcode"] + " has erroneous info"
            if errinfo:
                msg += ": "+errinfo
            return error(err_mass_creation_failed, msg)
        return error(err_success)
                
    @staticmethod
    @setcm(2, ['collection'], "an array of {barcode:xxx}",
        1, "")
    def int_ofs_customer_mass_deactivate(request, content):
        get_login_ofs_manager(request)
        delist = get_attribute(content, "collection")
        barcodeList = []
        # grab list of barcode
        try:
            for entry in delist:
                barcodeList.append(entry['barcode'])
        except Exception:
            return error(err_api)
        # verify all records exist
        try:
            for entry in barcodeList:
                cus = customer.objects.get(barcode=entry)
        except Exception:
            return error(err_mass_deactivate_notfound)
        # deactivate them all
        for entry in barcodeList:
            cus = customer.objects.get(barcode=entry)
            cus.is_activated = False
            cus.save() # guaranteed to be valid
        return error(err_success)


    @staticmethod
    @setcm(1, ["name", "description", "canteen", "category", "username_prefix"], 
        "A manager and an operator account will be created, with password=password, and username=username_prefix_{op/mgr}",
        1, "returns creatd stall entry")
    def int_ofs_stall_add(request, content, bypass=False):
        try:
            if not bypass:
                get_login_ofs_manager(request)
        except Exception:
            return error(err_no_access_rights)
        # get parameters
        name = get_attribute(content, "name")
        description = get_attribute(content, "description")
        canteenid = get_attribute(content, "canteen")
        category = get_attribute(content, "category")
        prefix = get_attribute(content, "username_prefix")

        manageruname= prefix+"_mgr"
        operatoruname= prefix+"_op"
        #validate canteen availability
        canobj = get_by_id(canteen,canteenid)
        # create item
        if len(stall_user.objects.filter(username=manageruname))!=0:
            return error(err_stall_managername)
        if len(stall_user.objects.filter(username=operatoruname))!=0:
            return error(err_stall_operatorname)
        stcreated=False
        mgrcreated=False
        opcreated=False
        try:
            newstall = stall(
                name=name,
                description=description,
                canteen=canobj,
                category=category,
                username_prefix=prefix,
                is_activated = True,
            )
            valid_save(newstall)
            stcreated=True
            stall_mgr = stall_user(
                usertype = stall_user.manager,
                username = manageruname,
                password = "password",
                stall = newstall
            )
            valid_save(stall_mgr)
            mgrcreated=True
            stall_op = stall_user(
                usertype = stall_user.operator,
                username = operatoruname,
                password = "password",
                stall = newstall
            )
            valid_save(stall_op)
            opcreated=True
        except Exception as e:
            # TODO we should check if e is cams_ex to give more useful info
            if stcreated and newstall.id>0:
                newstall.delte()
            if mgrcreated and stall_mgr.id>0:
                stall_mgr.delete()
            if opcreated and stall_op.id>0:
                stall_op.delete()
            return error(err_creating_entry)
        return case1(newstall)

    @staticmethod
    @setcm(1, ["stallid"], "",
        1, "")
    def int_ofs_stall_deactivate(request, content):
        get_login_ofs_manager(request)
        stallid = get_attribute(content, "stallid")
        stallobj = get_by_id(stall,stallid)
        stallobj.is_activated = False;
        stallobj.save() # guaranteed to be valid
        return error(err_success)
        

    @staticmethod
    @setcm(1, ["stallid"], "",
        1, "")
    def int_ofs_stall_reset_mgrpwd(request, content):
        get_login_ofs_manager(request)
        stallid = get_attribute(content, "stallid")
        stallobj = get_by_id(stall,stallid)
        # find mgr
        try:
            mgrobj = stall_user.objects.get(username=stallobj.username_prefix+"_mgr")
        except Exception:
            return error(err_stall_mgr_notfound)
        mgrobj.password="password"
        mgrobj.save() # guaranteed to be valid
        return error(err_success)


    @staticmethod
    @setcm(1, ["username", "password", "usertype", "stall", "name"], "",
        1, "")
    def int_ofs_stalluser_add(request, content):
        get_login_ofs_manager(request)
        # get parameters
        username = get_attribute(content, "username")
        password = get_attribute(content, "password")
        usertype = get_attribute(content, "usertype")
        stallid = get_attribute(content, "stall")
        name = get_attribute(content, "name")
        # make sure no user with same username
        stalluser = stall_user.objects.filter(username=username)
        if len(stalluser)>0:
            return error(err_invalid_info_submitted)
        stallobj = get_by_id(stall,stallid)
        #create new stall and stall user
        stalluser = stall_user(
            username = username,
            password = password,
            usertype = usertype,
            stall = stallobj,
            name = name,
            is_activated = True
        )
        valid_save(stalluser)
        return error(err_success)

    @staticmethod
    @setcm(1, ["username", "password", "usertype", "name"], "",
        1, "")
    def int_ofs_ofsuser_add(request, content):
        get_login_ofs_manager(request)
        # get parameters
        username = get_attribute(content, "username")
        password = get_attribute(content, "password")
        usertype = get_attribute(content, "usertype")
        name = get_attribute(content, "name")

        ofsuser = ofs_user.objects.filter(username=username)
        if len(ofsuser)>0:
            return error(err_invalid_info_submitted)

        #create new ofs user
        new_ofsuser = ofs_user(
            username = username,
            password = password,
            usertype = usertype,
            name = name,
            is_activated = True
        )
        valid_save(new_ofsuser)
        return error(err_success)

    #-------------- ofs get users --------------------------------
    @staticmethod
    @setcm(1, ["customerid"], "",
        1, "return the customer obj")
    def int_ofs_customer_get(request, content):
        #check login
        get_login_ofs(request)
        #get parameters
        customerid = get_attribute(content, "customerid")
        #execute
        cus1 = get_by_id(customer,customerid)
        return case1(cus1)

    @staticmethod
    @setcm(1, ["customerid"], "",
        1, "return the customer obj")
    def int_ofs_customer_getbyusername(request, content):
        #check login
        get_login_ofs(request)
        #get parameters
        username = get_attribute(content, "username")
        #execute
        try:
            cus1 = customer.objects.get(username=username)
        except Exception:
            return error(err_missing_obj)
        return case1(cus1)

    @staticmethod
    @setcm(1, ["customerid"], "",
        1, "return the customer obj")
    def int_ofs_customer_getbybarcode(request, content):
        #check login
        get_login_ofs(request)
        #get parameters
        barcode = get_attribute(content, "barcode")
        #execute
        try:
            cus1 = customer.objects.get(barcode=barcode)
        except Exception:
            return error(err_missing_obj)
        return case1(cus1)

    @staticmethod
    @setcm(1, ["stalluid"], "",
           1, "")
    def int_ofs_stalluser_get(request, content):
        #check login
        get_login_ofs_manager(request)
        #get parameters
        stalluid = get_attribute(content, "stalluid")
        #execute
        stallu = get_by_id(stall_user,stalluid)
        return case1(stallu)

    @staticmethod
    @setcm(1, ["ofsuid"], "",
           1, "")
    def int_ofs_ofsuser_get(request, content):
        #check login
        get_login_ofs_manager(request)
        #get parameters
        ofsuid = get_attribute(content, "ofsuid")
        #execute
        ofsu = get_by_id(ofs_user,ofsuid)
        return case1(ofsu)

    @staticmethod
    @setcm(1, [], "",
           2, "return an array of customer objects")
    def int_ofs_customer_get_all(request, content):
        #check login
        get_login_ofs_manager(request)
        #execute
        cusList = customer.objects.all()
        return case2(cusList)

    @staticmethod
    @setcm(1, [], "",
           1, "Count the number of customer pages we have. return {page_count: number_of_pages}")
    def int_ofs_customer_page_count(request, content):
        #check login
        get_login_ofs_manager(request)
        #execute
        return case1_raw({"page_count":get_customer_page_count()})
    
    @staticmethod
    @setcm(1, ["page_num"], "page_num is the page index",
           2, "return an array of customer objects on page page_num")
    def int_ofs_customer_get_page(request, content):
        """divide customer entries into pages, return a specific page"""
        #check login
        get_login_ofs_manager(request)
        try:
            page_num = int(get_attribute(content, "page_num"))
            if page_num<0:
                raise NameError("Incorrect page number")
        except NameError as e:
            return error(err_api, str(e))
        #execute
        # order by
        cusList = customer.objects.all().order_by("-is_activated", "id")
        startIndex = page_num * page_size;
        endIndex = (page_num+1)*page_size;
        if(cusList.count()<endIndex): endIndex = cusList.count()
        page = cusList[startIndex: endIndex]
        return case2(page)

    @staticmethod
    @setcm(1, [], "",
           2, "return an array of \"activated\" customer objects")
    def int_ofs_customer_get_activated(request, content):
        #check login
        get_login_ofs_manager(request)
        #execute
        cusList = customer.objects.filter(is_activated = True)
        return case2(cusList)

    @staticmethod
    @setcm(1, [], "",
           2, "return an array of stall_user objects")
    def int_ofs_stalluser_get_all(request, content):
        #check login
        get_login_ofs_manager(request)
        #execute
        stalluList = stall_user.objects.all()
        return case2(stalluList)

    @staticmethod
    @setcm(1, [], "",
           2, "return an array of \"activated\" stall_user objects")
    def int_ofs_stalluser_get_activated(request, content):
        #check login
        get_login_ofs_manager(request)
        #execute
        stalluList = stall_user.objects.filter(is_activated=True)
        return case2(stalluList)

    @staticmethod
    @setcm(1, [], "",
           2, "return an array of ofs_user objects")
    def int_ofs_ofsuser_get_all(request, content):
        #check login
        get_login_ofs_manager(request)
        #execute
        ofsuList = ofs_user.objects.all()
        return case2(ofsuList)

    @staticmethod
    @setcm(1, [], "",
           2, "return an array of \"activated\" ofs_user objects")
    def int_ofs_ofsuser_get_activated(request, content):
        #check login
        get_login_ofs_manager(request)
        #execute
        ofsuList = ofs_user.objects.filter(is_activated=True)
        return case2(ofsuList)

    #-------------- ofs edit users --------------------------------

    @staticmethod
    @setcm(1, ["customerid"], "optional arg: password, is_activated",
        1, "returns the updated customer entry")
    def int_ofs_customer_edit(request, content):
        #check login
        get_login_ofs_manager(request)
        # get parameter
        customerid = get_attribute(content, "customerid")
        # get object
        cusobj = get_by_id(customer,customerid)
        # execute
        mayset(content, cusobj, 'password')
        mayset(content, cusobj, 'is_activated')
        valid_save(cusobj)
        return case1(cusobj)

    @staticmethod
    @setcm(1, ["stalluid"], "optional arg: password, is_activated",
        1, "returns the updated stall_user entry")
    def int_ofs_stalluser_edit(request, content):
        #check login
        get_login_ofs_manager(request)
        # get parameter
        stalluid = get_attribute(content, "stalluid")
        # get object
        stalluser = get_by_id(stall_user,stalluid)
        # execute
        mayset(content, stalluser, 'password')
        mayset(content, stalluser, 'is_activated')
        valid_save(stalluser)
        return case1(stalluser)

    @staticmethod
    @setcm(1, ["ofsuid"], "optional arg: password, is_activated",
        1, "return the updated ofs_user entry")
    def int_ofs_ofsuser_edit(request, content):
        #check login
        get_login_ofs_manager(request)
        # get parameter
        ofsuid = get_attribute(content, "ofsuid")
        # get object
        ofsuser = get_by_id(ofs_user,ofsuid)
        # execute
        mayset(content, ofsuser, 'password')
        mayset(content, ofsuser, 'is_activated')
        valid_save(ofsuser)
        return case1(ofsuser)

    @staticmethod
    @setcm(1,["name"],"optional args: description, canteen, category, is_activated",
        1, "")
    def int_ofs_stall_edit(request, content):
        #check login
        get_login_ofs(request)
        #get parameter
        name = get_attribute(content, "name")
        # get object
        try:
            stallobj = stall.objects.get(name=name)
        except Exception:
            return error(err_missing_obj)
        # execute
        mayset(content, stallobj, 'description')
        mayset(content, stallobj, 'canteen')
        mayset(content, stallobj, 'category')
        mayset(content, stallobj, 'is_activated')
        valid_save(stallobj)
        return error(err_success)
    
    #-------------- topup ----------------------    
    @staticmethod
    @setcm(1,["customerid", "value"],"",
           1,"return the customer obj")
    def int_ofs_customer_topup(request, content):
        #check login
        get_login_ofs(request)
        #get parameter
        customerid = get_attribute(content, "customerid")
        value = get_attribute(content, "value")
        #check customer validation
        try:
            cus = customer.objects.get(id=customerid, is_activated=True)
        except Exception:
            return error(err_missing_obj)
        #excute
        newbalance = float(cus.balance) + float(value)
        cus.balance = newbalance
        valid_save(cus)
        return case1(cus)

    #-------------- canteen management ----------------------    

    @staticmethod
    @setcm(1,["name", "description"],"",
           1,"returns the created canteen entry")
    def int_ofs_canteen_add(request, content):
        #check login
        get_login_ofs_manager(request)
        # get parameter
        name = get_attribute(content, "name")
        description = get_attribute(content, "description")
        canteens = canteen.objects.filter(name=name)
        if len(canteens)>0:
            return error(err_invalid_info_submitted)
        newcan = canteen(name=name, description=description)
        valid_save(newcan)
        newcan.buildQueueTable()
        return case1(newcan)
       
    @staticmethod
    @setcm(1,["canteenid"],"name and description are optional values",
           1,"return the modified canteen entry")
    def int_ofs_canteen_edit(request, content):
        #check login
        get_login_ofs_manager(request)
        # get parameter
        canid = get_attribute(content, "canteenid")
        canobj = get_by_id(canteen,canid)
        mayset(content, canobj, 'name')
        mayset(content, canobj, 'description')
        valid_save(canobj)
        return case1(canobj)

    @staticmethod
    @setcm(1,["canteenid", "value"],"",
           1,"return the modified canteen entry")
    def int_ofs_canteen_setactivated(request, content):
        #check login
        get_login_ofs_manager(request)
        # get parameter
        canid = get_attribute(content, "canteenid")
        value = get_attribute(content, "value")
        canobj = get_by_id(canteen,canid)
        if not value and len(stall.objects.filter(canteen=canobj, is_activated=True))>0:
            return error(err_canteen_cannotdeact)
        canobj.is_activated = value
        valid_save(canobj)
        return case1(canobj)
