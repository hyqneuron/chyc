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
    c1 = canteen(name='Canteen 1', description='Canteen at South Spine')
    c2 = canteen(name='Canteen 2', description='Canteen at North Spine')
    c3 = canteen(name='Canteen 3', description='Canteen at West Spine')
    c4 = canteen(name='Canteen 4', description='Canteen at East Spine')
    c5 = canteen(name='Canteen 5', description='Central Canteen at BTU')
    c6 = canteen(name='Cafeteria', description='Campus Snack Bar')
    c1.save()
    c2.save()
    c3.save()
    c4.save()
    c5.save()
    c6.save()
    
    print "Building queue tables, this may take a while..."
    c1.buildQueueTable()
    c2.buildQueueTable()
    c3.buildQueueTable()
    c4.buildQueueTable()
    c5.buildQueueTable()
    c6.buildQueueTable()
    print "Queue table built"

    # stall
    s1 = stall(name='Xiao Jiang Nan', description='Good Food at LOW Price', 
        canteen=c1, username_prefix="stall1", category="Chinese")
    
    s2 = stall(name='Japanese Delight', description='BEST from Japan', 
        canteen=c1, username_prefix="stall2", category="Japanese")
    
    s3 = stall(name='Korean Euhm-Sheek', description='Traditional Korean Street Food', 
        canteen=c1, username_prefix="stall3", category="Korean")
    
    s4 = stall(name='Happy Chef', description='Fantastic Western Food', 
        canteen=c1, username_prefix="stall4", category="Western")

    s5 = stall(name='Maple Story', description='Original Canadian Food', 
        canteen=c1, username_prefix="stall5", category="Local")

    s6 = stall(name='Veggie Cottage', description='For Vegan and Organic', 
        canteen=c1, username_prefix="stall6", category="Vegetarian")

    s7 = stall(name='Salad Bar', description='Salad for Health Nuts', 
        canteen=c1, username_prefix="stall7", category="Western")

    s8 = stall(name='Brunetti', description='Enjoy your sweet time', 
        canteen=c1, username_prefix="stall8", category="Dessert")
    """
    s1.save()
    s2.save()
    s3.save()
    s4.save()
    s5.save()
    s6.save()
    s7.save()
    s8.save()
    """
    ns1 = {"name":s1.name,"description":s1.description,"category":s1.category,
        "canteen":s1.canteen.id,"username_prefix":s1.username_prefix}
    ns2 = {"name":s2.name,"description":s2.description,"category":s2.category,
        "canteen":s2.canteen.id,"username_prefix":s2.username_prefix}
    ns3 = {"name":s3.name,"description":s3.description,"category":s3.category,
        "canteen":s3.canteen.id,"username_prefix":s3.username_prefix}
    ns4 = {"name":s4.name,"description":s4.description,"category":s4.category,
        "canteen":s4.canteen.id,"username_prefix":s4.username_prefix}
    ns5 = {"name":s5.name,"description":s5.description,"category":s5.category,
        "canteen":s5.canteen.id,"username_prefix":s5.username_prefix}
    ns6 = {"name":s6.name,"description":s6.description,"category":s6.category,
        "canteen":s6.canteen.id,"username_prefix":s6.username_prefix}
    ns7 = {"name":s7.name,"description":s7.description,"category":s7.category,
        "canteen":s7.canteen.id,"username_prefix":s7.username_prefix}
    ns8 = {"name":s8.name,"description":s8.description,"category":s8.category,
        "canteen":s8.canteen.id,"username_prefix":s8.username_prefix}
    ofsBackend.int_ofs_stall_add(None, ns1, True)
    ofsBackend.int_ofs_stall_add(None, ns2, True)
    ofsBackend.int_ofs_stall_add(None, ns3, True)
    ofsBackend.int_ofs_stall_add(None, ns4, True)
    ofsBackend.int_ofs_stall_add(None, ns5, True)
    ofsBackend.int_ofs_stall_add(None, ns6, True)
    ofsBackend.int_ofs_stall_add(None, ns7, True)
    ofsBackend.int_ofs_stall_add(None, ns8, True)
    s1 = stall.objects.get(id=1)
    s2 = stall.objects.get(id=2)
    s3 = stall.objects.get(id=3)
    s4 = stall.objects.get(id=4)
    s5 = stall.objects.get(id=5)
    s6 = stall.objects.get(id=6)
    s7 = stall.objects.get(id=7)
    s8 = stall.objects.get(id=8)

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
    m11 = menu_item(stall=s1, name='Curry Beef Fried Rice', price=3.5,img_location="/static/stall/imgs/m11.jpg", is_available_online=True)
    m12 = menu_item(stall=s1, name='Wonton Noodles Soup', price=2.5,img_location="/static/stall/imgs/m12.jpg", is_available_online=True)
    m13 = menu_item(stall=s1, name='Roast Pork Lo Mein', price=4.0,img_location="/static/stall/imgs/m13.jpg", is_available_online=True)
    m14 = menu_item(stall=s1, name='Sweet & Sour Chicken', price=3.5, img_location="/static/stall/imgs/m14.jpg", is_available_online=True)
    m15 = menu_item(stall=s1, name='Chicken Chow Mein', price=3.0,img_location="/static/stall/imgs/m15.jpg", is_available_online=True)
    m16 = menu_item(stall=s1, name='Xiao Long Bao', price=3.5,img_location="/static/stall/imgs/m16.jpg", is_available_online=True)

    m21 = menu_item(stall=s2, name='Ochazuke', price=2.5, description="Hot green tea poured over cooked white rice, with various savory ingredients", img_location="/static/stall/imgs/m21.jpg", is_available_online=True)
    m22 = menu_item(stall=s2, name='Katsudon', price=3.5, description="Donburi topped with deep-fried breaded cutlet of pork", img_location="/static/stall/imgs/m22.jpg", is_available_online=True)
    m23 = menu_item(stall=s2, name='Hiyashi chuka', price=2.5, description="Thin, yellow noodles served cold with a variety of toppings,", img_location="/static/stall/imgs/m23.jpg", is_available_online=True)
    m24 = menu_item(stall=s2, name='Beef Yaki udon', price=4.5, description="Fried udon noodles with beef", img_location="/static/stall/imgs/m24.jpg", is_available_online=True)
    m25 = menu_item(stall=s2, name='Okonomiyaki', price=4.0, description="Pancake with seafood, vegetables and meat are mixed into a batter and grilled", img_location="/static/stall/imgs/m25.jpg", is_available_online=True)
    m26 = menu_item(stall=s2, name='Nikujaga', price=5.5, description="beef and potato stew, flavoured with sweet soy", img_location="/static/stall/imgs/m26.jpg", is_available_online=True)

    m31 = menu_item(stall=s3, name='Bulgogi', price=4.5, description="Shredded beef marinated in soy sauce, sesame oil, garlic, sugar, scallions, and black pepper, cooked on a grill", img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m32 = menu_item(stall=s3, name='Kimchi jjigae', price=4.0, description="A soup made with mainly kimchi, pork, and tofu ", img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m33 = menu_item(stall=s3, name='Bibimbap', price=4.0, description="Mixed rice topped with seasoned vegetables ", img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m34 = menu_item(stall=s3, name='Sundae', price=3.5, description="Korean sausage made with a mixture of boiled sweet rice, oxen or pig's blood, potato noodle, mung bean sprouts", img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m35 = menu_item(stall=s3, name='Kimbap', price=3.0, description="Popular snack in Korea", img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m36 = menu_item(stall=s3, name='Ddeokbokki', price=3.5, description="A casserole dish which is made with sliced rice cake, seasoned beef, fish cakes, and vegetables", img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)

    m41 = menu_item(stall=s4, name='Spicy Potato Wedges', price=3.5, description="Seasoned with spicy herbs and fried till golden brown", img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m42 = menu_item(stall=s4, name='Crispy Calamari', price=4.0, description="Crispy squid rings served with salsa sauce", img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m43 = menu_item(stall=s4, name='Seafood Bisque', price=4.5, description="Creamy bouillabaisse seafood soup", img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m44 = menu_item(stall=s4, name='Chicken tikka masala', price=4.5, description="Roasted chunks (tikka) of chicken in a spicy sauce", img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m45 = menu_item(stall=s4, name='Chicken Sandwich', price=3.5, img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m46 = menu_item(stall=s4, name='Black Pepper Chicken', price=5.5,img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m47 = menu_item(stall=s4, name='Grilled Fish with Herb', price=6.5,img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    
    m51 = menu_item(stall=s5, name='Poutine', price=3.5, description="French fries generously slathered in gravy and cheese curds", img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m52 = menu_item(stall=s5, name='Butter Tarts', price=3.5,
                    description="Classic Canadian dessert made with butter, sugar, syrup and eggs - filled in a buttery,pastry shell",
                    img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m53 = menu_item(stall=s5, name='Beaver Tail', price=4.5, description="The fried-dough treats are shaped to resemble real beaver tails and are topped with chocolate, candy, and fruit", img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m54 = menu_item(stall=s5, name='Donairs', price=6.0, description="Made of spiced ground beef that has been shaped and pressed into a large loaf and then roasted on a spit", img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m55 = menu_item(stall=s5, name='Sushi Pizza', price=10.0, description=" Mini pizza-like creation of a fried rice cake topped with raw fish and spicy mayo", img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m56 = menu_item(stall=s5, name='Cretons', price=6.5, description="Pork spread containing onions and spices", img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m57 = menu_item(stall=s5, name='Rappie Pie', price=5.5, description="Traditional Acadian dish made from shredded potatoes, with meat and onions.", img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m58 = menu_item(stall=s5, name='Montreal bagels', price=3.5, img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)

    m61 = menu_item(stall=s6, name='Kung Pao Tofu', price=3.5, description="Stir-fried tofu and lots of fresh vegetables", img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m62 = menu_item(stall=s6, name='Garden-Fresh Stir-Fry with Seitan', price=4.0,img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m63 = menu_item(stall=s6, name='Basque Vegetable Rice', price=4.0, description="Zucchini, onion, tomatoes and bell peppers stud this paella-inspired rice dish", img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
   
    m71 = menu_item(stall=s7, name='Caesar Salad', price=5.5,img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m72 = menu_item(stall=s7, name='Classic Macaroni Salad', price=4.5, img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m73 = menu_item(stall=s7, name='Greek Pasta Salad ', price=4.5,img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m74 = menu_item(stall=s7, name='Broccoli and Tortellini Salad', price=5.5, img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m75 = menu_item(stall=s7, name='Egg Salad ', price=3.5, img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)

    m81 = menu_item(stall=s8, name='Blueberry Grunt', price=4.5,img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m82 = menu_item(stall=s8, name='Bananas Foster', price=3.5,img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m83 = menu_item(stall=s8, name='New York Cheesecake', price=5.5,  img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m84 = menu_item(stall=s8, name='Apple Pie', price=2.5, img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m85 = menu_item(stall=s8, name='Black Magic Cake', price=6.0, img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m86 = menu_item(stall=s8, name='Frozen Yogurt', price=3.5, img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m87 = menu_item(stall=s8, name='Lime Pie', price=4.5, img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m88 = menu_item(stall=s8, name='Iced Latte', price=3.5,img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)
    m89 = menu_item(stall=s8, name='Iced Earl Grey', price=3.5,img_location="/static/stall/imgs/mi1.jpg", is_available_online=True)


    m11.save()
    m12.save()
    m13.save()
    m14.save()
    m15.save()
    m16.save()
    m21.save()
    m22.save()
    m23.save()
    m24.save()
    m25.save()
    m26.save()
    m31.save()
    m32.save()
    m33.save()
    m34.save()
    m35.save()
    m36.save()
    m41.save()
    m42.save()
    m43.save()
    m44.save()
    m45.save()
    m46.save()
    m47.save()
    m51.save()
    m52.save()
    m53.save()
    m54.save()
    m55.save()
    m56.save()
    m57.save()
    m58.save()
    m61.save()
    m62.save()
    m63.save()
    m71.save()
    m72.save()
    m73.save()
    m74.save()
    m75.save()
    m81.save()
    m82.save()
    m83.save()
    m84.save()
    m85.save()
    m86.save()
    m87.save()
    m88.save()
    m89.save()




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
        payment_time=datetime.now(),total=2.5)
    order2 = order(customer=cus2, stall = s2, 
        queue_num=get_queue_number(s2.canteen, cus2), 
        payment_time=datetime.now(),total=4)
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

