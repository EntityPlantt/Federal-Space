const generateRandomNumber = (from, to) => from + Math.floor(Math.random() * (to - from + 1)),
distance = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
Array.prototype.random = function() {
	return this[generateRandomNumber(0, this.length - 1)];
};
Math.radToDeg = rad => rad * 180 / Math.PI;
Math.degToRad = deg => deg / 180 * Math.PI;
var GUI = {
	"backpack": {
		open(elm) {
			GUI["backpack"].list = elm.querySelector("ul");
			elm.querySelector(".bp-max-size").innerText = data.backpack.maxSize.toLocaleString("en-US");
			elm.querySelector(".bp-up-cost").innerText = (data.backpack.maxSize * 20000).toLocaleString("en-US");
			for (var gem of Object.keys(data.backpack.items)) {
				var li = document.createElement("li"), path = gem.split(":"), elm;
				elm = generatePlanetGemImage(data.worlds[path[0]][path[1]].gem);
				elm.style.width = "32px";
				li.appendChild(elm);
				li.appendChild(document.createTextNode(data.worlds[path[0]][path[1]].gem.name
				+ " ($" + data.worlds[path[0]][path[1]].gem.value.toLocaleString("en-US") + ") x"));
				elm = document.createElement("span");
				elm.classList.add("gem-amount");
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
		}
	},
	"planet": {
		open(elm, planet) {
			var path = planet.split(":");
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
					$${(data.worlds[path[0]][path[1]].size * 1000000
					+ data.worlds[path[0]][path[1]].intelligentLife ? 1000000 : 0).toLocaleString("en-US")}</div>
				`;
				break;
				case "You":
				elm.querySelector(".planet-status").innerText = "This is your planet.";
				if (!planet.hasGemProduction) {
					elm.querySelector(".options").innerHTML = `
						<div class="gui gui-button" onclick='setUpGemProduction(${JSON.stringify(path.join(":"))})'>
						Set up gem production ($${(planet.gem.value * 100).toLocaleString("en-US")})
						</div>
					`;
				}
				else {
					elm.querySelector(".options").innerHTML = `
						<div class="gui gui-button gui-disabled">Set up gem production</div>
					`;
				}
				break;
				default:
				elm.querySelector(".planet-status").innerText = `This one is a part of the ${planet.ownedBy}'s federation.`;
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
		}
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
							style="--c: ${data.federationColors[planet.ownedBy]}">
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
		}
	}
};
onload = () => {
	window.music = new Audio("music.mp3");
	function playMusic() {
		music.play();
		music.onended = () => {
			music.play();
		}
		removeEventListener("click", playMusic);
	}
	addEventListener("click", playMusic);
	window.gameSettings = JSON.parse(localStorage.getItem("game-settings")) ?? {volume: 75, highRenderQuality: false};
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
	window.zoom = 40;
	window.renderer = new THREE.WebGLRenderer;
	renderer.domElement.onwheel = event => zoom *= (event.wheelDelta < 0) ? 1.1 : (1 / 1.1);
	renderer.setSize(innerWidth, innerHeight);
	window.scene = new THREE.Scene;
	window.camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight);
	renderer.domElement.id = "threejs-canvas";
	document.body.prepend(renderer.domElement);
	renderer.domElement.onmousedown = MouseClick;
	camera.userData.rotationX = 0;
	camera.userData.rotationY = Math.degToRad(45);
	camera.userData.x = 0;
	camera.userData.z = 0;
	window.data = JSON.parse(localStorage.getItem("game-data"));
	window.colonizingRocket = new THREE.Group;
	colonizingRocket.add(new THREE.Mesh(
		new THREE.CapsuleGeometry(0.2, 0.2),
		new THREE.MeshPhongMaterial({color: 0xdddddd})
	));
	colonizingRocket.add(new THREE.PointLight(0xe38c2d, 0.75));
	colonizingRocket.children.at(-1).position.y = -0.5;
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
				if (data.colonizingRocket.world == worldNow)
					scene.add(colonizingRocket);
				else
					scene.remove(colonizingRocket);
				var targetPlanet = data.colonizingRocket.targetPlanet.split(":");
				colonizingRocket.lookAt(
					data.worlds[targetPlanet[0]][targetPlanet[1]].x,
					0,
					data.worlds[targetPlanet[0]][targetPlanet[1]].z
				);
				colonizingRocket.rotation.x = Math.degToRad(90);
				colonizingRocket.position.set(data.colonizingRocket.x, 0, data.colonizingRocket.z);
				var calculatedValue = Math.atan(
					(data.colonizingRocket.x - data.worlds[targetPlanet[0]][targetPlanet[1]].x)
					/
					(data.colonizingRocket.z - data.worlds[targetPlanet[0]][targetPlanet[1]].z)
				);
				data.colonizingRocket.x -= Math.cos(Math.radToDeg(-calculatedValue) + 90) * 0.05;
				data.colonizingRocket.z -= Math.sin(Math.radToDeg(-calculatedValue) + 90) * 0.05;
				if (distance(
					data.worlds[targetPlanet[0]][targetPlanet[1]].x,
					data.worlds[targetPlanet[0]][targetPlanet[1]].z,
					data.colonizingRocket.x,
					data.colonizingRocket.z
				) < 0.1) {
					delete data.colonizingRocket;
					colonizePlanetFinish(targetPlanet.join(":"));
					scene.remove(colonizingRocket);
				}
				saveGame();
			}
			else {
				document.getElementById("cancel-rocket-btn").classList.add("gui-hidden");
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
				camera.userData.rotationY = Math.max(Math.degToRad(1), Math.min(Math.degToRad(90), camera.userData.rotationY));
				x = event.clientX;
				y = event.clientY;
			}
			onmouseup = () => {
				onmousemove = null;
			}
		}
		function startMove(x, y) {
			onmousemove = event => {
				camera.userData.x += Math.sin(camera.userData.rotationX) * (y - event.clientY) / 60 * zoom;
				camera.userData.z += Math.cos(camera.userData.rotationX) * (y - event.clientY) / 60 * zoom;
				camera.userData.x += Math.sin(camera.userData.rotationX + Math.PI / 2) * (x - event.clientX) / 60 * zoom;
				camera.userData.z += Math.cos(camera.userData.rotationX + Math.PI / 2) * (x - event.clientX) / 60 * zoom;
				x = event.clientX;
				y = event.clientY;
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
				if (data.worlds[i][j].ownedBy == null && data.worlds[i][j].intelligentLife && !generateRandomNumber(0, 999)) {
					data.worlds[i][j].intelligentLife = false;
					data.worlds[i][j].ownedBy
					= "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").random()
					+ "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").random()
					+ "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").random()
					+ "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").random()
					+ "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").random();
					data.federationColors[data.worlds[i][j].ownedBy] = `rgb(
						${generateRandomNumber(0, 255)},
						${generateRandomNumber(0, 255)},
						${generateRandomNumber(0, 255)}
					)`;
					saveGame();
					planet.strength = generateRandomNumber(5000, 5000000);
					openGUI("alert",
					`The life on the planet ${data.worlds[i][j].name} has evolved to ${data.worlds[i][j].ownedBy}!`);
				}
				if (data.alienCooldown < 0
				&& ![null, "You"].includes(data.worlds[i][j].ownedBy) && !generateRandomNumber(0, 499)) {
					data.alienCooldown = 250;
					var planet = data.worlds.random().random();
					if (planet.ownedBy == data.worlds[i][j].ownedBy)
						continue;
					planet.ownedBy = data.worlds[i][j].ownedBy;
					planet.strength = generateRandomNumber(1000, 1000000);
					saveGame();
					openGUI("alert", `${planet.ownedBy} has taken over ${planet.name}!`);
				}
			}
		}
	}, 500);
}
function removeGameData() {
	openGUI("confirm", "All game data will be lost.", () => {
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
			federationColors: {
				"You": "#080"
			}
		};
		data.federationColors[null] = "black";
		for (var i = 0; i < 50; i++) {
			data.worlds[0].push(generatePlanet());
		}
		data.worlds[0][0].ownedBy = "You";
		data.worlds[0][0].hasGemProduction = true;
		saveGame();
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
		renderGame -= data.worlds[worldNow].length;
		scene.add(new THREE.Mesh(new THREE.SphereGeometry(5), new THREE.MeshBasicMaterial({color: 0xffff80})));
		if (gameSettings.highRenderQuality) {
			scene.add(new THREE.PointLight(0xffff80, 1.5));
		}
		for (var j = 0; j < data.worlds[worldNow].length; j++) {
			scene.add(generatePlanetMesh(worldNow + ":" + j, () => renderGame++));
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
			}
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
			value: generateRandomNumber(100, 5000)
		},
		name: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").random() + generateRandomNumber(10, 99),
		x: x,
		z: z,
		intelligentLife: generateRandomNumber(0, 49) == 0,
		ownedBy: null,
		hasGemProduction: false
	};
}
function generatePlanetMesh(planet, onDoneCallback = new Function) {
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
		mesh.material.map = new THREE.TextureLoader().load(canvas.toDataURL());
		onDoneCallback();
	}
	image.src = `images/planets/${planet.display.texture}.png`;
	mesh.position.set(planet.x, 0, planet.z);
	mesh.rotation.x = planet.display.rotation;
	mesh.name = "Planet";
	mesh.userData.planet = path.join(":");
	return mesh;
}
function gotoPlanet(id) {
	camera.userData.x = data.worlds[worldNow][id].x;
	camera.userData.z = data.worlds[worldNow][id].z;
}
function changeWorldTo(worldId) {
	if (worldId < 0)
		return;
	if (worldId == 0)
		document.getElementById("prev-world").classList.add("gui-disabled");
	else
		document.getElementById("prev-world").classList.remove("gui-disabled");
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
	document.body.appendChild(document.querySelector(`[gui-name="${name}"]`));
	return ((GUI[name] || {}).open || new Function)(document.querySelector(`[gui-name="${name}"]`), ...data);
}
function closeGUI(name, ...data) {
	document.querySelector(`[gui-name="${name}"]`).classList.remove("gui-opened");
	return ((GUI[name] || {}).close || new Function)(document.querySelector(`[gui-name="${name}"]`), ...data);
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
	gem = gem.split(":");
	if (payMoney(data.worlds[gem[0]][gem[1]].gem.value * 100)) {
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
	path = path.split(":");
	if (payMoney(data.worlds[path[0]][path[1]].size * 1000000 + data.worlds[path[0]][path[1]].intelligentLife ? 1000000 : 0)) {
		data.worlds[path[0]][path[1]].intelligentLife = false;
		data.worlds[path[0]][path[1]].ownedBy = "You";
		openGUI("alert", `You've successfully colonized the planet ${data.worlds[path[0]][path[1]].name}. It is now yours.`);
	}
	else {
		openGUI("alert", `Cannot colonize planet because you need $${
			(data.worlds[path[0]][path[1]].size * 1000000
			+ data.worlds[path[0]][path[1]].intelligentLife ? 1000000 : 0).toLocaleString("en-US")
		} to colonize the entire planet.`);
	}
}
function reopenGUI(name) {
	closeGUI(name);
	openGUI(name);
}
function upgradeBackpack() {
	if (payMoney(data.backpack.maxSize * 20000)) {
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
		data.colonizingRocket = null;
		scene.remove(colonizingRocket);
		saveGame();
	});
}