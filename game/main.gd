extends Node3D
const Blueprints = preload("res://blueprints.gd")
var request: HTTPRequest
var telemetry: HTTPRequest
var token := ""
var state: Dictionary = {}
var slots: Array[Vector3] = []
var blocks: Array[MeshInstance3D] = []
var workers: Array[Dictionary] = []
var camera: Camera3D
var sun: DirectionalLight3D
var world_env: WorldEnvironment
var title: Label
var details: Label
var leaders: Label
var notice: Label
var instructions: Label
var status: Label
var gift_note: Label
var ui_font: Font
var bar: ProgressBar
var clock := 0.0
var polling := 0.0
var shown := 0
var round_id := -1
var pending := false
var building := "pyramid"
var material_cache: Dictionary = {}
var mesh_cache: Dictionary = {}
var placed_mesh: MultiMeshInstance3D
var landed := 0
var last_service_response := 0.0
var bottom_panel: ColorRect
var footer_note: Label
var last_quake := 0
var current_skin := "mixed"
var crown: Node3D
var dust: CPUParticles3D
var confetti: CPUParticles3D

func material(color: Color) -> StandardMaterial3D:
 if material_cache.has(color): return material_cache[color]
 var m := StandardMaterial3D.new()
 m.albedo_color = color
 m.roughness = 0.78
 if color == Color("d7ad55"):
  m.metallic = 0.7
  m.roughness = 0.25
 material_cache[color] = m
 return m

func box(parent: Node3D, pos: Vector3, size: Vector3, color: Color) -> MeshInstance3D:
 var mesh := MeshInstance3D.new()
 if not mesh_cache.has(size):
  var shape := BoxMesh.new()
  shape.size = size
  mesh_cache[size] = shape
 mesh.mesh = mesh_cache[size]
 mesh.material_override = material(color)
 parent.add_child(mesh)
 mesh.position = pos
 return mesh

func label_at(text: String, pos: Vector2, size: Vector2, font_size: int, color := Color.WHITE) -> Label:
 var l := Label.new()
 l.text = text
 l.position = pos
 l.size = size
 l.add_theme_font_override("font",ui_font)
 l.add_theme_font_size_override("font_size",font_size)
 l.add_theme_color_override("font_color",color)
 l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
 l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
 $Overlay.add_child(l)
 return l

