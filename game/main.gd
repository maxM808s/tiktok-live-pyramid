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
var bar: ProgressBar
var clock := 0.0
var polling := 0.0
var shown := 0
var round_id := -1
var pending := false
var building := "pyramid"
var material_cache: Dictionary = {}
var dust: CPUParticles3D
var confetti: CPUParticles3D

func material(color: Color) -> StandardMaterial3D:
 if material_cache.has(color): return material_cache[color]
 var m := StandardMaterial3D.new()
 m.albedo_color = color
 m.roughness = 0.78
 if color == Color.GOLD:
  m.metallic = 0.7
  m.roughness = 0.25
 material_cache[color] = m
 return m

func box(parent: Node3D, pos: Vector3, size: Vector3, color: Color) -> MeshInstance3D:
 var mesh := MeshInstance3D.new()
 var shape := BoxMesh.new()
 shape.size = size
 mesh.mesh = shape
 mesh.material_override = material(color)
 parent.add_child(mesh)
 mesh.position = pos
 return mesh

func label_at(text: String, pos: Vector2, size: Vector2, font_size: int, color := Color.WHITE) -> Label:
 var l := Label.new()
 l.text = text
 l.position = pos
 l.size = size
 l.add_theme_font_size_override("font_size",font_size)
 l.add_theme_color_override("font_color",color)
 l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
 l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
 $Overlay.add_child(l)
 return l

func _ready() -> void:
 Engine.max_fps = 60
 var overlay := CanvasLayer.new()
 overlay.name = "Overlay"
 add_child(overlay)
 var backdrop := ColorRect.new()
 backdrop.position = Vector2(35,40)
 backdrop.size = Vector2(1010,330)
 backdrop.color = Color(0.025,0.07,0.12,0.91)
 overlay.add_child(backdrop)
 label_at("P Y R A M I D   /   L I V E",Vector2(60,55),Vector2(960,60),32,Color.GOLD)
 title = label_at("EGYPTIAN PYRAMID",Vector2(50,120),Vector2(980,85),62)
 details = label_at("Waiting for local service",Vector2(50,210),Vector2(980,60),32)
 bar = ProgressBar.new()
 bar.position = Vector2(90,295)
 bar.size = Vector2(900,28)
 bar.show_percentage = false
 overlay.add_child(bar)
 status = label_at("CONNECTING",Vector2(70,345),Vector2(940,65),28,Color(0.5,0.9,0.8))
 notice = label_at("",Vector2(70,1120),Vector2(940,140),44,Color.GOLD)
 leaders = label_at("TOP BUILDERS",Vector2(50,1290),Vector2(980,230),34)
 instructions = label_at("5 likes → worker • Comment → stone\nFollow → 5 stones • Rose → 10 stones\nVote: comment the next building name",Vector2(50,1570),Vector2(980,180),32)
 label_at("BUILD SOMETHING THAT LASTS",Vector2(50,1800),Vector2(980,50),26,Color(0.8,0.7,0.5))
 world_env = WorldEnvironment.new()
 var env := Environment.new()
 env.background_mode = Environment.BG_COLOR
 env.background_color = Color("142634")
 env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
 env.ambient_light_color = Color("a4cbd5")
 env.ambient_light_energy = 0.65
 env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
 world_env.environment = env
 add_child(world_env)
 sun = DirectionalLight3D.new()
 sun.rotation_degrees = Vector3(-48,-25,0)
 sun.light_color = Color("ffe0a4")
 sun.light_energy = 1.8
 sun.shadow_enabled = true
 add_child(sun)
 box(self,Vector3(0,-0.45,0),Vector3(220,0.8,220),Color("bd915f"))
 box(self,Vector3(0,-0.02,0),Vector3(17,0.12,17),Color("8e7055"))
 var rng := RandomNumberGenerator.new()
 rng.seed = 2026
 for i in range(55):
  var mound := MeshInstance3D.new()
  var sphere := SphereMesh.new()
  sphere.radius = rng.randf_range(3,10)
  sphere.height = sphere.radius*2
  mound.mesh = sphere
  mound.material_override = material(Color("aa7c51"))
  mound.scale.y = 0.18
  mound.position = Vector3(rng.randf_range(-75,75),-0.4,rng.randf_range(-65,-20))
  add_child(mound)
 for x in [-9.0,9.0]:
  for z in [-7.0,0.0,7.0]:
   box(self,Vector3(x,3,z),Vector3(.15,6,.15),Color("614936"))
   box(self,Vector3(x,3,z),Vector3(.2,.18,7),Color("614936"))
   box(self,Vector3(x,5.7,z),Vector3(.2,.18,7),Color("614936"))
 for i in range(10):
  box(self,Vector3(-12+(i%3),0.4+(i/3)*.75,8),Vector3(.9,.7,.9),Color("d9b780"))
 camera = Camera3D.new()
 camera.fov = 49
 add_child(camera)
 camera.position = Vector3(23,22,32)
 camera.look_at(Vector3(0,3.5,0))
 dust = particles(24,Color("e4c89b"),0.6,2)
 confetti = particles(160,Color.GOLD,3,10)
 request = HTTPRequest.new()
 request.timeout = 2
 add_child(request)
 request.request_completed.connect(_response)
 telemetry = HTTPRequest.new()
 telemetry.timeout = 2
 add_child(telemetry)
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
  blocks.append(b)
 shown = 0

