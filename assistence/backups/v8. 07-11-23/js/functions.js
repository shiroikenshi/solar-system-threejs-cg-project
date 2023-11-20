// Função para remover e adicionar elementos da cena com botão
function sceneAdd(buttonId, element, buttonName) {
    const toggleButton = document.getElementById(buttonId);

    let isVisible = false;

    toggleButton.addEventListener('click', () => {
        isVisible = !isVisible;

        if (isVisible) {
            scene.add(element);
            toggleButton.textContent = `Desligar ${buttonName}`;
        } else {
            scene.remove(element);
            toggleButton.textContent = `Ligar ${buttonName}`;
        }
    });
}

// Função para criar um cinturão de asteroides
function createAsteroidBelt(numAsteroids, radius, minSize, maxSize, bandWidth, bandHeight) {
    var asteroidGroup = new THREE.Group(); // Criar um grupo para o cinturão de asteroides

    for (var i = 0; i < numAsteroids; i++) {
        var angle = Math.random() * (2 * Math.PI);
        var tamAsteroide = minSize + Math.random() * (maxSize - minSize);
        var distance = radius + (Math.random() * bandWidth - bandWidth / 2); // Distribuição ao longo do raio com largura de banda
        var height = Math.random() * bandHeight - bandHeight / 2; // Altura dentro da banda

        var asteroidGeometry = new THREE.IcosahedronGeometry(tamAsteroide, 0);
        var asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
        
        asteroid.position.set(Math.sin(angle) * distance, Math.cos(angle) * distance, height);
        asteroid.rotation.set(Math.random() * (2 * Math.PI), Math.random() * (2 * Math.PI), Math.random() * (2 * Math.PI));

        asteroid.radius = distance;
        asteroid.velocity = Math.random() * 0.1;
        
        asteroidGroup.add(asteroid); // Adicionar o asteroide ao grupo
    }
    
    return asteroidGroup; // Retornar o grupo de asteroides
}