func _ready() -> void:
 var font_path := OS.get_system_font_path("Segoe UI" if OS.get_name() == "Windows" else "DejaVu Sans")
 ui_font = ThemeDB.fallback_font
 if not font_path.is_empty():
  var file_font := FontFile.new()
  file_font.data = FileAccess.get_file_as_bytes(font_path)
  ui_font = file_font
 Engine.max_fps = 60
 var overlay := CanvasLayer.new()
 overlay.name = "Overlay"
 add_child(overlay)
 var lower := ColorRect.new()
 bottom_panel = lower
 lower.position = Vector2(35,1250)
 lower.size = Vector2(1010,620)
 lower.color = Color(0.025,0.07,0.12,0.94)
 overlay.add_child(lower)
 var backdrop := ColorRect.new()
 backdrop.position = Vector2(35,40)
 backdrop.size = Vector2(1010,330)
 backdrop.color = Color(0.025,0.07,0.12,0.91)
 overlay.add_child(backdrop)
 label_at("P Y R A M I D   /   L I V E",Vector2(60,55),Vector2(960,60),32,Color("d7ad55"))
 title = label_at("EGYPTIAN PYRAMID",Vector2(50,120),Vector2(980,85),62)
 details = label_at("Waiting for local service",Vector2(50,210),Vector2(980,60),32)
 bar = ProgressBar.new()
 bar.position = Vector2(90,295)
 bar.size = Vector2(900,28)
 bar.show_percentage = false
 var fill := StyleBoxFlat.new()
 fill.bg_color = Color("d7ad55")
 fill.corner_radius_top_left = 10
 fill.corner_radius_top_right = 10
 fill.corner_radius_bottom_left = 10
 fill.corner_radius_bottom_right = 10
 bar.add_theme_stylebox_override("fill",fill)
 overlay.add_child(bar)
 gift_note = label_at("",Vector2(70,420),Vector2(940,100),30,Color("d7ad55"))
 status = label_at("CONNECTING",Vector2(70,345),Vector2(940,65),28,Color(0.5,0.9,0.8))
 notice = label_at("",Vector2(70,1120),Vector2(940,140),44,Color("d7ad55"))
 leaders = label_at("TOP BUILDERS",Vector2(50,1290),Vector2(980,230),34)
 instructions = label_at("5 likes → worker • Comment → stone\nFollow → 5 stones • Rose → 10 stones\nVote: comment the next building name",Vector2(50,1570),Vector2(980,180),32)
 footer_note = label_at("BUILD SOMETHING THAT LASTS",Vector2(50,1800),Vector2(980,50),26,Color(0.8,0.7,0.5))
 world_env = WorldEnvironment.new()
 var env := Environment.new()
 env.background_mode = Environment.BG_COLOR
 env.background_color = Color("142634")
 env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
 env.ambient_light_color = Color("a4cbd5")
 env.ambient_light_energy = 0.32
 env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
 world_env.environment = env
 add_child(world_env)
 sun = DirectionalLight3D.new()
 sun.rotation_degrees = Vector3(-48,-25,0)
 sun.light_color = Color("ffe0a4")
 sun.light_energy = 0.8
 sun.shadow_enabled = true
 add_child(sun)
 box(self,Vector3(0,-0.45,0),Vector3(220,0.8,220),Color("987d5e"))
 box(self,Vector3(0,-0.02,0),Vector3(17,0.12,17),Color("8e7055"))
 var rng := RandomNumberGenerator.new()
 rng.seed = 2026
 for i in range(55):
  var mound := MeshInstance3D.new()
  var sphere := SphereMesh.new()
  sphere.radial_segments = 24
  sphere.rings = 6
  sphere.radius = rng.randf_range(3,10)
  sphere.height = sphere.radius*2
  mound.mesh = sphere
  mound.material_override = material(Color("79664f"))
  mound.scale.y = 0.18
  mound.position = Vector3(rng.randf_range(-75,75),-0.4,rng.randf_range(-65,-20))
  add_child(mound)
 # Completed distant landmarks are scenery, never contribution progress.
 for landmark in [Vector3(-19,0,-27),Vector3(17,0,-36)]:
  var monument := MeshInstance3D.new()
  var silhouette := CylinderMesh.new()
  silhouette.top_radius = 0
  silhouette.bottom_radius = 10
  silhouette.height = 11
  silhouette.radial_segments = 4
  monument.mesh = silhouette
  monument.material_override = material(Color("8d795b"))
  monument.position = landmark+Vector3(0,5.5,0)
  monument.rotation.y = PI/4
  add_child(monument)
 for x in [-9.0,9.0]:
  for z in [-7.0,0.0,7.0]:
   box(self,Vector3(x,3,z),Vector3(.15,6,.15),Color("614936"))
   box(self,Vector3(x,3,z),Vector3(.2,.18,7),Color("614936"))
   box(self,Vector3(x,5.7,z),Vector3(.2,.18,7),Color("614936"))
 for i in range(10):
  box(self,Vector3(-7+(i%3),0.4+int(i/3)*.75,9),Vector3(.9,.7,.9),Color("d9b780"))
 box(self,Vector3(9,4,-9),Vector3(.4,8,.4),Color("544936"))
 box(self,Vector3(6,8,-9),Vector3(7,.3,.3),Color("544936"))
 box(self,Vector3(3,5.7,-9),Vector3(.06,4.5,.06),Color("343c40"))
 box(self,Vector3(3,3.4,-9),Vector3(1.2,.9,1.2),Color("b99e76"))
 for p in [Vector3(-13,0,-12),Vector3(14,0,-16),Vector3(-15,0,3)]:
  box(self,p+Vector3(0,2.5,0),Vector3(.4,5,.4),Color("685037"))
  for a in range(6):
   var leaf := box(self,p+Vector3(cos(a*TAU/6)*1.2,5,sin(a*TAU/6)*1.2),Vector3(3,.12,.6),Color("4a6650"))
   leaf.rotation.y = -a*TAU/6
 camera = Camera3D.new()
 camera.fov = 49
 add_child(camera)
 camera.position = Vector3(23,17,32)
 camera.look_at(Vector3(0,3.5,0))
 dust = particles(24,Color("e4c89b"),0.6,2)
 confetti = particles(160,Color("d7ad55"),3,10)
 request = HTTPRequest.new()
 request.timeout = 2
 add_child(request)
 request.request_completed.connect(_response)
 telemetry = HTTPRequest.new()
 telemetry.timeout = 2
 add_child(telemetry)
 telemetry.request_completed.connect(func(_result: int, code: int, _headers: PackedStringArray, _body: PackedByteArray):
  if code == 403: token = "")
 request.request("http://127.0.0.1:3210/api/session")
 pending = true
 rebuild()
 for i in range(16): make_worker(i)