func make_worker(i: int) -> void:
 var root := Node3D.new()
 add_child(root)
 var skin := i%4
 var colors := [Color("29a0a8"),Color("eee0bf"),Color("26374d"),Color.GOLD]
 box(root,Vector3(0,1.1,0),Vector3(.48,.65,.3),colors[skin])
 box(root,Vector3(0,1.67,0),Vector3(.37,.38,.36),Color("bc865c"))
 box(root,Vector3(0,1.88,0),Vector3(.45,.14,.4),colors[skin])
 var left := box(root,Vector3(-.15,.48,0),Vector3(.18,.65,.2),Color("514737"))
 var right := box(root,Vector3(.15,.48,0),Vector3(.18,.65,.2),Color("514737"))
 box(root,Vector3(-.34,1.18,.15),Vector3(.17,.52,.18),Color("bc865c"))
 box(root,Vector3(.34,1.18,.15),Vector3(.17,.52,.18),Color("bc865c"))
 var carry := box(root,Vector3(0,1.2,.5),Vector3(.7,.55,.55),Color("e4c18a"))
 var tag := Label3D.new()
 tag.font_size = 40
 tag.pixel_size = .012
 tag.billboard = BaseMaterial3D.BILLBOARD_ENABLED
 tag.position.y = 2.35
 root.add_child(tag)
 workers.append({"node":root,"left":left,"right":right,"carry":carry,"tag":tag,"offset":float(i)/16.0})

func _response(_result: int, code: int, _headers: PackedStringArray, body: PackedByteArray) -> void:
 pending = false
 if code != 200: return
 var parsed = JSON.parse_string(body.get_string_from_utf8())
 if not parsed is Dictionary: return
 if parsed.has("token"):
  token = parsed.token
  return
 state = parsed
 if int(state.round) != round_id:
  round_id = int(state.round)
  building = state.building
  rebuild()
 var he: bool = state.config.language == "he"
 title.text = ({"pyramid":"הפירמידה המצרית","temple":"המקדש העתיק","castle":"טירת ימי הביניים","lighthouse":"המגדלור","obelisk":"האובליסק","ziggurat":"הזיגוראת"}.get(building,building) if he else building.to_upper())
 details.text = ("סיבוב %d  •  %d / %d אבנים" if he else "ROUND %d  •  %d / %d STONES") % [state.round,state.built,state.target]
 bar.value = 100.0*float(state.built)/float(state.target)
 status.text = ("SIMULATOR • TEST EVENTS" if state.config.mode == "simulator" else ("TIKFINITY SOCKET CONNECTED" if state.connection.socket else "TIKFINITY DISCONNECTED"))
 if state.paused: status.text += " • PAUSED"
 leaders.text = "הבונים המובילים\n" if he else "TOP BUILDERS\n"
 var top: Array = state.roundLeaders if state.phase == "celebrating" else state.leaderboard
 for i in range(mini(4,top.size())): leaders.text += "%d.  %s   ·   %d\n" % [i+1,top[i][0],top[i][1]]
 notice.text = (("הבנייה הושלמה! הסיבוב הבא בעוד %d" if he else "MONUMENT COMPLETE\nNext round in %ds") % maxi(0,int(state.countdown))) if state.phase == "celebrating" else (("ממתינים לבונים" if he else "THE DESERT AWAITS ITS BUILDERS") if state.idle else ("תודה " if he else "Building with ")+str(state.builder))
 instructions.text = "5 לייקים ← פועל • תגובה ← אבן\nמעקב ← 5 אבנים • ורד ← 10 אבנים\nלהצבעה: כתבו את שם המבנה באנגלית" if he else "5 likes → worker • Comment → stone\nFollow → 5 stones • Rose → 10 stones\nVote: pyramid / temple / castle / lighthouse / obelisk / ziggurat"
 var count := int(state.config.workers)
 while workers.size() < count: make_worker(workers.size())
 for i in range(workers.size()): workers[i].node.visible = i<count
 sun.shadow_enabled = state.config.quality == "high"

