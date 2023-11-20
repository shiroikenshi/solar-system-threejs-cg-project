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
    const distance = objectRadius * 3; // Ajuste o valor 4 de acordo com sua preferência
    const objectPosition = object.position.clone();
    const direction = new THREE.Vector3().subVectors(camera.position, objectPosition).normalize();
    const newPosition = objectPosition.clone().add(direction.multiplyScalar(distance));
    
    // Duração da animação em milissegundos
    const duration = 1000;

    // Use o Tween.js para animar a posição da câmera para a posição do objeto clicado
    new TWEEN.Tween(camera.position)
        .to(newPosition, duration)
        .easing(TWEEN.Easing.Quadratic.Out) // Você pode escolher um easing diferente
        .start();

    // Atualiza o alvo dos controles da câmera para o objeto
    controls1.target.copy(objectPosition);
    controls2.target.copy(objectPosition);

    // Atualiza os controles da câmera
    controls1.update();
    controls2.update();
}

// Objetos clicáveis
function setupClickableObjects(renderer, camera, objectsToIntersect, markersToIntersect, onClickCallback) {
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 1;
    let clickedObject = null;

    renderer.domElement.addEventListener('click', onMouseClick);

    function onMouseClick(event) {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects([...objectsToIntersect, ...markersToIntersect]);

        if (intersects.length > 0) {
            clickedObject = intersects[0].object;

            if (objectsToIntersect.includes(clickedObject)) {
                // Se o objeto clicado está na lista de objetos, chame a função de foco

                onClickCallback(clickedObject);
            } else {
                // Se o objeto clicado está na lista de marcadores, determine o planeta correspondente e chame a função de foco
                if (clickedObject === sunMarker) {
                    onClickCallback(sunSphere);
                } else if (clickedObject === mercuryMarker) {
                    onClickCallback(mercurySphere);
                } else if (clickedObject === venusMarker) {
                    onClickCallback(venusSphere);
                } else if (clickedObject === earthMarker) {
                    onClickCallback(earthSphere);
                }
                // Adicione outras verificações para planetas adicionais, se necessário
            }
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
function createOrbit(semiMinorAxis, semiMajorAxis, resolution = 100, color = 0xffffff) {
    const points = [];

    for (let i = 0; i <= resolution; i++) {
        const theta = (i / resolution) * Math.PI * 2;
        const x = semiMajorAxis * Math.cos(theta);
        const y = semiMinorAxis * Math.sin(theta);
        points.push(new THREE.Vector3(x, 0, y));
    }

    const curve = new THREE.CatmullRomCurve3(points);

    const numPoints = 360; // Você pode ajustar a quantidade de pontos aqui
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(numPoints));
    const orbitMaterial = new THREE.LineBasicMaterial({ color: color, linecap: "round" });
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);

    return orbit;
}