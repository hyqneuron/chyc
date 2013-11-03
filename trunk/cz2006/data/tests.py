#-*- coding:utf8 -*- 
'''     Unit Test Cases for CAMS    '''

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



class UnitFunctionTest(TestCase):

    def setUp(self):
        '''set up Request and session '''
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
                    usertype=customer.student, balance=30.5)
        customer.objects.create(username='user2', barcode='106', password='password',
                    usertype=customer.student, balance=0.0)

        self.cus1 = customer.objects.get(username='user1')
        self.cus2 = customer.objects.get(username='user2')

        # canteen objects
        canteen.objects.create(name='Canteen 1', description='Best canteen in NTU')
        canteen.objects.create(name='Canteen 2', description='Worst canteen in NTU',is_activated = False)
        canteen.objects.create(name='Canteen 3', description='Canteen in NTU',is_activated = False)

        self.can1 = canteen.objects.get(name='Canteen 1')
        self.can2 = canteen.objects.get(name='Canteen 2')

        # build queue 
        #c1.buildQueueTable()
        #c2.buildQueueTable()
        
        # stall objects
        stall.objects.create(name='Mixed Rice', description='good food at low price',
                             canteen=self.can1, username_prefix="stall1", category="Chinese")
        stall.objects.create(name='Japanese Delight', description='best from Japan',
                             canteen=self.can1, username_prefix="stall2", category="Japanese")
        stall.objects.create(name='Big Wok', description='blah blah blah desc',
                             canteen=self.can2, username_prefix="stall3", category="Chinese")
        stall.objects.create(name='Western Food', description='desc lah lah',
                             canteen=self.can2, username_prefix="stall4", category="Western")

        self.stall1 = stall.objects.get(name='Mixed Rice')
        self.stall2 = stall.objects.get(name='Japanese Delight')
        self.stall3 = stall.objects.get(name='Big Wok')
        self.stall4 = stall.objects.get(name='Western Food')
        
        
        
        # stall user objects
        stall_user.objects.create(password="password",usertype=stall_user.manager, username="stall1_mgr", stall=self.stall1)
        stall_user.objects.create(password="password",usertype=stall_user.manager, username="stall2_mgr", stall=self.stall2)

        # menu item objects
        menu_item.objects.create(stall=self.stall1, name='Curry Beef Fried Rice',price=2.5, is_available_online=True)
        menu_item.objects.create(stall=self.stall1, name='Wonton Noodles Soup',price=2.5, is_available_online=True)
        menu_item.objects.create(stall=self.stall1, name='Roast Pork Lo Mein',price=2.5, is_available_online=True)

        menu_item.objects.create(stall=self.stall2, name='Ochazuke', price=2.5, description="Hot green tea poured ", is_available_online=True)
        menu_item.objects.create(stall=self.stall2, name='Katsudon', price=3.5, description="Donburi topped ", is_available_online=True)
        menu_item.objects.create(stall=self.stall2, name='Hiyashi chuka', price=2.5, description="Thin, yellow noodles", is_available_online=True)

        menu_item.objects.create(stall=self.stall3, name='Bulgogi', price=4.5, description="Shredded beef", is_available_online=True)
        menu_item.objects.create(stall=self.stall3, name='Kimchi jjigae', price=4.0, description="A soup", is_available_online=True)
        menu_item.objects.create(stall=self.stall3, name='Bibimbap', price=4.0, description="Mixed rice", is_available_online=True)  

        menu_item.objects.create(stall=self.stall4, name='Spicy Potato Wedges', price=3.5, description="Seasoned with spicy herbs and fried till golden brown", is_available_online=True)
        menu_item.objects.create(stall=self.stall4, name='Crispy Calamari', price=4.0, description="Crispy squid rings served with salsa sauce", is_available_online=True)
        menu_item.objects.create(stall=self.stall4, name='Seafood Bisque', price=4.5, description="Creamy bouillabaisse seafood soup", is_available_online=True)

        self.m21= menu_item.objects.get(name='Ochazuke')
        self.m22= menu_item.objects.get(name='Katsudon')

        # order objects 
        order.objects.create(customer=self.cus1, stall = self.stall1, queue_num=get_queue_number(self.stall1.canteen, self.cus1), payment_time=datetime.now(),total=2.5)
        order.objects.create(customer=self.cus2, stall = self.stall2, queue_num=get_queue_number(self.stall2.canteen, self.cus2), payment_time=datetime.now(),total=4)

        self.order1=order.objects.get(customer=self.cus1)
        self.order2=order.objects.get(customer=self.cus2)

        # order item objects
        order_item.objects.create(order=self.order1, item=self.m21, quantity=1, remarks='spicy')
        order_item.objects.create(order=self.order1, item=self.m22, quantity=2)
        order_item.objects.create(order=self.order2, item=self.m21, quantity=1)
        
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

    
    def test_method_getLoginStall(self):
        ''' test for get_login_stall() function '''
        
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
        
        expected = ofs_user.objects.get(id=1)   
        response = get_login_ofs_manager(self.request)
        
        self.assertEqual(response, expected)

    
    #----------------------------------------------------------------------------
        
    
    def test_method_validateBarcode(self):
        '''test for validate_barcode() method'''
        barcode1 = 'BarCode1234'            #letters and numbers: pass
        barcode2 = 'barcode '               #include special characters:raised cams_ex
        barcode3 = ''                       #empty string: raised cams_ex

        #--test valid inputs
        validate1 = validate_barcode(barcode1)
        self.assertEqual(validate1,None)

        #--test invalid inputs
        with self.assertRaises(cams_ex) as e:
            validate_barcode(barcode2)
        repliedEx = e.exception
        self.assertEqual(repliedEx.err_obj[0], 14)

        with self.assertRaises(cams_ex) as e:
            validate_barcode(barcode3)
        repliedEx = e.exception
        self.assertEqual(repliedEx.err_obj[0], 14)
        

    def test_method_validateUsername(self):
        '''test for validate_username() method'''
        username1 = 'name1'                 # 5 chars: raised cams_ex
        username2 = 'name12'                # 6 chars: pass
        username3 = 'UserName1234567'       # lettrs & numbers (15 chars): pass
        username4 = 'usernameusername'      # 16 chars:raised cams_ex
        username5 = '1234567UserName'       #start with numbres: raised cams_ex  
        username6 = '_username'             #include special characters: raised cams_ex

        #--test valid inputs
        validate2 = validate_username(username2)
        validate3 = validate_username(username3)
      
        self.assertEqual(validate2,None)
        self.assertEqual(validate3,None)

        #--test invalid inputs
        with self.assertRaises(cams_ex) as e:
            validate_username(username1)
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

    def test_method_validatePassword(self):
        '''test for validate_password() method'''
        password1 = 'passw'                      # 5 chars: raised cams_ex
        password2 = 'passwo'                     # 6 chars: pass
        password3 = '1234password%^$'            # 15 chars: pass
        password4 = '1234password%^$%'           # 16 chars: raised cams_ex
        password5 = '!@#$%^&*()*^%$'             # all special chars: pass
        password6 = '12345678'                   # all numbers: pass
        password7 = '%&//&$/'                    # with illegal chars: raised cams_ex

        #--test valid inputs
        validate2 = validate_password(password2)
        validate3 = validate_password(password3)
        validate5 = validate_password(password5)
        validate6 = validate_password(password6)
        
        self.assertEqual(validate2,None)
        self.assertEqual(validate3,None)
        self.assertEqual(validate5,None)
        self.assertEqual(validate6,None)

        #--test invalid inputs
        with self.assertRaises(cams_ex) as e:
            validate_password(password1)
        repliedEx = e.exception
        self.assertEqual(repliedEx.err_obj[0], 16)
        
        with self.assertRaises(cams_ex) as e:
            validate_password(password4)
        repliedEx = e.exception
        self.assertEqual(repliedEx.err_obj[0], 16)
        
        with self.assertRaises(cams_ex) as e:
            validate_password(password7)
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

    #-------------test !!!!
        


    
        
    #----------------------------------------------
    #       class infoBackend
    def test_loginBackend_intLogin(self):
        '''test for int_login function'''
 
        content = {"username": "ofs1","password":"password","domain":"ofs_user"}
        response = loginBackend.int_login (self.request,content)
        case1Resp = json.loads(response.content)["content"]
        expected = {'id':1,'is_activated':True, 'name':'OFS Manager', 'username': 'ofs1', 'usertype': 'M'}
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(case1Resp,expected)

    def test_loginBackend_intLoginCheckCustomer(self):
        '''test for int_login_check_customer function'''
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
        expected = {'id':1,'barcode':'105','username': 'user1', 'hpnumber':'', 'is_activated':True,'balance':'0','usertype': 'S'}
        self.assertEqual(response.status_code, 200)
        self.assertEqual(case1Resp,expected)

    # test_loginBackend_intLoginCheckStall(self):   
    # test int_login_check_ofs(request, content)
    # test int_logout(request, content)



    
    #---------------for ofs.py ------------------------------------------------------

    def test_ofsBackend_customerAdd(self):
        '''test for int_ofs_customer_add() method '''
        self.request.session['logged_in'] =True
        self.request.session['user_domain']='ofs_user'
        self.request.session['user_id'] = 1
        # valid input, with username not added before
        content1 = {'username':'user123', 'barcode':210, 'password': 'password',
                   'usertype':customer.student}
        response1 = ofsBackend.int_ofs_customer_add(self.request,content1)
        case1Resp1 = json.loads(response1.content)["content"]
        expected1 = {'id':3,'barcode':210,'username': 'user123', 'hpnumber':'',
                     'is_activated':True,'balance':0.0,'usertype': 'S'}
        self.assertEqual(case1Resp1, expected1)

        # invalid input, with user added before
        content2 = {'username':'user1', 'barcode':105, 'password': 'password',
                   'usertype':customer.student}
        response2 = ofsBackend.int_ofs_customer_add(self.request,content2)
        case1Resp2 = json.loads(response2.content)['err_code']              # error is returned 
        expected = 24
        self.assertEqual(case1Resp2, expected)
        
    def test_ofsBackend_stallAdd(self):
        '''test for int_ofs_stall_add() method '''
        
        self.request.session['logged_in'] =True
        self.request.session['user_domain']='ofs_user'
        self.request.session['user_id'] = 1
        #valid input, with bypass == True
        bypass = True
        content = {'name':'Test case1', 'description':'test case 1',
                    'canteen':1, 'username_prefix':"stall20", 'category':"Chinese"}
        response = ofsBackend.int_ofs_stall_add(self.request,content,bypass)
        case1Resp = json.loads(response.content)["content"]
        expected = {'id':5,'name':'Test case1', 'description':'test case 1',
                    'canteen':1, 'username_prefix':"stall20", 'category':"Chinese",'is_activated':True}
        self.assertEqual(case1Resp, expected)
        
        # valid input, with stall name not added before
        content1 = {'name':'Test case2', 'description':'test case 2',
                    'canteen':1, 'username_prefix':"stall21", 'category':"Chinese"}
        response1 = ofsBackend.int_ofs_stall_add(self.request,content1)
        case1Resp1 = json.loads(response1.content)['content']
        expected1 = {'id':6,'name':'Test case2', 'description':'test case 2',
                    'canteen':1, 'username_prefix':"stall21", 'category':"Chinese",'is_activated':True}
        self.assertEqual(case1Resp1, expected1)

        #invalid input, with canteen object with invalid id (not exist)
        content2 = {'name':'Test case3', 'description':'Test case 3',
                    'canteen':-1, 'username_prefix':"stall33", 'category':"Chinese"}
        with self.assertRaises(cams_ex) as e:
            ofsBackend.int_ofs_stall_add(self.request,content2)
        repliedEx = e.exception
        self.assertEqual(repliedEx.err_obj[0], 18)

        # invalid input, with stall manager account added before
        content3 = {'name':'Mixed Rice', 'description':'good food at low price',
                    'canteen':1, 'username_prefix':"stall1", 'category':"Chinese"}
        response3 = ofsBackend.int_ofs_stall_add(self.request,content3)
        case1Resp3 = json.loads(response3.content)['err_code']          # error is returned 
        expected3 = 35
        self.assertEqual(case1Resp3, expected3)

