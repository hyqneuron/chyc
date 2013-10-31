#-*- coding:utf8 -*- 
"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""
import os
from django.conf import settings
from django.utils.importlib import import_module
from django.contrib.sessions import *
from django.core.urlresolvers import reverse
from django.utils import unittest
from django.test import TestCase
from django.test.client import RequestFactory
from django.http import HttpRequest
from web.interface.common import *
from web.interface.customer import *
from web.interface.ofs import *
from web.interface.stall import *
from web.interface.error import *
from data.models import *
import json

"""
customer:
    cus_pay_canteen
    cus_set_cart
ofs:
    order_submit
    get_processing_queue
    order_complete
stall:
    stall_add
    canteen_add
    canteen_setactivated

"""


class UnitFunctionTest(TestCase):

    def setUp(self):
        '''set up RequestFactory and session '''
        #self.factory = RequestFactory()
        self.request = HttpRequest()
        settings.SESSION_ENGINE = 'django.contrib.sessions.backends.db'
        engine = import_module(settings.SESSION_ENGINE)
        session_key = None
        store = engine.SessionStore(session_key)
        store.save()
        self.request.session = store

        # ofs_user objects
        ofs_user.objects.create(username="ofs1", password="password",
                                usertype=ofs_user.manager, name="OFS Manager")
        ofs_user.objects.create(username="ofs2", password="password",
                                usertype=ofs_user.operator, name="OFS Operator")

        # customer objects
        customer.objects.create(username='user1', barcode='105', password='password',
                    usertype=customer.student, balance=0.0)
        customer.objects.create(username='user2', barcode='106', password='password',
                    usertype=customer.student, balance=0.0)

        # canteen objects
        canteen.objects.create(name='Canteen 1', description='Best canteen in NTU')
        canteen.objects.create(name='Canteen 2', description='Worst canteen in NTU')

        c1 = canteen.objects.get(name='Canteen 1')
        c2 = canteen.objects.get(name='Canteen 2')

        # build queue 
        #c1.buildQueueTable()
        #c2.buildQueueTable()
        
        # stall objects
        stall.objects.create(name='Mixed Rice', description='good food at low price',
                             canteen=c1, username_prefix="stall1", category="Chinese")
        stall.objects.create(name='Japanese Delight', description='best from Japan',
                             canteen=c1, username_prefix="stall2", category="Japanese")
        stall.objects.create(name='Big Wok', description='blah blah blah desc',
                             canteen=c2, username_prefix="stall3", category="Chinese")
        stall.objects.create(name='Western Food', description='desc lah lah',
                             canteen=c2, username_prefix="stall4", category="Western")

        s1 = stall.objects.get(name='Mixed Rice')
        s2 = stall.objects.get(name='Japanese Delight')
        
        # stall user objects
        stall_user.objects.create(username="stall1", password="password",
                                  usertype=stall_user.manager, name="Stall 1 Manager", stall=s1)
        stall_user.objects.create(username="stall2", password="password",
                                  usertype=stall_user.manager, name="Stall 2 Manager", stall=s2)
        
    ''' for common.py '''
    #--------------------------------------------------------------------------------------------
    def test_method_getAttribute(self):
        '''test for get_attribute() method'''
        
        content = {"username": "ofs1","password":"password","domain":"ofs_user"}
        name = "username"

        content1 = {"username": "ofs1","password":"password","domain":"ofs_user"}
        name1 = "username1"
        
        content2 = {"username": "cust1","password":"password","domain":"customer"}
        name2 = 'username'
        
        self.assertEqual(get_attribute(content,name),content['username'])       #pass
  
        self.assertEqual(get_attribute(content2,name2),"cust1")                 #pass

        #name not in content: raise cams_ex
        with self.assertRaises(cams_ex) as e:
            get_attribute(content1,name1)                                        
        repliedEx = e.exception
        self.assertEqual(repliedEx.err_obj[0], 2)

        
    def test_method_error(self):
        '''test for error() method'''
        ''' must test error.py before '''
        
        err = err_unknown
        err_msg = 'Testing!'
        response = json.loads(error(err,err_msg).content)
        expected = {"err_msg": "Testing!","err_code":1}
        
        err1 = err_unknown
        err_msg1 = None         # err_msg = None
        response1 = json.loads(error(err1,err_msg1).content)
        expected1 = {"err_msg": "Oops, something went wrong in the server :( debug time","err_code":1}

        err2 = err_api
        err_msg2 = 'Testing!'
        response2 = json.loads(error(err2,err_msg2).content)
        expected2 = {"err_msg": "Testing!","err_code":2}

        err3 = err_api
        err_msg3 = 3            #int type err_msg
        response3 = json.loads(error(err3,err_msg3).content)
        expected3 = {"err_msg": 3,"err_code":2}

        err4 = err_api
        err_msg4 = ''           #string type err_msg, but no value
        response4 = json.loads(error(err4,err_msg4).content)
        expected4 = {"err_msg": '',"err_code":2}        
        
        self.assertEqual(response, expected)        #pass
        self.assertEqual(response1, expected1)      #pass
        self.assertEqual(response2, expected2)      #pass
        self.assertEqual(response3, expected3)      #pass
        self.assertEqual(response4, expected4)      #pass
        
    def test_method_case1(self):
        '''test for case1() method'''
        obj = ofs_user()
        case1Resp = json.loads(case1(obj).content)
        expected = {"err_code": err_success[0], "err_msg":None, "content": obj.get_json_dict()}

        obj1 = customer()
        case1Resp1 = json.loads(case1(obj).content)
        expected1 = {"err_code": err_success[0], "err_msg":None, "content": obj.get_json_dict()}


        self.assertEqual(case1Resp, expected)       #pass
        self.assertEqual(case1Resp1, expected1)     #pass

    '''
    def test_method_case2(self):
        #test for case2() method
        #obj = customer()               #customer object is not iterable
        #obj = ofs_user()               #ofs_user object is not iterable
        #obj = menu_item()              #menu_item object is not iterable
        obj = canteen()                 # cantten object is not iterable
        case2Resp = json.loads(case2(obj).content)
        expected = {"err_code": err_success[0], "err_msg":None, "content": obj.get_json_dict()}
        self.assertEqual(case2Resp, expected)

    def test_method_case3(self):
        #test for case2() method
        #obj = customer()                #customer object is not iterable
        #obj = ofs_user()                 #ofs_user object is not iterable
        obj = menu_item()                 #menu_item object is not iterable
        case3Resp = json.loads(case3(obj).content)
        expected = {"err_code": err_success[0], "err_msg":None, "content": obj.get_json_dict()}
        self.assertEqual(case3Resp, expected)

    def test_method_mayset(self):
        #test for maysey() method
        self.assertEqual(1+1, 2)
        
    '''
    
    def test_method_getLoginStall(self):
        ''' test for get_login_stall() function '''
        
        # precondition: should test login function first
        
        self.request.session['logged_in'] =True
        self.request.session['user_domain']='stall_user'
        self.request.session['user_id'] = 2

        expected = stall.objects.get(id=2)          
        response = get_login_stall(self.request)
        
        self.assertEqual(response, expected)
        

    def test_method_getLoginStallUser(self):
        ''' test for get_login_stall_user() function '''
        self.request.session['logged_in'] =True
        self.request.session['user_domain']='stall_user'
        self.request.session['user_id'] = 1

        expected = stall_user.objects.get(id=1)   
        response = get_login_stall_user(self.request)
        
        self.assertEqual(response, expected)

    def test_method_getLoginCustomer(self): 
        ''' test for get_login_customer() function '''
        self.request.session['logged_in'] =True
        self.request.session['user_domain']='customer'
        self.request.session['user_id'] = 1

        expected = customer.objects.get(id=1)   
        response = get_login_customer(self.request)
        
        self.assertEqual(response, expected)

    def test_method_getLoginOfs(self): 
        ''' test for get_login_ofs() function '''
        self.request.session['logged_in'] =True
        self.request.session['user_domain']='ofs_user'
        self.request.session['user_id'] = 1

        expected = ofs_user.objects.get(id=1)   
        response = get_login_ofs(self.request)
        
        self.assertEqual(response, expected)

    def test_method_getLoginOfsManager(self): 
        ''' test for get_login_ofs_manager() function '''
        self.request.session['logged_in'] =True
        self.request.session['user_domain']='ofs_user'
        self.request.session['user_id'] = 1

        usr = get_login_ofs(self.request)
        usr.usertype = ofs_user.manager
        
        expected = ofs_user.objects.get(id=1)   
        #response = get_login_ofs_manager(self.request)
        
        self.assertEqual(response, None)
        
    def test_method_getById(self):
        ''' test for get_by_id() function '''
        cls = customer
        _id = 1
        response = get_by_id(cls,_id)
        expected = customer.objects.get(id=1)
        self.assertEqual(response, expected)

    
    #----------------------------------------------------------------------------
        
    
    def test_method_validateBarcode(self):
        '''test for validate_barcode() method'''
        barcode = 'barcode'                 #all lowercase letters:pass
        barcode1 = 'BarCode'                #uppercase and lowercase pass
        barcode2 = 'BarCode1234'            #pass
        barcode3 = 'barcode_'               #raised cams_ex
        barcode4 = ''                       #raised cams_ex
        barcode5 = ' barcode'               #raised cams_ex

        validate = validate_barcode(barcode)
        validate1 = validate_barcode(barcode1)
        validate2 = validate_barcode(barcode2)
        
        with self.assertRaises(cams_ex) as e:
            validate_barcode(barcode3)
        repliedEx = e.exception
        self.assertEqual(repliedEx.err_obj[0], 14)

        with self.assertRaises(cams_ex) as e:
            validate_barcode(barcode4)
        repliedEx = e.exception
        self.assertEqual(repliedEx.err_obj[0], 14)
        
        with self.assertRaises(cams_ex) as e:
            validate_barcode(barcode5)
        repliedEx = e.exception
        self.assertEqual(repliedEx.err_obj[0], 14)
        

    def test_method_validateUsername(self):
        '''test for validate_username() method'''
        username = 'username'               #pass
        username1 = 'UserName'              #pass
        username2 = 'UserName1234'          #pass
        username3 = '1234UserName'          #raised cams_ex  
        username4 = '_username'             #raised cams_ex
        username5 = ''                      #raised cams_ex
        username6 = 'name1'                 # 5 chars raised cams_ex
        username7 = 'name12'                # 6 chars pass
        username8 = '
        
        username8 = 'usernameusername'      # 16 charsraised cams_ex
        
        validate = validate_username(username)
        validate1 = validate_username(username1)
        validate2 = validate_username(username2)
        
        self.assertEqual(validate,None)
        self.assertEqual(validate1,None)
        self.assertEqual(validate2,None)

        with self.assertRaises(cams_ex) as e:
            validate_username(username3)
        repliedEx = e.exception
        self.assertEqual(repliedEx.err_obj[0], 15)
        
        with self.assertRaises(cams_ex) as e:
            validate_username(username4)
        repliedEx = e.exception
        self.assertEqual(repliedEx.err_obj[0], 15)
        
        with self.assertRaises(cams_ex) as e:
            validate_username(username5)
        repliedEx = e.exception
        self.assertEqual(repliedEx.err_obj[0], 15)

        with self.assertRaises(cams_ex) as e:
            validate_username(username6)
        repliedEx = e.exception
        self.assertEqual(repliedEx.err_obj[0], 15)

        with self.assertRaises(cams_ex) as e:
            validate_username(username7)
        repliedEx = e.exception
        self.assertEqual(repliedEx.err_obj[0], 15)

    def test_method_validatePassword(self):
        '''test for validate_password() method'''
        password = '1234password%^$'            #succeed
        password1 = '!@#$%^&*()*^%$'            #succeed
        password2 = 'password'                  #succeed
        password3 = '12345678'                  #succeed
        password4 = '%&//&$/&$(%/(^*#@%!'       #raised cams_ex
        password5 = ''                          #raised cams_ex
        password6 = ' password'                 #raised cams_ex

        validate = validate_password(password)
        validate1 = validate_password(password1)
        validate2 = validate_password(password2)
        validate3 = validate_password(password3)
        
        self.assertEqual(validate,None)
        self.assertEqual(validate1,None)
        self.assertEqual(validate2,None)
        self.assertEqual(validate3,None)

        with self.assertRaises(cams_ex) as e:
            validate_password(password4)
        repliedEx = e.exception
        self.assertEqual(repliedEx.err_obj[0], 16)
        
        with self.assertRaises(cams_ex) as e:
            validate_password(password5)
        repliedEx = e.exception
        self.assertEqual(repliedEx.err_obj[0], 16)
        
        with self.assertRaises(cams_ex) as e:
            validate_password(password6)
        repliedEx = e.exception
        self.assertEqual(repliedEx.err_obj[0], 16)
        

    '''     
    def test_method_getQueueNumber(self):
        #test for get_queue_number() method
        # currently no queues in the system ?!-------------------------?????????????
        canObj = canteen()
        tUser = customer()
        qNum = get_queue_number(canObj, tUser)
        self.assertEqual(qNum,bad_luck_number)

    def test_method_returnQueueNumber(self):
        #test for return_queue_number() method
        #canObj = canteen()                 #---------------------------???????
        canObj = canteen.objects.get(name='Canteen 1')
                            # canteen matching query does not exist
        qNum = 1
        #qNum = bad_luck_number
        qNumReturned = return_queue_number(canObj, qNum)
        self.assertEqual(qNumReturned,bad_luck_number)
        #self.assertEqual(qNumReturned,None)
    '''

    #def test_method_placeOrderToStall(self):
    #    '''test for place_order_to_stall() method'''
        


    
        
    #----------------------------------------------
    #       class infoBackend
    def test_loginBackend_intLogin(self):
        '''test for int_login function'''

        # test for domain=='ofs_user' 
        content = {"username": "ofs1","password":"password","domain":"ofs_user"}
        response = loginBackend.int_login (self.request,content)
        case1Resp = json.loads(response.content)["content"]
        expected = {'id':1,'is_activated':True, 'name':'OFS Manager', 'username': 'ofs1', 'usertype': 'M'}
        
        # test for domain=='customer' 
        content1 = {"username": "user1","password":"password","domain":"customer"}
        response1 = loginBackend.int_login (self.request,content1)
        case1Resp1 = json.loads(response1.content)["content"]
        expected1 = {'id':1,'balance': '0','barcode':'105','is_activated':True,'username': 'user1', 'usertype': 'S'}
                    
        # test for domain=='stall_user' 
        content2 = {"username": "stall1","password":"password","domain":"stall_user"}
        response2 = loginBackend.int_login (self.request,content2)
        case1Resp2 = json.loads(response2.content)["content"]
        expected2 = {'id':1,'is_activated':True, 'name':'Stall 1 Manager', 'stall':1,'username': 'stall1', 'usertype': 'M'}
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(case1Resp,expected)

        self.assertEqual(response1.status_code, 200)
        self.assertEqual(case1Resp1,expected1)

        self.assertEqual(response2.status_code, 200)
        self.assertEqual(case1Resp2,expected2)

    def test_loginBackend_intLoginCheckCustomer(self):
        '''test for int_login function'''
        content = {"username": "user1","password":"password","domain":"customer"}
        self.request.content = content
        self.request.session['logged_in'] =True
        self.request.session['user_domain']='customer'
        self.request.session['user_id'] = 1
        """
        cus = customer(username="hhhhhh", password="lalalalala", usertype="S")
        cus.save()
        customer.objects.get(username="hhhhhh")
        print cus.username
        """
        response = loginBackend.int_login_check_customer (self.request,content)
        case1Resp = json.loads(response.content)["content"]
        expected = {'id':1,'balance': '0','barcode':'105','is_activated':True,'username': 'user1', 'usertype': 'S'}
        self.assertEqual(response.status_code, 200)
        self.assertEqual(case1Resp,expected)

    # test_loginBackend_intLoginCheckStall(self):
        
    # test int_login_check_ofs(request, content)
    # test int_logout(request, content)



    #----------------------------------------------
    #       class infoBackend

    # test int_get_canteen_activated(request, content)
    # test int_get_stall_activated(request, content)
    # test int_get_stall(request, content)
    # test int_get_stall_in_canteen(request, content)
    # test int_get_menu_item_install(request, content)
    



    ''' for customer.py '''
    #--------------------------------------------------------------------------------------------