// Função para criar um campo estelar
function createStarField(color, size, numStars, sphereRadius) {
    var starsGeometry = new THREE.BufferGeometry();
    var starsMaterial = new THREE.PointsMaterial({
        color: color,
        size: size,
    });

    var positions = new Float32Array(numStars * 3);

    for (var i = 0; i < numStars; i++) {
        var u = Math.random();
        var v = Math.random();
        var theta = 2 * Math.PI * u;
        var phi = Math.acos(2 * v - 1);
        var radius = sphereRadius * Math.cbrt(Math.random());
        var x = radius * Math.sin(phi) * Math.cos(theta);
        var y = radius * Math.sin(phi) * Math.sin(theta);
        var z = radius * Math.cos(phi);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var starField = new THREE.Points(starsGeometry, starsMaterial);

    return starField;
}

// Função para criar marcadores para localizar os corpos celestes
function createMarker(color, size, sizeAttenuation = false) {
    var markGeometry = new THREE.BufferGeometry();
    var markMaterial = new THREE.PointsMaterial({
        color: color,
        size: size,
        sizeAttenuation: sizeAttenuation,
        transparent: true
    });

    var markVertices = new Float32Array(3);
    markVertices[0] = 0;
    markVertices[1] = 0;
    markVertices[2] = 0;

    markGeometry.setAttribute('position', new THREE.BufferAttribute((markVertices), 3));
    var mark = new THREE.Points(markGeometry, markMaterial);

    return mark;
}

// Função para realocar a câmera para focar em um objeto, considerando o raio da esfera
function focusOnObject(object) {
    // Obtém o raio da esfera do objeto
    const objectRadius = object.geometry.parameters.radius;

    // Calcula a nova posição da câmera com base no raio da esfera
    const distance = objectRadius * 2; // Definindo distância da câmera do objeto
    controls2.minDistance = objectRadius * 1.1; // Definindo zoom mínimo
    const objectPosition = object.position.clone();
    const direction = new THREE.Vector3().subVectors(camera.position, objectPosition).normalize();
    const newPosition = objectPosition.clone().add(direction.multiplyScalar(distance));
    
    // Duração da animação em milissegundos
    const duration = 1000;

    // Usando o Tween.js para animar a posição da câmera para a posição do objeto clicado
    new TWEEN.Tween(camera.position)
        .to(newPosition, duration)
        .easing(TWEEN.Easing.Quadratic.Out) // Definindo Easing
        .start();

    // Atualiza o alvo dos controles da câmera para o objeto
    controls1.target.copy(objectPosition);
    controls2.target.copy(objectPosition);

    // Atualiza os controles da câmera
    controls1.update();
    controls2.update();

    // Habilita rotação da câmera
    controls1.autoRotate = true;
}

// Função de raycasting para interagir com objetos definidos (clickableObjects) ao clicar
function onDocumentMouseDown(event) {
    event.preventDefault();

    // Coordenadas do clique do mouse em relação ao elemento de renderização
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Criando um objeto Raycaster com o valor de threshold inicial
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = raycasterThreshold;
    raycaster.setFromCamera(mouse, camera);

    // Verificando a interseção com os objetos marcadores, excluindo o objeto clicado anteriormente
    const clickableObjects = [
        sunMarker, mercuryMarker, venusMarker, earthMarker, moonMarker, marsMarker, jupiterMarker, saturnMarker, uranusMarker, neptuneMarker, plutoMarker, charonMarker, ceresMarker, haumeaMarker, makemakeMarker, erisMarker
    ].filter(obj => obj.userData.name !== cameraTargetObject );

    // Se o último planeta clicado pertencer a "userData.closeObject", atualiza o valor do threshold
    if (cameraTargetObject && cameraTargetObject.userData && cameraTargetObject.userData.closeObject) {
        raycasterThreshold = 0.004;
    }

    // Realize a primeira verificação de interseção
    const intersects = raycaster.intersectObjects(clickableObjects);

    // Se nenhum objeto for clicado na primeira verificação
    if (intersects.length === 0) {
        // Crie um segundo raycaster com um valor de threshold diferente ignorando objetos "userData.closeObject"
        const secondRaycaster = new THREE.Raycaster();
        secondRaycaster.params.Points.threshold = 15; // Valor de threshold diferente
        secondRaycaster.setFromCamera(mouse, camera);

        const secondClickableObjects = clickableObjects.filter(obj => !obj.userData.closeObject);

        const secondIntersects = secondRaycaster.intersectObjects(secondClickableObjects);

        // Se algum marcador for clicado no segundo raycasting, realoque a câmera para esse objeto
        if (secondIntersects.length > 0) {
            const clickedObject = secondIntersects[0].object;
            const name = clickedObject.userData.name;

            // Atualizando o último planeta clicado
            cameraTargetObject = name;
            // Atualizando o valor de threshold
            raycasterThreshold = 15;
            
            // Obtenha a esfera correspondente ao planeta
            const object = celestialObjectMap[name];

            if (object) {
                // Chamando a função focusOnObject
                focusOnObject(object);
            }
        }
    } else {
        // Se algum objeto for clicado na primeira verificação
        const clickedObject = intersects[0].object;
        const name = clickedObject.userData.name;

        // Atualizando o último planeta clicado
        cameraTargetObject = name;

        // Atualizando marcador caso clickedObject = userData.closeObject
        if (clickedObject.userData.closeObject) {
            raycasterThreshold = 0.004;
        }

        // Obtendo a esfera correspondente ao planeta
        const object = celestialObjectMap[name];

        if (object) {
            // Chamando a função focusOnObject
            focusOnObject(object);
        }
    }
}

// Função para criar linha de órbita
function createOrbit(periapsisDistance, apoapsisDistance, eccentricity, inclinationAngle, centerX, centerY, centerZ, color) {
    const orbitGeometry = new THREE.BufferGeometry();
    const segments = 20000;

    const positions = [];
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const semiMajorAxis = (periapsisDistance + apoapsisDistance) / 2;
        const radius = semiMajorAxis * (1 - eccentricity) / (1 - eccentricity * Math.cos(theta));
        const x = radius * Math.cos(theta) + centerX;
        const y = centerY;
        const z = radius * Math.sin(theta) + centerZ;
        positions.push(x, y, z);
    }

    const orbitVertices = new Float32Array(positions);
    orbitGeometry.setAttribute('position', new THREE.BufferAttribute(orbitVertices, 3));

    // Definindo material da órbita
    const orbitMaterial = new THREE.LineBasicMaterial({ color: color, transparent: true });

    // Cloco para controlar a renderização transparente
    orbitMaterial.depthWrite = false;
    orbitMaterial.blending = THREE.AdditiveBlending;

    // Criando orbitLine com a geometria e material
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    orbitLine.rotation.x = (Math.PI / 180) * inclinationAngle; // Inclinando

    return orbitLine;
}

