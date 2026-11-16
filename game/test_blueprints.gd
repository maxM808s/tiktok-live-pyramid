extends SceneTree
const Blueprints = preload("res://blueprints.gd")
func _initialize() -> void:
 var signatures := {}
 for b in ["pyramid","temple","castle","lighthouse","obelisk","ziggurat"]:
  var cells: Array[Vector3] = Blueprints.make(b)
  assert(cells.size()>100,b)
  var seen := {}
  var last_y := -1.0
  for cell in cells:
   assert(not seen.has(cell),"duplicate cell")
   assert(cell.y>=last_y,"build order")
   seen[cell]=true
   last_y=cell.y
  var signature := str(cells.hash())
  assert(not signatures.has(signature),"distinct geometry")
  signatures[signature]=true
  print("PASS ",b," cells=",cells.size())
 quit()