func particles(count: int, color: Color, lifetime: float, velocity: float) -> CPUParticles3D:
 var p := CPUParticles3D.new()
 p.emitting = false
 p.one_shot = true
 p.amount = count
 p.lifetime = lifetime
 p.explosiveness = 0.95
 p.direction = Vector3.UP
 p.spread = 75
 p.initial_velocity_min = velocity*0.5
 p.initial_velocity_max = velocity
 p.gravity = Vector3(0,-3,0)
 p.color = color
 var mesh := BoxMesh.new()
 mesh.size = Vector3(.12,.12,.12)
 mesh.material = material(color)
 p.mesh = mesh
 add_child(p)
 return p

func rebuild() -> void:
 for tween in get_tree().get_processed_tweens(): tween.kill()
 for w in workers: w.delivery = false
 if is_instance_valid(crown): crown.queue_free()
 if is_instance_valid(placed_mesh): placed_mesh.queue_free()
 for b in blocks: b.queue_free()
 blocks.clear()
 slots = Blueprints.make(building)
 for i in range(slots.size()):
  var c := Color("e4c18a")
  if building == "lighthouse": c = Color("f5e7cc") if int(slots[i].y/3)%2==0 else Color("b95c46")
  if building == "castle": c = Color("9aabab")
  if building == "temple" and slots[i].y >= 6: c = Color("c06d4e")
  if building == "ziggurat" and slots[i].y >= 6: c = Color("297e9b")
  var b := box(self,slots[i],Vector3(.96,.91,.96),c)
  b.visible = false
  b.set_meta("base_material",b.material_override)
  blocks.append(b)
 shown = 0
 landed = 0
 placed_mesh = MultiMeshInstance3D.new()
 var instances := MultiMesh.new()
 instances.transform_format = MultiMesh.TRANSFORM_3D
 instances.use_colors = true
 instances.instance_count = slots.size()
 var shared_mesh := BoxMesh.new()
 shared_mesh.size = Vector3(.96,.91,.96)
 var shared_material := StandardMaterial3D.new()
 shared_material.vertex_color_use_as_albedo = true
 shared_material.roughness = .65
 shared_mesh.material = shared_material
 instances.mesh = shared_mesh
 placed_mesh.multimesh = instances
 add_child(placed_mesh)
 for i in range(slots.size()): set_placed(i,false)
 crown = Node3D.new()
 add_child(crown)
 var highest := Vector3.ZERO
 for cell in slots:
  if cell.y > highest.y: highest = cell
 crown.position = highest+Vector3(0,.8,0)
 crown.visible = false
 if building in ["pyramid","obelisk"]:
  var tip := MeshInstance3D.new()
  var cone := CylinderMesh.new()
  cone.top_radius = 0
  cone.bottom_radius = 1.05
  cone.height = 1.4
  cone.radial_segments = 4
  tip.mesh = cone
  tip.material_override = material(Color("d7ad55"))
  tip.rotation.y = PI/4
  crown.add_child(tip)
 elif building == "castle":
  box(crown,Vector3(0,.6,0),Vector3(.1,2,.1),Color("514737"))
  box(crown,Vector3(.6,1.2,0),Vector3(1.2,.7,.08),Color("bf654d"))
 elif building == "lighthouse":
  var lamp := OmniLight3D.new()
  lamp.light_color = Color("ffe3a2")
  lamp.light_energy = 3
  lamp.omni_range = 15
  crown.add_child(lamp)
  box(crown,Vector3.ZERO,Vector3(1.4,.8,1.4),Color("d7ad55"))
 else:
  box(crown,Vector3.ZERO,Vector3(2,.5,2),Color("d7ad55"))