// Função para controlar opacidade da linha de órbita
function updateOpacity(orbitLine, marker, object) {
    const distanceToCamera = camera.position.distanceTo(object.position);
    let minDistance, maxDistance;

    if (distanceToCamera < 400000) {
        // Ajuste esses valores conforme necessário para controlar a transição de opacidade ao se aproximar
        minDistance = 5 * (object.geometry.parameters.radius * 7.5);
        maxDistance = 50 * (object.geometry.parameters.radius * 7.5);

        const opacity = linearInterpolationIn(distanceToCamera, minDistance, maxDistance);
        orbitLine.material.opacity = opacity;
        marker.material.opacity = opacity;
    } else {
        // Ajuste esses valores conforme necessário para controlar a transição de opacidade ao se afastar
        minDistance = 400000;
        maxDistance = 1200000;

        const opacity = linearInterpolationOut(distanceToCamera, minDistance, maxDistance);
        orbitLine.material.opacity = opacity;
        marker.material.opacity = opacity;
    }

    // Interpola a opacidade entre 0 e 1 com base na distância da câmera (In)
    function linearInterpolationIn(value, min, max) {
        if (value <= min) return 0;
        if (value >= max) return 1;
        return (value - min) / (max - min);
    }

    // Interpola a opacidade entre 0 e 1 com base na distância da câmera (Out)
    function linearInterpolationOut(value, min, max) {
        if (value <= min) return 1;
        if (value >= max) return 0;
        return 1 - (value - min) / (max - min);
    }
}

// Função para atualizar a posição de um planeta/objeto na órbita
function updatePlanetPosition(object, timeElapsed, orbitSpeed, periapsisDistance, apoapsisDistance, eccentricity, inclinationAngle, orbitCenterX, orbitCenterY, orbitCenterZ) {
    // Atualiza o tempo decorrido
    timeElapsed += orbitSpeed;

    // Calcula a posição do planeta na órbita
    const theta = timeElapsed;
    const semiMajorAxis = (periapsisDistance + apoapsisDistance) / 2;
    const radius = semiMajorAxis * (1 - eccentricity) / (1 - eccentricity * Math.cos(theta));

    // Calcula a posição considerando a inclinação angular da órbita
    const inclinationRadians = (Math.PI / 180) * inclinationAngle;
    const planetX = radius * Math.cos(theta) + orbitCenterX;
    const planetY = orbitCenterY;
    const planetZ = radius * Math.sin(theta) + orbitCenterZ;

    // Define a posição do planeta
    object.position.set(planetX, planetY, planetZ);

    // Aplica a inclinação à órbita
    const rotationMatrix = new THREE.Matrix4().makeRotationX(inclinationRadians);
    object.position.applyMatrix4(rotationMatrix);

    return timeElapsed;
}

// Função para mover a câmera para a posição inicial
function moverCameraParaSistemaSolar() {
    // Tempo em milisegundos para animação começar
    let speedAnimation = 0;

    if(cameraTargetObject == 'Cena Terra' || cameraTargetObject == 'Cena Lua' || cameraTargetObject == 'Cena Marte'){
        // Tempo em milisegundos para animação começar
        speedAnimation = 500;

        // Chamando tela de carregamento
        loadingScreen(2000);
    }

    cameraTargetObject = "Sistema";

    // Animação de câmera após "speedAnimation" milisegundos
    setTimeout(() => {
        // Removendo cenas e itens
        scene.remove(cenaTerra); // Terra
        scene.remove(cenaLua); // Lua
        scene.remove(apollo); // Lua
        scene.remove(astronaut1); // Lua
        scene.remove(astronaut2); // Lua
        scene.remove(astronaut3); // Lua
        scene.remove(flag); // Lua
        scene.remove(cenaMarte); // Marte
        scene.remove(perseverance); // Marte

        // Removendo Luz Direcional
        scene.remove(directionalLight);
        bgSphere.visible = true;
        
        // Atualizando controles de câmera
        controls2.maxDistance = 28680000 // Distância máxima de zoom out
        controls2.minDistance = 0.55; // Definindo zoom mínimo

        // Coordenadas da posição do Sistema Solar
        const sistemaSolarPosicao = new THREE.Vector3(-4800, 2000, 4800);
        
        // Tempo total da animação (em milissegundos)
        const duracaoAnimacao = 1000; // Ajuste conforme necessário

        // Use o Tween.js para animar a posição da câmera
        new TWEEN.Tween(camera.position)
            .to(sistemaSolarPosicao, duracaoAnimacao)
            .easing(TWEEN.Easing.Quadratic.InOut) // Easing da animação (pode ajustar conforme necessário)
            .start();

        // Atualiza o alvo dos controles da câmera para o objeto
        controls1.target.set(0,0,0);
        controls2.target.set(0,0,0);

        // Atualiza os controles da câmera
        controls1.update();
        controls2.update();

        // Modifica target e threshold
        cameraTargetObject = 'Sistema';
        raycasterThreshold = 15;

        // Habilita rotação da câmera
        controls1.autoRotate = true;
    }, speedAnimation);
}

