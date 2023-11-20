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
    const distance = objectRadius * 2.5; // Definindo distância da câmera do objeto
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
        sunMarker, mercuryMarker, venusMarker, earthMarker, moonMarker, marsMarker, jupiterMarker, saturnMarker, uranusMarker, neptuneMarker
    ].filter(obj => obj.userData.name !== cameraTargetObject );

    // Se o último planeta clicado pertencer a "userData.closeObject", atualiza o valor do threshold
    if (cameraTargetObject && cameraTargetObject.userData && cameraTargetObject.userData.closeObject) {
        raycasterThreshold = 0.01;
    }

    // Realize a primeira verificação de interseção
    const intersects = raycaster.intersectObjects(clickableObjects);

    // Se nenhum objeto for clicado na primeira verificação
    if (intersects.length === 0) {
        // Crie um novo raycaster com um valor de threshold diferente ignorando objetos "userData.closeObject"
        const secondRaycaster = new THREE.Raycaster();
        secondRaycaster.params.Points.threshold = 1; // Valor de threshold diferente
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
            raycasterThreshold = 6;
            
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
            raycasterThreshold = 0.01;
        }

        // Obtendo a esfera correspondente ao planeta
        const object = celestialObjectMap[name];

        if (object) {
            // Chamando a função focusOnObject
            focusOnObject(object);
        }
    }
}


// Função para agrupar objetos em uma mesma cena
function createSceneGroup(...objects) {
    const group = new THREE.Group();
    for (const object of objects) {
        group.add(object);
    }
    return group;
}

// Cria linha de órbita
function createOrbit(periapsisDistance, apoapsisDistance, eccentricity, inclinationAngle, centerX, centerY, centerZ, color) {
    const orbitGeometry = new THREE.BufferGeometry();
    const segments = 5000; // Número de segmentos da elipse
  
    const positions = [];
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const radius = periapsisDistance * (1 - eccentricity) / (1 - eccentricity * Math.cos(theta));
        const x = radius * Math.cos(theta) + centerX;
        const y = centerY;
        const z = radius * Math.sin(theta) + centerZ;
        positions.push(x, y, z);
    }
  
    const orbitVertices = new Float32Array(positions);
    orbitGeometry.setAttribute('position', new THREE.BufferAttribute(orbitVertices, 3));
  
    const orbitMaterial = new THREE.LineBasicMaterial({ color: color });
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    orbitLine.rotation.x = (Math.PI / 180) * inclinationAngle;
  
    return orbitLine;
}

// Função para atualizar a posição de um planeta/objeto na órbita
function updatePlanetPosition(object, timeElapsed, orbitSpeed, periapsisDistance, apoapsisDistance, eccentricity, inclinationAngle, orbitCenterX, orbitCenterY, orbitCenterZ) {
    // Atualiza o tempo decorrido
    timeElapsed += orbitSpeed;

    // Calcula a posição do planeta na órbita
    const theta = timeElapsed; // Velocidade da órbita
    const radius = periapsisDistance * (1 - eccentricity) / (1 - eccentricity * Math.cos(theta)); // Excentricidade orbital
    
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

// Função para remover marcador de objeto clicado
function markerRemove(object){
    object     
}