func make_worker(i: int) -> void:
 var root := Node3D.new()
 add_child(root)
 var skin := i%4 if current_skin == "mixed" else maxi(0,["worker","mummy","ninja","pharaoh"].find(current_skin))
 var colors := [Color("29a0a8"),Color("eee0bf"),Color("26374d"),Color("d7ad55")]
 box(root,Vector3(0,1.1,0),Vector3(.48,.65,.3),colors[skin])
 box(root,Vector3(0,1.67,0),Vector3(.37,.38,.36),Color("bc865c"))
 box(root,Vector3(0,1.88,0),Vector3(.45,.14,.4),colors[skin])
 for eye in [-.09,.09]: box(root,Vector3(eye,1.71,.185),Vector3(.055,.055,.02),Color("282c32"))
 if skin == 1:
  for band in range(5): box(root,Vector3(0,.86+band*.13,.16),Vector3(.5,.035,.025),Color("a99b80"))
 if skin == 2: box(root,Vector3(0,1.62,.19),Vector3(.39,.16,.05),Color("18222e"))
 if skin == 3:
  for side in [-1,1]:
   box(root,Vector3(side*.24,1.6,0),Vector3(.12,.6,.38),Color("1f6385"))
  box(root,Vector3(0,1.98,0),Vector3(.16,.24,.16),Color("d7ad55"))
 var left := box(root,Vector3(-.15,.48,0),Vector3(.18,.65,.2),Color("514737"))
 var right := box(root,Vector3(.15,.48,0),Vector3(.18,.65,.2),Color("514737"))
 box(root,Vector3(-.34,1.18,.15),Vector3(.17,.52,.18),Color("bc865c"))
 box(root,Vector3(.34,1.18,.15),Vector3(.17,.52,.18),Color("bc865c"))
 if i < 3:
  var aura := MeshInstance3D.new()
  var ring := TorusMesh.new()
  ring.inner_radius = .55
  ring.outer_radius = .62
  aura.mesh = ring
  aura.material_override = material(Color("d7ad55"))
  aura.position.y = .12
  root.add_child(aura)
 var carry := box(root,Vector3(0,1.2,.5),Vector3(.7,.55,.55),Color("e4c18a"))
 var tag := Label3D.new()
 tag.font_size = 30
 tag.pixel_size = .009
 tag.billboard = BaseMaterial3D.BILLBOARD_ENABLED
 tag.position.y = 2.35
 root.add_child(tag)
 workers.append({"node":root,"left":left,"right":right,"carry":carry,"tag":tag,"offset":float(i)/16.0,"delivery":false})

