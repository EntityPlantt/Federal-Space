const generateRandomNumber = (from, to) => from + Math.floor(Math.random() * (to - from + 1)),
distance = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
Array.prototype.random = function() {return this[generateRandomNumber(0, this.length - 1)]};
Array.prototype.toInt = function() {return this.map(x => x.parseInt(x))};
Math.toDegrees = rad => rad * 180 / Math.PI;
Math.toRadians = deg => deg / 180 * Math.PI;
var GUI = {
	"backpack": {
		open(elm) {
			GUI["backpack"].list = elm.querySelector("#backpack-gem-list");
			elm.querySelector(".bp-max-size").innerText = data.backpack.maxSize.toLocaleString("en-US");
			elm.querySelector(".bp-up-cost").innerText = (data.backpack.maxSize * 2e4).toLocaleString("en-US");
			for (var gem of Object.keys(data.backpack.items)) {
				var li = document.createElement("li"), path = gem.split(":"), elm;
				elm = generatePlanetGemImage(data.worlds[path[0]][path[1]].gem);
				elm.style.width = "32px";
				li.appendChild(elm);
				li.appendChild(document.createTextNode(data.worlds[path[0]][path[1]].gem.name
				+ " ($" + data.worlds[path[0]][path[1]].gem.value.toLocaleString("en-US") + ") x"));
				elm = document.createElement("span");
				elm.className = "gem-amount";
				li.appendChild(elm);
				li.setAttribute("gem", gem);
				GUI["backpack"].list.appendChild(li);
			}
			GUI["backpack"].interval = setInterval(() => {
				for (var elm of GUI["backpack"].list.querySelectorAll("li")) {
					elm.querySelector(".gem-amount").innerText = data.backpack.items[elm.getAttribute("gem")];
				}
			}, 50);
		},
		close() {
			clearInterval(GUI["backpack"].interval);
			GUI["backpack"].list.innerHTML = "";
			delete GUI["backpack"].list;
			delete GUI["backpack"].interval;
		},
		shortcut: {key: "b"}
	},
	"planet": {
		open(elm, planet) {
			var path = planet.split(":").toInt();
			planet = data.worlds[path[0]][path[1]];
			elm.querySelector(".gui-title").innerHTML
			= elm.querySelector(".gui-title").innerHTML.replace(/^(.*?)</, planet.name + "<");
			switch (planet.ownedBy) {
				case null:
				elm.querySelector(".planet-status").innerText = "This planet is independent.";
				if (planet.intelligentLife) {
					elm.querySelector(".planet-status").innerText = "This planet is colonized by intelligent life.";
				}
				elm.querySelector(".options").innerHTML = `
					<div class="gui gui-button" onclick='colonizePlanet(${JSON.stringify(path.join(":"))})'>Colonize
					$${(data.worlds[path[0]][path[1]].size * 1e6 * 2 ** path[0] 
					+ (data.worlds[path[0]][path[1]].intelligentLife ? (1e6 * 3 ** path[0]) : 0)).toLocaleString("en-US")}</div>
				`;
				break;
				case "You":
				elm.querySelector(".planet-status").innerText = "This is your planet.";
				if (!planet.hasGemProduction) {
					elm.querySelector(".options").innerHTML = `
						<div class="gui gui-button" onclick='setUpGemProduction(${JSON.stringify(path.join(":"))})'>
						Set up gem production ($${(planet.gem.value * 100 * 2.5 ** path[0]).toLocaleString("en-US")})
						</div>
					`;
				}
				else {
					elm.querySelector(".options").innerHTML = `
						<div class="gui gui-button" disabled>Set up gem production</div>
					`;
				}
				break;
				default:
				elm.querySelector(".planet-status").innerText = `This planet is a part of the ${planet.ownedBy}'s federation.`;
				elm.querySelector(".options").innerHTML = `
					<div class="gui gui-button" onclick='declareWar(${JSON.stringify(path.join(":"))})'>Declare war
					($${planet.strength.toLocaleString("en-US")})</div>
				`;
				break;
			}
		}
	},
	"alert": {
		open(elm, text) {
			elm.querySelector(".message").innerText = text;
		}
	},
	"confirm": {
		async open(elm, text, onConfirmCallback) {
			elm.querySelector(".message").innerText = text;
			elm.querySelector(".confirm").onclick = (...args) => {
				closeGUI("confirm");
				onConfirmCallback(...args);
			}
		}
	},
	"options": {
		open(elm) {
			elm.querySelector(".volume-setting").value = music.volume * 100;
		},
		changeVolume(value) {
			music.volume = value / 100;
			gameSettings.volume = value;
			saveGameSettings();
		},
		shortcut: {key: "escape"}
	},
	"planet-list": {
		open(elm) {
			var list = elm.querySelector(".planet-list");
			list.innerHTML = "";
			for (var i = 0; i < data.worlds.length; i++) {
				var li = document.createElement("li");
				list.appendChild(li);
				li.innerHTML = `World ${i}<ul></ul>`;
				li = li.querySelector("ul");
				for (var j = 0; j < data.worlds[i].length; j++) {
					var planet = data.worlds[i][j];
					li.innerHTML += `
						<li>
							<a ${(worldNow == i) ? `onclick="gotoPlanet(${j})"` : ""}>
							${planet.name}
							</a>
							<span class="gui-badge ${planet.ownedBy ? "" : "gui-hidden"}"
							style="--c: ${data.federations[planet.ownedBy].color}">
							${planet.ownedBy}
							</span>
							<span class="gui-badge ${planet.hasGemProduction ? "" : "gui-hidden"}" style="--c: magenta">
							Gem production
							</span>
							<span class="gui-badge ${planet.intelligentLife ? "" : "gui-hidden"}" style="--c: darkblue">
							Intelligent life
							</span>
						</li>
					`;
				}
			}
		},
		shortcut: {key: "p"}
	},
	"change-world": {
		open(elm) {
			elm.querySelector("#change-world-number").value = worldNow;
		},
		shortcut: {key: "w"}
	}
};
onload = () => {
	window.tl = new THREE.TextureLoader;
	window.music = new Audio("music.mp3");
	function playMusic() {
		music.play();
		music.onended = () => {
			music.play();
		}
		removeEventListener("click", playMusic);
	}
	addEventListener("click", playMusic);
	window.gameSettings = JSON.parse(localStorage.getItem("game-settings")) ?? {
		volume: 75,
		highRenderQuality: true,
		renderPlanetTags: false
	};
	music.volume = gameSettings.volume / 100;
	window.closeButton = document.createElement("div");
	closeButton.classList.add("gui-window-close-btn");
	closeButton.innerText = "X";
	document.querySelectorAll("[gui-name]").forEach(elm => {
		var closeBtn = closeButton.cloneNode(true), title = document.createElement("h1");
		closeBtn.setAttribute("onclick", `closeGUI(${JSON.stringify(elm.getAttribute("gui-name"))})`);
		title.innerText = elm.getAttribute("gui-title");
		title.className = "gui-title";
		title.append(closeBtn);
		elm.prepend(title);
	});
	window.renderGame = 0;
	window.worldNow = 0;
	window.zoom = 25;
	window.renderer = new THREE.WebGLRenderer;
	renderer.domElement.onwheel = event => {
		zoom *= (event.wheelDelta < 0) ? 1.1 : (1 / 1.1);
		zoom = Math.min(Math.max(zoom, 1), 25);
	};
	renderer.setSize(innerWidth, innerHeight);
	window.scene = new THREE.Scene;
	window.camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight);
	renderer.domElement.id = "threejs-canvas";
	document.body.prepend(renderer.domElement);
	renderer.domElement.onmousedown = MouseClick;
	camera.userData.rotationX = 0;
	camera.userData.rotationY = Math.toRadians(45);
	camera.userData.x = 0;
	camera.userData.z = 0;
	window.data = JSON.parse(localStorage.getItem("game-data"));
	window.colonizingRocket = new THREE.Group;
	colonizingRocket.add(new THREE.Mesh(
		new THREE.CylinderGeometry(0.35, 0.35, 2, 24, 1),
		new THREE.MeshPhongMaterial({color: 0xdddddd})
	));
	colonizingRocket.children.at(-1).rotation.x = Math.toRadians(90);
	colonizingRocket.add(new THREE.PointLight(0xe38c2d, 0.75));
	colonizingRocket.children.at(-1).rotation.x = Math.toRadians(90);
	colonizingRocket.children.at(-1).position.z = -1.5;
	colonizingRocket.add(new THREE.Mesh(
		new THREE.ConeGeometry(0.5, 0.75, 24, 1),
		new THREE.MeshPhongMaterial({color: 0xdd1212})
	));
	colonizingRocket.children.at(-1).rotation.x = Math.toRadians(90);
	colonizingRocket.children.at(-1).position.z = 1.5;
	colonizingRocket.scale.set(.4, .4, .4);
	window.stars = [];
	window.planetRenders = [];
	window.generatedFederationPlanetTags = {};
	loadGame();
	function frame() {
		if (renderGame >= 0) {
			renderer.shadowMap.enabled = gameSettings.highRenderQuality;
			renderer.render(scene, camera);
			renderer.domElement.style.opacity = 1;
			document.querySelectorAll(".gui").forEach(e => e.classList.remove("gui-hidden-force"));
			document.getElementById("balance").innerText = (data || {balance: 0}).balance.toLocaleString("en-US");
			camera.position.x = Math.sin(camera.userData.rotationY)
			 * Math.sin(camera.userData.rotationX) * zoom + camera.userData.x;
			camera.position.z = Math.sin(camera.userData.rotationY)
			 * Math.cos(camera.userData.rotationX) * zoom + camera.userData.z;
			camera.position.y = Math.cos(camera.userData.rotationY) * zoom;
			camera.lookAt(camera.userData.x, 0, camera.userData.z);
			camera.updateProjectionMatrix();
			if (data.colonizingRocket) {
				document.getElementById("cancel-rocket-btn").classList.remove("gui-hidden");
				var targetPlanet = data.colonizingRocket.targetPlanet.split(":");
				if (data.colonizingRocket.world == worldNow) {
					document.getElementById("goto-rocket-btn").classList.remove("gui-hidden");
					if (camera.userData.rocketlock) {
						camera.userData.x = data.colonizingRocket.x;
						camera.userData.z = data.colonizingRocket.z;
					}
					scene.add(colonizingRocket);
					colonizingRocket.lookAt(
						data.worlds[targetPlanet[0]][targetPlanet[1]].x,
						0,
						data.worlds[targetPlanet[0]][targetPlanet[1]].z
					);
					colonizingRocket.position.set(data.colonizingRocket.x, 0, data.colonizingRocket.z);
				}
				else {
					scene.remove(colonizingRocket);
					document.getElementById("goto-rocket-btn").classList.add("gui-hidden");
				}
				var calculatedValue = Math.atan(
					(data.colonizingRocket.x - data.worlds[targetPlanet[0]][targetPlanet[1]].x)
					/
					(data.colonizingRocket.z - data.worlds[targetPlanet[0]][targetPlanet[1]].z)
				);
				data.colonizingRocket.x -= Math.cos(90 - Math.toDegrees(calculatedValue)) * 0.05;
				data.colonizingRocket.z -= Math.sin(90 - Math.toDegrees(calculatedValue)) * 0.05;
				if (distance(
					data.worlds[targetPlanet[0]][targetPlanet[1]].x,
					data.worlds[targetPlanet[0]][targetPlanet[1]].z,
					data.colonizingRocket.x,
					data.colonizingRocket.z
				) < data.worlds[targetPlanet[0]][targetPlanet[1]].size) {
					delete data.colonizingRocket;
					colonizePlanetFinish(targetPlanet.join(":"));
					scene.remove(colonizingRocket);
				}
				saveGame();
			}
			else {
				document.getElementById("cancel-rocket-btn").classList.add("gui-hidden");
				document.getElementById("goto-rocket-btn").classList.add("gui-hidden");
			}
			// Moving stars
			if (gameSettings.highRenderQuality) {
				for (var star of stars) {
					star.position.x += generateRandomNumber(5, 12) / 2500 * Math.abs(star.position.y);
					if (star.position.x > 150) {
						star.position.x -= 300;
					}
					if (star.position.x < -150) {
						star.position.x += 300;
					}
				}
			}
		}
		else {
			renderer.domElement.style.opacity = 0;
			document.querySelectorAll(".gui").forEach(e => e.classList.add("gui-hidden-force"));
		}
		requestAnimationFrame(frame);
	}
	frame();
	onresize = () => {
		renderer.setSize(innerWidth, innerHeight);
		camera.aspect = innerWidth / innerHeight;
	}
	function MouseClick(event) {
		switch (event.button) {
			case 0: // left click
			interactWith(event.clientX, event.clientY);
			break;
			case 1: // middle click
			startMove(event.clientX, event.clientY);
			break;
			case 2: // right click
			startRotate(event.clientX, event.clientY);
			break;
		}
		function startRotate(x, y) {
			onmousemove = event => {
				camera.userData.rotationX += (x - event.clientX) / 180;
				camera.userData.rotationY += (y - event.clientY) / 180;
				camera.userData.rotationY = Math.max(Math.toRadians(1), Math.min(Math.toRadians(90), camera.userData.rotationY));
				x = event.clientX;
				y = event.clientY;
			}
			onmouseup = () => {
				onmousemove = null;
			}
		}
		function startMove(x, y) {
			onmousemove = event => {
				camera.userData.rocketlock = false;
				camera.userData.x += Math.sin(camera.userData.rotationX) * (y - event.clientY) / 60 * zoom;
				camera.userData.z += Math.cos(camera.userData.rotationX) * (y - event.clientY) / 60 * zoom;
				camera.userData.x += Math.sin(camera.userData.rotationX + Math.PI / 2) * (x - event.clientX) / 60 * zoom;
				camera.userData.z += Math.cos(camera.userData.rotationX + Math.PI / 2) * (x - event.clientX) / 60 * zoom;
				x = event.clientX;
				y = event.clientY;
				// Constraints
				camera.userData.x = Math.min(Math.max(camera.userData.x, -100), 100);
				camera.userData.z = Math.min(Math.max(camera.userData.z, -100), 100);
			}
			onmouseup = () => {
				onmousemove = null;
			}
		}
		function interactWith(x, y) {
			var raycaster = new THREE.Raycaster, intersects;
			raycaster.setFromCamera(new THREE.Vector2(x / innerWidth * 2 - 1, y / innerHeight * -2 + 1), camera);
			intersects = raycaster.intersectObjects(scene.children);
			while (intersects.length && intersects[0].object.name != "Planet")
				intersects.shift();
			if (!intersects.length)
				return;
			var planet = intersects[0].object.userData.planet;
			openGUI("planet", planet);
		}
	}
	setInterval(() => {
		data.alienCooldown--;
		for (var i = 0; i < data.worlds.length; i++) {
			for (var j = 0; j < data.worlds[i].length; j++) {
				if (data.worlds[i][j].ownedBy == "You" && data.worlds[i][j].hasGemProduction) {
					if (!data.backpack.items[i + ":" + j]) {
						data.backpack.items[i + ":" + j] = 0;
					}
					if (data.backpack.totalItems < data.backpack.maxSize) {
						data.backpack.items[i + ":" + j]++;
						data.backpack.totalItems++;
						saveGame();
					}
				}
				if (data.worlds[i][j].ownedBy == null && data.worlds[i][j].intelligentLife && !generateRandomNumber(0, 899 / 1.1 ** i)) {
					data.worlds[i][j].intelligentLife = false;
					data.worlds[i][j].ownedBy
					= "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").random()
					+ "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").random()
					+ "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").random()
					+ "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").random()
					+ "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").random();
					data.federations[data.worlds[i][j].ownedBy] = {color: `rgb(
						${generateRandomNumber(0, 255)},
						${generateRandomNumber(0, 255)},
						${generateRandomNumber(0, 255)}
					)`};
					saveGame();
					data.worlds[i][j].strength = generateRandomNumber(5e3 * 1.5 ** i, 5e6 * 1.5 ** i);
					openGUI("alert",
					`The life on the planet ${data.worlds[i][j].name} has evolved to ${data.worlds[i][j].ownedBy}!`);
				}
				if (![null, "You"].includes(data.worlds[i][j].ownedBy)) {
					data.worlds[i][j].strength += generateRandomNumber(10 * 1.2 ** i, 100 * 1.2 ** i);
				}
				if (data.alienCooldown < 0
				&& ![null, "You"].includes(data.worlds[i][j].ownedBy) && !generateRandomNumber(0, 449 / 1.1 ** i)) {
					data.alienCooldown = 250 / 1.1 ** i;
					var path = [generateRandomNumber(0, data.worlds.length), generateRandomNumber(0, 49)];
					var planet = data.worlds[path[0]][path[1]];
					if (planet.ownedBy == data.worlds[i][j].ownedBy) {
						continue;
					}
					planet.ownedBy = data.worlds[i][j].ownedBy;
					planet.strength = generateRandomNumber(1e3 * 1.5 ** path[0], 1e6 * 1.5 ** path[0]);
					saveGame();
					if (worldNow == path[0]) {
						openGUI("alert", `${planet.ownedBy} has taken over ${planet.name} in your world!`);
						if (gameSettings.renderPlanetTags) {
							planetRenders[path[1]].children[1].material = federationPlanetTag(planet.ownedBy, data.federations[planet.ownedBy].color);
						}
					}
				}
			}
		}
	}, 500);
	onkeydown = event => {
		if (event.ctrlKey && event.key.toLowerCase() == "w") {
			event.preventDefault();
		}
	}
	onkeyup = event => {
		for (var i of Object.keys(GUI)) {
			if (!GUI[i].shortcut) {
				continue;
			}
			if (GUI[i].shortcut.key == event.key.toLowerCase()) {
				if (GUI[i].shortcut.ctrl != undefined && GUI[i].shortcut.ctrl != event.ctrlKey) {
					continue;
				}
				if (GUI[i].shortcut.shift != undefined && GUI[i].shortcut.shift != event.shiftKey) {
					continue;
				}
				if (GUI[i].shortcut.alt != undefined && GUI[i].shortcut.alt != event.altKey) {
					continue;
				}
				if (GUI[i]?.opened) {
					closeGUI(i);
				}
				else {
					openGUI(i);
				}
			}
		}
	}
}
function removeGameData() {
	openGUI("confirm", "⚠ All game data will be lost.", () => {
		data = null;
		saveGame();
		location.reload(true);
	});
}
function toggleHighRenderQuality() {
	gameSettings.highRenderQuality = !gameSettings.highRenderQuality;
	saveGameSettings();
	loadGame();
}
function loadGame() {
	if (!data) {
		data = {
			worlds: [[]],
			backpack: {
				items: {},
				totalItems: 0,
				maxSize: 250
			},
			balance: 0,
			basePlanet: "0:0",
			alienCooldown: 250,
			federations: {
				You: {color: "#080"},
				null: {color: "black"}
			}
		};
		for (var i = 0; i < 50; i++) {
			data.worlds[0].push(generatePlanet());
		}
		data.worlds[0][0].ownedBy = "You";
		data.worlds[0][0].hasGemProduction = true;
		saveGame();
	}
	// Compatibility
	if (data.federationColors) {
		data.federations = {};
		for (var i of Object.keys(data.federationColors)) {
			data.federations[i] = {color: data.federationColors[i]};
		}
		delete data.federationColors;
		saveGame();
		openGUI("alert", `Your old save was automatically adjusted to fit the format of the new update.`);
	}
	while (scene.children.length) {
		scene.remove(scene.children[0]);
	}
	if (worldNow >= data.worlds.length) {
		data.worlds.push([]);
		for (var i = 0; i < 50; i++) {
			data.worlds.at(-1).push(generatePlanet());
		}
		saveGame();
		loadGame();
	}
	else {
		planetRenders = [];
		renderGame -= data.worlds[worldNow].length;
		scene.add(new THREE.Mesh(new THREE.SphereGeometry(5), new THREE.MeshBasicMaterial({color: 0xffff80})));
		if (gameSettings.highRenderQuality) {
			scene.add(new THREE.PointLight(0xffff80, 1.5));
			scene.add(new THREE.AmbientLight(0xffffff, 0.05));
		}
		for (var j = 0; j < data.worlds[worldNow].length; j++) {
			// Compatibility
			if (data.worlds[worldNow][j].display.ring == undefined) {
				data.worlds[worldNow][j].display.ring = !generateRandomNumber(0, 5);
			}
			planetRenders.push(generatePlanetRender(worldNow + ":" + j, () => renderGame++));
			scene.add(planetRenders.at(-1));
		}
	}
	// Decoration
	if (gameSettings.highRenderQuality) {
		stars = [];
		for (var i = 0; i < 1e3; i++) {
			var star = new THREE.Mesh(
				new THREE.SphereGeometry(generateRandomNumber(100, 500) / 5e3),
				new THREE.MeshBasicMaterial({color: `rgb(
					${generateRandomNumber(175, 255)}, 
					${generateRandomNumber(175, 255)}, 255)`})
			);
			star.position.set(
				generateRandomNumber(-150, 150),
				generateRandomNumber(-50, 50),
				generateRandomNumber(-150, 150)
			);
			scene.add(star);
			stars.push(star);
		}
	}
}
function saveGame() {
	localStorage.setItem("game-data", JSON.stringify(data));
}
function generatePlanetGemName() {
	const consonants = [
		"b", "c", "cr", "ch", "sch", "d",
		"t", "s", "l", "m", "n", "gr", "g",
		"w", "v", "f", "k", "fr", "gl", "cl",
		"chl", "tr", "kn", "cn", "ph"
	], vowels = "aeiouy".split("");
	var str = consonants.random() + ["ium", "um", "en", vowels.random() + "te", "ond"].random();
	for (var syllables = generateRandomNumber(0, 3); syllables > 0; syllables--) {
		str = consonants.random() + vowels.random() + str;
	}
	str = ((generateRandomNumber(0, 1) == 1) ? consonants.random() : "") + vowels.random() + str;
	str = str[0].toUpperCase() + str.substr(1);
	return str;
}
function generatePlanet(x = generateRandomNumber(-100, 100), z = generateRandomNumber(-100, 100)) {
	return {
		display: {
			texture: generateRandomNumber(1, 3),
			rotation: generateRandomNumber(0, 90),
			color: {
				r: generateRandomNumber(0, 255),
				g: generateRandomNumber(0, 255),
				b: generateRandomNumber(0, 255)
			},
			ring: !generateRandomNumber(0, 5)
		},
		size: generateRandomNumber(25, 150) / 100,
		gem: {
			name: generatePlanetGemName(),
			display: {
				color: {
					r: generateRandomNumber(0, 255),
					g: generateRandomNumber(0, 255),
					b: generateRandomNumber(0, 255)
				},
				texture: generateRandomNumber(1, 5)
			},
			value: generateRandomNumber(100, 5e3)
		},
		name: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").random() + generateRandomNumber(10, 99),
		x: x,
		z: z,
		intelligentLife: generateRandomNumber(0, 49) == 0,
		ownedBy: null,
		hasGemProduction: false
	};
}
function generatePlanetRender(planet, onDoneCallback = new Function) {
	var r = new THREE.Group;
	var path = planet.split(":");
	planet = data.worlds[path[0]][path[1]];
	var mesh = new THREE.Mesh(new THREE.SphereGeometry(planet.size),
	gameSettings.highRenderQuality ? new THREE.MeshPhongMaterial({map: null}) : new THREE.MeshBasicMaterial({map: null}));
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	mesh.shininess = 0;
	var image = new Image;
	image.onload = () => {
		var canvas = document.createElement("canvas");
		canvas.width = 1024;
		canvas.height = 512;
		var ctx = canvas.getContext("2d");
		ctx.fillStyle = `rgb(${planet.display.color.r}, ${planet.display.color.g}, ${planet.display.color.b})`;
		ctx.fillRect(0, 0, 1024, 512);
		ctx.globalAlpha = 0.5;
		ctx.drawImage(image, 0, 0);
		mesh.material.map = tl.load(canvas.toDataURL());
		onDoneCallback();
	}
	image.src = `images/planets/${planet.display.texture}.png`;
	mesh.rotation.x = planet.display.rotation;
	mesh.name = "Planet";
	mesh.userData.planet = path.join(":");
	r.add(mesh);
	if (gameSettings.renderPlanetTags) {
		r.add(new THREE.Sprite(new THREE.SpriteMaterial({
			map: federationPlanetTag(planet.ownedBy, data.federations[planet.ownedBy].color)
		})));
		r.children.at(-1).position.set(0, planet.size + 2, 0);
		r.children.at(-1).scale.set(4, 4, 4);
	}
	if (planet.display.ring) {
		r.add(new THREE.Mesh(
			new THREE.TorusGeometry(planet.size + 0.5, 0.15, 32, 32),
			gameSettings.highRenderQuality ?
			new THREE.MeshPhongMaterial({color: 0x808080}) :
			new THREE.MeshBasicMaterial({color: 0x808080})
		));
		r.children.at(-1).rotation.x = planet.display.rotation;
	}
	r.position.set(planet.x, 0, planet.z);
	return r;
}
function federationPlanetTag(name, color, size = 256) {
	if (generatedFederationPlanetTags[name]) {
		return generatedFederationPlanetTags[name];
	}
	var canvas = document.createElement("canvas");
	canvas.width = canvas.height = size;
	if (!name) {
		var texture = tl.load(canvas.toDataURL());
		generatedFederationPlanetTags[name] = texture;
		return texture;
	}
	var ctx = canvas.getContext("2d");
	ctx.fillStyle = (typeof color == "string") ? color : ("#" + color.toString(16));
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.moveTo(size / 5, size / 2);
	ctx.lineTo(size * 0.8, size / 2);
	ctx.lineTo(size / 2, size * 0.8);
	ctx.lineTo(size / 5, size / 2);
	ctx.closePath();
	ctx.fill();
	ctx.font = size / 4 + "px font";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(name, size / 2, size / 4, size);
	var texture = tl.load(canvas.toDataURL());
	generatedFederationPlanetTags[name] = texture;
	return texture;
}
function gotoPlanet(id) {
	camera.userData.x = data.worlds[worldNow][id].x;
	camera.userData.z = data.worlds[worldNow][id].z;
}
function changeWorldTo(worldId) {
	if (worldId < 0)
		return;
	if (worldId == 0)
		document.getElementById("prev-world").setAttribute("disabled", "");
	else
		document.getElementById("prev-world").removeAttribute("disabled");
	worldNow = worldId;
	document.getElementById("world-now").innerText = worldNow;
	loadGame();
}
function generatePlanetGemImage(gem) {
	var image = new Image, returnImage = new Image;
	image.onload = () => {
		var canvas = document.createElement("canvas");
		canvas.width = 256;
		canvas.height = 256;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(image, 0, 0);
		var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		for (var i = 0; i < imageData.data.length; i += 4) {
			imageData.data[i] *= gem.display.color.r / 256;
			imageData.data[i + 1] *= gem.display.color.g / 256;
			imageData.data[i + 2] *= gem.display.color.b / 256;
		}
		ctx.putImageData(imageData, 0, 0);
		returnImage.src = canvas.toDataURL();
	}
	image.src = `images/gems/${gem.display.texture}.png`;
	return returnImage;
}
function openGUI(name, ...data) {
	document.querySelector(`[gui-name="${name}"]`).classList.add("gui-opened");
	if (!GUI[name]) {
		GUI[name] = {};
	}
	GUI[name].opened = true;
	document.body.appendChild(document.querySelector(`[gui-name="${name}"]`));
	return (GUI[name].open || new Function)(document.querySelector(`[gui-name="${name}"]`), ...data);
}
function closeGUI(name, ...data) {
	if (!GUI[name]) {
		GUI[name] = {};
	}
	GUI[name].opened = false;
	document.querySelector(`[gui-name="${name}"]`).classList.remove("gui-opened");
	return (GUI[name].close || new Function)(document.querySelector(`[gui-name="${name}"]`), ...data);
}
function sellBackpack() {
	for (var gem of Object.keys(data.backpack.items)) {
		data.balance += data.backpack.items[gem] * data.worlds[gem.split(":")[0]][gem.split(":")[1]].gem.value;
		data.backpack.totalItems -= data.backpack.items[gem];
		data.backpack.items[gem] = 0;
	}
	saveGame();
}
function setUpGemProduction(gem) {
	gem = gem.split(":").toInt();
	if (payMoney(data.worlds[gem[0]][gem[1]].gem.value * 100 * 2.5 ** gem[0])) {
		data.worlds[gem[0]][gem[1]].hasGemProduction = true;
		closeGUI("planet");
	}
	else {
		openGUI("alert", "You don't have enough money to set up gem production on this planet.");
	}
}
function colonizePlanet(path) {
	if (data.colonizingRocket) {
		Object.assign(data.colonizingRocket, {
			targetPlanet: path,
			world: path.split(":")[0]
		});
	}
	else {
		data.colonizingRocket = {
			x: data.worlds[data.basePlanet.split(":")[0]][data.basePlanet.split(":")[0]].x,
			z: data.worlds[data.basePlanet.split(":")[0]][data.basePlanet.split(":")[0]].z,
			targetPlanet: path,
			world: path.split(":")[0]
		};
	}
	saveGame();
	closeGUI("planet");
}
function colonizePlanetFinish(path) {
	path = path.split(":").toInt();
	if (payMoney(data.worlds[path[0]][path[1]].size * 1e6 * 2 ** worldNow 
			+ (data.worlds[path[0]][path[1]].intelligentLife ? (1e6 * 3 ** worldNow) : 0))) {
		data.worlds[path[0]][path[1]].intelligentLife = false;
		data.worlds[path[0]][path[1]].ownedBy = "You";
		openGUI("alert", `You've successfully colonized the planet ${data.worlds[path[0]][path[1]].name}. It is now yours.`);
		if (worldNow == path[0] && gameSettings.renderPlanetTags) {
			planetRenders[path[1]].children[1].material = federationPlanetTag("You", data.federations["You"].color);
		}
	}
	else {
		openGUI("alert", `Cannot colonize planet because you need $${
			(data.worlds[path[0]][path[1]].size * 1e6 * 2 ** worldNow 
			+ (data.worlds[path[0]][path[1]].intelligentLife ? (1e6 * 3 ** worldNow) : 0)).toLocaleString("en-US")
		} to colonize the entire planet.`);
	}
}
function reopenGUI(name) {
	closeGUI(name);
	openGUI(name);
}
function upgradeBackpack() {
	if (payMoney(data.backpack.maxSize * 2e4)) {
		data.backpack.maxSize += 50;
		reopenGUI("backpack");
	}
	else {
		closeGUI("backpack");
		openGUI("alert", "You don't have enough money to upgrade your backpack!");
	}
}
function payMoney(amount) {
	if (data.balance >= amount) {
		data.balance -= amount;
		saveGame();
		return true;
	}
	else {
		return false;
	}
}
function saveGameSettings() {
	localStorage.setItem("game-settings", JSON.stringify(gameSettings));
}
function declareWar(path) {
	closeGUI("planet");
	path = path.split(":");
	var planet = data.worlds[path[0]][path[1]];
	if (payMoney(planet.strength)) {
		delete planet.strength;
		openGUI("alert", `You've successfully colonized ${planet.name} and taken it from the ${planet.ownedBy}.`);
		planet.ownedBy = "You";
		if (worldNow == path[0] && gameSettings.renderPlanetTags) {
			planetRenders[path[1]].children[1].material = federationPlanetTag("You", data.federations["You"].color);
		}
	}
	else {
		planet.strength -= data.balance;
		data.balance = 0;
		openGUI("alert", `You couldn't colonize ${planet.name} because the ${planet.ownedBy} were stronger.
But, you lowered their planet budget to $${planet.strength.toLocaleString("en-US")}.`);
	}
	saveGame();
}
function cancelColonizingRocket() {
	openGUI("confirm", "You are going to cancel the colonizing rocket.", () => {
		delete data.colonizingRocket;
		scene.remove(colonizingRocket);
		saveGame();
	});
}
function gotoColonizingRocket() {
	camera.userData.rocketlock = true;
	zoom = 10;
	camera.userData.rotationX = Math.PI + colonizingRocket.rotation.y;
	camera.userData.rotationY = Math.toRadians(60);
}
function toggleRenderingPlanetTags() {
	gameSettings.renderPlanetTags = !gameSettings.renderPlanetTags;
	saveGameSettings();
	loadGame();
}