// Função para exibir cards e texto de objeto mirado no display
function toggleDisplay(nome, cardName, objectName, status) {
    const displayElement = document.getElementById(cardName);
    const systemObjectElement = document.getElementById(objectName);

    if (status === "on") {
        displayElement.style.display = "block";
        systemObjectElement.style.display = "block";
        systemObjectElement.innerHTML = `> ${nome}`;
    } else {
        displayElement.style.display = "none";
        systemObjectElement.style.display = "none";
    }
}

// Função para atualizar a posição da câmera com limites
function updateCameraPositionY(minCameraY) {
    // Verifique os limites de movimento
    if (camera.position.y < minCameraY) {
        camera.position.y = minCameraY;
    }
}

// Função para mover a camera para a cena de Terra
function moverCameraParaExplorarTerra(cena) {
    // Alterando cameraTargetObject
    cameraTargetObject = 'Cena Terra';

    // Chamando tela de carregamento
    loadingScreen(2000);

    // Animação de câmera após 500 milisegundos
    setTimeout(() => {
        // Adicionando cena da Terra
        scene.add(cenaTerra);

        // Adicionando Luz Direcional
        modificaLuzDirecional(directionalLight, 0xffa500, new THREE.Vector3(3529610.4127944447, 33285698.144390512, -52108916.266331956), new THREE.Vector3(30000000, 0, 0));
        scene.add(directionalLight);
        bgSphere.visible = false;

        // Atualizando controles de câmera
        controls2.maxDistance = 0.0002;
        controls2.minDistance = 0.00001;

        // Calcula a nova posição da câmera com base no raio da esfera
        const distance = 1;
        const objectPosition = cena.position.clone(); objectPosition.x += 0.00015; objectPosition.y += 0.000735; // Ajustando altura da camera na cena
        const direction = new THREE.Vector3().subVectors(camera.position, objectPosition).normalize();
        const newPosition = objectPosition.clone().add(direction.multiplyScalar(distance));

        // Usando o Tween.js para animar a posição da câmera para a posição do objeto clicado
        new TWEEN.Tween(camera.position)
            .to(newPosition, 1000)
            .easing(TWEEN.Easing.Quadratic.Out) // Definindo Easing
            .start();

        // Atualiza o alvo dos controles da câmera para o objeto
        controls1.target.copy(objectPosition);
        controls2.target.copy(objectPosition);

        // Atualiza os controles da câmera
        controls1.update();
        controls2.update();
    }, 500);
}

// Função para mover a camera para a cena de Lua
function moverCameraParaExplorarLua(cena) {
    // Alterando cameraTargetObject
    cameraTargetObject = 'Cena Lua';

    // Chamando tela de carregamento
    loadingScreen(2000);

    // Animação de câmera após 500 milisegundos
    setTimeout(() => {
        // Adicionando cena da Lua e objetos
        scene.add(cenaLua);
        scene.add(apollo);
        scene.add(astronaut1);
        scene.add(astronaut2);
        scene.add(astronaut3);
        scene.add(flag);

        // Adicionando Luz Direcional
        modificaLuzDirecional(directionalLight, 0xffffff, new THREE.Vector3(30009501, 10000000, 10), new THREE.Vector3(30010000, 0, 0));
        scene.add(directionalLight); 
        bgSphere.visible = false;

        // Atualizando controles de câmera
        controls2.maxDistance = 0.00012;
        controls2.minDistance = 0.0000001;

        // Calcula a nova posição da câmera com base no raio da esfera
        const distance = 1;
        const objectPosition = cena.position.clone(); objectPosition.x -= 0.00025; objectPosition.z += 0.000005; objectPosition.y = 0; // Ajustando altura da camera na cena
        const direction = new THREE.Vector3().subVectors(camera.position, objectPosition).normalize();
        const newPosition = objectPosition.clone().add(direction.multiplyScalar(distance));

        // Usando o Tween.js para animar a posição da câmera para a posição do objeto clicado
        new TWEEN.Tween(camera.position)
            .to(newPosition, 1000)
            .easing(TWEEN.Easing.Quadratic.Out) // Definindo Easing
            .start();

        // Atualiza o alvo dos controles da câmera para o objeto
        controls1.target.copy(objectPosition);
        controls2.target.copy(objectPosition);

        // Atualiza os controles da câmera
        controls1.update();
        controls2.update();
    }, 500);
}