func _response(_result: int, code: int, _headers: PackedStringArray, body: PackedByteArray) -> void:
 pending = false
 if code != 200: return
 var parsed = JSON.parse_string(body.get_string_from_utf8())
 if not parsed is Dictionary: return
 if parsed.has("token"):
  token = parsed.token
  return
 state = parsed
 last_service_response = Time.get_ticks_msec()/1000.0
 for tween in get_tree().get_processed_tweens(): tween.set_speed_scale(0.0 if state.paused else 1.0)
 if int(state.get("quakeAt",0)) != last_quake:
  last_quake = int(state.get("quakeAt",0))
  if last_quake > 0:
   dust.position = Vector3(0,2,0)
   dust.restart()
 if int(state.round) != round_id:
  round_id = int(state.round)
  building = state.building
  rebuild()
 var he: bool = state.config.language == "he"
 title.text = ({"pyramid":"הפירמידה המצרית","temple":"המקדש העתיק","castle":"טירת ימי הביניים","lighthouse":"המגדלור","obelisk":"האובליסק","ziggurat":"הזיגוראת"}.get(building,building) if he else building.to_upper())
 details.text = ("סיבוב %d  •  \u2066%d / %d\u2069 אבנים" if he else "ROUND %d  •  %d / %d STONES") % [state.round,state.built,state.target]
 bar.value = 100.0*float(state.built)/float(state.target)
 status.text = ("SIMULATOR • TEST EVENTS" if state.config.mode == "simulator" else ("TIKFINITY SOCKET CONNECTED" if state.connection.socket else "TIKFINITY DISCONNECTED"))
 if state.paused: status.text += " • PAUSED"
 gift_note.text = ""
 if state.get("lastGift") is Dictionary:
  var gift: Dictionary = state.lastGift
  if Time.get_unix_time_from_system()*1000-float(gift.at)<20000:
   gift_note.text = "%s  •  %s × %d" % [gift.user,gift.name,gift.count]
 leaders.text = "הבונים המובילים\n" if he else "TOP BUILDERS\n"
 var top: Array = state.roundLeaders if state.phase == "celebrating" else state.leaderboard
 for i in range(mini(4,top.size())): leaders.text += "%d.  %s   ·   %d\n" % [i+1,top[i][0],top[i][1]]
 notice.text = (("הבנייה הושלמה! הסיבוב הבא בעוד %d" if he else "MONUMENT COMPLETE\nNext round in %ds") % maxi(0,int(state.countdown))) if state.phase == "celebrating" else (("ממתינים לבונים" if he else "THE DESERT AWAITS ITS BUILDERS") if state.idle else ("תודה " if he else "Building with ")+str(state.builder))
 var action_values := [state.config.get("likesPerWorker",5),state.config.get("commentBlocks",1),state.config.get("followBlocks",5),state.config.get("shareBlocks",1)]
 instructions.text = ("%d לייקים ← פועל • תגובה ← %d אבנים\nמעקב ← %d אבנים • שיתוף ← %d אבנים\nלהצבעה: כתבו את שם המבנה באנגלית" if he else "%d likes → worker • Comment → %d stones\nFollow → %d stones • Share → %d stones\nVote: pyramid / temple / castle / lighthouse / obelisk / ziggurat") % action_values
 var count := int(state.config.workers)
 while workers.size() < count: make_worker(workers.size())
 for i in range(workers.size()): workers[i].node.visible = i<count
 sun.shadow_enabled = state.config.quality == "high"
 leaders.visible = state.config.get("overlay","full") == "full"
 instructions.visible = leaders.visible
 bottom_panel.visible = leaders.visible
 footer_note.visible = leaders.visible
 if state.config.get("skin","mixed") != current_skin:
  current_skin = state.config.skin
  for tween in get_tree().get_processed_tweens(): tween.kill()
  for w in workers: w.node.queue_free()
  workers.clear()
  for i in range(shown):
   blocks[i].visible = false
   set_placed(i,true)
  landed = shown
  for i in range(count): make_worker(i)