##        content3 = {'name':1, 'description':'good food at low price',
##                    'canteen':1, 'username_prefix':"stalltestcasetestcase", 'category':"Chinese"}
##        response3 = ofsBackend.int_ofs_stall_add(self.request,content3)
##        case1Resp3 = json.loads(response3.content)          # error is returned 
##        expected3 = 35
##        self.assertEqual(case1Resp3, None)

    def test_ofsBackend_canAdd(self):
        '''test for int_ofs_canteen_add method '''
        self.request.session['logged_in'] =True
        self.request.session['user_domain']='ofs_user'
        self.request.session['user_id'] = 1
        # valid input, with canteen not added before
        content1 = {'name':'CanteenTest', 'description':'Canteen Test'}
        response1 = ofsBackend.int_ofs_canteen_add(self.request,content1)
        case1Resp1 = json.loads(response1.content)["content"]
        expected1 = {'id':3,'name':'CanteenTest', 'description':'Canteen Test','is_activated':True}
        self.assertEqual(case1Resp1, expected1)

        # invalid input, with canteen added before
        content2 = {'name':'Canteen 1', 'description':'Best canteen in NTU'}
        response2 = ofsBackend.int_ofs_canteen_add(self.request,content2)
        case1Resp2 = json.loads(response2.content)["err_code"]         # error is returned 
        expected2 = 24
        self.assertEqual(case1Resp2, expected2)

    def test_ofsBackend_canSetDeactivated(self):
        '''test for int_ofs_canteen_setactivated method'''
            #-------------- the name of the function should be deactivated??
        self.request.session['logged_in'] =True
        self.request.session['user_domain']='ofs_user'
        self.request.session['user_id'] = 1
        # invalid input, with canteen still contains active stalls
        content1 = {'canteenid':2,'value':False}
        response1 = ofsBackend.int_ofs_canteen_setactivated(self.request,content1)
        case1Resp1 = json.loads(response1.content)['err_code']
        expected1 = 39
        self.assertEqual(case1Resp1, expected1)
        #valid input, with canteen contains no active stalls
        content2 = {'canteenid':3,'value':False}
        response2 = ofsBackend.int_ofs_canteen_setactivated(self.request,content2)
        case1Resp2 = json.loads(response2.content)['content']
        expected2 = {'id':3,'name':'Canteen 3', 'description':'Canteen in NTU','is_activated':False}
        self.assertEqual(case1Resp2, expected2)


        
    #---------------for stall.py--------------------------------------------------------------
    '''

    '''
    def test_stallBackend_stallOrderSubmit(self):
        '''test for int_stall_order_submit method'''
        self.request.session['logged_in'] =True
        self.request.session['user_domain']='stall_user'
        self.request.session['user_id'] = 1

        # valid input with valid menu items and user account
        collection = [{'itemid': 1, 'quantity':2, 'remarks':''},
                      {'itemid': 2, 'quantity':1, 'remarks':'spicy'},
                      {'itemid': 3, 'quantity':2, 'remarks':''}]
        content = {'customer_barcode':105, 'collection':collection}    
        response = stallBackend.int_stall_order_submit(self.request,content)
        case1Resp = json.loads(response.content)['err_code']
        expected = 0                            # err_code == 0 means succeed
        self.assertEqual(case1Resp, expected)


    def test_stallBackend_stallGetProcessingQueue(self):  
        '''test for int_stall_get_processing_queue method '''
        self.request.session['logged_in'] =True
        self.request.session['user_domain']='stall_user'
        self.request.session['user_id'] = 2
        content ={}
        response = stallBackend.int_stall_get_processing_queue(self.request,content)
        cus_case3Resp = json.loads(response.content)['content'][0]['parent']['customer']
        cus_expected = 2
        stall_case3Resp = json.loads(response.content)['content'][0]['parent']['stall']
        stall_expected = 2
        finish_case3Resp = json.loads(response.content)['content'][0]['parent']['is_finished']
        finish_expected = False
        item_case3Resp = json.loads(response.content)['content'][0]['children'][0]['item']
        item_expected = 4
        self.assertEqual(cus_case3Resp, cus_expected)
        self.assertEqual(stall_case3Resp, stall_expected)
        self.assertEqual(finish_case3Resp, finish_expected)
        self.assertEqual(item_case3Resp, item_expected)
        
    def test_stallBackend_stallOrderComplete(self):  
        '''test for int_stall_order_complete method'''
        self.request.session['logged_in'] =True
        self.request.session['user_domain']='stall_user'
        self.request.session['user_id'] = 2
        content ={'orderid':2}
        response = stallBackend.int_stall_order_complete(self.request,content)
        cus_case3Resp = json.loads(response.content)['content']['customer']
        cus_expected = 2
        stall_case3Resp = json.loads(response.content)['content']['stall']
        stall_expected = 2
        finish_case3Resp = json.loads(response.content)['content']['is_finished']
        finish_expected = True
        total_case3Resp = json.loads(response.content)['content']['total']
        total_expected = '4'
        
        self.assertEqual(cus_case3Resp,cus_expected)
        self.assertEqual(stall_case3Resp,stall_expected)
        self.assertEqual(finish_case3Resp,finish_expected)
        self.assertEqual(total_case3Resp,total_expected)
        
        

    #---------------for customer.py-----------------------------------------------------------------
    '''
customer:
    cus_pay_canteen
    cus_set_cart
    '''


##    def test_customerBackend_setCart(self):
##        ''' test for int_cus_set_cart method '''
##        self.request.session['logged_in'] =True
##        self.request.session['user_domain']='customer'
##        self.request.session['user_id'] = 1
##
##        collection = [{'item': 1, 'quantity':2, 'remarks':''},
##                      {'item': 2, 'quantity':1, 'remarks':'spicy'},
##                      {'item': 3, 'quantity':2, 'remarks':''}]
##        content = {'collection':collection}
## 
##        response = customerBackend.int_cus_set_cart(self.request,content)
##        case2Resp = json.loads(response.content)
##        self.assertEqual(case2Resp, None)
        

##    def test_customerBackend_payCanteen(self):
##        ''' test for int_cus_pay_canteen '''
##        self.request.session['logged_in'] =True
##        self.request.session['user_domain']='stall_user'
##        self.request.session['user_id'] = 2