// Função para mover a camera para a cena de Marte
function moverCameraParaExplorarMarte(cena) {
    // Alterando cameraTargetObject
    cameraTargetObject = 'Cena Marte';

    // Chamando tela de carregamento
    loadingScreen(2000);

    // Animação de câmera após 500 milisegundos
    setTimeout(() => {
        // Adicionando cena de Marte e objetos
        scene.add(cenaMarte);
        scene.add(perseverance);

        // Adicionando Luz Direcional
        modificaLuzDirecional(directionalLight, 0xffa500, new THREE.Vector3(3529610.4127944447, 33285698.144390512, -52108916.266331956), new THREE.Vector3(30020000, 0, 0));
        scene.add(directionalLight);
        bgSphere.visible = false;

        // Atualizando controles de câmera
        controls2.maxDistance = 0.0003;
        controls2.minDistance = 0.0000005;

        // Calcula a nova posição da câmera com base no raio da esfera
        const distance = 1;
        const objectPosition = cena.position.clone(); objectPosition.y = 0; // Ajustando altura da camera na cena
        const direction = new THREE.Vector3().subVectors(camera.position, objectPosition).normalize();
        const newPosition = objectPosition.clone().add(direction.multiplyScalar(distance));

        // Usando o Tween.js para animar a posição da câmera para a posição do objeto clicado
        new TWEEN.Tween(camera.position)
            .to(newPosition, 1000)
            .easing(TWEEN.Easing.Quadratic.Out) // Definindo Easing
            .start();

        // Atualiza o alvo dos controles da câmera para o objeto
        controls1.target.copy(objectPosition);
        controls2.target.copy(objectPosition);

        // Atualiza os controles da câmera
        controls1.update();
        controls2.update();
    }, 500);
}

function loadingScreen(tempo){
    var tempo;

    // Mostrar a tela de carregamento antes de iniciar a animação
    document.getElementById('loading-screen').style.display = 'block';

    // Iniciar a animação de aparecimento (de opacidade 0 a 1)
    setTimeout(() => {
        document.getElementById('loading-screen').style.opacity = 1;
    }, 0); // Comece imediatamente

    // Após a animação, iniciar a animação de desaparecimento (de opacidade 1 a 0)
    setTimeout(() => {
        document.getElementById('loading-screen').style.opacity = 0;
    }, tempo); // Inicia após 1700 milissegundos (2000 = 2500 - 500 para garantir a sincronia)

    // Oculte a tela de carregamento após a animação de desaparecimento
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
    }, tempo + 500); // Ajuste o tempo de espera conforme necessário
}

// Função para printar no console a posição da câmera
function printCameraPosition() {
    console.log("Camera Position:", camera.position);
}

// Modifica luz direcional
function modificaLuzDirecional(luz, cor, posicao, target) {
    // Altera a cor da luz
    luz.color.set(cor);
  
    // Altera a posição da luz
    luz.position.copy(posicao);
  
    // Altera a posição do alvo da luz (target)
    luz.target.position.copy(target);
}

// Função para atualizar glowsprite
function glowspriteUpdate(){
    const distanceToSun = camera.position.distanceTo(sunSphere.position)

    // Atualiza escala do glowsprite
	if(distanceToSun > 50){
		glowSprite.scale.set(0.1 * distanceToSun, 0.1 * distanceToSun, 0);
	}

    // Atualiza opacidade do glowsprite
    if (distanceToSun <= 5) {glowSprite.material.opacity = 0.5;}
    else if (distanceToSun >= 100 && distanceToSun <= 28701243) {glowSprite.material.opacity = 1;}
        else if (distanceToSun > 28701243) {glowSprite.material.opacity = 0;}
            else {glowSprite.material.opacity = 0.5 + (distanceToSun - 5) / (100 - 5) * 0.5;}
}