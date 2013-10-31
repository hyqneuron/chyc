from datetime import *

from django.core.management import call_command

from data.models import *
from web.interface.common import get_queue_number
from web.interface.ofs import ofsBackend


def rebuildData():
    call_command('flush')

    """
    classes = [ofs_user, customer, canteen, stall, cart, stall_user, menu_item,
                cart_item, order, order_item]
    for c in classes:
        c.initialize()
        if c.objects.count()!=1:
            raise Exception("Initialization error in" + c.__name__)"""

    # ofs user
    ou1 = ofs_user(username="ofs1", password="password",
        usertype=ofs_user.manager, name="OFS Manager")
    ou2 = ofs_user(username="ofs2", password="password",
        usertype=ofs_user.operator, name="OFS Operator")
    ou1.save()
    ou2.save()

    # customer
    cus1 = customer(username='user1', barcode='105', password='password',
                    usertype=customer.student, balance=0.0)
    cus2 = customer(username='user2', barcode='106', password='password',
                    usertype=customer.student, balance=0.0)
    cus1.save()
    cus2.save()

    print "Adding 999 test customers"
    for i in range(1, 1000):
        testcus = customer(username='testuser'+str(i), barcode=str(1000+i), password='password',
                usertype=customer.student, balance=0.0)
        testcus.save()
        testcus.build_cart()
        if i%10==0:
            print i
    print "999 test customers added"

    # canteen
    c1 = canteen(name='Canteen 1', description='Best canteen in NTU')
    c2 = canteen(name='Canteen 2', description='Worst canteen in NTU')
    c1.save()
    c2.save()
    
    print "Building queue tables, this may take a while..."
    c1.buildQueueTable()
    c2.buildQueueTable()
    print "Queue table built"

    # stall
    s1 = stall(name='Mixed Rice', description='good food at low price', 
        canteen=c1, username_prefix="stall1", category="Chinese")
    s2 = stall(name='Japanese Delight', description='best from Japan', 
        canteen=c1, username_prefix="stall2", category="Japanese")
    s3 = stall(name='Big Wok', description='blah blah blah desc', 
        canteen=c2, username_prefix="stall3", category="Chinese")
    s4 = stall(name='Western Food', description='desc lah lah', 
        canteen=c2, username_prefix="stall4", category="Western")
    """
    s1.save()
    s2.save()
    s3.save()
    s4.save()
    """
    ns1 = {"name":s1.name,"description":s1.description,"category":s1.category,
        "canteen":s1.canteen.id,"username_prefix":s1.username_prefix}
    ns2 = {"name":s2.name,"description":s2.description,"category":s2.category,
        "canteen":s2.canteen.id,"username_prefix":s2.username_prefix}
    ns3 = {"name":s3.name,"description":s3.description,"category":s3.category,
        "canteen":s3.canteen.id,"username_prefix":s3.username_prefix}
    ns4 = {"name":s4.name,"description":s4.description,"category":s4.category,
        "canteen":s4.canteen.id,"username_prefix":s4.username_prefix}
    ofsBackend.int_ofs_stall_add(None, ns1, True)
    ofsBackend.int_ofs_stall_add(None, ns2, True)
    ofsBackend.int_ofs_stall_add(None, ns3, True)
    ofsBackend.int_ofs_stall_add(None, ns4, True)
    s1 = stall.objects.get(id=1)
    s2 = stall.objects.get(id=2)
    s3 = stall.objects.get(id=3)
    s4 = stall.objects.get(id=4)

    """
    # stall user
    su1 = stall_user(username="stall1", password="password",
        usertype=stall_user.manager, name="Stall 1 Manager", stall=s1)
    su2 = stall_user(username="stall2", password="password",
        usertype=stall_user.manager, name="Stall 2 Manager", stall=s2)
    su1.save()
    su2.save()
    """

    # menu item
    m11 = menu_item(stall=s1, name='Beef', price=1.5, img_location="/static/stall/imgs/mi1.jpg")
    m12 = menu_item(stall=s1, name='Curry veg', price=0.5, description="lahlah")
    m13 = menu_item(stall=s1, name='Fish', price=2.5)
    m21 = menu_item(stall=s2, name='dishA', price=4.0, is_available_online=True)
    m22 = menu_item(stall=s2, name='dishB', price=4.5, is_available_online=True)
    m11.save()
    m12.save()
    m13.save()
    m21.save()
    m22.save()

    # cart
    cart1 = cart(customer=cus1)
    cart2 = cart(customer=cus2)
    cart1.save()
    cart2.save()

    # cart item
    ci1 = cart_item(cart=cart1, item=m11, quantity=1)
    ci1.save()

    # order
    order1 = order(customer=cus1, stall = s1, 
        queue_num=get_queue_number(s1.canteen, cus1), 
        payment_time=datetime.now())
    order2 = order(customer=cus2, stall = s2, 
        queue_num=get_queue_number(s2.canteen, cus2), 
        payment_time=datetime.now())
    order1.save()
    order2.save()

    # order item
    oi11 = order_item(order=order1, item=m11, quantity=1, remarks='spicy')
    oi12 = order_item(order=order1, item=m12, quantity=2)
    oi21 = order_item(order=order2, item=m21, quantity=1)
    oi11.save()
    oi12.save()
    oi21.save()
    print "Data rebuild complete"