func _process(delta: float) -> void:
 clock += delta
 polling += delta
 if polling > 0.25 and not pending:
  polling = 0
  pending = true
  request.request("http://127.0.0.1:3210/api/state" if not token.is_empty() else "http://127.0.0.1:3210/api/session")
  if not token.is_empty() and telemetry.get_http_client_status() == HTTPClient.STATUS_DISCONNECTED:
   telemetry.request("http://127.0.0.1:3210/api/perf",PackedStringArray(["Content-Type: application/json","X-Session: "+token]),HTTPClient.METHOD_POST,JSON.stringify({"fps":Engine.get_frames_per_second(),"workers":mini(workers.size(),int(state.get("config",{}).get("workers",16))),"round":round_id,"visualComplete":landed>=slots.size(),"memoryMB":Performance.get_monitor(Performance.MEMORY_STATIC)/1048576.0}))
 if state.is_empty(): return
 var running: bool = not state.paused
 var target_count := clampi(int(float(state.built)/float(state.target)*slots.size()),0,slots.size())
 if Time.get_ticks_msec()/1000.0-last_service_response > 4.0:
  status.text = "LOCAL SERVICE RECONNECTING" if state.config.language == "en" else "מתחברים מחדש לשירות המקומי"
  status.add_theme_color_override("font_color",Color("e7b978"))
 else:
  status.add_theme_color_override("font_color",Color("8bd3bb"))
 if target_count < shown:
  for tween in get_tree().get_processed_tweens(): tween.kill()
  for w in workers: w.delivery = false
  for i in range(target_count):
   blocks[i].position = slots[i]
   blocks[i].visible = false
   set_placed(i,true)
  for i in range(target_count,shown):
   var fallen := blocks[i]
   set_placed(i,false)
   fallen.position = slots[i]
   fallen.visible = true
   var shake := create_tween()
   shake.tween_property(fallen,"position",fallen.position+Vector3(randf_range(-3,3),-3,randf_range(-3,3)),.7)
   shake.tween_callback(func(): fallen.visible = false)
  shown = target_count
  landed = target_count
 if running and target_count > shown:
  for i in range(shown,mini(target_count,shown+4)):
   var available := -1
   for j in range(workers.size()):
    if workers[j].node.visible and not workers[j].delivery:
     available = j
     break
   if available < 0: break
   deliver_stone(i,available)
   shown += 1
 var busy: bool = state.queue>0 and running and state.phase == "building"
 for i in range(workers.size()):
  var w: Dictionary = workers[i]
  if not w.node.visible: continue
  if w.delivery:
   w.left.rotation.x = sin(clock*10+i)*.55
   w.right.rotation.x = -w.left.rotation.x
   continue
  var t := fmod(clock*0.23+w.offset,1.0)
  var source := Vector3(-7+float(i%3),0,9)
  var destination := Vector3(-5+float(i%7)*1.6,0,7)
  var travel := (t*2 if t<.5 else (1-t)*2) if busy else 0.0
  w.node.position = source.lerp(destination,travel)
  w.node.rotation.y = -PI/2 if t < .5 else PI/2
  w.left.rotation.x = sin(clock*10+i)*.55 if busy else 0
  w.right.rotation.x = -w.left.rotation.x
  w.carry.visible = busy and t < .5
  var board: Array = state.leaderboard
  w.tag.text = str(board[i%board.size()][0]) if not board.is_empty() and i<mini(4,board.size()) else ""
  if state.phase == "celebrating": w.node.position.y = abs(sin(clock*4+i))*.5
 if state.config.camera:
  camera.position = Vector3(30*sin(.62+sin(clock*.06)*.12),17,33*cos(.62+sin(clock*.06)*.12))
  camera.look_at(Vector3(0,4,0))
 if state.config.night:
  var day := .5+.5*sin(clock*.012)
  sun.light_energy = .25+day*.65
  world_env.environment.background_color = Color("101d32").lerp(Color("618695"),day)
 crown.visible = state.phase == "celebrating" and landed >= slots.size()
 if crown.visible and not confetti.emitting:
  confetti.position = Vector3(0,9,0)
  confetti.restart()

func deliver_stone(index: int, worker_index: int) -> void:
 var w: Dictionary = workers[worker_index]
 var b := blocks[index]
 var target := slots[index]
 w.delivery = true
 var unit := mini(int(float(index)/slots.size()*float(state.target)),state.placements.size()-1)
 var owner_data: Dictionary = state.placements[unit] if unit >= 0 else {"user":state.builder,"gold":state.gold}
 w.tag.text = str(owner_data.user) if worker_index<4 else ""
 w.tag.modulate = Color("d7ad55") if owner_data.gold else Color.WHITE
 w.carry.visible = true
 w.node.position = Vector3(-6.0+worker_index%4,0,9.5+int(worker_index/4)*.5)
 var landing := Vector3(target.x,0,target.z+1.5)
 w.node.look_at(Vector3(landing.x,0.01,landing.z),Vector3.UP,true)
 b.visible = false
 b.material_override = material(Color("d7ad55")) if owner_data.gold else b.get_meta("base_material")
 var tween := create_tween()
 tween.tween_property(w.node,"position",landing,.65)
 tween.tween_callback(func():
  if is_instance_valid(b):
   w.carry.visible = false
   b.position = w.node.position+Vector3(0,1.6,0)
   b.visible = true)
 tween.tween_property(b,"position",target+Vector3(0,1.5,0),.25).set_trans(Tween.TRANS_SINE)
 tween.tween_property(b,"position",target,.2).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
 tween.tween_callback(func():
  w.delivery = false
  b.visible = false
  set_placed(index,true)
  landed += 1
  dust.position = target
  if state.config.quality == "high": dust.restart())

func set_placed(index: int, visible_stone: bool) -> void:
 var basis := Basis.IDENTITY if visible_stone else Basis.from_scale(Vector3.ZERO)
 placed_mesh.multimesh.set_instance_transform(index,Transform3D(basis,slots[index]))
 var mat: StandardMaterial3D = blocks[index].material_override
 placed_mesh.multimesh.set_instance_color(index,mat.albedo_color)
