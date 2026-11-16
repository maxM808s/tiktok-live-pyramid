extends RefCounted
static func make(kind: String) -> Array[Vector3]:
 var cells: Array[Vector3] = []
 for y in range(15):
  for z in range(-6,7):
   for x in range(-6,7):
    var yes := false
    match kind:
     "pyramid": yes = y < 7 and abs(x) <= 6-y and abs(z) <= 6-y
     "ziggurat": yes = y < 8 and abs(x) <= 6-int(y/2)*2 and abs(z) <= 6-int(y/2)*2
     "obelisk": yes = (y == 0 and abs(x)<=3 and abs(z)<=3) or (y<13 and abs(x)<=1 and abs(z)<=1) or (y==13 and x==0 and z==0)
     "temple": yes = (y==0 and abs(x)<=5 and abs(z)<=4) or (y<6 and y>0 and abs(x)<=4 and abs(z)==3 and x%2==0) or (y>=6 and y<9 and abs(x)<=5 and abs(z)<=8-y)
     "castle": yes = (y<4 and (abs(x)==5 or abs(z)==5) and not(z==5 and abs(x)<2 and y<2)) or (y<7 and abs(x)>=4 and abs(x)<=5 and abs(z)>=4 and abs(z)<=5) or (y<8 and abs(x)<=2 and abs(z)<=2) or (y==4 and (abs(x)==5 or abs(z)==5) and (x+z)%2==0)
     "lighthouse": yes = (y==0 and x*x+z*z<=16) or (y>0 and y<12 and x*x+z*z<=9 and x*x+z*z>=3) or (y==12 and x*x+z*z<=16) or (y>12 and abs(x)<=1 and abs(z)<=1)
    if yes: cells.append(Vector3(x,y+0.5,z))
 return cells