func _process(delta: float) -> void:
 clock += delta
 polling += delta
 if polling > 0.25 and not pending:
  polling = 0
  pending = true
  request.request("http://127.0.0.1:3210/api/state" if not token.is_empty() else "http://127.0.0.1:3210/api/session")
  if not token.is_empty() and telemetry.get_http_client_status() == HTTPClient.STATUS_DISCONNECTED:
   telemetry.request("http://127.0.0.1:3210/api/perf",PackedStringArray(["Content-Type: application/json","X-Session: "+token]),HTTPClient.METHOD_POST,JSON.stringify({"fps":Engine.get_frames_per_second(),"workers":workers.size(),"memoryMB":Performance.get_monitor(Performance.MEMORY_STATIC)/1048576.0}))
 if state.is_empty(): return
 var running: bool = not state.paused
 var target_count := int(float(state.built)/float(state.target)*slots.size())
 if target_count < shown:
  for i in range(target_count,shown): blocks[i].visible = false
  shown = target_count
 if running and target_count > shown:
  var n := mini(target_count,shown+4)
  for i in range(shown,n):
   var b := blocks[i]
   b.visible = true
   b.position = slots[i]+Vector3(0,1.3,0)
   if state.gold: b.material_override = material(Color.GOLD)
   create_tween().tween_property(b,"position",slots[i],0.38).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
  shown = n
  dust.position = slots[maxi(0,shown-1)]
  if state.config.quality == "high": dust.restart()
 var busy: bool = state.queue>0 and running and state.phase == "building"
 for i in range(workers.size()):
  var w: Dictionary = workers[i]
  if not w.node.visible: continue
  var t := fmod(clock*0.23+w.offset,1.0)
  var source := Vector3(-11+float(i%3),0,8)
  var destination := Vector3(-5+float(i%7)*1.6,0,7)
  var travel := (t*2 if t<.5 else (1-t)*2) if busy else 0.0
  w.node.position = source.lerp(destination,travel)
  w.node.rotation.y = -PI/2 if t < .5 else PI/2
  w.left.rotation.x = sin(clock*10+i)*.55 if busy else 0
  w.right.rotation.x = -w.left.rotation.x
  w.carry.visible = busy and t < .5
  var board: Array = state.leaderboard
  w.tag.text = str(board[i%board.size()][0]) if not board.is_empty() else ""
  if state.phase == "celebrating": w.node.position.y = abs(sin(clock*4+i))*.5
 if state.config.camera:
  camera.position = Vector3(30*sin(.62+sin(clock*.06)*.12),22,33*cos(.62+sin(clock*.06)*.12))
  camera.look_at(Vector3(0,4,0))
 if state.config.night:
  var day := .5+.5*sin(clock*.012)
  sun.light_energy = .35+day*1.5
  world_env.environment.background_color = Color("101d32").lerp(Color("618695"),day)
 if state.phase == "celebrating" and not confetti.emitting:
  confetti.position = Vector3(0,9,0)
  confetti.restart()
